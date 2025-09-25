import { Edge, Connection, Node } from '@xyflow/react';

export interface ConnectionInfo {
  sourceTableId: string;
  sourceAttrName: string;
  targetTableId: string;
  targetAttrName: string;
}

export const parseConnectionHandles = (
  sourceHandle: string | null, 
  targetHandle: string | null
): ConnectionInfo | null => {
  if (!sourceHandle || !targetHandle) return null;
  
  const sourceMatch = sourceHandle.match(/^(.+)-(.+)-source$/);
  const targetMatch = targetHandle.match(/^(.+)-(.+)-target$/);
  
  if (!sourceMatch || !targetMatch) return null;
  
  return {
    sourceTableId: sourceMatch[1],
    sourceAttrName: sourceMatch[2],
    targetTableId: targetMatch[1],
    targetAttrName: targetMatch[2],
  };
};

export const createStyledEdge = (params: Edge | Connection): Partial<Edge> => {
  return {
    ...params,
    style: {
      stroke: '#0074D9',
      strokeWidth: 2,
    },
    markerEnd: {
      type: 'arrowclosed' as const,
      color: '#0074D9',
    },
    label: params.sourceHandle && params.targetHandle ? 'FK Relationship' : undefined,
    labelStyle: { fill: '#0074D9', fontWeight: 'bold', fontSize: 10 },
  };
};

export const isValidConnection = (connection: Edge | Connection): boolean => {
  // Prevent connecting a node to itself
  if (connection.source === connection.target) {
    return false;
  }
  
  // Ensure we have proper handle IDs
  if (!connection.sourceHandle || !connection.targetHandle) {
    return false;
  }
  
  // Parse handle information
  const connectionInfo = parseConnectionHandles(connection.sourceHandle, connection.targetHandle);
  
  return connectionInfo !== null;
};