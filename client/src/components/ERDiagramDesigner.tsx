import React, { useCallback, useMemo, useState } from 'react';
import {
  addEdge,
  Background,
  BackgroundVariant,
  Connection,
  Controls,
  Edge,
  EdgeChange,
  Handle,
  MiniMap,
  Node,
  NodeChange,
  NodeProps,
  NodeTypes,
  Position,
  ReactFlow,
  useEdgesState,
  useNodesState,
  useReactFlow,
} from '@xyflow/react';
import { nanoid } from 'nanoid';

type ERKind =
  | 'entity'
  | 'attribute'
  | 'relationship'
  | 'weak-entity'
  | 'identifying-relationship'
  | 'derived-attribute'
  | 'multivalued-attribute'
  | 'composite-attribute'
  | 'note'
  | 'frame';

interface ERNodeData extends Record<string, unknown> {
  label: string;
  kind: ERKind;
  accent: string;
  description?: string;
}

type ERNode = Node<ERNodeData>;

interface PaletteItem {
  kind: ERKind;
  label: string;
  description: string;
  accent: string;
  hint?: string;
}

const paletteItems: PaletteItem[] = [
  { kind: 'entity', label: 'Entity', description: 'Core table or thing', accent: '#facc15', hint: 'Rectangular' },
  { kind: 'attribute', label: 'Attribute', description: 'Descriptive property', accent: '#8bc34a', hint: 'Oval' },
  { kind: 'relationship', label: 'Relationship', description: 'Links entities', accent: '#28b7c5', hint: 'Diamond' },
  { kind: 'weak-entity', label: 'Weak Entity', description: 'Depends on owner entity', accent: '#4ade80', hint: 'Double box' },
  { kind: 'identifying-relationship', label: 'Identifying Rel.', description: 'Owns a weak entity', accent: '#6366f1', hint: 'Double diamond' },
  { kind: 'derived-attribute', label: 'Derived Attribute', description: 'Computed value', accent: '#f59e0b', hint: 'Dashed oval' },
  { kind: 'multivalued-attribute', label: 'Multi-valued Attr.', description: 'Repeating property', accent: '#fb923c', hint: 'Double oval' },
  { kind: 'composite-attribute', label: 'Composite Attribute', description: 'Breaks into parts', accent: '#a3e635', hint: 'Branching oval' },
  { kind: 'note', label: 'Note', description: 'Free-form annotation', accent: '#f472b6', hint: 'Sticky note' },
  { kind: 'frame', label: 'Boundary Frame', description: 'Group related items', accent: '#22c55e', hint: 'Dashed frame' },
];

const defaultLabels: Record<ERKind, string> = {
  entity: 'Entity',
  attribute: 'Attribute',
  relationship: 'Relationship',
  'weak-entity': 'Weak Entity',
  'identifying-relationship': 'Identifying Rel.',
  'derived-attribute': 'Derived Attribute',
  'multivalued-attribute': 'Multi-valued Attr.',
  'composite-attribute': 'Composite Attribute',
  note: 'Note',
  frame: 'Frame',
};

const kindStyles: Record<ERKind, { width: number; height: number; shape: string; borderStyle?: string }> = {
  entity: { width: 180, height: 86, shape: 'rectangle' },
  attribute: { width: 170, height: 72, shape: 'oval' },
  relationship: { width: 140, height: 104, shape: 'diamond' },
  'weak-entity': { width: 190, height: 94, shape: 'double-rectangle' },
  'identifying-relationship': { width: 158, height: 108, shape: 'double-diamond' },
  'derived-attribute': { width: 180, height: 72, shape: 'oval', borderStyle: 'dashed' },
  'multivalued-attribute': { width: 184, height: 78, shape: 'double-oval' },
  'composite-attribute': { width: 196, height: 92, shape: 'composite' },
  note: { width: 180, height: 112, shape: 'note' },
  frame: { width: 240, height: 150, shape: 'frame' },
};

const createNode = (kind: ERKind, position: { x: number; y: number }, label?: string): ERNode => ({
  id: nanoid(10),
  type: 'erNode',
  position,
  data: {
    kind,
    label: label || defaultLabels[kind],
    accent: paletteItems.find((item) => item.kind === kind)?.accent || '#14b8a6',
    description: paletteItems.find((item) => item.kind === kind)?.description,
  },
});

const baseNodeStyle = {
  color: '#e5eefc',
  fontFamily: "'Space Grotesk', sans-serif",
};

const ERNodeRenderer: React.FC<NodeProps> = ({ data, selected }) => {
  const nodeData = data as unknown as ERNodeData;
  const kind = nodeData.kind;
  const accent = nodeData.accent;
  const style = kindStyles[kind];

  const labelNode = (
    <div className="relative z-10 flex h-full w-full items-center justify-center px-3 text-center">
      <span className="text-[12px] font-semibold tracking-wide" style={baseNodeStyle}>
        {nodeData.label}
      </span>
    </div>
  );

  const handles = (
    <>
      <Handle
        type="target"
        position={Position.Left}
        className="er-handle"
        style={{
          width: 12,
          height: 12,
          borderRadius: '50%',
          backgroundColor: '#0b1020',
          border: '2px solid #67e8f9',
          left: -6,
          boxShadow: '0 0 0 2px rgba(6,10,20,0.9)',
        }}
      />
      <Handle
        type="source"
        position={Position.Right}
        className="er-handle"
        style={{
          width: 12,
          height: 12,
          borderRadius: '50%',
          backgroundColor: '#0b1020',
          border: '2px solid #67e8f9',
          right: -6,
          boxShadow: '0 0 0 2px rgba(6,10,20,0.9)',
        }}
      />
      <Handle
        type="target"
        position={Position.Top}
        className="er-handle"
        style={{
          width: 12,
          height: 12,
          borderRadius: '50%',
          backgroundColor: '#0b1020',
          border: '2px solid #67e8f9',
          top: -6,
          boxShadow: '0 0 0 2px rgba(6,10,20,0.9)',
        }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="er-handle"
        style={{
          width: 12,
          height: 12,
          borderRadius: '50%',
          backgroundColor: '#0b1020',
          border: '2px solid #67e8f9',
          bottom: -6,
          boxShadow: '0 0 0 2px rgba(6,10,20,0.9)',
        }}
      />
    </>
  );

  if (kind === 'frame') {
    return (
      <div
        className={`relative rounded-[22px] border-2 border-dashed bg-white/3 backdrop-blur-sm ${selected ? 'shadow-[0_0_0_2px_rgba(20,184,166,0.35)]' : ''}`}
        style={{
          width: style.width,
          height: style.height,
          borderColor: accent,
          background: 'linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))',
        }}
      >
        {handles}
        <div className="absolute left-4 top-3 text-[10px] uppercase tracking-[0.3em]" style={{ color: accent }}>
          Boundary
        </div>
        <div className="flex h-full items-center justify-center text-slate-300/70 text-sm">Drop related elements here</div>
      </div>
    );
  }

  if (kind === 'note') {
    return (
      <div
        className={`relative rounded-[18px] border bg-[linear-gradient(135deg,rgba(255,255,255,0.07),rgba(255,255,255,0.03))] shadow-lg ${selected ? 'shadow-[0_0_0_2px_rgba(244,114,182,0.35)]' : ''}`}
        style={{
          width: style.width,
          height: style.height,
          borderColor: accent,
          borderWidth: 1.5,
          clipPath: 'polygon(0 0, 100% 0, 100% 84%, 86% 100%, 0 100%)',
          color: '#f8fafc',
        }}
      >
        {handles}
        <div
          className="absolute right-0 top-0 h-8 w-8 opacity-80"
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.32), rgba(255,255,255,0.02))',
            clipPath: 'polygon(100% 0, 0 0, 100% 100%)',
          }}
        />
        <div className="flex h-full flex-col justify-center px-4 py-3">
          <div className="text-[10px] uppercase tracking-[0.35em]" style={{ color: accent }}>Note</div>
          <div className="mt-2 text-sm leading-5 text-slate-100/90">{nodeData.label}</div>
        </div>
      </div>
    );
  }

  const borderColor = selected ? '#67e8f9' : accent;

  const shape = (() => {
    switch (kind) {
      case 'entity':
        return (
          <div className="relative h-full w-full rounded-[16px] border-2 bg-slate-950/55 shadow-[0_12px_40px_rgba(0,0,0,0.32)]" style={{ borderColor }}>
            {handles}
            <div className="absolute left-3 top-3 text-[9px] uppercase tracking-[0.35em]" style={{ color: accent }}>Entity</div>
            {labelNode}
          </div>
        );
      case 'weak-entity':
        return (
          <div className="relative h-full w-full rounded-[16px] border-2 bg-slate-950/55 shadow-[0_12px_40px_rgba(0,0,0,0.32)]" style={{ borderColor }}>
            {handles}
            <div className="absolute inset-[5px] rounded-[12px] border" style={{ borderColor: accent }} />
            <div className="absolute left-3 top-3 text-[9px] uppercase tracking-[0.35em]" style={{ color: accent }}>Weak Entity</div>
            {labelNode}
          </div>
        );
      case 'attribute':
      case 'derived-attribute':
      case 'multivalued-attribute':
      case 'composite-attribute':
        return (
          <div className="relative h-full w-full">
            <div
              className={`absolute inset-0 rounded-full border-2 bg-slate-950/35 shadow-[0_12px_40px_rgba(0,0,0,0.25)] ${kind === 'derived-attribute' ? 'border-dashed' : ''}`}
              style={{ borderColor }}
            />
            {kind === 'multivalued-attribute' && (
              <div className="absolute inset-[5px] rounded-full border" style={{ borderColor: accent }} />
            )}
            {kind === 'composite-attribute' && (
              <>
                <div className="absolute left-[14%] top-1/2 h-px w-[18%] -translate-y-1/2 rotate-[-22deg] bg-slate-100/35" />
                <div className="absolute left-[14%] top-1/2 h-px w-[18%] -translate-y-1/2 rotate-[22deg] bg-slate-100/35" />
                <div className="absolute left-[14%] top-1/2 h-px w-[18%] -translate-y-1/2 bg-slate-100/35" />
              </>
            )}
            {handles}
            <div className="absolute left-3 top-2 text-[9px] uppercase tracking-[0.35em]" style={{ color: accent }}>
              {kind === 'derived-attribute' ? 'Derived' : kind === 'multivalued-attribute' ? 'Multi-valued' : kind === 'composite-attribute' ? 'Composite' : 'Attribute'}
            </div>
            {labelNode}
          </div>
        );
      case 'relationship':
      case 'identifying-relationship':
        return (
          <div className="relative h-full w-full">
            {handles}
            <div className="absolute inset-0 z-10 pointer-events-none">
              <div
                className="absolute left-1/2 top-1/2 h-[90%] w-[70%] -translate-x-1/2 -translate-y-1/2 rotate-45 border-2 bg-transparent shadow-[0_12px_40px_rgba(0,0,0,0.28)]"
                style={{ borderColor }}
              />
              {kind === 'identifying-relationship' && (
                <div
                  className="absolute left-1/2 top-1/2 h-[80%] w-[62%] -translate-x-1/2 -translate-y-1/2 rotate-45 border"
                  style={{ borderColor: accent }}
                />
              )}
              <div className="absolute inset-0 flex items-center justify-center px-3 text-center">
                <span className="max-w-[72%] text-[11px] font-semibold leading-tight tracking-wide" style={baseNodeStyle}>
                  {nodeData.label}
                </span>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  })();

  return (
    <div
      className="relative"
      style={{ width: style.width, height: style.height, ...baseNodeStyle }}
    >
      {shape}
    </div>
  );
};

const nodeTypes: NodeTypes = {
  erNode: ERNodeRenderer,
};

const initialNodes: ERNode[] = [
  createNode('entity', { x: 120, y: 120 }, 'Customer'),
  createNode('attribute', { x: 360, y: 58 }, 'customer_id'),
  createNode('attribute', { x: 360, y: 180 }, 'full_name'),
  createNode('relationship', { x: 630, y: 150 }, 'Places'),
  createNode('entity', { x: 850, y: 120 }, 'Order'),
  createNode('attribute', { x: 1110, y: 58 }, 'order_id'),
  createNode('multivalued-attribute', { x: 1180, y: 190 }, 'email'),
];

const initialEdges: Edge[] = [
  { id: 'e1', source: initialNodes[0].id, target: initialNodes[3].id, type: 'smoothstep', animated: false, style: { stroke: '#28b7c5', strokeWidth: 2 } },
  { id: 'e2', source: initialNodes[3].id, target: initialNodes[4].id, type: 'smoothstep', animated: false, style: { stroke: '#28b7c5', strokeWidth: 2 } },
  { id: 'e3', source: initialNodes[0].id, target: initialNodes[1].id, type: 'smoothstep', style: { stroke: '#8bc34a', strokeWidth: 1.6 } },
  { id: 'e4', source: initialNodes[0].id, target: initialNodes[2].id, type: 'smoothstep', style: { stroke: '#8bc34a', strokeWidth: 1.6 } },
  { id: 'e5', source: initialNodes[4].id, target: initialNodes[5].id, type: 'smoothstep', style: { stroke: '#8bc34a', strokeWidth: 1.6 } },
  { id: 'e6', source: initialNodes[4].id, target: initialNodes[6].id, type: 'smoothstep', style: { stroke: '#8bc34a', strokeWidth: 1.6 } },
];

const inspectorLabelStyle = { fontFamily: "'Space Grotesk', sans-serif" };

export const ERDiagramDesigner: React.FC = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState<ERNode>(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(initialNodes[0]?.id || null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [draftLabel, setDraftLabel] = useState('');
  const [draftAccent, setDraftAccent] = useState('#14b8a6');
  const { screenToFlowPosition, fitView } = useReactFlow();

  const selectedNode = useMemo(() => (nodes.find((node) => node.id === selectedNodeId) || null) as ERNode | null, [nodes, selectedNodeId]);
  const selectedEdge = useMemo(() => edges.find((edge) => edge.id === selectedEdgeId) || null, [edges, selectedEdgeId]);

  const syncDrafts = useCallback((node: ERNode | null) => {
    if (!node) {
      setDraftLabel('');
      setDraftAccent('#14b8a6');
      return;
    }
    setDraftLabel(node.data.label);
    setDraftAccent(node.data.accent);
  }, []);

  React.useEffect(() => {
    syncDrafts(selectedNode);
  }, [selectedNode, syncDrafts]);

  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') {
        const activeTag = (event.target as HTMLElement | null)?.tagName?.toLowerCase();
        if (activeTag === 'input' || activeTag === 'textarea' || (event.target as HTMLElement | null)?.isContentEditable) {
          return;
        }

        event.preventDefault();
        setEdges((currentEdges) => {
          if (currentEdges.length === 0) return currentEdges;
          return currentEdges.slice(0, -1);
        });
      }

      if (event.key === 'Delete' || event.key === 'Backspace') {
        const activeTag = (event.target as HTMLElement | null)?.tagName?.toLowerCase();
        if (activeTag === 'input' || activeTag === 'textarea' || (event.target as HTMLElement | null)?.isContentEditable) {
          return;
        }

        if (selectedEdgeId) {
          event.preventDefault();
          setEdges((currentEdges) => currentEdges.filter((edge) => edge.id !== selectedEdgeId));
          setSelectedEdgeId(null);
          return;
        }

        if (selectedNodeId) {
          event.preventDefault();
          setNodes((currentNodes) => currentNodes.filter((node) => node.id !== selectedNodeId));
          setEdges((currentEdges) => currentEdges.filter((edge) => edge.source !== selectedNodeId && edge.target !== selectedNodeId));
          setSelectedNodeId(null);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedEdgeId, selectedNodeId, setEdges, setNodes]);

  const onConnect = useCallback((connection: Connection) => {
    setEdges((currentEdges) => addEdge({
      ...connection,
      type: 'smoothstep',
      style: { stroke: '#28b7c5', strokeWidth: 2 },
    }, currentEdges));
  }, [setEdges]);

  const onDragStart = (event: React.DragEvent<HTMLButtonElement>, kind: ERKind) => {
    event.dataTransfer.setData('application/reactflow', kind);
    event.dataTransfer.effectAllowed = 'move';
  };

  const onDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const kind = event.dataTransfer.getData('application/reactflow') as ERKind;
    if (!kind) return;

    const position = screenToFlowPosition({
      x: event.clientX,
      y: event.clientY,
    });

    const node = createNode(kind, position);
    setNodes((currentNodes) => [...currentNodes, node]);
    setSelectedNodeId(node.id);
    setSelectedEdgeId(null);
  }, [screenToFlowPosition, setNodes]);

  const updateSelectedNode = useCallback(() => {
    if (!selectedNodeId) return;
    setNodes((currentNodes) => currentNodes.map((node) => {
      if (node.id !== selectedNodeId) return node;
      return {
        ...node,
        data: {
          ...node.data,
          label: draftLabel.trim() || defaultLabels[node.data.kind],
          accent: draftAccent,
        },
      };
    }));
  }, [draftAccent, draftLabel, selectedNodeId, setNodes]);

  const duplicateSelected = useCallback(() => {
    if (!selectedNode) return;
    const nextNode = createNode(selectedNode.data.kind, {
      x: selectedNode.position.x + 42,
      y: selectedNode.position.y + 42,
    }, `${selectedNode.data.label} copy`);
    nextNode.data.accent = selectedNode.data.accent;
    setNodes((currentNodes) => [...currentNodes, nextNode]);
    setSelectedNodeId(nextNode.id);
  }, [selectedNode, setNodes]);

  const exportJson = useCallback(() => {
    const payload = JSON.stringify({ nodes, edges }, null, 2);
    const blob = new Blob([payload], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'er-diagram.json';
    link.click();
    URL.revokeObjectURL(url);
  }, [nodes, edges]);

  const clearCanvas = useCallback(() => {
    setNodes([]);
    setEdges([]);
    setSelectedNodeId(null);
    setSelectedEdgeId(null);
  }, [setNodes, setEdges]);

  return (
    <div className="h-screen w-screen overflow-hidden" style={{ backgroundColor: '#070812', color: '#e5eefc' }}>
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(circle at top left, rgba(20,184,166,0.14), transparent 30%), radial-gradient(circle at bottom right, rgba(99,102,241,0.12), transparent 35%)' }} />
      <div className="relative z-10 flex h-full w-full">
        <aside className="hidden w-[320px] shrink-0 flex-col border-r border-white/8 bg-[#0b1020]/95 backdrop-blur-xl lg:flex">
          <div className="border-b border-white/8 px-5 py-5">
            <div className="text-xs uppercase tracking-[0.4em] text-teal-300/90">ER Diagram Designer</div>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-5">

              <div className="rounded-2xl border border-white/8 bg-white/4 p-4">
              <div className="mb-3 text-[11px] uppercase tracking-[0.35em] text-slate-400">Selected element</div>
              {selectedNode ? (
                <div className="space-y-3">
                  <div className="rounded-xl border border-white/8 bg-[#0f1730] p-3">
                    <div className="text-sm font-semibold text-white">{selectedNode.data.label}</div>
                    <div className="mt-1 text-xs text-slate-400">{selectedNode.data.description}</div>
                    <div className="mt-2 text-[10px] uppercase tracking-[0.35em]" style={{ color: selectedNode.data.accent }}>
                      {selectedNode.data.kind.replace('-', ' ')}
                    </div>
                  </div>
                  <label className="block text-xs text-slate-400">
                    Label
                    <input
                      value={draftLabel}
                      onChange={(event) => setDraftLabel(event.target.value)}
                      onBlur={updateSelectedNode}
                      className="mt-2 w-full rounded-xl border border-white/8 bg-[#0f1730] px-3 py-2 text-sm text-white outline-none focus:border-teal-400/30"
                    />
                  </label>
                  <label className="block text-xs text-slate-400">
                    Accent color
                    <input
                      type="color"
                      value={draftAccent}
                      onChange={(event) => setDraftAccent(event.target.value)}
                      onBlur={updateSelectedNode}
                      className="mt-2 h-11 w-full cursor-pointer rounded-xl border border-white/8 bg-[#0f1730] p-1"
                    />
                  </label>
                  <div className="flex gap-2">
                    <button onClick={updateSelectedNode} className="flex-1 rounded-xl bg-teal-400 px-3 py-2 text-sm font-semibold text-[#061016]">Apply</button>
                    <button
                      onClick={() => {
                        setNodes((currentNodes) => currentNodes.filter((node) => node.id !== selectedNode.id));
                        setEdges((currentEdges) => currentEdges.filter((edge) => edge.source !== selectedNode.id && edge.target !== selectedNode.id));
                        setSelectedNodeId(null);
                      }}
                      className="rounded-xl border border-red-400/20 px-3 py-2 text-sm text-red-200 hover:bg-red-500/10"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-slate-500">Select an element to edit its label and accent.</p>
              )}
            </div>
            <div className="mb-6 rounded-2xl border border-white/8 bg-white/4 p-4">
              <div className="mb-3 text-[11px] uppercase tracking-[0.35em] text-slate-400">Symbols</div>
              <div className="grid gap-3">
                {paletteItems.map((item) => (
                  <button
                    key={item.kind}
                    draggable
                    onDragStart={(event) => onDragStart(event, item.kind)}
                    onClick={() => {
                      const node = createNode(item.kind, { x: 180, y: 180 }, item.label);
                      setNodes((currentNodes) => [...currentNodes, node]);
                      setSelectedNodeId(node.id);
                    }}
                    className="group flex items-center gap-3 rounded-xl border border-white/8 bg-[#0f1730] px-3 py-3 text-left transition-transform hover:-translate-y-0.5 hover:border-teal-400/30"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-[10px] font-semibold uppercase" style={{ color: item.accent }}>
                      {item.label.slice(0, 2)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-slate-100">{item.label}</div>
                      <div className="text-xs text-slate-400">{item.description}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

           

          
          </div>
        </aside>

        <main className="relative flex-1 overflow-hidden">
          <div className="absolute left-4 top-4 z-20 flex flex-wrap gap-2">
            <div className="rounded-full border border-white/10 bg-[#0d1327]/90 px-3 py-2 text-xs text-slate-300 backdrop-blur-md">
              /er-diagram
            </div>
            <div className="rounded-full border border-teal-400/20 bg-teal-400/10 px-3 py-2 text-xs text-teal-200 backdrop-blur-md">
              Drag items from the sidebar
            </div>
          </div>

          <div
            className="absolute inset-0"
            onDragOver={onDragOver}
            onDrop={onDrop}
          >
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange as (changes: NodeChange[]) => void}
              onEdgesChange={onEdgesChange as (changes: EdgeChange[]) => void}
              onConnect={onConnect}
              nodeTypes={nodeTypes}
              onNodeClick={(_, node) => {
                setSelectedNodeId(node.id);
                setSelectedEdgeId(null);
              }}
              onEdgeClick={(_, edge) => {
                setSelectedEdgeId(edge.id);
                setSelectedNodeId(null);
              }}
              onPaneClick={() => {
                setSelectedNodeId(null);
                setSelectedEdgeId(null);
              }}
              fitView
              fitViewOptions={{ padding: 0.25 }}
              defaultEdgeOptions={{
                type: 'smoothstep',
                style: { stroke: '#28b7c5', strokeWidth: 2 },
              }}
              connectionLineStyle={{ stroke: '#67e8f9', strokeWidth: 2 }}
            >
              <Background variant={BackgroundVariant.Dots} gap={24} size={1} color="rgba(148,163,184,0.16)" />
              <MiniMap
                zoomable
                pannable
                style={{ backgroundColor: 'rgba(10, 15, 31, 0.92)' }}
                    nodeStrokeColor={(node) => ((node.data as unknown as ERNodeData).accent)}
                maskColor="rgba(7, 8, 18, 0.78)"
              />
              <Controls />
            </ReactFlow>
          </div>

          <div className="absolute bottom-4 left-4 right-4 z-20 flex flex-wrap gap-2 text-xs text-slate-300 lg:right-auto">
            {selectedNode ? (
              <div className="rounded-full border border-white/10 bg-[#0d1327]/90 px-3 py-2 backdrop-blur-md">
                Selected: {selectedNode.data.label}
              </div>
            ) : (
              <div className="rounded-full border border-white/10 bg-[#0d1327]/90 px-3 py-2 backdrop-blur-md">
                Tip: double-click or use the sidebar to add more elements.
              </div>
            )}
            {selectedEdge ? (
              <div className="rounded-full border border-white/10 bg-[#0d1327]/90 px-3 py-2 backdrop-blur-md">
                Relationship edge selected
              </div>
            ) : null}
          </div>
        </main>

        <aside className="hidden w-[280px] shrink-0 border-l border-white/8 bg-[#0b1020]/95 backdrop-blur-xl xl:flex xl:flex-col">
          <div className="border-b border-white/8 px-5 py-5">
            <div className="text-[11px] uppercase tracking-[0.4em] text-slate-400">Workspace</div>
            <div className="mt-2 text-lg font-semibold text-white" style={inspectorLabelStyle}>ER notation guide</div>
          </div>
          <div className="space-y-4 overflow-y-auto px-5 py-5 text-sm text-slate-300">
            <div className="rounded-2xl border border-white/8 bg-white/4 p-4">
              <div className="text-xs uppercase tracking-[0.35em] text-slate-400">Legend</div>
              <div className="mt-3 space-y-2 text-sm">
                {paletteItems.slice(0, 8).map((item) => (
                  <div key={item.kind} className="flex items-center gap-3">
                    <div className="h-3.5 w-3.5 rounded-full" style={{ backgroundColor: item.accent }} />
                    <span>{item.label}</span>
                  </div>
                ))}
              </div>
            </div>

           <div className="mb-6 rounded-2xl border border-white/8 bg-white/4 p-4">
              <div className="mb-3 text-[11px] uppercase tracking-[0.35em] text-slate-400">Utilities</div>
              <div className="grid gap-2 text-sm text-slate-300">
                <button onClick={() => createNode('note', { x: 220, y: 200 }) && undefined} className="hidden" aria-hidden="true" />
                <button
                  onClick={() => {
                    const node = createNode('note', { x: 260, y: 220 }, 'Add design note');
                    setNodes((currentNodes) => [...currentNodes, node]);
                    setSelectedNodeId(node.id);
                  }}
                  className="rounded-xl border border-white/8 bg-[#0f1730] px-3 py-2 text-left hover:border-pink-400/30"
                >
                  Add note block
                </button>
                <button
                  onClick={duplicateSelected}
                  disabled={!selectedNode}
                  className="rounded-xl border border-white/8 bg-[#0f1730] px-3 py-2 text-left disabled:opacity-40"
                >
                  Duplicate selected item
                </button>
                <button
                  onClick={exportJson}
                  className="rounded-xl border border-white/8 bg-[#0f1730] px-3 py-2 text-left hover:border-teal-400/30"
                >
                  Export JSON snapshot
                </button>
                <button
                  onClick={clearCanvas}
                  className="rounded-xl border border-white/8 bg-[#0f1730] px-3 py-2 text-left hover:border-red-400/30"
                >
                  Clear canvas
                </button>
              </div>
            </div>
          
          </div>
        </aside>
      </div>

      <style>{`
        .react-flow__attribution { display: none; }
        .react-flow__node { cursor: grab; }
        .react-flow__node:active { cursor: grabbing; }
        .react-flow__node .er-handle {
          opacity: 0;
          transform: scale(0.72);
          transition: opacity 0.14s ease, transform 0.14s ease;
          pointer-events: none;
        }
        .react-flow__node:hover .er-handle {
          opacity: 1;
          transform: scale(1);
          pointer-events: auto;
        }
      `}</style>
    </div>
  );
};

export default ERDiagramDesigner;