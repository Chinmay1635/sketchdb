import { useState, useCallback } from 'react';
import { Node, useNodesState } from '@xyflow/react';
import { TableAttribute, AttributeType, DataType, TableData } from '../types';

type TableNode = Node<TableData>;

export const useTableManagement = (initialNodes: Node[]) => {
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
  
  const selectedTable = nodes.find((n) => n.id === selectedTableId);
  const attributes = Array.isArray(selectedTable?.data?.attributes) ? selectedTable.data.attributes : [];

  // Add Table
  const addTable = useCallback(() => {
    setNodes((nds) => [
      ...nds,
      {
        id: `table-${nds.length + 1}`,
        data: {
          label: `Table ${nds.length + 1}`,
          attributes: [],
        },
        position: { x: 100 + nds.length * 50, y: 100 + nds.length * 50 },
        type: 'tableNode',
      },
    ]);
  }, [setNodes]);

  // Delete Table
  const deleteTable = useCallback(() => {
    if (!selectedTableId) return;
    setNodes((nds) => nds.filter((node) => node.id !== selectedTableId));
    setSelectedTableId(null);
  }, [selectedTableId, setNodes]);

  // Add Attribute
  const addAttribute = useCallback(() => {
    if (!selectedTableId || !attrName) return;
    
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
          isEditing: false,   // NEW
          editName: ""        // NEW
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
  }, [selectedTableId, attrName, attrType, attrDataType, refTable, refAttr, setNodes]);

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
    
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id !== selectedTableId) return node;
        return {
          ...node,
          data: {
            ...node.data,
            label: editTableName.trim(),
          },
        };
      })
    );
    setIsEditingTableName(false);
    setEditTableName("");
  }, [selectedTableId, editTableName, setNodes]);

  const cancelEditTableName = useCallback(() => {
    setIsEditingTableName(false);
    setEditTableName("");
  }, []);

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
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id !== selectedTableId) return node;
        const nodeData = node.data as TableData;
        const updatedAttrs = nodeData.attributes.map((attr: TableAttribute, i: number) =>
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
        return { ...node, data: { ...nodeData, attributes: updatedAttrs } };
      })
    );
  }, [selectedTableId, setNodes]);

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
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id !== selectedTableId) return node;
        const nodeData = node.data as TableData;
        const updatedAttrs = nodeData.attributes.filter((_: TableAttribute, i: number) => i !== idx);
        return { ...node, data: { ...nodeData, attributes: updatedAttrs } };
      })
    );
  }, [selectedTableId, setNodes]);

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
  };
};
