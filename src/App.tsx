import React, { useCallback, useState } from 'react';
import {
  ReactFlow,
  addEdge,
  MiniMap,
  Controls,
  Background,
  useEdgesState,
  Connection,
  Edge,
  Node,
  NodeTypes,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

// Components
import {
  TableNode,
  Sidebar,
  SQLDialog,
  DeleteConfirmDialog,
  Toolbar,
  LoadingDialog,
} from './components';

// Hooks
import { useTableManagement } from './hooks/useTableManagement';

// Utils
import { 
  parseConnectionHandles, 
  createStyledEdge, 
  isValidConnection 
} from './utils/connectionUtils';
import { generateSQL, copyToClipboard } from './utils/sqlGenerator';

// Types
import { AttributeType, DataType } from './types';

// Node types configuration
const nodeTypes: NodeTypes = {
  tableNode: TableNode,
};

const initialNodes: Node[] = [];
const initialEdges: Edge[] = [];

export default function CanvasPlayground() {
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  
  // Dialog states
  const [sqlDialogOpen, setSqlDialogOpen] = useState(false);
  const [loadingDialogOpen, setLoadingDialogOpen] = useState(false);
  const [sqlText, setSqlText] = useState('');
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  // Table management hook
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
    updateNodeAttributes,
    setEditTableName,
    setAttrName,
    setAttrType,
    setAttrDataType,
    setRefTable,
    setRefAttr,
  } = useTableManagement(initialNodes);

  // Connection handling
  const onConnect = useCallback(
    (params: Edge | Connection) => {
      const connectionInfo = parseConnectionHandles(
        params.sourceHandle || null, 
        params.targetHandle || null
      );
      
      if (connectionInfo) {
        updateNodeAttributes(connectionInfo);
      }
      
      const newEdge = createStyledEdge(params);
      setEdges((eds) => addEdge(newEdge as Connection, eds));
    },
    [setEdges, updateNodeAttributes]
  );

  // Node selection
  const onNodeClick = useCallback((_: any, node: Node) => {
    setSelectedTableId(node.id);
  }, [setSelectedTableId]);

  // SQL Export with loading animation
  const exportToSQL = useCallback(() => {
    // Show loading dialog
    setLoadingDialogOpen(true);
    
    // Generate SQL immediately but show it after 2 seconds
    const sql = generateSQL(nodes);
    
    // Store timeout ID for cancellation
    const timeoutId = setTimeout(() => {
      setLoadingDialogOpen(false);
      setSqlText(sql);
      setSqlDialogOpen(true);
    }, 2000);

    // Store timeout ID in state for potential cancellation
    return timeoutId;
  }, [nodes]);

  const handleCancelLoading = useCallback(() => {
    setLoadingDialogOpen(false);
  }, []);

  const handleCopySQL = useCallback(() => {
    copyToClipboard(sqlText);
  }, [sqlText]);

  // Delete handlers
  const handleDeleteTable = useCallback(() => {
    deleteTable();
    setDeleteConfirmOpen(false);
  }, [deleteTable]);

  const handleDeleteConfirm = useCallback(() => {
    setDeleteConfirmOpen(true);
  }, []);

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex' }}>
      {/* Sidebar */}
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
        onDeleteTable={handleDeleteConfirm}
        onAttrNameChange={setAttrName}
        onAttrDataTypeChange={setAttrDataType}
        onAttrTypeChange={setAttrType}
        onRefTableChange={setRefTable}
        onRefAttrChange={setRefAttr}
        onAddAttribute={addAttribute}
      />

      {/* Main Canvas Area */}
      <div style={{ flex: 1, position: 'relative' }}>
        {/* Toolbar */}
        <Toolbar onAddTable={addTable} onExportSQL={exportToSQL} />
        
        {/* Loading Dialog */}
        <LoadingDialog
          isOpen={loadingDialogOpen}
          message="Parsing to SQL..."
          onCancel={handleCancelLoading}
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
        
        {/* React Flow */}
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          isValidConnection={isValidConnection}
          fitView
          connectionLineStyle={{ stroke: '#0074D9', strokeWidth: 3 }}
          defaultEdgeOptions={{
            style: { stroke: '#0074D9', strokeWidth: 3 },
            markerEnd: { type: 'arrowclosed', color: '#0074D9' },
            labelBgStyle: { fill: '#ffffff', fillOpacity: 0.8 },
            labelStyle: { fill: '#0074D9', fontWeight: 'bold' }
          }}
        >
          <MiniMap />
          <Controls />
          <Background />
        </ReactFlow>
      </div>
    </div>
  );
}