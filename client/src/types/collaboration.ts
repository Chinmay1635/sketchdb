/**
 * Collaboration Types for Real-time Editing
 */

export interface CollaboratorInfo {
  id: string;
  odUserId: string;
  username: string;
  permission: 'view' | 'edit';
  cursor?: CursorPosition;
  color?: string;
  selectedNodes?: string[];
  selectedEdges?: string[];
}

export interface CursorPosition {
  x: number;
  y: number;
}

export interface CollaborationState {
  isConnected: boolean;
  isConnecting: boolean;
  diagramId: string | null;
  permission: 'view' | 'edit' | null;
  collaborators: CollaboratorInfo[];
  error: string | null;
  ownerUsername: string | null;
  diagramName: string | null;
}

export interface NodeOperation {
  type: 'add' | 'update' | 'delete' | 'move';
  node?: unknown;
  nodeId?: string;
  changes?: Record<string, unknown>;
  position?: { x: number; y: number };
  userId: string;
  username: string;
}

export interface EdgeOperation {
  type: 'add' | 'delete';
  edge?: unknown;
  edgeId?: string;
  userId: string;
  username: string;
}

export interface SelectionState {
  userId: string;
  username: string;
  selectedNodes: string[];
  selectedEdges: string[];
}

export interface DiagramJoinedEvent {
  diagramId: string;
  permission: 'view' | 'edit';
  users: CollaboratorInfo[];
  ownerUsername: string;
  diagramName: string;
}

export interface UserJoinedEvent {
  id: string;
  odUserId: string;
  username: string;
  permission: 'view' | 'edit';
}

export interface UserLeftEvent {
  id: string;
  userId: string;
  username: string;
}

export interface CursorUpdateEvent {
  id: string;
  username: string;
  x: number;
  y: number;
}

// Predefined colors for collaborator cursors
export const COLLABORATOR_COLORS = [
  '#FF6B6B', // Red
  '#4ECDC4', // Teal
  '#45B7D1', // Blue
  '#96CEB4', // Green
  '#FFEAA7', // Yellow
  '#DDA0DD', // Plum
  '#98D8C8', // Mint
  '#F7DC6F', // Gold
  '#BB8FCE', // Purple
  '#85C1E9', // Sky Blue
  '#F8B500', // Orange
  '#58D68D', // Emerald
];

/**
 * Get a consistent color for a collaborator based on their ID
 */
export function getCollaboratorColor(collaboratorId: string): string {
  let hash = 0;
  for (let i = 0; i < collaboratorId.length; i++) {
    hash = collaboratorId.charCodeAt(i) + ((hash << 5) - hash);
  }
  return COLLABORATOR_COLORS[Math.abs(hash) % COLLABORATOR_COLORS.length];
}
