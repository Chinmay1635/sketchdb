import React, { useCallback, useState, useRef, useEffect } from "react";
import {
  Routes,
  Route,
  useParams,
  useNavigate,
  useLocation,
} from "react-router-dom";
import {
  ReactFlow,
  addEdge,
  MiniMap,
  Controls,
  Background,
  useEdgesState,
  useReactFlow,
  ReactFlowProvider,
  Connection,
  Edge,
  Node,
  NodeTypes,
  EdgeTypes,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

// Components
import {
  TableNode,
  Sidebar,
  SQLDialog,
  ImportDialog,
  DeleteConfirmDialog,
  Toolbar,
  LoadingDialog,
  ErrorDialog,
  CustomEdge,
  NotFound,
  ShareDialog,
  CollaboratorCursors,
  CollaboratorAvatars,
  MyDiagramsDialog,
  AIChatSidebar,
} from "./components";
import AuthDialog from "./components/AuthDialog";
import SavedDiagramsDialog from "./components/SavedDiagramsDialog";
import UserMenu from "./components/UserMenu";
import LandingPage from "./components/LandingPage";

// Context
import { AuthProvider, useAuth } from "./context/AuthContext";

// Hooks
import { useTableManagement } from "./hooks/useTableManagement";
import { useCollaboration } from "./hooks/useCollaboration";

// Utils
import { parseConnectionHandles, createStyledEdge, isValidConnection, createEdgesFromForeignKeys } from "./utils/connectionUtils";
import { generateSQL, copyToClipboard } from "./utils/sqlGenerator";
import { parseSQLSchema } from "./utils/sqlParser";
import { exportCanvasAsPNG, exportCanvasAsPDF } from "./utils/canvasExport";
import { useErrorHandler } from "./utils/errorHandler";
import { diagramsAPI } from "./services/api";

// Types
import { AttributeType, DataType } from "./types";

// Safe SQL generator that doesn't throw
const safeGenerateSQL = (nodes: Node[]): string => {
  try {
    return generateSQL(nodes);
  } catch (e) {
    console.error('SQL generation error:', e);
    return '-- SQL generation failed. Please check your schema for errors.';
  }
};

// Node types configuration
const nodeTypes: NodeTypes = {
  tableNode: TableNode,
};

// Edge types configuration
const edgeTypes: EdgeTypes = {
  customEdge: CustomEdge,
};

const initialNodes: Node[] = [];
const initialEdges: Edge[] = [];

// Main Canvas Component
function CanvasPlayground() {
  const [edges, setEdges, onEdgesChangeDefault] = useEdgesState(initialEdges);
  const reactFlowInstance = useReactFlow();
  const navigate = useNavigate();
  const location = useLocation();
  const { username: urlUsername, slug: urlSlug } = useParams<{ username: string; slug: string }>();

  // Auth state
  const { isAuthenticated, user } = useAuth();
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [savedDiagramsDialogOpen, setSavedDiagramsDialogOpen] = useState(false);
  const [myDiagramsDialogOpen, setMyDiagramsDialogOpen] = useState(false);
  const [currentDiagramId, setCurrentDiagramId] = useState<string | null>(null);
  const [currentDiagramSlug, setCurrentDiagramSlug] = useState<string | null>(null);
  const [currentDiagramName, setCurrentDiagramName] = useState<string | null>(null);
  const [currentOwnerUsername, setCurrentOwnerUsername] = useState<string | null>(null);
  const [currentPermission, setCurrentPermission] = useState<'owner' | 'edit' | 'view' | null>(null);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingDiagram, setIsLoadingDiagram] = useState(false);
  const [diagramNotFound, setDiagramNotFound] = useState(false);

  // Error handling
  const { error, showError, clearError, retryOperation, hasError } = useErrorHandler();

  // Dialog states
  const [sqlDialogOpen, setSqlDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [loadingDialogOpen, setLoadingDialogOpen] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [aiChatOpen, setAiChatOpen] = useState(false);
  const [sqlText, setSqlText] = useState("");
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [lastOperation, setLastOperation] = useState<(() => void) | null>(null);
  const [isPublic, setIsPublic] = useState(false);

  // Table management
  const tableManagement = useTableManagement(
    initialNodes,
    setEdges
  );

  const {
    nodes,
    selectedTableId,
    selectedTable,
    attributes,
    isEditingTableName,
    editTableName,
    attrName,
    attrType,
    attrDataType,
    refTable,
    refAttr,

    setSelectedTableId,
    onNodesChange,
    addTable,
    deleteTable,
    addAttribute,
    startEditTableName,
    saveTableName,
    cancelEditTableName,
    changeTableColor,

    // Attribute editing
    onStartAttrEdit,
    onAttrEditNameChange,
    onAttrEditDataTypeChange,
    onAttrEditTypeChange,
    onAttrEditRefTableChange,
    onAttrEditRefAttrChange,
    onSaveAttrName,
    onCancelAttrEdit,
    onDeleteAttribute,

    updateNodeAttributes,

    setEditTableName,
    setAttrName,
    setAttrType,
    setAttrDataType,
    setRefTable,
    setRefAttr,
    
    // FK Helper functions
    getAvailableTables,
    getAttributesForTable,
    validateFKReference,
    createFKEdge,
    removeFKEdge,
    importNodes,
    setNodes, // For collaboration updates
  } = tableManagement;

  // Collaboration hook - handles real-time sync
  const cursorThrottleRef = useRef<number>(0);
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleCollabNodeAdd = useCallback((node: any) => {
    setNodes((prev: Node[]) => [...prev, node as Node]);
  }, [setNodes]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleCollabNodeUpdate = useCallback((nodeId: string, changes: any) => {
    setNodes((prev: Node[]) => prev.map(n => 
      n.id === nodeId ? { ...n, ...changes, data: { ...n.data, ...(changes.data || {}) } } : n
    ));
  }, [setNodes]);

  const handleCollabNodeDelete = useCallback((nodeId: string) => {
    setNodes((prev: Node[]) => prev.filter(n => n.id !== nodeId));
  }, [setNodes]);

  const handleCollabNodeMove = useCallback((nodeId: string, position: { x: number; y: number }) => {
    setNodes((prev: Node[]) => prev.map(n =>
      n.id === nodeId ? { ...n, position } : n
    ));
  }, [setNodes]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleCollabEdgeAdd = useCallback((edge: any) => {
    setEdges(prev => [...prev, edge as Edge]);
  }, [setEdges]);

  const handleCollabEdgeDelete = useCallback((edgeId: string) => {
    setEdges(prev => prev.filter(e => e.id !== edgeId));
  }, [setEdges]);

  // Initialize collaboration hook FIRST - before any useEffect that uses it
  const collaboration = useCollaboration({
    diagramId: currentDiagramId || undefined,
    onNodeAdd: handleCollabNodeAdd,
    onNodeUpdate: handleCollabNodeUpdate,
    onNodeDelete: handleCollabNodeDelete,
    onNodeMove: handleCollabNodeMove,
    onEdgeAdd: handleCollabEdgeAdd,
    onEdgeDelete: handleCollabEdgeDelete,
  });

  // Track previous nodes for detecting changes to broadcast
  const prevNodesRef = useRef<string>('');
  
  // Auto-save and broadcast node changes
  const autoSaveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const AUTO_SAVE_DELAY = 3000; // 3 seconds debounce
  
  // Refs for auto-save to avoid stale closures
  const nodesRef = useRef(nodes);
  const edgesRef = useRef(edges);
  useEffect(() => { nodesRef.current = nodes; }, [nodes]);
  useEffect(() => { edgesRef.current = edges; }, [edges]);
  
  // Effect to detect and broadcast node changes + auto-save
  useEffect(() => {
    const currentNodesStr = JSON.stringify(nodes.map(n => ({ id: n.id, data: n.data, position: n.position })));
    
    if (prevNodesRef.current && prevNodesRef.current !== currentNodesStr) {
      // Nodes changed - broadcast full state update to collaborators
      if (collaboration.state.isConnected && collaboration.state.permission === 'edit') {
        // Parse to find what changed
        try {
          const prevNodes = JSON.parse(prevNodesRef.current);
          const currNodes = nodes.map(n => ({ id: n.id, data: n.data, position: n.position }));
          
          // Find updated nodes (data changed, not position)
          currNodes.forEach(curr => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const prev = prevNodes.find((p: any) => p.id === curr.id);
            if (prev && JSON.stringify(prev.data) !== JSON.stringify(curr.data)) {
              // Node data changed - broadcast update
              collaboration.broadcastNodeUpdate(curr.id, { data: curr.data });
            }
          });
        } catch (e) {
          // Ignore parse errors
        }
      }
      
      // Schedule auto-save for owner
      if (currentDiagramId && isAuthenticated && currentPermission === 'owner') {
        if (autoSaveTimeoutRef.current) {
          clearTimeout(autoSaveTimeoutRef.current);
        }
        autoSaveTimeoutRef.current = setTimeout(async () => {
          try {
            setIsSaving(true);
            const diagramData = {
              name: currentDiagramName || 'Untitled Diagram',
              description: '',
              nodes: nodesRef.current, // Use ref to get current value
              edges: edgesRef.current, // Use ref to get current value
              sqlContent: safeGenerateSQL(nodesRef.current),
              viewport: reactFlowInstance ? reactFlowInstance.getViewport() : { x: 0, y: 0, zoom: 1 },
            };
            await diagramsAPI.update(currentDiagramId, diagramData);
            setLastSavedAt(new Date());
            console.log('Auto-saved diagram');
          } catch (error) {
            console.error('Auto-save failed:', error);
          } finally {
            setIsSaving(false);
          }
        }, AUTO_SAVE_DELAY);
      }
    }
    
    prevNodesRef.current = currentNodesStr;
    
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [nodes, collaboration.state.isConnected, collaboration.state.permission, currentDiagramId, isAuthenticated, currentPermission, currentDiagramName, reactFlowInstance, collaboration.broadcastNodeUpdate]);

  // Throttled cursor broadcast
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!collaboration.state.isConnected || !collaboration.state.diagramId) return;
    
    const now = Date.now();
    if (now - cursorThrottleRef.current < 50) return; // 20fps max
    cursorThrottleRef.current = now;

    // Convert screen coordinates to flow coordinates
    const bounds = e.currentTarget.getBoundingClientRect();
    const viewport = reactFlowInstance?.getViewport();
    if (!viewport) return;

    const x = (e.clientX - bounds.left - viewport.x) / viewport.zoom;
    const y = (e.clientY - bounds.top - viewport.y) / viewport.zoom;

    collaboration.broadcastCursor(x, y);
  }, [collaboration, reactFlowInstance]);

  // Load diagram from URL parameters
  useEffect(() => {
    const loadDiagramFromURL = async () => {
      // Only load if we have URL params and not already loading
      if (!urlUsername || !urlSlug) {
        setDiagramNotFound(false);
        return;
      }

      // Skip if we already have this diagram loaded
      if (currentDiagramSlug === urlSlug && currentOwnerUsername?.toLowerCase() === urlUsername.toLowerCase()) {
        return;
      }

      setIsLoadingDiagram(true);
      setDiagramNotFound(false);

      try {
        const response = await diagramsAPI.getBySlug(urlUsername, urlSlug);
        if (response.success && response.diagram) {
          const diagram = response.diagram;
          
          // Load nodes
          if (diagram.nodes && diagram.nodes.length > 0) {
            importNodes(diagram.nodes);
          } else {
            importNodes([]);
          }
          
          // Load edges
          if (diagram.edges) {
            setEdges(diagram.edges);
          } else {
            setEdges([]);
          }
          
          // Set viewport if available
          if (diagram.viewport && reactFlowInstance) {
            setTimeout(() => {
              reactFlowInstance.setViewport(diagram.viewport);
            }, 100);
          }
          
          // Store diagram info
          setCurrentDiagramId(diagram._id);
          setCurrentDiagramSlug(diagram.slug);
          setCurrentDiagramName(diagram.name);
          setCurrentOwnerUsername(diagram.ownerUsername);
          setCurrentPermission(diagram.permission);
          setIsPublic(diagram.isPublic || false);
          setLastSavedAt(diagram.updatedAt ? new Date(diagram.updatedAt) : new Date());
          
          console.log('Diagram loaded from URL:', diagram.name);
        } else {
          setDiagramNotFound(true);
        }
      } catch (err: any) {
        console.error('Failed to load diagram from URL:', err);
        if (err.message?.includes('not found') || err.message?.includes('permission')) {
          setDiagramNotFound(true);
        } else {
          showError(new Error('Failed to load diagram. Please try again.'), 'import');
        }
      } finally {
        setIsLoadingDiagram(false);
      }
    };

    loadDiagramFromURL();
  }, [urlUsername, urlSlug, currentDiagramSlug, currentOwnerUsername, importNodes, setEdges, reactFlowInstance, showError]);

  // Import schema functionality
  const importSchema = useCallback((sqlText: string) => {
    try {
      // Parse SQL to nodes and edges
      const { nodes: parsedNodes, edges: parsedEdges } = parseSQLSchema(sqlText);
      
      // Replace all nodes and edges with imported ones
      importNodes(parsedNodes);
      setEdges(parsedEdges);
      
      console.log('Schema imported successfully:', { parsedNodes, parsedEdges });
    } catch (error) {
      console.error('Failed to import schema:', error);
      throw error; // Re-throw to be handled by ImportDialog
    }
  }, [importNodes, setEdges]);

  // Load diagram from saved data (from dialogs)
  const handleLoadDiagram = useCallback((diagram: any) => {
    try {
      // Load nodes
      if (diagram.nodes && diagram.nodes.length > 0) {
        importNodes(diagram.nodes);
      } else {
        importNodes([]);
      }
      
      // Load edges
      if (diagram.edges) {
        setEdges(diagram.edges);
      } else {
        setEdges([]);
      }
      
      // Set viewport if available
      if (diagram.viewport && reactFlowInstance) {
        setTimeout(() => {
          reactFlowInstance.setViewport(diagram.viewport);
        }, 100);
      }
      
      // Store current diagram info
      setCurrentDiagramId(diagram._id);
      setCurrentDiagramSlug(diagram.slug);
      setCurrentDiagramName(diagram.name);
      setCurrentOwnerUsername(diagram.ownerUsername || diagram.username);
      setCurrentPermission(diagram.permission || 'owner');
      setIsPublic(diagram.isPublic || false);
      setLastSavedAt(diagram.updatedAt ? new Date(diagram.updatedAt) : new Date());
      
      // Navigate to diagram URL
      const ownerUsername = diagram.ownerUsername || diagram.username || user?.username;
      if (ownerUsername && diagram.slug) {
        navigate(`/playground/${ownerUsername}/${diagram.slug}`, { replace: true });
      }
      
      console.log('Diagram loaded successfully:', diagram.name);
    } catch (error) {
      console.error('Failed to load diagram:', error);
      showError(new Error('Failed to load diagram. Please try again.'), 'import');
    }
  }, [importNodes, setEdges, reactFlowInstance, showError, navigate, user]);

  // Quick save current diagram
  const handleQuickSave = useCallback(async () => {
    if (!isAuthenticated) {
      setAuthDialogOpen(true);
      return;
    }

    // If no current diagram, open save dialog to create new
    if (!currentDiagramId) {
      setSavedDiagramsDialogOpen(true);
      return;
    }

    setIsSaving(true);
    try {
      const diagramData = {
        name: currentDiagramName || 'Untitled Diagram',
        description: '',
        nodes: nodes,
        edges: edges,
        sqlContent: generateSQL(nodes),
        viewport: reactFlowInstance ? reactFlowInstance.getViewport() : { x: 0, y: 0, zoom: 1 },
      };

      await diagramsAPI.update(currentDiagramId, diagramData);
      setLastSavedAt(new Date());
      console.log('Diagram saved successfully');
    } catch (error) {
      console.error('Failed to save diagram:', error);
      showError(new Error('Failed to save diagram. Please try again.'), 'export');
    } finally {
      setIsSaving(false);
    }
  }, [isAuthenticated, currentDiagramId, currentDiagramName, nodes, edges, reactFlowInstance, showError]);

  // Handle save completion from dialog (for new diagrams)
  const handleSaveComplete = useCallback((diagramId: string, name: string, slug?: string) => {
    setCurrentDiagramId(diagramId);
    setCurrentDiagramName(name);
    setLastSavedAt(new Date());
    
    // Navigate to new diagram URL
    if (slug && user?.username) {
      setCurrentDiagramSlug(slug);
      setCurrentOwnerUsername(user.username);
      setCurrentPermission('owner');
      navigate(`/playground/${user.username}/${slug}`, { replace: true });
    }
  }, [navigate, user]);

  // Get current viewport
  const getViewport = useCallback(() => {
    if (reactFlowInstance) {
      return reactFlowInstance.getViewport();
    }
    return { x: 0, y: 0, zoom: 1 };
  }, [reactFlowInstance]);

  // Import dialog handlers
  const handleImportSchema = useCallback(() => {
    setImportDialogOpen(true);
  }, []);

  const handleImportClose = useCallback(() => {
    setImportDialogOpen(false);
  }, []);

  const handleImportError = useCallback((error: any) => {
    showError(error, 'import');
    setLastOperation(() => () => setImportDialogOpen(true));
  }, [showError]);

  // Handle importing SQL from uploaded file
  const handleImportSQLFile = useCallback((sqlText: string) => {
    try {
      importSchema(sqlText);
      // close any dialogs if open
      setImportDialogOpen(false);
    } catch (error) {
      console.error('Import SQL file failed:', error);
      showError(error, 'import');
      setLastOperation(() => () => handleImportSchema());
    }
  }, [importSchema, showError, handleImportSchema]);

  // Handle applying AI-generated schema
  const handleApplyAISchema = useCallback((newNodes: Node[], newEdges: Edge[]) => {
    try {
      // The AI generates nodes with FK attributes containing refTable (could be node ID or table label)
      // We normalize refTable to use table LABEL for SQL generation consistency
      const nodesWithFixedRefs = newNodes.map(node => {
        const nodeData = node.data as any;
        if (!nodeData.attributes) return node;
        
        const fixedAttributes = nodeData.attributes.map((attr: any) => {
          if (attr.type === 'FK' && attr.refTable) {
            // Find the referenced node by ID or label
            const referencedNode = newNodes.find(n => {
              const label = (n.data as any)?.label;
              return n.id === attr.refTable || label === attr.refTable;
            });
            
            if (referencedNode) {
              // Normalize refTable to use table LABEL (for SQL generation)
              const refTableLabel = (referencedNode.data as any)?.label || attr.refTable;
              return {
                ...attr,
                refTable: refTableLabel, // Use table label for SQL compatibility
              };
            }
          }
          return attr;
        });
        
        return {
          ...node,
          data: {
            ...nodeData,
            attributes: fixedAttributes,
          },
        };
      });
      
      // Import the AI-generated nodes
      importNodes(nodesWithFixedRefs);
      
      // Regenerate edges from FK relationships in nodes
      // This ensures edges use correct handle IDs that match TableNode component
      const generatedEdges = createEdgesFromForeignKeys(nodesWithFixedRefs);
      setEdges(generatedEdges);
      
      console.log('AI Schema applied:', { 
        nodes: nodesWithFixedRefs, 
        generatedEdges,
        originalAIEdges: newEdges 
      });
      
      // Broadcast changes to collaborators if connected with edit permission
      if (collaboration.state.isConnected && collaboration.state.permission === 'edit') {
        // Broadcast each new node
        nodesWithFixedRefs.forEach(node => {
          collaboration.broadcastNodeAdd(node);
        });
        // Broadcast each generated edge
        generatedEdges.forEach(edge => {
          collaboration.broadcastEdgeAdd(edge);
        });
      }
      
      // Close the AI chat sidebar after applying
      setAiChatOpen(false);
    } catch (error) {
      console.error('Apply AI schema failed:', error);
      showError(error, 'import');
    }
  }, [importNodes, setEdges, collaboration, showError]);

  // Canvas export handlers
  const handleExportPNG = useCallback(async () => {
    try {
      setLoadingDialogOpen(true);
      await exportCanvasAsPNG();
    } catch (error) {
      console.error('Export PNG failed:', error);
      showError(error, 'export');
      setLastOperation(() => handleExportPNG);
    } finally {
      setLoadingDialogOpen(false);
    }
  }, [showError]);

  const handleExportPDF = useCallback(async () => {
    try {
      setLoadingDialogOpen(true);
      await exportCanvasAsPDF();
    } catch (error) {
      console.error('Export PDF failed:', error);
      showError(error, 'export');
      setLastOperation(() => handleExportPDF);
    } finally {
      setLoadingDialogOpen(false);
    }
  }, [showError]);

  // Connection handling
  const onConnect = useCallback(
    async (params: Edge | Connection) => {
      try {
        const connectionInfo = parseConnectionHandles(
          params.sourceHandle || null,
          params.targetHandle || null
        );

        if (connectionInfo) {
          updateNodeAttributes(connectionInfo);
        }

        const newEdge = createStyledEdge(params, nodes);
        setEdges((eds) => addEdge(newEdge as Connection, eds));
        
        // Broadcast edge to collaborators (broadcastEdgeAdd internally checks permission)
        if (collaboration.state.isConnected && collaboration.state.permission === 'edit') {
          collaboration.broadcastEdgeAdd(newEdge as Edge);
        }
      } catch (error) {
        console.error('Failed to create connection:', error);
        showError(new Error('Failed to create connection between tables. Please try again.'), 'validation');
      }
    },
    [setEdges, updateNodeAttributes, showError, nodes, collaboration]
  );

  // Custom edges change handler with collaboration broadcast
  const onEdgesChange = useCallback(
    (changes: any[]) => {
      // Track removed edges for collaboration
      const removedEdges = changes.filter((c: any) => c.type === 'remove');
      
      // Handle the default React Flow changes
      onEdgesChangeDefault(changes);
      
      // Broadcast edge removals to collaborators
      if (collaboration.state.isConnected && collaboration.state.permission === 'edit') {
        removedEdges.forEach((change: any) => {
          collaboration.broadcastEdgeDelete(change.id);
        });
      }
    },
    [onEdgesChangeDefault, collaboration]
  );

  // Wrapped onNodesChange with collaboration broadcast
  const lastNodePositionsRef = useRef<Map<string, { x: number; y: number }>>(new Map());
  const nodePositionThrottleRef = useRef<Map<string, number>>(new Map());
  
  const handleNodesChange = useCallback((changes: any[]) => {
    onNodesChange(changes);
    
    // Broadcast position changes to collaborators
    if (collaboration.state.isConnected && collaboration.state.permission === 'edit') {
      changes.forEach((change: any) => {
        if (change.type === 'position' && change.position && !change.dragging) {
          // Node drag ended - broadcast final position
          const nodeId = change.id;
          const position = change.position;
          
          // Throttle broadcasts per node
          const now = Date.now();
          const lastBroadcast = nodePositionThrottleRef.current.get(nodeId) || 0;
          if (now - lastBroadcast > 100) {
            collaboration.broadcastNodeMove(nodeId, position);
            nodePositionThrottleRef.current.set(nodeId, now);
          }
        }
      });
    }
  }, [onNodesChange, collaboration]);

  // Node selection
  const onNodeClick = useCallback(
    (_: any, node: Node) => {
      try {
        setSelectedTableId(node.id);
      } catch (error) {
        console.error('Failed to select node:', error);
        showError(new Error('Failed to select table. Please try again.'), 'validation');
      }
    },
    [setSelectedTableId, showError]
  );

  // SQL Export with loading animation and error handling
  const exportToSQL = useCallback(() => {
    try {
      setLoadingDialogOpen(true);
      
      // Validate nodes before generation
      if (!nodes || nodes.length === 0) {
        throw new Error('No tables available to export. Please create some tables first.');
      }
      
      const sql = generateSQL(nodes);

      const timeoutId = setTimeout(() => {
        setLoadingDialogOpen(false);
        setSqlText(sql);
        setSqlDialogOpen(true);
      }, 1500); // Reduced timeout for better UX

      return timeoutId;
    } catch (error) {
      setLoadingDialogOpen(false);
      console.error('SQL export failed:', error);
      showError(error, 'export');
      setLastOperation(() => exportToSQL);
    }
  }, [nodes, showError]);

  // Download SQL as a .sql file
  const downloadSQL = useCallback(() => {
    try {
      if (!nodes || nodes.length === 0) {
        throw new Error('No tables available to export. Please create some tables first.');
      }
      const sql = generateSQL(nodes);
      const blob = new Blob([sql], { type: 'text/sql' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const filename = `schema.sql`;
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download SQL failed:', error);
      showError(error, 'export');
      setLastOperation(() => downloadSQL);
    }
  }, [nodes, showError]);

  const handleCancelLoading = useCallback(() => {
    setLoadingDialogOpen(false);
  }, []);

  const handleCopySQL = useCallback(() => {
    try {
      copyToClipboard(sqlText);
      // You could show a success toast here
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      showError(new Error('Failed to copy SQL to clipboard. Please try selecting and copying manually.'), 'export');
    }
  }, [sqlText, showError]);

  // Wrapped functions with error handling and collaboration broadcast
  const handleAddAttribute = useCallback(() => {
    try {
      addAttribute();
    } catch (error) {
      console.error('Failed to add attribute:', error);
      showError(error, 'validation');
    }
  }, [addAttribute, showError]);

  const handleAddTable = useCallback(() => {
    try {
      const newNode = addTable();
      // Broadcast to collaborators
      if (newNode && collaboration.state.isConnected) {
        collaboration.broadcastNodeAdd(newNode);
      }
    } catch (error) {
      console.error('Failed to add table:', error);
      showError(error, 'validation');
    }
  }, [addTable, showError, collaboration]);

  // Error handling
  const handleRetryOperation = useCallback(() => {
    if (lastOperation) {
      retryOperation(lastOperation);
      setLastOperation(null);
    } else {
      clearError();
    }
  }, [lastOperation, retryOperation, clearError]);

  // Delete handlers
  const handleDeleteTable = useCallback(() => {
    try {
      const deletedId = selectedTableId;
      deleteTable();
      setDeleteConfirmOpen(false);
      // Broadcast to collaborators
      if (deletedId && collaboration.state.isConnected) {
        collaboration.broadcastNodeDelete(deletedId);
      }
    } catch (error) {
      console.error('Failed to delete table:', error);
      showError(error, 'validation');
    }
  }, [deleteTable, showError, selectedTableId, collaboration]);

  const handleDeleteConfirm = useCallback(() => {
    setDeleteConfirmOpen(true);
  }, []);

  // Handle "New Diagram" - clear everything and go to home
  const handleNewDiagram = useCallback(() => {
    importNodes([]);
    setEdges([]);
    setCurrentDiagramId(null);
    setCurrentDiagramSlug(null);
    setCurrentDiagramName(null);
    setCurrentOwnerUsername(null);
    setCurrentPermission(null);
    setLastSavedAt(null);
    navigate('/playground', { replace: true });
  }, [importNodes, setEdges, navigate]);

  // Show loading state when loading diagram from URL
  if (isLoadingDiagram) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-gray-900">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-300 text-lg">Loading diagram...</p>
        </div>
      </div>
    );
  }

  // Show 404 if diagram not found
  if (diagramNotFound) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-gray-900">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="text-6xl mb-4">🔍</div>
          <h1 className="text-2xl font-bold text-white mb-2">Diagram Not Found</h1>
          <p className="text-gray-400 mb-6">
            This diagram doesn't exist or you don't have permission to view it.
          </p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => navigate('/playground')}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Go to Home
            </button>
            <button
              onClick={() => {
                setDiagramNotFound(false);
                window.location.reload();
              }}
              className="px-6 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Determine if the current user can only view (not edit)
  // User can edit if:
  // - They are the owner (currentPermission === 'owner')
  // - They are a collaborator with edit permission (currentPermission === 'edit')
  // - They are on a playground without a slug (new diagram)
  const canEdit = 
    currentPermission === 'owner' || 
    currentPermission === 'edit' || 
    (!urlSlug && isAuthenticated);
  const isReadOnly = !canEdit;

  return (
    <div className="w-screen h-screen flex bg-gray-900">
      {/* Navbar - Fixed at top */}
      <Toolbar 
        onAddTable={handleAddTable} 
        onExportSQL={exportToSQL}
        onImportSchema={handleImportSchema}
        onExportPNG={handleExportPNG}
        onExportPDF={handleExportPDF}
        onExportSQLFile={downloadSQL}
        onImportSQLFile={handleImportSQLFile}
        onSave={handleQuickSave}
        onShare={() => setShareDialogOpen(true)}
        onAIAssistantClick={() => setAiChatOpen(true)}
        isSaving={isSaving}
        lastSavedAt={lastSavedAt}
        currentDiagramName={currentDiagramName}
        currentDiagramId={currentDiagramId}
        isAuthenticated={isAuthenticated}
        onLoginClick={() => setAuthDialogOpen(true)}
        onSavedDiagramsClick={() => setSavedDiagramsDialogOpen(true)}
        onMyDiagramsClick={() => setMyDiagramsDialogOpen(true)}
        isReadOnly={isReadOnly}
      />

      {/* Collaboration Status Bar - Shows when collaborators are present */}
      {collaboration.state.isConnected && collaboration.state.collaborators.length > 0 && (
        <div className="fixed top-14 right-4 z-40 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 shadow-lg">
          <CollaboratorAvatars
            collaborators={collaboration.state.collaborators}
            ownerUsername={collaboration.state.ownerUsername}
            currentUserPermission={collaboration.state.permission}
          />
        </div>
      )}

      {/* Connection Status Indicator */}
      {currentDiagramId && (
        <div className="fixed bottom-4 right-4 z-40">
          <div 
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${
              collaboration.state.isConnected 
                ? 'bg-green-900/50 text-green-400 border border-green-700' 
                : collaboration.state.isConnecting
                  ? 'bg-yellow-900/50 text-yellow-400 border border-yellow-700'
                  : 'bg-gray-800 text-gray-400 border border-gray-700'
            }`}
          >
            <div 
              className={`w-2 h-2 rounded-full ${
                collaboration.state.isConnected 
                  ? 'bg-green-400 animate-pulse' 
                  : collaboration.state.isConnecting
                    ? 'bg-yellow-400 animate-pulse'
                    : 'bg-gray-500'
              }`}
            />
            {collaboration.state.isConnected 
              ? `Live • ${collaboration.state.collaborators.length + 1} user${collaboration.state.collaborators.length > 0 ? 's' : ''}`
              : collaboration.state.isConnecting
                ? 'Connecting...'
                : 'Offline'
            }
          </div>
        </div>
      )}

      {/* Auth Dialog */}
      <AuthDialog
        isOpen={authDialogOpen}
        onClose={() => setAuthDialogOpen(false)}
      />

      {/* Saved Diagrams Dialog */}
      <SavedDiagramsDialog
        isOpen={savedDiagramsDialogOpen}
        onClose={() => setSavedDiagramsDialogOpen(false)}
        onLoad={handleLoadDiagram}
        onSaveComplete={handleSaveComplete}
        currentNodes={nodes}
        currentEdges={edges}
        sqlContent={safeGenerateSQL(nodes)}
        viewport={getViewport()}
        currentDiagramId={currentDiagramId}
      />

      {/* My Diagrams Dialog - Like Canva's My Designs */}
      <MyDiagramsDialog
        isOpen={myDiagramsDialogOpen}
        onClose={() => setMyDiagramsDialogOpen(false)}
      />

      {/* Share Dialog */}
      <ShareDialog
        isOpen={shareDialogOpen}
        onClose={() => setShareDialogOpen(false)}
        diagramId={currentDiagramId}
        diagramSlug={currentDiagramSlug}
        ownerUsername={currentOwnerUsername}
        diagramName={currentDiagramName}
        isPublic={isPublic}
        onVisibilityChange={setIsPublic}
      />

      {/* AI Chat Sidebar */}
      <AIChatSidebar
        isOpen={aiChatOpen}
        onClose={() => setAiChatOpen(false)}
        diagramId={currentDiagramId}
        currentSchema={{ nodes, edges }}
        onApplySchema={handleApplyAISchema}
        isReadOnly={isReadOnly}
      />

      {/* Sidebar - Hidden in read-only mode */}
      {!isReadOnly && (
      <Sidebar
        selectedTable={selectedTable}
        attributes={attributes}
        isEditingTableName={isEditingTableName}
        editTableName={editTableName}
        attrName={attrName}
        attrType={attrType}
        attrDataType={attrDataType}
        refTable={refTable}
        refAttr={refAttr}
        onStartEditTableName={startEditTableName}
        onSaveTableName={saveTableName}
        onCancelEditTableName={cancelEditTableName}
        onEditTableNameChange={setEditTableName}
        onDeleteTable={deleteTable}
        onChangeTableColor={changeTableColor}
        onAttrNameChange={setAttrName}
        onAttrDataTypeChange={setAttrDataType}
        onAttrTypeChange={setAttrType}
        onRefTableChange={setRefTable}
        onRefAttrChange={setRefAttr}
        onAddAttribute={handleAddAttribute}
        onStartAttrEdit={onStartAttrEdit}
        onAttrEditNameChange={onAttrEditNameChange}
        onAttrEditDataTypeChange={onAttrEditDataTypeChange}
        onAttrEditTypeChange={onAttrEditTypeChange}
        onAttrEditRefTableChange={onAttrEditRefTableChange}
        onAttrEditRefAttrChange={onAttrEditRefAttrChange}
        onSaveAttrName={onSaveAttrName}
        onCancelAttrEdit={onCancelAttrEdit}
        onDeleteAttribute={onDeleteAttribute}
        getAvailableTables={getAvailableTables}
        getAttributesForTable={getAttributesForTable}
        validateFKReference={validateFKReference}
      />
      )}

      {/* Main Canvas Area */}
      <div className={`flex-1 relative bg-black ${isReadOnly ? 'pt-[86px]' : 'pt-14'}`}>
        {/* Loading Dialog */}
        <LoadingDialog
          isOpen={loadingDialogOpen}
          message="Parsing to SQL..."
          onCancel={handleCancelLoading}
        />

        {/* Import Dialog */}
        <ImportDialog
          isOpen={importDialogOpen}
          onClose={handleImportClose}
          onImport={importSchema}
          onError={handleImportError}
        />

        {/* SQL Dialog */}
        <SQLDialog
          isOpen={sqlDialogOpen}
          sqlText={sqlText}
          onClose={() => setSqlDialogOpen(false)}
          onCopy={handleCopySQL}
        />

        {/* Delete Confirmation Dialog */}
        <DeleteConfirmDialog
          isOpen={deleteConfirmOpen}
          selectedTable={selectedTable}
          selectedTableId={selectedTableId}
          onConfirm={handleDeleteTable}
          onCancel={() => setDeleteConfirmOpen(false)}
        />

        {/* Error Dialog */}
        <ErrorDialog
          isOpen={hasError}
          title={error?.title || 'Error'}
          message={error?.message || 'An unexpected error occurred'}
          details={error?.details}
          onClose={clearError}
          onRetry={error?.retryable ? handleRetryOperation : undefined}
        />

        {/* React Flow */}
        <div 
          className="w-full h-full"
          onMouseMove={handleMouseMove}
        >
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            onNodesChange={handleNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            isValidConnection={isValidConnection}
            fitView
            connectionLineStyle={{ stroke: "#60a5fa", strokeWidth: 3 }}
            defaultEdgeOptions={{
              type: "customEdge",
              style: { stroke: "#60a5fa", strokeWidth: 2 },
              markerEnd: { type: "arrowclosed", color: "#60a5fa" },
              labelBgStyle: { fill: "#1f2937", fillOpacity: 0.9 },
              labelStyle: { fill: "#60a5fa", fontWeight: "bold" },
            }}
          >
            <MiniMap style={{ backgroundColor: '#374151' }} />
            <Controls />
            <Background color="#4b5563" />
            
            {/* Collaborator Cursors */}
            {collaboration.state.collaborators.length > 0 && (
              <CollaboratorCursors collaborators={collaboration.state.collaborators} />
            )}
          </ReactFlow>
        </div>
      </div>
    </div>
  );
}

// Wrapper component for the canvas with routes
function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/playground" element={<CanvasPlayground />} />
      <Route path="/playground/:username/:slug" element={<CanvasPlayground />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

// App component
export default function App() {
  return (
    <AuthProvider>
      <ReactFlowProvider>
        <AppRoutes />
      </ReactFlowProvider>
    </AuthProvider>
  );
}
