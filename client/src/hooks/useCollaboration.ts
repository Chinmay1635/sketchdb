/**
 * useCollaboration Hook
 * 
 * Manages real-time collaboration for diagram editing using Socket.IO
 * Features:
 * - Socket.IO connection management with authentication
 * - Room-based collaboration (join/leave diagrams)
 * - Real-time cursor tracking
 * - Node and edge operation broadcasting
 * - Presence awareness (online collaborators)
 * - Automatic reconnection handling
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import {
  CollaborationState,
  CollaboratorInfo,
  CursorUpdateEvent,
  DiagramJoinedEvent,
  UserJoinedEvent,
  UserLeftEvent,
  getCollaboratorColor
} from '../types/collaboration';
import { collaborationToasts } from '../utils/toast';

// Use generic types for nodes/edges to avoid version conflicts
type GenericNode = { id: string; position?: { x: number; y: number }; [key: string]: unknown };
type GenericEdge = { id: string; source: string; target: string; [key: string]: unknown };

// Socket server URL
const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

// Get token from localStorage
const getToken = (): string | null => {
  return localStorage.getItem('sketchdb_token');
};

interface UseCollaborationOptions {
  diagramId?: string;
  onNodeAdd?: (node: GenericNode) => void;
  onNodeUpdate?: (nodeId: string, changes: Partial<GenericNode>) => void;
  onNodeDelete?: (nodeId: string) => void;
  onNodeMove?: (nodeId: string, position: { x: number; y: number }) => void;
  onEdgeAdd?: (edge: GenericEdge) => void;
  onEdgeDelete?: (edgeId: string) => void;
  onStateReceived?: (state: { nodes: GenericNode[]; edges: GenericEdge[] }) => void;
}

interface UseCollaborationReturn {
  state: CollaborationState;
  connect: () => void;
  disconnect: () => void;
  joinDiagram: (diagramId: string) => void;
  leaveDiagram: () => void;
  broadcastCursor: (x: number, y: number) => void;
  broadcastNodeAdd: (node: GenericNode) => void;
  broadcastNodeUpdate: (nodeId: string, changes: Partial<GenericNode>) => void;
  broadcastNodeDelete: (nodeId: string) => void;
  broadcastNodeMove: (nodeId: string, position: { x: number; y: number }) => void;
  broadcastEdgeAdd: (edge: GenericEdge) => void;
  broadcastEdgeDelete: (edgeId: string) => void;
  broadcastSelection: (nodeIds: string[], edgeIds: string[]) => void;
  provideState: (state: { nodes: GenericNode[]; edges: GenericEdge[] }) => void;
}

export function useCollaboration(options: UseCollaborationOptions = {}): UseCollaborationReturn {
  const {
    diagramId: initialDiagramId,
    onNodeAdd,
    onNodeUpdate,
    onNodeDelete,
    onNodeMove,
    onEdgeAdd,
    onEdgeDelete,
    onStateReceived
  } = options;

  const socketRef = useRef<Socket | null>(null);
  const stateProviderRequesterId = useRef<string | null>(null);
  
  // Use refs for callbacks to avoid stale closures
  const callbacksRef = useRef({
    onNodeAdd,
    onNodeUpdate,
    onNodeDelete,
    onNodeMove,
    onEdgeAdd,
    onEdgeDelete,
    onStateReceived
  });
  
  // Update refs when callbacks change
  useEffect(() => {
    callbacksRef.current = {
      onNodeAdd,
      onNodeUpdate,
      onNodeDelete,
      onNodeMove,
      onEdgeAdd,
      onEdgeDelete,
      onStateReceived
    };
  }, [onNodeAdd, onNodeUpdate, onNodeDelete, onNodeMove, onEdgeAdd, onEdgeDelete, onStateReceived]);

  const [state, setState] = useState<CollaborationState>({
    isConnected: false,
    isConnecting: false,
    diagramId: null,
    permission: null,
    collaborators: [],
    error: null,
    ownerUsername: null,
    diagramName: null
  });

  // Update collaborator with color
  const addCollaborator = useCallback((user: CollaboratorInfo) => {
    setState(prev => {
      // Check if already exists
      if (prev.collaborators.some(c => c.id === user.id)) {
        return prev;
      }
      return {
        ...prev,
        collaborators: [
          ...prev.collaborators,
          { ...user, color: getCollaboratorColor(user.id) }
        ]
      };
    });
  }, []);

  // Remove collaborator
  const removeCollaborator = useCallback((socketId: string) => {
    setState(prev => ({
      ...prev,
      collaborators: prev.collaborators.filter(c => c.id !== socketId)
    }));
  }, []);

  // Update collaborator cursor
  const updateCollaboratorCursor = useCallback((socketId: string, x: number, y: number) => {
    setState(prev => ({
      ...prev,
      collaborators: prev.collaborators.map(c =>
        c.id === socketId ? { ...c, cursor: { x, y } } : c
      )
    }));
  }, []);

  // Update collaborator selection
  const updateCollaboratorSelection = useCallback((socketId: string, selectedNodes: string[], selectedEdges: string[]) => {
    setState(prev => ({
      ...prev,
      collaborators: prev.collaborators.map(c =>
        c.id === socketId ? { ...c, selectedNodes, selectedEdges } : c
      )
    }));
  }, []);

  // Connect to socket server
  const connect = useCallback(() => {
    const token = getToken();
    
    if (!token) {
      setState(prev => ({ ...prev, error: 'Authentication required' }));
      return;
    }

    if (socketRef.current?.connected) {
      return;
    }

    setState(prev => ({ ...prev, isConnecting: true, error: null }));

    const socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000
    });

    // Connection events
    socket.on('connect', () => {
      console.log('Connected to collaboration server');
      collaborationToasts.connected();
      setState(prev => ({
        ...prev,
        isConnected: true,
        isConnecting: false,
        error: null
      }));
    });

    socket.on('connect_error', (error) => {
      console.error('Connection error:', error.message);
      collaborationToasts.connectionError(error.message);
      setState(prev => ({
        ...prev,
        isConnected: false,
        isConnecting: false,
        error: error.message
      }));
    });

    socket.on('disconnect', (reason) => {
      console.log('Disconnected:', reason);
      if (reason === 'io server disconnect' || reason === 'transport close') {
        collaborationToasts.disconnected();
      }
      setState(prev => ({
        ...prev,
        isConnected: false,
        diagramId: null,
        collaborators: [],
        permission: null
      }));
    });

    // Diagram room events
    socket.on('joined-diagram', (data: DiagramJoinedEvent) => {
      console.log('Joined diagram:', data.diagramId);
      
      // Add colors to users
      const usersWithColors = data.users
        .filter(u => u.id !== socket.id) // Exclude self
        .map(u => ({ ...u, color: getCollaboratorColor(u.id) }));

      setState(prev => ({
        ...prev,
        diagramId: data.diagramId,
        permission: data.permission,
        collaborators: usersWithColors,
        ownerUsername: data.ownerUsername,
        diagramName: data.diagramName
      }));
    });

    socket.on('user-joined', (user: UserJoinedEvent) => {
      console.log(`${user.username} joined`);
      collaborationToasts.userJoined(user.username);
      addCollaborator({
        ...user,
        color: getCollaboratorColor(user.id)
      });
    });

    socket.on('user-left', (data: UserLeftEvent) => {
      console.log(`${data.username} left`);
      collaborationToasts.userLeft(data.username);
      removeCollaborator(data.id);
    });

    // Cursor updates
    socket.on('cursor-update', (data: CursorUpdateEvent) => {
      updateCollaboratorCursor(data.id, data.x, data.y);
    });

    // Selection updates from other users
    socket.on('selection-change', (data: { userId: string; username: string; selectedNodes: string[]; selectedEdges: string[] }) => {
      // Find the collaborator by odUserId and update their selection
      setState(prev => ({
        ...prev,
        collaborators: prev.collaborators.map(c =>
          c.odUserId === data.userId ? { ...c, selectedNodes: data.selectedNodes, selectedEdges: data.selectedEdges } : c
        )
      }));
    });

    // Node operations from others - use refs to avoid stale closures
    socket.on('node-add', (data: { node: GenericNode; userId: string; username: string }) => {
      console.log(`Node added by ${data.username}`);
      callbacksRef.current.onNodeAdd?.(data.node);
    });

    socket.on('node-update', (data: { nodeId: string; changes: Partial<GenericNode>; userId: string; username: string }) => {
      console.log(`Node updated by ${data.username}`);
      callbacksRef.current.onNodeUpdate?.(data.nodeId, data.changes);
    });

    socket.on('node-delete', (data: { nodeId: string; userId: string; username: string }) => {
      console.log(`Node deleted by ${data.username}`);
      callbacksRef.current.onNodeDelete?.(data.nodeId);
    });

    socket.on('node-move', (data: { nodeId: string; position: { x: number; y: number }; userId: string; username: string }) => {
      callbacksRef.current.onNodeMove?.(data.nodeId, data.position);
    });

    // Edge operations from others - use refs to avoid stale closures
    socket.on('edge-add', (data: { edge: GenericEdge; userId: string; username: string }) => {
      console.log(`Edge added by ${data.username}`);
      callbacksRef.current.onEdgeAdd?.(data.edge);
    });

    socket.on('edge-delete', (data: { edgeId: string; userId: string; username: string }) => {
      console.log(`Edge deleted by ${data.username}`);
      callbacksRef.current.onEdgeDelete?.(data.edgeId);
    });

    // State request from late joiners
    socket.on('provide-state', (data: { requesterId: string; requesterUsername: string }) => {
      console.log(`State requested by ${data.requesterUsername}`);
      stateProviderRequesterId.current = data.requesterId;
    });

    // Receive state from another user
    socket.on('state-provided', (data: { nodes: GenericNode[]; edges: GenericEdge[] }) => {
      console.log('State received from collaborator');
      callbacksRef.current.onStateReceived?.(data);
    });

    // Error handling
    socket.on('error', (data: { message: string }) => {
      console.error('Socket error:', data.message);
      setState(prev => ({ ...prev, error: data.message }));
    });

    socketRef.current = socket;
  }, [addCollaborator, removeCollaborator, updateCollaboratorCursor]);

  // Disconnect from socket server
  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
      setState({
        isConnected: false,
        isConnecting: false,
        diagramId: null,
        permission: null,
        collaborators: [],
        error: null,
        ownerUsername: null,
        diagramName: null
      });
    }
  }, []);

  // Join a diagram room
  const joinDiagram = useCallback((diagramId: string) => {
    if (!socketRef.current?.connected) {
      setState(prev => ({ ...prev, error: 'Not connected to server' }));
      return;
    }

    socketRef.current.emit('join-diagram', { diagramId });
  }, []);

  // Leave current diagram room
  const leaveDiagram = useCallback(() => {
    if (!socketRef.current?.connected || !state.diagramId) {
      return;
    }

    socketRef.current.emit('leave-diagram', { diagramId: state.diagramId });
    setState(prev => ({
      ...prev,
      diagramId: null,
      permission: null,
      collaborators: [],
      ownerUsername: null,
      diagramName: null
    }));
  }, [state.diagramId]);

  // Broadcast cursor position (throttled - call from component with throttle)
  const broadcastCursor = useCallback((x: number, y: number) => {
    if (!socketRef.current?.connected || !state.diagramId) {
      return;
    }

    socketRef.current.emit('cursor-move', {
      diagramId: state.diagramId,
      x,
      y
    });
  }, [state.diagramId]);

  // Broadcast node operations
  const broadcastNodeAdd = useCallback((node: GenericNode) => {
    if (!socketRef.current?.connected || !state.diagramId || state.permission !== 'edit') {
      return;
    }
    socketRef.current.emit('node-add', { diagramId: state.diagramId, node });
  }, [state.diagramId, state.permission]);

  const broadcastNodeUpdate = useCallback((nodeId: string, changes: Partial<GenericNode>) => {
    if (!socketRef.current?.connected || !state.diagramId || state.permission !== 'edit') {
      return;
    }
    socketRef.current.emit('node-update', { diagramId: state.diagramId, nodeId, changes });
  }, [state.diagramId, state.permission]);

  const broadcastNodeDelete = useCallback((nodeId: string) => {
    if (!socketRef.current?.connected || !state.diagramId || state.permission !== 'edit') {
      return;
    }
    socketRef.current.emit('node-delete', { diagramId: state.diagramId, nodeId });
  }, [state.diagramId, state.permission]);

  const broadcastNodeMove = useCallback((nodeId: string, position: { x: number; y: number }) => {
    if (!socketRef.current?.connected || !state.diagramId || state.permission !== 'edit') {
      return;
    }
    socketRef.current.emit('node-move', { diagramId: state.diagramId, nodeId, position });
  }, [state.diagramId, state.permission]);

  // Broadcast edge operations
  const broadcastEdgeAdd = useCallback((edge: GenericEdge) => {
    if (!socketRef.current?.connected || !state.diagramId || state.permission !== 'edit') {
      return;
    }
    socketRef.current.emit('edge-add', { diagramId: state.diagramId, edge });
  }, [state.diagramId, state.permission]);

  const broadcastEdgeDelete = useCallback((edgeId: string) => {
    if (!socketRef.current?.connected || !state.diagramId || state.permission !== 'edit') {
      return;
    }
    socketRef.current.emit('edge-delete', { diagramId: state.diagramId, edgeId });
  }, [state.diagramId, state.permission]);

  // Broadcast selection changes
  const broadcastSelection = useCallback((nodeIds: string[], edgeIds: string[]) => {
    if (!socketRef.current?.connected || !state.diagramId) {
      return;
    }
    socketRef.current.emit('selection-change', {
      diagramId: state.diagramId,
      selectedNodes: nodeIds,
      selectedEdges: edgeIds
    });
  }, [state.diagramId]);

  // Provide state to a late joiner
  const provideState = useCallback((stateData: { nodes: GenericNode[]; edges: GenericEdge[] }) => {
    if (!socketRef.current?.connected || !stateProviderRequesterId.current) {
      return;
    }
    // Send state directly to the requester
    socketRef.current.emit('state-response', {
      targetId: stateProviderRequesterId.current,
      ...stateData
    });
    stateProviderRequesterId.current = null;
  }, []);

  // Auto-connect if there's a token
  useEffect(() => {
    const token = getToken();
    if (token && !socketRef.current) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, []);

  // Auto-join diagram if provided
  useEffect(() => {
    if (initialDiagramId && state.isConnected && !state.diagramId) {
      joinDiagram(initialDiagramId);
    }
  }, [initialDiagramId, state.isConnected, state.diagramId, joinDiagram]);

  return {
    state,
    connect,
    disconnect,
    joinDiagram,
    leaveDiagram,
    broadcastCursor,
    broadcastNodeAdd,
    broadcastNodeUpdate,
    broadcastNodeDelete,
    broadcastNodeMove,
    broadcastEdgeAdd,
    broadcastEdgeDelete,
    broadcastSelection,
    provideState
  };
}

export default useCollaboration;
