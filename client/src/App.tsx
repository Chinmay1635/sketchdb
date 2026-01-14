import React, { useCallback, useState, useRef } from "react";
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
} from "./components";
import AuthDialog from "./components/AuthDialog";
import SavedDiagramsDialog from "./components/SavedDiagramsDialog";
import UserMenu from "./components/UserMenu";

// Context
import { AuthProvider, useAuth } from "./context/AuthContext";

// Hooks
import { useTableManagement } from "./hooks/useTableManagement";

// Utils
import { parseConnectionHandles, createStyledEdge, isValidConnection } from "./utils/connectionUtils";
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

  // Auth state
  const { isAuthenticated } = useAuth();
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [savedDiagramsDialogOpen, setSavedDiagramsDialogOpen] = useState(false);
  const [currentDiagramId, setCurrentDiagramId] = useState<string | null>(null);
  const [currentDiagramName, setCurrentDiagramName] = useState<string | null>(null);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Error handling
  const { error, showError, clearError, retryOperation, hasError } = useErrorHandler();

  // Dialog states
  const [sqlDialogOpen, setSqlDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [loadingDialogOpen, setLoadingDialogOpen] = useState(false);
  const [sqlText, setSqlText] = useState("");
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [lastOperation, setLastOperation] = useState<(() => void) | null>(null);

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
  } = tableManagement;

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

  // Load diagram from saved data
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
      
      // Store current diagram ID and name for future saves
      setCurrentDiagramId(diagram._id);
      setCurrentDiagramName(diagram.name);
      setLastSavedAt(diagram.updatedAt ? new Date(diagram.updatedAt) : new Date());
      
      console.log('Diagram loaded successfully:', diagram.name);
    } catch (error) {
      console.error('Failed to load diagram:', error);
      showError(new Error('Failed to load diagram. Please try again.'), 'import');
    }
  }, [importNodes, setEdges, reactFlowInstance, showError]);

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
  const handleSaveComplete = useCallback((diagramId: string, name: string) => {
    setCurrentDiagramId(diagramId);
    setCurrentDiagramName(name);
    setLastSavedAt(new Date());
  }, []);

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
      } catch (error) {
        console.error('Failed to create connection:', error);
        showError(new Error('Failed to create connection between tables. Please try again.'), 'validation');
      }
    },
    [setEdges, updateNodeAttributes, showError, nodes]
  );

  // Custom edges change handler
  const onEdgesChange = useCallback(
    async (changes: any[]) => {
      // Handle the default React Flow changes
      onEdgesChangeDefault(changes);
    },
    [onEdgesChangeDefault]
  );

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

  // Wrapped functions with error handling
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
      addTable();
    } catch (error) {
      console.error('Failed to add table:', error);
      showError(error, 'validation');
    }
  }, [addTable, showError]);

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
      deleteTable();
      setDeleteConfirmOpen(false);
    } catch (error) {
      console.error('Failed to delete table:', error);
      showError(error, 'validation');
    }
  }, [deleteTable, showError]);

  const handleDeleteConfirm = useCallback(() => {
    setDeleteConfirmOpen(true);
  }, []);

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
        isSaving={isSaving}
        lastSavedAt={lastSavedAt}
        currentDiagramName={currentDiagramName}
        isAuthenticated={isAuthenticated}
        onLoginClick={() => setAuthDialogOpen(true)}
        onSavedDiagramsClick={() => setSavedDiagramsDialogOpen(true)}
      />

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

      {/* Main Canvas Area */}
      <div className="flex-1 relative pt-14 bg-black">
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
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          onNodesChange={onNodesChange}
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
        </ReactFlow>
      </div>
    </div>
  );
}

// App component
export default function App() {
  return (
    <AuthProvider>
      <ReactFlowProvider>
        <CanvasPlayground />
      </ReactFlowProvider>
    </AuthProvider>
  );
}
