import { useState, useCallback } from 'react';
import { Node, useNodesState, Edge } from '@xyflow/react';
import { TableAttribute, AttributeType, DataType, TableData } from '../types';
import { getRandomTableColor } from '../utils/colorUtils';
import { useErrorHandler } from '../utils/errorHandler';

type TableNode = Node<TableData>;

export const useTableManagement = (
  initialNodes: Node[], 
  setEdges?: React.Dispatch<React.SetStateAction<Edge[]>>
) => {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  
  // Table name editing state
  const [isEditingTableName, setIsEditingTableName] = useState(false);
  const [editTableName, setEditTableName] = useState("");
  
  // Attribute form state
  const [attrName, setAttrName] = useState("");
  const [attrType, setAttrType] = useState<AttributeType>('normal');
  const [attrDataType, setAttrDataType] = useState<DataType>("VARCHAR(255)");
  const [refTable, setRefTable] = useState("");
  const [refAttr, setRefAttr] = useState("");
  
  // Error handling
  const { showError } = useErrorHandler();
  
  const selectedTable = nodes.find((n) => n.id === selectedTableId);
  const attributes = Array.isArray(selectedTable?.data?.attributes) ? selectedTable.data.attributes : [];

  // Helper functions for FK relationships
  const getAvailableTables = useCallback(() => {
    return nodes
      .filter(node => node.id !== selectedTableId) // Exclude current table
      .map(node => ({
        id: node.id,
        label: typeof node.data?.label === 'string' ? node.data.label : `Table ${node.id}`,
        attributes: Array.isArray(node.data?.attributes) ? node.data.attributes : []
      }));
  }, [nodes, selectedTableId]);

  const getAttributesForTable = useCallback((tableId: string) => {
    const table = nodes.find(node => node.id === tableId);
    if (!table || !Array.isArray(table.data?.attributes)) return [];
    
    return table.data.attributes
      .filter((attr: TableAttribute) => attr.type === 'PK' || attr.type === 'normal')
      .map((attr: TableAttribute) => ({
        name: attr.name,
        type: attr.type,
        dataType: attr.dataType
      }));
  }, [nodes]);

  const validateFKReference = useCallback((refTableId: string, refAttrName: string) => {
    const refTable = nodes.find(node => node.id === refTableId);
    if (!refTable || !Array.isArray(refTable.data?.attributes)) return false;
    
    return refTable.data.attributes.some((attr: TableAttribute) => 
      attr.name === refAttrName && (attr.type === 'PK' || attr.type === 'normal')
    );
  }, [nodes]);

  // Edge management functions
  const createFKEdge = useCallback((sourceTableId: string, sourceAttrName: string, targetTableId: string, targetAttrName: string) => {
    if (!setEdges) return;
    
    const sourceHandle = `${sourceTableId}-${sourceAttrName}-source`;
    const targetHandle = `${targetTableId}-${targetAttrName}-target`;
    const edgeId = `${sourceTableId}-${sourceAttrName}-to-${targetTableId}-${targetAttrName}`;
    
    setEdges((edges) => {
      // Remove any existing edge with the same source/target handles or ID
      const filteredEdges = edges.filter(edge => {
        return !(
          (edge.source === sourceTableId && edge.target === targetTableId && 
           edge.sourceHandle === sourceHandle && edge.targetHandle === targetHandle) ||
          edge.id === edgeId
        );
      });
      
      const newEdge: Edge = {
        id: edgeId,
        source: sourceTableId,
        target: targetTableId,
        sourceHandle,
        targetHandle,
        style: {
          stroke: '#0074D9',
          strokeWidth: 2,
        },
        markerEnd: {
          type: 'arrowclosed' as const,
          color: '#0074D9',
        },
        label: 'FK Relationship',
        labelStyle: { fill: '#0074D9', fontWeight: 'bold', fontSize: 10 },
      };
      
      return [...filteredEdges, newEdge];
    });
  }, [setEdges]);

  const removeFKEdge = useCallback((sourceTableId: string, sourceAttrName: string, targetTableId: string, targetAttrName: string) => {
    if (!setEdges) return;
    
    const sourceHandle = `${sourceTableId}-${sourceAttrName}-source`;
    const targetHandle = `${targetTableId}-${targetAttrName}-target`;
    
    setEdges((edges) => 
      edges.filter(edge => {
        // Remove edge if it matches the FK relationship being removed
        return !(
          (edge.source === sourceTableId && edge.target === targetTableId && 
           edge.sourceHandle === sourceHandle && edge.targetHandle === targetHandle) ||
          // Also check for the custom ID format we create
          edge.id === `${sourceTableId}-${sourceAttrName}-to-${targetTableId}-${targetAttrName}`
        );
      })
    );
  }, [setEdges]);

  const removeEdgesByAttribute = useCallback((tableId: string, attrName: string) => {
    if (!setEdges) return;
    
    setEdges((edges) => 
      edges.filter(edge => {
        // Remove edges where this attribute is involved (as source or target)
        const sourceHandle = `${tableId}-${attrName}-source`;
        const targetHandle = `${tableId}-${attrName}-target`;
        
        return !(
          edge.sourceHandle === sourceHandle || 
          edge.targetHandle === targetHandle ||
          // Also check for edges that involve this table and attribute in any way
          (edge.source === tableId && edge.sourceHandle?.includes(`-${attrName}-`)) ||
          (edge.target === tableId && edge.targetHandle?.includes(`-${attrName}-`))
        );
      })
    );
  }, [setEdges]);

  // Helper function to clean up foreign key references when a referenced attribute is deleted
  const cleanupForeignKeyReferences = useCallback((tableId: string, attrName: string) => {
    if (!setNodes || !setEdges) return;
    
    // Find the table name for the tableId
    const sourceNode = nodes.find(n => n.id === tableId);
    if (!sourceNode) return;
    
    const sourceTableName = typeof sourceNode.data?.label === 'string' 
      ? sourceNode.data.label.replace(/\s+/g, '_')
      : `Table_${tableId}`;
    
    console.log(`Cleaning up FK references to ${sourceTableName}.${attrName}`);
    
    // Update all nodes to remove foreign key references to the deleted attribute
    setNodes((nds) =>
      nds.map((node) => {
        const nodeData = node.data as TableData;
        const hasChanges = nodeData.attributes.some((attr: TableAttribute) => 
          attr.type === 'FK' && 
          attr.refTable === sourceTableName && 
          attr.refAttr === attrName
        );
        
        if (!hasChanges) return node;
        
        console.log(`Removing FK references in table ${node.id}`);
        
        // Remove FK references and convert back to normal attributes
        const updatedAttrs = nodeData.attributes.map((attr: TableAttribute) => {
          if (attr.type === 'FK' && attr.refTable === sourceTableName && attr.refAttr === attrName) {
            console.log(`Converting FK ${attr.name} back to normal attribute`);
            return {
              ...attr,
              type: 'normal' as const,
              refTable: undefined,
              refAttr: undefined,
            };
          }
          return attr;
        });
        
        return { ...node, data: { ...nodeData, attributes: updatedAttrs } };
      })
    );
    
    // Remove related edges
    removeEdgesByAttribute(tableId, attrName);
  }, [setNodes, setEdges, nodes, removeEdgesByAttribute]);

  const findFKEdgeByAttribute = useCallback((tableId: string, attrName: string) => {
    // This would need to be called with current edges from the parent component
    // We'll handle this in the save function
    return `${tableId}-${attrName}`;
  }, []);

  const importNodes = useCallback((newNodes: Node[]) => {
    setNodes(newNodes);
    setSelectedTableId(null);
  }, [setNodes, setSelectedTableId]);

  // Add Table
  const addTable = useCallback(() => {
    setNodes((nds) => [
      ...nds,
      {
        id: `table-${nds.length + 1}`,
        data: {
          label: `Table ${nds.length + 1}`,
          attributes: [],
          color: getRandomTableColor(), // Assign random color to new table
        },
        position: { x: 100 + nds.length * 50, y: 100 + nds.length * 50 },
        type: 'tableNode',
      },
    ]);
  }, [setNodes]);

  // Delete Table
  const deleteTable = useCallback(() => {
    if (!selectedTableId) return;
    
    // Remove all edges associated with this table
    if (setEdges) {
      setEdges((edges) => 
        edges.filter(edge => 
          edge.source !== selectedTableId && edge.target !== selectedTableId
        )
      );
    }
    
    setNodes((nds) => nds.filter((node) => node.id !== selectedTableId));
    setSelectedTableId(null);
  }, [selectedTableId, setNodes, setEdges]);

  // Add Attribute
  const addAttribute = useCallback(() => {
    if (!selectedTableId || !attrName) {
      throw new Error('Please select a table and provide an attribute name');
    }
    
    // Validate attribute name
    if (attrName.trim().length === 0) {
      throw new Error('Attribute name cannot be empty');
    }
    
    // Check for duplicate attribute names
    const existingAttr = attributes.find(attr => attr.name.toLowerCase() === attrName.toLowerCase());
    if (existingAttr) {
      throw new Error(`An attribute named '${attrName}' already exists in this table`);
    }
    
    // Validate FK reference if adding FK attribute
    if (attrType === 'FK') {
      if (!refTable || !refAttr) {
        throw new Error('Foreign key reference is incomplete. Please select both reference table and attribute.');
      }
      
      // Find the referenced table by label
      const refTableNode = nodes.find(n => 
        typeof n.data?.label === 'string' && n.data.label === refTable
      );
      
      if (!refTableNode) {
        throw new Error(`Referenced table "${refTable}" not found`);
      }
      
      // Check if referenced attribute exists
      const refAttrExists = Array.isArray(refTableNode.data?.attributes) && 
        refTableNode.data.attributes.some((a: TableAttribute) => a.name === refAttr);
      
      if (!refAttrExists) {
        throw new Error(`Referenced attribute "${refAttr}" not found in table "${refTable}"`);
      }
      
      // Create FK edge if validation passes
      if (setEdges) {
        createFKEdge(refTableNode.id, refAttr, selectedTableId, attrName);
      }
    }
    
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id !== selectedTableId) return node;
        const oldAttrs = Array.isArray(node.data.attributes) ? node.data.attributes : [];
        const newAttr: TableAttribute = { 
          name: attrName, 
          type: attrType, 
          dataType: attrDataType,
          refTable: attrType === 'FK' ? refTable : undefined, 
          refAttr: attrType === 'FK' ? refAttr : undefined,
          isEditing: false,   
          editName: ""        
        };
        return {
          ...node,
          data: {
            ...node.data,
            attributes: [...oldAttrs, newAttr],
          },
        };
      })
    );
    
    // Reset form
    setAttrName("");
    setAttrType('normal');
    setAttrDataType("VARCHAR(255)");
    setRefTable("");
    setRefAttr("");
  }, [selectedTableId, attrName, attrType, attrDataType, refTable, refAttr, setNodes, nodes, setEdges, createFKEdge, attributes]);

  // Start Editing Table Name
  const startEditTableName = useCallback(() => {
    if (selectedTable) {
      const currentLabel = typeof selectedTable.data.label === 'string' 
        ? selectedTable.data.label 
        : `Table ${selectedTable.id}`;
      setEditTableName(currentLabel);
      setIsEditingTableName(true);
    }
  }, [selectedTable]);

  // Save Table Name
  const saveTableName = useCallback(() => {
    if (!selectedTableId || !editTableName.trim()) return;
    
    setNodes((nds) => {
      // Find the old table name
      const tableToUpdate = nds.find(n => n.id === selectedTableId);
      if (!tableToUpdate) return nds;
      
      const oldTableName = typeof tableToUpdate.data?.label === 'string' 
        ? tableToUpdate.data.label.replace(/\s+/g, '_')
        : `Table_${selectedTableId}`;
      const newTableName = editTableName.trim().replace(/\s+/g, '_');
      
      console.log(`Renaming table from '${oldTableName}' to '${newTableName}'`);
      
      // Update all nodes - rename the table and update FK references
      return nds.map((node) => {
        const nodeData = node.data as TableData;
        
        if (node.id === selectedTableId) {
          // Update the table name
          return {
            ...node,
            data: {
              ...nodeData,
              label: editTableName.trim(),
            },
          };
        } else {
          // Update FK references in other tables that point to the renamed table
          const hasChanges = nodeData.attributes?.some((attr: TableAttribute) => 
            attr.type === 'FK' && attr.refTable === oldTableName
          );
          
          if (!hasChanges) return node;
          
          console.log(`Updating FK references in table ${node.id}`);
          
          const updatedAttrs = nodeData.attributes.map((attr: TableAttribute) => {
            if (attr.type === 'FK' && attr.refTable === oldTableName) {
              console.log(`  Updating FK ${attr.name}: ${oldTableName} -> ${newTableName}`);
              return {
                ...attr,
                refTable: newTableName,
              };
            }
            return attr;
          });
          
          return { ...node, data: { ...nodeData, attributes: updatedAttrs } };
        }
      });
    });
    setIsEditingTableName(false);
    setEditTableName("");
  }, [selectedTableId, editTableName, setNodes]);

  const cancelEditTableName = useCallback(() => {
    setIsEditingTableName(false);
    setEditTableName("");
  }, []);

  // Change Table Color
  const changeTableColor = useCallback((color: string) => {
    if (!selectedTableId) return;
    
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id !== selectedTableId) return node;
        return {
          ...node,
          data: {
            ...node.data,
            color: color,
          },
        };
      })
    );
  }, [selectedTableId, setNodes]);

  // Attribute Editing Functions
  const onStartAttrEdit = useCallback((idx: number) => {
    if (!selectedTableId) return;
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id !== selectedTableId) return node;
        const nodeData = node.data as TableData;
        const updatedAttrs = nodeData.attributes.map((attr: TableAttribute, i: number) =>
          i === idx ? { 
            ...attr, 
            isEditing: true, 
            editName: attr.name,
            editDataType: attr.dataType as DataType,
            editType: attr.type,
            editRefTable: attr.refTable || "",
            editRefAttr: attr.refAttr || ""
          } : attr
        );
        return { ...node, data: { ...nodeData, attributes: updatedAttrs } };
      })
    );
  }, [selectedTableId, setNodes]);

  const onAttrEditNameChange = useCallback((idx: number, value: string) => {
    if (!selectedTableId) return;
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id !== selectedTableId) return node;
        const nodeData = node.data as TableData;
        const updatedAttrs = nodeData.attributes.map((attr: TableAttribute, i: number) =>
          i === idx ? { ...attr, editName: value } : attr
        );
        return { ...node, data: { ...nodeData, attributes: updatedAttrs } };
      })
    );
  }, [selectedTableId, setNodes]);

  const onAttrEditDataTypeChange = useCallback((idx: number, value: DataType) => {
    if (!selectedTableId) return;
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id !== selectedTableId) return node;
        const nodeData = node.data as TableData;
        const updatedAttrs = nodeData.attributes.map((attr: TableAttribute, i: number) =>
          i === idx ? { ...attr, editDataType: value } : attr
        );
        return { ...node, data: { ...nodeData, attributes: updatedAttrs } };
      })
    );
  }, [selectedTableId, setNodes]);

  const onAttrEditTypeChange = useCallback((idx: number, value: AttributeType) => {
    if (!selectedTableId) return;
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id !== selectedTableId) return node;
        const nodeData = node.data as TableData;
        const updatedAttrs = nodeData.attributes.map((attr: TableAttribute, i: number) =>
          i === idx ? { ...attr, editType: value } : attr
        );
        return { ...node, data: { ...nodeData, attributes: updatedAttrs } };
      })
    );
  }, [selectedTableId, setNodes]);

  const onAttrEditRefTableChange = useCallback((idx: number, value: string) => {
    if (!selectedTableId) return;
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id !== selectedTableId) return node;
        const nodeData = node.data as TableData;
        const updatedAttrs = nodeData.attributes.map((attr: TableAttribute, i: number) =>
          i === idx ? { ...attr, editRefTable: value } : attr
        );
        return { ...node, data: { ...nodeData, attributes: updatedAttrs } };
      })
    );
  }, [selectedTableId, setNodes]);

  const onAttrEditRefAttrChange = useCallback((idx: number, value: string) => {
    if (!selectedTableId) return;
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id !== selectedTableId) return node;
        const nodeData = node.data as TableData;
        const updatedAttrs = nodeData.attributes.map((attr: TableAttribute, i: number) =>
          i === idx ? { ...attr, editRefAttr: value } : attr
        );
        return { ...node, data: { ...nodeData, attributes: updatedAttrs } };
      })
    );
  }, [selectedTableId, setNodes]);

  const onSaveAttrName = useCallback((idx: number) => {
    if (!selectedTableId) return;
    
    // First, gather the necessary information to handle edge updates
    let edgeUpdates: { action: 'remove' | 'create', sourceTableId?: string, sourceAttrName?: string, targetTableId?: string, targetAttrName?: string, tableId?: string, attrName?: string }[] = [];
    
    setNodes((nds) => {
      const nodeToUpdate = nds.find(n => n.id === selectedTableId);
      if (!nodeToUpdate) return nds;
      
      const nodeData = nodeToUpdate.data as TableData;
      if (!nodeData.attributes || !nodeData.attributes[idx]) return nds;
      
      const attr = nodeData.attributes[idx];
      const oldType = attr.type;
      const newType = attr.editType || attr.type;
      const oldRefTable = attr.refTable;
      const oldRefAttr = attr.refAttr;
      const newRefTable = attr.editRefTable || attr.refTable;
      const newRefAttr = attr.editRefAttr || attr.refAttr;
      
      // Prepare edge updates
      if (setEdges) {
        // If changing FROM FK to something else, remove the old edge
        if (oldType === 'FK' && newType !== 'FK') {
          edgeUpdates.push({ action: 'remove', tableId: selectedTableId, attrName: attr.name });
        }
        
        // If changing FK reference (but staying FK), remove old edge first
        if (oldType === 'FK' && newType === 'FK' && 
            (oldRefTable !== newRefTable || oldRefAttr !== newRefAttr)) {
          edgeUpdates.push({ action: 'remove', tableId: selectedTableId, attrName: attr.name });
        }
        
        // If changing TO FK, validate and prepare edge creation
        if (newType === 'FK') {
          const refTableName = newRefTable;
          const refAttrName = newRefAttr;
          
          if (!refTableName || !refAttrName) {
            console.warn('Foreign key reference is incomplete');
            return nds; // Don't save if FK reference is incomplete
          }
          
          // Find the referenced table by label
          const refTable = nds.find(n => 
            typeof n.data?.label === 'string' && n.data.label === refTableName
          );
          
          if (!refTable) {
            console.warn(`Referenced table "${refTableName}" not found`);
            return nds; // Don't save if referenced table doesn't exist
          }
          
          // Check if referenced attribute exists
          const refAttrExists = Array.isArray(refTable.data?.attributes) && 
            refTable.data.attributes.some((a: TableAttribute) => a.name === refAttrName);
          
          if (!refAttrExists) {
            console.warn(`Referenced attribute "${refAttrName}" not found in table "${refTableName}"`);
            return nds; // Don't save if referenced attribute doesn't exist
          }
          
          // Queue edge creation
          edgeUpdates.push({ 
            action: 'create', 
            sourceTableId: refTable.id, 
            sourceAttrName: refAttrName, 
            targetTableId: selectedTableId, 
            targetAttrName: attr.editName || attr.name 
          });
        }
      }
      
      // Update the node
      return nds.map((node) => {
        if (node.id !== selectedTableId) return node;
        const currentNodeData = node.data as TableData;
        const updatedAttrs = currentNodeData.attributes.map((attr: TableAttribute, i: number) =>
          i === idx ? { 
            ...attr, 
            name: attr.editName || attr.name, 
            dataType: attr.editDataType || attr.dataType,
            type: attr.editType || attr.type,
            refTable: attr.editType === 'FK' ? (attr.editRefTable || attr.refTable) : undefined,
            refAttr: attr.editType === 'FK' ? (attr.editRefAttr || attr.refAttr) : undefined,
            isEditing: false, 
            editName: "",
            editDataType: undefined,
            editType: undefined,
            editRefTable: "",
            editRefAttr: ""
          } : attr
        );
        return { ...node, data: { ...currentNodeData, attributes: updatedAttrs } };
      });
    });
    
    // Apply edge updates after nodes are updated
    if (setEdges && edgeUpdates.length > 0) {
      setTimeout(() => {
        edgeUpdates.forEach(update => {
          if (update.action === 'remove' && update.tableId && update.attrName) {
            removeEdgesByAttribute(update.tableId, update.attrName);
          } else if (update.action === 'create' && update.sourceTableId && update.sourceAttrName && update.targetTableId && update.targetAttrName) {
            createFKEdge(update.sourceTableId, update.sourceAttrName, update.targetTableId, update.targetAttrName);
          }
        });
      }, 0);
    }
  }, [selectedTableId, setNodes, setEdges, createFKEdge, removeEdgesByAttribute]);

  const onCancelAttrEdit = useCallback((idx: number) => {
    if (!selectedTableId) return;
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id !== selectedTableId) return node;
        const nodeData = node.data as TableData;
        const updatedAttrs = nodeData.attributes.map((attr: TableAttribute, i: number) =>
          i === idx ? { 
            ...attr, 
            isEditing: false, 
            editName: "",
            editDataType: undefined,
            editType: undefined,
            editRefTable: "",
            editRefAttr: ""
          } : attr
        );
        return { ...node, data: { ...nodeData, attributes: updatedAttrs } };
      })
    );
  }, [selectedTableId, setNodes]);

  const onDeleteAttribute = useCallback((idx: number) => {
    if (!selectedTableId) return;
    
    try {
      console.log(`Deleting attribute at index: ${idx} from table: ${selectedTableId}`);
      
      // Use setNodes with functional update to get current state
      setNodes((nds) => {
        const nodeToUpdate = nds.find(n => n.id === selectedTableId);
        if (!nodeToUpdate) return nds;
        
        const nodeData = nodeToUpdate.data as TableData;
        if (!nodeData.attributes || !nodeData.attributes[idx]) return nds;
        
        const attrToDelete = nodeData.attributes[idx];
        console.log(`Deleting attribute: ${attrToDelete.name}`);
        
        // Get the attribute name before deletion for edge cleanup
        const attrName = attrToDelete.name;
        const tableId = selectedTableId;
        
        // Clean up edges involving this attribute
        if (setEdges) {
          setEdges((edges) => 
            edges.filter(edge => {
              const sourceHandle = `${tableId}-${attrName}-source`;
              const targetHandle = `${tableId}-${attrName}-target`;
              
              return !(
                edge.sourceHandle === sourceHandle || 
                edge.targetHandle === targetHandle ||
                (edge.source === tableId && edge.sourceHandle?.includes(`-${attrName}-`)) ||
                (edge.target === tableId && edge.targetHandle?.includes(`-${attrName}-`))
              );
            })
          );
        }
        
        // Find the source table name for FK cleanup
        const sourceTableName = typeof nodeToUpdate.data?.label === 'string' 
          ? nodeToUpdate.data.label.replace(/\s+/g, '_')
          : `Table_${tableId}`;
        
        // Update all nodes - remove the attribute and clean up FK references
        return nds.map((node) => {
          const currentNodeData = node.data as TableData;
          
          if (node.id === selectedTableId) {
            // Remove the attribute from this table
            const updatedAttrs = currentNodeData.attributes.filter((_: TableAttribute, i: number) => i !== idx);
            console.log(`Removed attribute ${attrName}, remaining attributes:`, updatedAttrs.map(a => a.name));
            return { ...node, data: { ...currentNodeData, attributes: updatedAttrs } };
          } else {
            // Clean up FK references in other tables
            const hasChanges = currentNodeData.attributes?.some((attr: TableAttribute) => 
              attr.type === 'FK' && 
              attr.refTable === sourceTableName && 
              attr.refAttr === attrName
            );
            
            if (!hasChanges) return node;
            
            const updatedAttrs = currentNodeData.attributes.map((attr: TableAttribute) => {
              if (attr.type === 'FK' && attr.refTable === sourceTableName && attr.refAttr === attrName) {
                console.log(`Converting FK ${attr.name} back to normal attribute`);
                return {
                  ...attr,
                  type: 'normal' as const,
                  refTable: undefined,
                  refAttr: undefined,
                };
              }
              return attr;
            });
            
            return { ...node, data: { ...currentNodeData, attributes: updatedAttrs } };
          }
        });
      });
      
    } catch (error) {
      console.error('Error deleting attribute:', error);
      showError(error, 'validation');
    }
  }, [selectedTableId, setNodes, setEdges, showError]);

  // Connection handling
  const updateNodeAttributes = useCallback((connectionInfo: any) => {
    const { sourceTableId, sourceAttrName, targetTableId, targetAttrName } = connectionInfo;
    
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === sourceTableId) {
          const updatedAttributes = Array.isArray(node.data.attributes) 
            ? node.data.attributes.map((attr: TableAttribute) => 
                attr.name === sourceAttrName 
                  ? { ...attr, type: 'PK' as const }
                  : attr
              )
            : [];
          return {
            ...node,
            data: {
              ...node.data,
              attributes: updatedAttributes,
            },
          };
        } else if (node.id === targetTableId) {
          const sourceTable = nds.find(n => n.id === sourceTableId);
          const sourceTableLabel = typeof sourceTable?.data?.label === 'string' 
            ? sourceTable.data.label 
            : `Table_${sourceTableId}`;
          
          const updatedAttributes = Array.isArray(node.data.attributes) 
            ? node.data.attributes.map((attr: TableAttribute) => 
                attr.name === targetAttrName 
                  ? { 
                      ...attr, 
                      type: 'FK' as const, 
                      refTable: sourceTableLabel.replace(/\s+/g, '_'),
                      refAttr: sourceAttrName 
                    }
                  : attr
              )
            : [];
          return {
            ...node,
            data: {
              ...node.data,
              attributes: updatedAttributes,
            },
          };
        }
        return node;
      })
    );
  }, [setNodes]);

  return {
    // State
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
    
    // Actions
    setSelectedTableId,
    onNodesChange,
    addTable,
    deleteTable,
    addAttribute,
    startEditTableName,
    saveTableName,
    cancelEditTableName,
    changeTableColor,
    updateNodeAttributes,

    // Attribute Editing
    onStartAttrEdit,
    onAttrEditNameChange,
    onAttrEditDataTypeChange,
    onAttrEditTypeChange,
    onAttrEditRefTableChange,
    onAttrEditRefAttrChange,
    onSaveAttrName,
    onCancelAttrEdit,
    onDeleteAttribute,
    
    // Form setters
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
    removeEdgesByAttribute,
    importNodes,
  };
};
