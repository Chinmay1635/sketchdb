import { Edge, Node } from '@xyflow/react';
import { TableAttribute } from '../types';
import { createStyledEdge } from './connectionUtils';

export const createEdgesFromNodes = (nodes: Node[]): Edge[] => {
  const edges: Edge[] = [];
  let edgeCounter = 1;

  nodes.forEach(node => {
    const nodeId = node.id;
    const attributes = Array.isArray(node.data.attributes) ? node.data.attributes : [];
    
    attributes.forEach(attr => {
      if (attr.type === 'FK' && attr.refTable && attr.refAttr) {
        // Find the referenced table node
        const referencedNode = nodes.find(n => {
          const label = typeof n.data.label === 'string' ? n.data.label : `Table_${n.id}`;
          return label.replace(/\s+/g, '_') === attr.refTable;
        });
        
        if (referencedNode) {
          // Check if the referenced attribute exists
          const referencedAttrs = Array.isArray(referencedNode.data.attributes) ? referencedNode.data.attributes : [];
          const referencedAttr = referencedAttrs.find(refAttr => refAttr.name === attr.refAttr);
          
          if (referencedAttr) {
            const edgeParams = {
              id: `edge-${edgeCounter++}`,
              source: referencedNode.id,
              target: nodeId,
              sourceHandle: `${referencedNode.id}-${attr.refAttr}-source`,
              targetHandle: `${nodeId}-${attr.name}-target`,
            };
            
            const styledEdge = createStyledEdge(edgeParams);
            edges.push(styledEdge as Edge);
          }
        }
      }
    });
  });

  return edges;
};