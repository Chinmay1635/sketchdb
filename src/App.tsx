import React, { useCallback } from 'react';
import { Parser } from 'node-sql-parser';
import {
  ReactFlow,
  addEdge,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  Connection,
  Edge,
  Node,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

const initialNodes: Node[] = [];
const initialEdges: Edge[] = [];

export default function CanvasPlayground() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback(
    (params: Edge | Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const addTable = () => {
    setNodes((nds) => [
      ...nds,
      {
        id: `table-${nds.length + 1}`,
        data: {
          label: `Table ${nds.length + 1}`,
          attributes: [] // Each attribute: { name: string, type: 'PK' | 'FK' | 'normal', refTable?: string, refAttr?: string }
        },
        position: { x: 100 + nds.length * 50, y: 100 + nds.length * 50 },
        type: 'default',
      },
    ]);
  };

  // Sidebar state
  const [selectedTableId, setSelectedTableId] = React.useState<string | null>(null);
  const [attrName, setAttrName] = React.useState("");
  const [attrType, setAttrType] = React.useState<'PK' | 'FK' | 'normal'>('normal');
  const [refTable, setRefTable] = React.useState("");
  const [refAttr, setRefAttr] = React.useState("");

  // Select table on click
  const onNodeClick = (_: any, node: Node) => {
    setSelectedTableId(node.id);
  };

  // Add attribute to selected table
  const addAttribute = () => {
    if (!selectedTableId || !attrName) return;
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id !== selectedTableId) return node;
        const oldAttrs = Array.isArray(node.data.attributes) ? node.data.attributes : [];
        const newAttr = { name: attrName, type: attrType, refTable: attrType === 'FK' ? refTable : undefined, refAttr: attrType === 'FK' ? refAttr : undefined };
        return {
          ...node,
          data: {
            ...node.data,
            attributes: [...oldAttrs, newAttr],
          },
        };
      })
    );
    setAttrName("");
    setAttrType('normal');
    setRefTable("");
    setRefAttr("");
  };

  // Get selected table's attributes
  const selectedTable = nodes.find((n) => n.id === selectedTableId);
  const attributes = Array.isArray(selectedTable?.data?.attributes) ? selectedTable.data.attributes : [];

  // SQL Export logic with modal
  const [sqlDialogOpen, setSqlDialogOpen] = React.useState(false);
  const [sqlText, setSqlText] = React.useState('');

  const exportToSQL = () => {
    const sqlType = (attr: any) => 'VARCHAR(255)';
    let sql = '';
    nodes.forEach((node) => {
      const label = typeof node.data.label === 'string' ? node.data.label : `Table_${node.id}`;
      const tableName = label.replace(/\s+/g, '_');
      const attrs = Array.isArray(node.data.attributes) ? node.data.attributes : [];
      if (!attrs.length) return;
      sql += `CREATE TABLE ${tableName} (\n`;
      sql += attrs.map((attr: any) => {
        let line = `  ${attr.name} ${sqlType(attr)}`;
        if (attr.type === 'PK') line += ' PRIMARY KEY';
        return line;
      }).join(',\n');
      const fks = attrs.filter((a: any) => a.type === 'FK');
      if (fks.length) {
        sql += ',\n';
        sql += fks.map((fk: any) =>
          `  FOREIGN KEY (${fk.name}) REFERENCES ${fk.refTable}(${fk.refAttr})`
        ).join(',\n');
      }
      sql += '\n);\n\n';
    });
    setSqlText(sql || 'No tables to export!');
    setSqlDialogOpen(true);
  };

  const copySQL = () => {
    navigator.clipboard.writeText(sqlText);
  };

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex' }}>
      {/* Sidebar for attribute editing */}
      <div style={{ width: 300, background: '#f4f4f4', padding: 16 }}>
        <h3>Attributes</h3>
        {selectedTable ? (
          <>
            <ul>
              {attributes.map((attr: any, idx: number) => (
                <li key={idx}>
                  {attr.name} ({attr.type}{attr.type === 'FK' ? ` → ${attr.refTable}.${attr.refAttr}` : ''})
                </li>
              ))}
            </ul>
            <input
              placeholder="Attribute name"
              value={attrName}
              onChange={e => setAttrName(e.target.value)}
              style={{ width: '100%', marginBottom: 8 }}
            />
            <select value={attrType} onChange={e => setAttrType(e.target.value as any)} style={{ width: '100%', marginBottom: 8 }}>
              <option value="normal">Normal</option>
              <option value="PK">Primary Key</option>
              <option value="FK">Foreign Key</option>
            </select>
            {attrType === 'FK' && (
              <>
                <input
                
                  placeholder="Reference Table"
                  value={refTable}
                  onChange={e => setRefTable(e.target.value)}
                  style={{ width: '100%', marginBottom: 8 }}
                />
                <input
                  placeholder="Reference Attribute"
                  value={refAttr}
                  onChange={e => setRefAttr(e.target.value)}
                  style={{ width: '100%', marginBottom: 8 }}
                />
              </>
            )}
            <button onClick={addAttribute} style={{ width: '100%', background: 'green', color: 'white' }}>Add Attribute</button>
          </>
        ) : (
          <div>Select a table node to edit attributes.</div>
        )}
      </div>
      <div style={{ flex: 1, position: 'relative' }}>
        <button onClick={addTable} style={{ position: 'absolute', zIndex: 10, width:'250px', height:"75px", backgroundColor:"yellow" }}>
          Add Table
        </button>
        <button onClick={exportToSQL} style={{ position: 'absolute', left: 270, zIndex: 10, width:'250px', height:"75px", backgroundColor:"#0074D9", color: 'white' }}>
          Export to SQL
        </button>
        {/* SQL Dialog */}
        {sqlDialogOpen && (
          <div style={{ position: 'absolute', top: 100, left: '50%', transform: 'translateX(-50%)', zIndex: 100, background: 'white', border: '2px solid #0074D9', borderRadius: 8, boxShadow: '0 2px 16px rgba(0,0,0,0.15)', padding: 24, minWidth: 400 }}>
            <h2 style={{ marginTop: 0 }}>Exported SQL</h2>
            <textarea
              value={sqlText}
              readOnly
              style={{ width: '100%', height: 200, fontFamily: 'monospace', fontSize: 14, marginBottom: 16 }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <button onClick={copySQL} style={{ background: '#0074D9', color: 'white', padding: '8px 16px', borderRadius: 4, border: 'none' }}>Copy</button>
              <button onClick={() => setSqlDialogOpen(false)} style={{ background: '#aaa', color: 'white', padding: '8px 16px', borderRadius: 4, border: 'none' }}>Close</button>
            </div>
          </div>
        )}
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          fitView
        >
          <MiniMap />
          <Controls />
          <Background />
        </ReactFlow>
      </div>
    </div>
  );
}