import React, { useState, useMemo } from "react";
import { Node } from "@xyflow/react";
import { 
  TableAttribute, 
  AttributeType, 
  DataType, 
  DATA_TYPES,
  Cardinality,
  CascadeAction,
  CARDINALITY_OPTIONS,
  CASCADE_ACTIONS
} from "../types";
import { ColorPicker } from "./ColorPicker";

interface TableNodeData {
  label: string;
  [key: string]: unknown;
}
type TableNode = Node<TableNodeData>;

interface SidebarProps {
  selectedTable?: Node;
  attributes?: TableAttribute[];
  isEditingTableName: boolean;
  editTableName: string;
  attrName: string;
  attrType: AttributeType;
  attrDataType: DataType;
  refTable: string;
  refAttr: string;
  cardinality?: Cardinality;
  onDelete?: CascadeAction;
  onUpdate?: CascadeAction;
  isOptional?: boolean;
  checkConstraint?: string;
  defaultValue?: string;
  isNotNull?: boolean;
  isUnique?: boolean;
  onStartEditTableName?: () => void;
  onSaveTableName?: () => void;
  onCancelEditTableName?: () => void;
  onEditTableNameChange?: (val: string) => void;
  onDeleteTable?: () => void;
  onChangeTableColor?: (color: string) => void;
  onAttrNameChange?: (val: string) => void;
  onAttrDataTypeChange?: (val: DataType) => void;
  onAttrTypeChange?: (val: AttributeType) => void;
  onRefTableChange?: (val: string) => void;
  onRefAttrChange?: (val: string) => void;
  onCardinalityChange?: (val: Cardinality) => void;
  onOnDeleteChange?: (val: CascadeAction) => void;
  onOnUpdateChange?: (val: CascadeAction) => void;
  onIsOptionalChange?: (val: boolean) => void;
  onCheckConstraintChange?: (val: string) => void;
  onDefaultValueChange?: (val: string) => void;
  onIsNotNullChange?: (val: boolean) => void;
  onIsUniqueChange?: (val: boolean) => void;
  onAddAttribute?: () => void;
  onStartAttrEdit?: (idx: number) => void;
  onAttrEditNameChange?: (idx: number, val: string) => void;
  onAttrEditDataTypeChange?: (idx: number, val: DataType) => void;
  onAttrEditTypeChange?: (idx: number, val: AttributeType) => void;
  onAttrEditRefTableChange?: (idx: number, val: string) => void;
  onAttrEditRefAttrChange?: (idx: number, val: string) => void;
  onAttrEditCardinalityChange?: (idx: number, val: Cardinality) => void;
  onAttrEditOnDeleteChange?: (idx: number, val: CascadeAction) => void;
  onAttrEditOnUpdateChange?: (idx: number, val: CascadeAction) => void;
  onAttrEditIsOptionalChange?: (idx: number, val: boolean) => void;
  onAttrEditCheckConstraintChange?: (idx: number, val: string) => void;
  onAttrEditDefaultValueChange?: (idx: number, val: string) => void;
  onAttrEditIsNotNullChange?: (idx: number, val: boolean) => void;
  onAttrEditIsUniqueChange?: (idx: number, val: boolean) => void;
  onSaveAttrName?: (idx: number) => void;
  onCancelAttrEdit?: (idx: number) => void;
  onDeleteAttribute?: (idx: number) => void;
  getAvailableTables?: () => Array<{id: string, label: string, attributes: any[]}>;
  getAttributesForTable?: (tableId: string) => Array<{name: string, type: string, dataType: string}>;
  validateFKReference?: (refTableId: string, refAttrName: string) => boolean;
  onClose?: () => void;
  // New: all nodes for table list
  allNodes?: Node[];
  onSelectTable?: (nodeId: string) => void;
  onAddTable?: () => void;
}

// Collapsible section component
const CollapsibleSection: React.FC<{
  title: string;
  icon?: React.ReactNode;
  defaultOpen?: boolean;
  count?: number;
  children: React.ReactNode;
}> = ({ title, icon, defaultOpen = false, count, children }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-400 hover:text-slate-200 hover:bg-white/3 transition-colors"
      >
        <svg className={`w-3 h-3 transition-transform ${open ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        {icon}
        <span className="font-medium">{title}</span>
        {count !== undefined && <span className="text-[10px] text-slate-500 ml-auto">{count}</span>}
      </button>
      {open && <div>{children}</div>}
    </div>
  );
};

export const Sidebar: React.FC<SidebarProps> = ({
  selectedTable,
  attributes = [],
  isEditingTableName,
  editTableName,
  attrName,
  attrType,
  attrDataType,
  refTable,
  refAttr,
  cardinality = 'one-to-many',
  onDelete: onDeleteCascade = 'NO ACTION',
  onUpdate: onUpdateCascade = 'NO ACTION',
  isOptional = false,
  checkConstraint = '',
  defaultValue = '',
  isNotNull = false,
  isUnique = false,
  onStartEditTableName,
  onSaveTableName,
  onCancelEditTableName,
  onEditTableNameChange,
  onDeleteTable,
  onChangeTableColor,
  onAttrNameChange,
  onAttrDataTypeChange,
  onAttrTypeChange,
  onRefTableChange,
  onRefAttrChange,
  onCardinalityChange,
  onOnDeleteChange,
  onOnUpdateChange,
  onIsOptionalChange,
  onCheckConstraintChange,
  onDefaultValueChange,
  onIsNotNullChange,
  onIsUniqueChange,
  onAddAttribute,
  onStartAttrEdit,
  onAttrEditNameChange,
  onAttrEditDataTypeChange,
  onAttrEditTypeChange,
  onAttrEditRefTableChange,
  onAttrEditRefAttrChange,
  onAttrEditCardinalityChange,
  onAttrEditOnDeleteChange,
  onAttrEditOnUpdateChange,
  onAttrEditIsOptionalChange,
  onAttrEditCheckConstraintChange,
  onAttrEditDefaultValueChange,
  onAttrEditIsNotNullChange,
  onAttrEditIsUniqueChange,
  onSaveAttrName,
  onCancelAttrEdit,
  onDeleteAttribute,
  getAvailableTables,
  getAttributesForTable,
  validateFKReference,
  onClose,
  allNodes = [],
  onSelectTable,
  onAddTable,
}) => {
  const [filterText, setFilterText] = useState('');
  const [activeTab, setActiveTab] = useState<'tables' | 'edit'>('tables');
  const [expandedTables, setExpandedTables] = useState<Set<string>>(new Set());

  // Auto-switch to edit tab when a table is selected
  React.useEffect(() => {
    if (selectedTable) {
      setActiveTab('edit');
      setExpandedTables(prev => new Set(prev).add(selectedTable.id));
    }
  }, [selectedTable?.id]);

  // Filtered table list
  const filteredNodes = useMemo(() => {
    if (!filterText) return allNodes;
    const lower = filterText.toLowerCase();
    return allNodes.filter(n => {
      const label = (n.data as any)?.label || '';
      return label.toLowerCase().includes(lower);
    });
  }, [allNodes, filterText]);

  const toggleTableExpand = (nodeId: string) => {
    setExpandedTables(prev => {
      const next = new Set(prev);
      if (next.has(nodeId)) next.delete(nodeId);
      else next.add(nodeId);
      return next;
    });
  };

  return (
    <div className="flex h-full">
      {/* Icon strip - narrow sidebar nav */}
      <div 
        className="hidden sm:flex flex-col items-center w-12 py-3 gap-1 flex-shrink-0"
        style={{ backgroundColor: '#0f0f1a', borderRight: '1px solid rgba(255,255,255,0.06)' }}
      >
        {onAddTable && (
          <button 
            onClick={onAddTable}
            className="w-8 h-8 flex items-center justify-center rounded text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
            title="New Table"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          </button>
        )}
        <div className="w-6 border-t border-white/5 my-1" />
        <button 
          onClick={() => setActiveTab('tables')}
          className={`w-8 h-8 flex items-center justify-center rounded transition-colors ${activeTab === 'tables' ? 'text-teal-400 bg-teal-400/10' : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'}`}
          title="Tables"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18M3 6h18M3 18h18" /></svg>
        </button>
        <button 
          onClick={() => setActiveTab('edit')}
          className={`w-8 h-8 flex items-center justify-center rounded transition-colors ${activeTab === 'edit' ? 'text-teal-400 bg-teal-400/10' : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'}`}
          title="Edit Fields"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
        </button>
      </div>

      {/* Main sidebar panel */}
      <div 
        className="w-full sm:w-64 lg:w-72 overflow-y-auto max-h-screen flex flex-col"
        style={{ backgroundColor: '#141420', borderRight: '1px solid rgba(255,255,255,0.06)' }}
      >
        {/* Close button (mobile) */}
        {onClose && (
          <button
            onClick={onClose}
            className="sm:hidden absolute top-2 right-2 p-1.5 text-slate-500 hover:text-white rounded transition-colors z-10"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        )}

        {activeTab === 'tables' ? (
          /* ====== TABLE LIST TAB ====== */
          <>
            {/* Filter + Add Table */}
            <div className="p-3 space-y-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <input
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
                placeholder="Filter"
                className="w-full px-2.5 py-1.5 text-xs rounded bg-white/5 border border-white/8 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-teal-500/50 transition-colors"
              />
              {onAddTable && (
                <button
                  onClick={onAddTable}
                  className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded transition-colors"
                  style={{ backgroundColor: 'rgba(20,184,166,0.1)', color: '#14b8a6', border: '1px solid rgba(20,184,166,0.2)' }}
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18M3 6h18M3 18h18" /></svg>
                  Add Table
                </button>
              )}
            </div>

            {/* Table List */}
            <div className="flex-1 overflow-y-auto">
              {filteredNodes.length === 0 ? (
                <div className="px-4 py-8 text-center text-xs text-slate-500">
                  {filterText ? 'No tables match filter' : 'No tables yet'}
                </div>
              ) : (
                filteredNodes.map(node => {
                  const nodeData = node.data as any;
                  const label = nodeData?.label || `Table ${node.id}`;
                  const nodeAttrs: TableAttribute[] = nodeData?.attributes || [];
                  const color = nodeData?.color || '#14b8a6';
                  const isExpanded = expandedTables.has(node.id);
                  const isSelected = selectedTable?.id === node.id;

                  return (
                    <div key={node.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      {/* Table header row */}
                      <div 
                        className={`flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-white/3 transition-colors ${isSelected ? 'bg-white/5' : ''}`}
                        onClick={() => {
                          onSelectTable?.(node.id);
                          toggleTableExpand(node.id);
                        }}
                      >
                        <svg className={`w-3 h-3 text-slate-500 transition-transform flex-shrink-0 ${isExpanded ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                        <div className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ backgroundColor: color }} />
                        <span className="text-xs text-slate-200 truncate flex-1 font-medium">{label}</span>
                        {/* 3-dot menu */}
                        <button 
                          className="p-0.5 text-slate-500 hover:text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                          onClick={(e) => { e.stopPropagation(); onSelectTable?.(node.id); setActiveTab('edit'); }}
                          title="Edit table"
                        >
                          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="5" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="19" r="2"/></svg>
                        </button>
                      </div>

                      {/* Expanded: show fields */}
                      {isExpanded && (
                        <div className="pb-2">
                          {/* Fields */}
                          <CollapsibleSection title="Fields" defaultOpen={true} count={nodeAttrs.length} icon={
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" /></svg>
                          }>
                            {nodeAttrs.length > 0 ? nodeAttrs.map((attr, i) => (
                              <div key={i} className="flex items-center gap-2 px-6 py-1 text-xs">
                                <span className={`truncate flex-1 ${attr.type === 'PK' ? 'text-slate-200 font-medium' : attr.type === 'FK' ? 'font-medium' : 'text-slate-400'}`}
                                  style={attr.type === 'FK' ? { color } : undefined}
                                >
                                  {attr.name}
                                </span>
                                <span className="text-[10px] text-slate-500 flex-shrink-0">{attr.dataType || 'varchar'}</span>
                                {attr.type === 'PK' && (
                                  <svg className="w-3 h-3 flex-shrink-0" viewBox="0 0 24 24" fill={color} stroke="none">
                                    <path d="M12.65 10A5.99 5.99 0 007 6c-3.31 0-6 2.69-6 6s2.69 6 6 6a5.99 5.99 0 005.65-4H17v4h4v-4h2v-4H12.65zM7 14c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"/>
                                  </svg>
                                )}
                                {!attr.isNotNull && <span className="text-[10px] text-slate-600 flex-shrink-0">?</span>}
                              </div>
                            )) : (
                              <div className="px-6 py-1 text-[10px] text-slate-600 italic">No fields</div>
                            )}
                          </CollapsibleSection>

                          {/* Color + Edit */}
                          <div className="px-4 pt-1 flex items-center gap-2">
                            <div className="w-4 h-4 rounded cursor-pointer border border-white/10" style={{ backgroundColor: color }} title="Table color" />
                            <button
                              className="text-[10px] text-teal-400 hover:text-teal-300 transition-colors"
                              onClick={() => { onSelectTable?.(node.id); setActiveTab('edit'); }}
                            >
                              Edit
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </>
        ) : (
          /* ====== EDIT TAB - attribute editor ====== */
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {/* Back to tables */}
            <button 
              onClick={() => setActiveTab('tables')}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors mb-2"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              Tables
            </button>

            {selectedTable ? (
              <>
                {/* Table Name */}
                <div className="rounded-md p-3" style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  {isEditingTableName ? (
                    <div className="space-y-2">
                      <input
                        value={editTableName || ""}
                        onChange={(e) => onEditTableNameChange?.(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") onSaveTableName?.();
                          if (e.key === "Escape") onCancelEditTableName?.();
                        }}
                        className="w-full px-2.5 py-1.5 rounded text-sm bg-white/5 border border-white/8 text-slate-100 focus:outline-none focus:border-teal-500/50"
                        placeholder="Table name"
                        autoFocus
                      />
                      <div className="flex gap-2">
                        <button onClick={onSaveTableName} className="flex-1 py-1.5 text-xs rounded font-medium" style={{ backgroundColor: '#14b8a6', color: '#0a0a0f' }}>Save</button>
                        <button onClick={onCancelEditTableName} className="flex-1 py-1.5 text-xs rounded text-slate-300 bg-white/5">Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <h4
                        className="text-sm font-semibold text-slate-100 cursor-pointer hover:text-teal-400 transition-colors truncate flex-1"
                        onClick={onStartEditTableName}
                        title="Click to rename"
                      >
                        {(selectedTable?.data as any)?.label || `Table ${selectedTable?.id}`}
                      </h4>
                      <button
                        onClick={onDeleteTable}
                        className="ml-2 px-2 py-1 text-[10px] rounded text-red-400 hover:text-red-300 border border-red-500/30 hover:bg-red-500/10 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>

                {/* Color Picker */}
                <ColorPicker
                  currentColor={(selectedTable?.data as any)?.color || '#14b8a6'}
                  onColorChange={(color) => onChangeTableColor?.(color)}
                />

                {/* Fields list */}
                <div className="rounded-md" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div className="px-3 py-2 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', backgroundColor: 'rgba(255,255,255,0.02)' }}>
                    <span className="text-xs font-medium text-slate-300">Fields</span>
                    <span className="text-[10px] text-slate-500">{attributes.length}</span>
                  </div>

                  {attributes.length > 0 ? (
                    <div className="max-h-64 overflow-y-auto">
                      {attributes.map((attr, idx) => (
                        <div key={idx} className="px-3 py-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                          {attr.isEditing ? (
                            /* Editing mode */
                            <div className="space-y-2">
                              <input
                                value={attr.editName || ""}
                                onChange={(e) => onAttrEditNameChange?.(idx, e.target.value)}
                                onKeyDown={(e) => { if (e.key === "Enter") onSaveAttrName?.(idx); if (e.key === "Escape") onCancelAttrEdit?.(idx); }}
                                className="w-full px-2 py-1.5 text-xs rounded bg-white/5 border border-white/8 text-slate-100 focus:outline-none focus:border-teal-500/50"
                                placeholder="Field name"
                                autoFocus
                              />
                              <select value={attr.editDataType || attr.dataType} onChange={(e) => onAttrEditDataTypeChange?.(idx, e.target.value as DataType)} className="w-full px-2 py-1.5 text-xs rounded bg-white/5 border border-white/8 text-slate-100 focus:outline-none">
                                {DATA_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
                              </select>
                              <select value={attr.editType || attr.type} onChange={(e) => onAttrEditTypeChange?.(idx, e.target.value as AttributeType)} className="w-full px-2 py-1.5 text-xs rounded bg-white/5 border border-white/8 text-slate-100 focus:outline-none">
                                <option value="normal">Normal</option>
                                <option value="PK">Primary Key</option>
                                <option value="FK">Foreign Key</option>
                              </select>

                              {/* FK refs */}
                              {(attr.editType === "FK" || (attr.editType === undefined && attr.type === "FK")) && (
                                <div className="space-y-2 p-2 rounded" style={{ backgroundColor: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.15)' }}>
                                  <span className="text-[10px] font-medium text-indigo-300">FK Reference</span>
                                  <select value={attr.editRefTable || attr.refTable || ""} onChange={(e) => { onAttrEditRefTableChange?.(idx, e.target.value); if (e.target.value !== (attr.editRefTable || attr.refTable)) onAttrEditRefAttrChange?.(idx, ""); }} className="w-full px-2 py-1 text-xs rounded bg-white/5 border border-white/8 text-slate-100">
                                    <option value="">Select table...</option>
                                    {getAvailableTables?.().map((table) => <option key={table.id} value={table.label}>{table.label}</option>)}
                                  </select>
                                  <select value={attr.editRefAttr || attr.refAttr || ""} onChange={(e) => onAttrEditRefAttrChange?.(idx, e.target.value)} className="w-full px-2 py-1 text-xs rounded bg-white/5 border border-white/8 text-slate-100" disabled={!(attr.editRefTable || attr.refTable)}>
                                    <option value="">Select attribute...</option>
                                    {(attr.editRefTable || attr.refTable) && getAvailableTables?.().find(table => table.label === (attr.editRefTable || attr.refTable))?.attributes?.map((refAttr: any) => (
                                      <option key={refAttr.name} value={refAttr.name}>{refAttr.name} ({refAttr.dataType})</option>
                                    ))}
                                  </select>
                                  <select value={attr.editCardinality || attr.cardinality || 'one-to-many'} onChange={(e) => onAttrEditCardinalityChange?.(idx, e.target.value as Cardinality)} className="w-full px-2 py-1 text-xs rounded bg-white/5 border border-white/8 text-slate-100">
                                    {CARDINALITY_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                  </select>
                                  <div className="grid grid-cols-2 gap-1.5">
                                    <select value={attr.editOnDelete || attr.onDelete || 'NO ACTION'} onChange={(e) => onAttrEditOnDeleteChange?.(idx, e.target.value as CascadeAction)} className="px-2 py-1 text-[10px] rounded bg-white/5 border border-white/8 text-slate-100">
                                      {CASCADE_ACTIONS.map((a) => <option key={a} value={a}>{a}</option>)}
                                    </select>
                                    <select value={attr.editOnUpdate || attr.onUpdate || 'NO ACTION'} onChange={(e) => onAttrEditOnUpdateChange?.(idx, e.target.value as CascadeAction)} className="px-2 py-1 text-[10px] rounded bg-white/5 border border-white/8 text-slate-100">
                                      {CASCADE_ACTIONS.map((a) => <option key={a} value={a}>{a}</option>)}
                                    </select>
                                  </div>
                                  <label className="flex items-center gap-1.5 text-[10px] text-slate-300 cursor-pointer">
                                    <input type="checkbox" checked={attr.editIsOptional ?? attr.isOptional ?? false} onChange={(e) => onAttrEditIsOptionalChange?.(idx, e.target.checked)} className="w-3 h-3 rounded" />
                                    Optional (nullable)
                                  </label>
                                </div>
                              )}

                              {/* Constraints for non-FK */}
                              {(attr.editType !== "FK" && attr.type !== "FK") && (
                                <div className="space-y-1.5 p-2 rounded" style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                                  <div className="flex gap-3">
                                    <label className="flex items-center gap-1.5 text-[10px] text-slate-300 cursor-pointer">
                                      <input type="checkbox" checked={attr.editIsNotNull ?? attr.isNotNull ?? false} onChange={(e) => onAttrEditIsNotNullChange?.(idx, e.target.checked)} className="w-3 h-3 rounded" />
                                      NOT NULL
                                    </label>
                                    <label className="flex items-center gap-1.5 text-[10px] text-slate-300 cursor-pointer">
                                      <input type="checkbox" checked={attr.editIsUnique ?? attr.isUnique ?? false} onChange={(e) => onAttrEditIsUniqueChange?.(idx, e.target.checked)} className="w-3 h-3 rounded" />
                                      UNIQUE
                                    </label>
                                  </div>
                                  <input value={attr.editDefaultValue ?? attr.defaultValue ?? ''} onChange={(e) => onAttrEditDefaultValueChange?.(idx, e.target.value)} placeholder="Default value" className="w-full px-2 py-1 text-[10px] rounded bg-white/5 border border-white/8 text-slate-100 placeholder-slate-600 focus:outline-none" />
                                  <input value={attr.editCheckConstraint ?? attr.checkConstraint ?? ''} onChange={(e) => onAttrEditCheckConstraintChange?.(idx, e.target.value)} placeholder="CHECK constraint" className="w-full px-2 py-1 text-[10px] rounded bg-white/5 border border-white/8 text-slate-100 placeholder-slate-600 focus:outline-none" />
                                </div>
                              )}

                              <div className="flex gap-1.5">
                                <button onClick={() => onSaveAttrName?.(idx)} className="flex-1 py-1 text-[10px] rounded font-medium" style={{ backgroundColor: '#14b8a6', color: '#0a0a0f' }}>Save</button>
                                <button onClick={() => onCancelAttrEdit?.(idx)} className="flex-1 py-1 text-[10px] rounded text-slate-300 bg-white/5">Cancel</button>
                              </div>
                            </div>
                          ) : (
                            /* Display mode */
                            <div className="flex items-center justify-between group">
                              <div className="flex items-center gap-1.5 min-w-0 flex-1">
                                <span className="text-xs text-slate-200 truncate">{attr.name || "Unnamed"}</span>
                                <span className="text-[10px] text-slate-500">{attr.dataType || "varchar"}</span>
                                {attr.type === "PK" && <span className="text-[9px] px-1 py-0.5 rounded bg-amber-500/10 text-amber-400 font-medium">PK</span>}
                                {attr.type === "FK" && <span className="text-[9px] px-1 py-0.5 rounded bg-indigo-500/10 text-indigo-400 font-medium">FK</span>}
                              </div>
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => onStartAttrEdit?.(idx)} className="p-0.5 text-slate-500 hover:text-teal-400 transition-colors" title="Edit">
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                </button>
                                <button onClick={() => onDeleteAttribute?.(idx)} className="p-0.5 text-slate-500 hover:text-red-400 transition-colors" title="Delete">
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                </button>
                              </div>
                            </div>
                          )}

                          {/* FK reference info */}
                          {!attr.isEditing && attr.type === "FK" && attr.refTable && attr.refAttr && (
                            <div className="mt-1 text-[10px] text-slate-500">
                              → {attr.refTable}.{attr.refAttr}
                              {attr.cardinality && (
                                <span className="ml-1.5 text-indigo-400">
                                  {attr.cardinality === 'one-to-one' ? '1:1' : attr.cardinality === 'one-to-many' ? '1:N' : 'M:N'}
                                </span>
                              )}
                            </div>
                          )}

                          {/* Constraint badges */}
                          {!attr.isEditing && attr.type !== "FK" && (attr.isNotNull || attr.isUnique || attr.defaultValue || attr.checkConstraint) && (
                            <div className="mt-1 flex flex-wrap gap-1">
                              {attr.isNotNull && <span className="text-[9px] px-1 py-0.5 rounded bg-blue-500/10 text-blue-400">NOT NULL</span>}
                              {attr.isUnique && <span className="text-[9px] px-1 py-0.5 rounded bg-green-500/10 text-green-400">UNIQUE</span>}
                              {attr.defaultValue && <span className="text-[9px] px-1 py-0.5 rounded bg-purple-500/10 text-purple-400">DEF: {attr.defaultValue}</span>}
                              {attr.checkConstraint && <span className="text-[9px] px-1 py-0.5 rounded bg-orange-500/10 text-orange-400">CHECK</span>}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="px-3 py-4 text-xs text-slate-500 text-center">No fields yet</div>
                  )}
                </div>

                {/* Add New Field */}
                <div className="rounded-md p-3 space-y-2" style={{ border: '1px solid rgba(255,255,255,0.06)', backgroundColor: 'rgba(255,255,255,0.02)' }}>
                  <span className="text-xs font-medium text-slate-300">Add Field</span>
                  <input placeholder="Field name" value={attrName || ""} onChange={(e) => onAttrNameChange?.(e.target.value)} className="w-full px-2.5 py-1.5 text-xs rounded bg-white/5 border border-white/8 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-teal-500/50" />
                  <div className="grid grid-cols-2 gap-1.5">
                    <select value={attrDataType || "VARCHAR"} onChange={(e) => onAttrDataTypeChange?.(e.target.value as DataType)} className="px-2 py-1.5 text-xs rounded bg-white/5 border border-white/8 text-slate-100 focus:outline-none">
                      {DATA_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
                    </select>
                    <select value={attrType || "normal"} onChange={(e) => onAttrTypeChange?.(e.target.value as AttributeType)} className="px-2 py-1.5 text-xs rounded bg-white/5 border border-white/8 text-slate-100 focus:outline-none">
                      <option value="normal">Normal</option>
                      <option value="PK">Primary Key</option>
                      <option value="FK">Foreign Key</option>
                    </select>
                  </div>

                  {/* FK options */}
                  {attrType === "FK" && (
                    <div className="space-y-1.5 p-2 rounded" style={{ backgroundColor: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.15)' }}>
                      <select value={refTable || ""} onChange={(e) => { onRefTableChange?.(e.target.value); if (e.target.value !== refTable) onRefAttrChange?.(""); }} className="w-full px-2 py-1 text-xs rounded bg-white/5 border border-white/8 text-slate-100">
                        <option value="">Ref table...</option>
                        {getAvailableTables?.().map((table) => <option key={table.id} value={table.label}>{table.label}</option>)}
                      </select>
                      <select value={refAttr || ""} onChange={(e) => onRefAttrChange?.(e.target.value)} className="w-full px-2 py-1 text-xs rounded bg-white/5 border border-white/8 text-slate-100" disabled={!refTable}>
                        <option value="">Ref attribute...</option>
                        {refTable && getAvailableTables?.().find(table => table.label === refTable)?.attributes?.map((refAttribute: any) => (
                          <option key={refAttribute.name} value={refAttribute.name}>{refAttribute.name} ({refAttribute.dataType})</option>
                        ))}
                      </select>
                      <select value={cardinality} onChange={(e) => onCardinalityChange?.(e.target.value as Cardinality)} className="w-full px-2 py-1 text-xs rounded bg-white/5 border border-white/8 text-slate-100">
                        {CARDINALITY_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                      </select>
                      <div className="grid grid-cols-2 gap-1.5">
                        <select value={onDeleteCascade} onChange={(e) => onOnDeleteChange?.(e.target.value as CascadeAction)} className="px-2 py-1 text-[10px] rounded bg-white/5 border border-white/8 text-slate-100">
                          {CASCADE_ACTIONS.map((a) => <option key={a} value={a}>DEL: {a}</option>)}
                        </select>
                        <select value={onUpdateCascade} onChange={(e) => onOnUpdateChange?.(e.target.value as CascadeAction)} className="px-2 py-1 text-[10px] rounded bg-white/5 border border-white/8 text-slate-100">
                          {CASCADE_ACTIONS.map((a) => <option key={a} value={a}>UPD: {a}</option>)}
                        </select>
                      </div>
                      <label className="flex items-center gap-1.5 text-[10px] text-slate-300 cursor-pointer">
                        <input type="checkbox" checked={isOptional} onChange={(e) => onIsOptionalChange?.(e.target.checked)} className="w-3 h-3 rounded" />
                        Optional (nullable)
                      </label>
                    </div>
                  )}

                  {/* Constraints for non-FK */}
                  {attrType !== "FK" && (
                    <div className="space-y-1.5 p-2 rounded" style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <div className="flex gap-3">
                        <label className="flex items-center gap-1.5 text-[10px] text-slate-300 cursor-pointer">
                          <input type="checkbox" checked={isNotNull} onChange={(e) => onIsNotNullChange?.(e.target.checked)} className="w-3 h-3 rounded" />
                          NOT NULL
                        </label>
                        <label className="flex items-center gap-1.5 text-[10px] text-slate-300 cursor-pointer">
                          <input type="checkbox" checked={isUnique} onChange={(e) => onIsUniqueChange?.(e.target.checked)} className="w-3 h-3 rounded" />
                          UNIQUE
                        </label>
                      </div>
                      <input value={defaultValue} onChange={(e) => onDefaultValueChange?.(e.target.value)} placeholder="Default value" className="w-full px-2 py-1 text-[10px] rounded bg-white/5 border border-white/8 text-slate-100 placeholder-slate-600 focus:outline-none" />
                      <input value={checkConstraint} onChange={(e) => onCheckConstraintChange?.(e.target.value)} placeholder="CHECK constraint" className="w-full px-2 py-1 text-[10px] rounded bg-white/5 border border-white/8 text-slate-100 placeholder-slate-600 focus:outline-none" />
                    </div>
                  )}

                  <button
                    onClick={onAddAttribute}
                    className="w-full py-1.5 text-xs rounded font-medium transition-colors"
                    style={{ backgroundColor: '#14b8a6', color: '#0a0a0f' }}
                  >
                    + Add Field
                  </button>
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <div className="text-3xl mb-3">📊</div>
                <p className="text-sm font-medium text-slate-300 mb-1">No Table Selected</p>
                <p className="text-xs text-slate-500">Select a table to edit its fields</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
