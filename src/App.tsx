import React, { useCallback, useState } from "react";
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
} from "./components";

// Hooks
import { useTableManagement } from "./hooks/useTableManagement";

// Utils
import {
  parseConnectionHandles,
  createStyledEdge,
  isValidConnection,
} from "./utils/connectionUtils";
import { generateSQL, copyToClipboard } from "./utils/sqlGenerator";
import { parseSQLSchema } from "./utils/sqlParser";
import { createEdgesFromNodes } from "./utils/edgeGenerator";

// Types
import { AttributeType, DataType } from "./types";

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
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [loadingDialogOpen, setLoadingDialogOpen] = useState(false);
  const [sqlText, setSqlText] = useState("");
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  // Table management hook
  const {
    nodes,
    selectedTableId, // <-- add this
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
  } = useTableManagement(initialNodes, setEdges);

  // Import schema functionality
  const importSchema = useCallback((sqlText: string) => {
    try {
      // Parse SQL to nodes
      const parsedNodes = parseSQLSchema(sqlText);
      
      // Generate edges from foreign key relationships
      const generatedEdges = createEdgesFromNodes(parsedNodes);
      
      // Replace all nodes and edges with imported ones
      importNodes(parsedNodes);
      setEdges(generatedEdges);
      
      console.log('Schema imported successfully:', { parsedNodes, generatedEdges });
    } catch (error) {
      console.error('Failed to import schema:', error);
      throw new Error('Failed to parse SQL schema. Please check your SQL syntax.');
    }
  }, [importNodes, setEdges]);

  // Import dialog handlers
  const handleImportSchema = useCallback(() => {
    setImportDialogOpen(true);
  }, []);

  const handleImportClose = useCallback(() => {
    setImportDialogOpen(false);
  }, []);

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
  const onNodeClick = useCallback(
    (_: any, node: Node) => {
      setSelectedTableId(node.id);
    },
    [setSelectedTableId]
  );

  // SQL Export with loading animation
  const exportToSQL = useCallback(() => {
    setLoadingDialogOpen(true);
    const sql = generateSQL(nodes);

    const timeoutId = setTimeout(() => {
      setLoadingDialogOpen(false);
      setSqlText(sql);
      setSqlDialogOpen(true);
    }, 2000);

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
    <div className="w-screen h-screen flex">
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
        onDeleteTable={deleteTable}
        onAttrNameChange={setAttrName}
        onAttrDataTypeChange={setAttrDataType}
        onAttrTypeChange={setAttrType}
        onRefTableChange={setRefTable}
        onRefAttrChange={setRefAttr}
        onAddAttribute={addAttribute}
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

      {/* Main Canvas Area */}
      <div className="flex-1 relative">
        {/* Toolbar */}
        <Toolbar 
          onAddTable={addTable} 
          onExportSQL={exportToSQL}
          onImportSchema={handleImportSchema}
        />

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
          connectionLineStyle={{ stroke: "#0074D9", strokeWidth: 3 }}
          defaultEdgeOptions={{
            style: { stroke: "#0074D9", strokeWidth: 3 },
            markerEnd: { type: "arrowclosed", color: "#0074D9" },
            labelBgStyle: { fill: "#ffffff", fillOpacity: 0.8 },
            labelStyle: { fill: "#0074D9", fontWeight: "bold" },
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
