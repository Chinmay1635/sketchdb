import { Edge, Connection, Node } from '@xyflow/react';
import { Cardinality } from '../types';

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

export const createStyledEdge = (params: Edge | Connection, nodes?: Node[]): Partial<Edge> => {
  let edgeColor = '#0074D9'; // Default color
  
  // Try to get color from the target node if nodes are provided
  if (nodes && params.target) {
    const targetNode = nodes.find(n => n.id === params.target);
    if (targetNode && (targetNode.data as any)?.color) {
      edgeColor = (targetNode.data as any).color;
    }
  }
  
  return {
    ...params,
    type: 'customEdge',
    style: {
      stroke: edgeColor,
      strokeWidth: 2,
    },
    markerEnd: {
      type: 'arrowclosed' as const,
      color: edgeColor,
    },
    label: params.sourceHandle && params.targetHandle ? 'FK Relationship' : undefined,
    labelStyle: { fill: edgeColor, fontWeight: 'bold', fontSize: 10 },
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

// Create edges from foreign key relationships
export const createEdgesFromForeignKeys = (nodes: Node[]): Edge[] => {
  const edges: Edge[] = [];
  
  nodes.forEach(node => {
    const tableData = node.data as any; // Type assertion for table data
    if (!tableData || !tableData.attributes || !Array.isArray(tableData.attributes)) return;
    
    const sourceColor = tableData.color || '#0074D9'; // Use table color for edges
    
    tableData.attributes.forEach((attr: any) => {
      // Check if this attribute is a foreign key
      if (attr.type === 'FK' && attr.refTable && attr.refAttr) {
        // Find the target node (referenced table) - check by label, id, or normalized label
        const referencedNode = nodes.find(n => {
          const targetData = n.data as any;
          const targetLabel = targetData?.label || '';
          const normalizedTargetLabel = targetLabel.replace(/\s+/g, '_');
          const normalizedRefTable = attr.refTable.replace(/\s+/g, '_');
          return targetData?.table === attr.refTable || 
                 targetLabel === attr.refTable || 
                 normalizedTargetLabel === normalizedRefTable ||
                 n.id === attr.refTable;
        });
        
        if (referencedNode) {
          const targetColor = (referencedNode.data as any)?.color || '#0074D9';
          
          // Get cardinality and optional flag from the attribute
          const cardinalityValue: Cardinality = attr.cardinality || 'one-to-many';
          const isOptionalFK = attr.isOptional || false;
          
          // Determine edge color based on cardinality
          const getEdgeColor = (card: Cardinality) => {
            if (card === 'many-to-many') return '#FF6B6B'; // Red for M:N
            return targetColor; // Use target table color for 1:1 and 1:N
          };
          
          const edgeColor = getEdgeColor(cardinalityValue);
          
          // Edge direction: FROM referenced PK TO foreign key
          // This shows: "Primary key is referenced by foreign key"
          const sourceHandle = `${referencedNode.id}-${attr.refAttr}-source`;  // PK side
          const targetHandle = `${node.id}-${attr.name}-target`;               // FK side
          
          const edge: Edge = {
            id: `${referencedNode.id}-${attr.refAttr}-to-${node.id}-${attr.name}`,
            source: referencedNode.id,    // Source: referenced table (PK)
            target: node.id,              // Target: table with FK
            sourceHandle,                 // Source: referenced column (PK)
            targetHandle,                 // Target: FK column
            type: 'custom',
            data: {
              cardinality: cardinalityValue,
              isOptional: isOptionalFK,
            },
            style: {
              stroke: edgeColor,
              strokeWidth: 2,
              strokeDasharray: isOptionalFK ? '5,5' : undefined,
            },
            markerEnd: {
              type: 'arrowclosed' as const,
              color: edgeColor,
            },
            label: cardinalityValue === 'one-to-one' ? '1:1' : 
                   cardinalityValue === 'many-to-many' ? 'M:N' : '1:N',
            labelStyle: { fill: edgeColor, fontWeight: 'bold', fontSize: 10 },
          };
          
          console.log('Creating edge:', {
            from: `${referencedNode.id}.${attr.refAttr} (PK)`,
            to: `${node.id}.${attr.name} (FK)`,
            cardinality: cardinalityValue,
            isOptional: isOptionalFK,
            edge
          });
          
          edges.push(edge);
        }
      }
    });
  });
  
  return edges;
};