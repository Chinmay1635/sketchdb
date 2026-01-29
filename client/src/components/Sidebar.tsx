import React from "react";
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
  // New FK options for adding attributes
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

  // Attribute editing
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
  
  // FK Helper functions
  getAvailableTables?: () => Array<{id: string, label: string, attributes: any[]}>;
  getAttributesForTable?: (tableId: string) => Array<{name: string, type: string, dataType: string}>;
  validateFKReference?: (refTableId: string, refAttrName: string) => boolean;
  
  // Mobile close
  onClose?: () => void;
}

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
}) => {
  return (
    <div 
      className="w-full sm:w-72 lg:w-80 xl:w-96 p-4 sm:p-5 overflow-y-auto max-h-screen"
      style={{
        backgroundColor: 'rgba(10, 10, 15, 0.98)',
        borderRight: '1px solid rgba(42, 42, 58, 0.5)',
        boxShadow: '4px 0 30px rgba(0, 0, 0, 0.5), 0 0 40px rgba(0, 255, 255, 0.02)'
      }}
    >
      <div className="flex items-center justify-between mb-0 pb-3" style={{ borderBottom: '1px solid rgba(42, 42, 58, 0.5)' }}>
        <h3 
          className="text-sm sm:text-base font-bold text-neon-cyan uppercase tracking-widest"
          style={{ fontFamily: "'Orbitron', sans-serif" }}
        >
          // Attributes
        </h3>
        {/* Close button - visible on mobile */}
        {onClose && (
          <button
            onClick={onClose}
            className="sm:hidden mt-25 p-2 text-chrome hover:text-neon-cyan rounded transition-all duration-200"
            style={{ backgroundColor: 'rgba(42, 42, 58, 0.3)' }}
            title="Close sidebar"
            aria-label="Close sidebar"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {selectedTable ? (
        <>
          {/* Table Name Section */}
          <div
            className={`${
              isEditingTableName
                ? "block"
                : "flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2"
            } mb-5 p-3 sm:p-4 rounded`}
            style={{
              backgroundColor: 'rgba(26, 26, 36, 0.5)',
              border: '1px solid rgba(42, 42, 58, 0.5)'
            }}
          >
            {isEditingTableName ? (
              <div className="flex flex-col flex-1 mr-2 gap-2">
                <input
                  value={editTableName || ""}
                  onChange={(e) => onEditTableNameChange?.(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") onSaveTableName?.();
                    if (e.key === "Escape") onCancelEditTableName?.();
                  }}
                  className="flex-1 px-3 py-2 rounded text-ghost text-sm transition-all duration-200"
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    backgroundColor: 'rgba(18, 18, 24, 0.8)',
                    border: '1px solid rgba(42, 42, 58, 0.8)',
                    outline: 'none'
                  }}
                  placeholder="Enter table name"
                  title="Edit table name"
                  autoFocus
                />
                <div className="flex gap-2">
                  <button
                    onClick={onSaveTableName}
                    className="text-void rounded w-1/2 px-3 py-2 transition-all duration-200 text-sm font-bold"
                    style={{ 
                      background: 'linear-gradient(135deg, #00ff88, #00cc6a)',
                      fontFamily: "'JetBrains Mono', monospace"
                    }}
                  >
                    ✓
                  </button>
                  <button
                    onClick={onCancelEditTableName}
                    className="text-ghost rounded w-1/2 px-3 py-2 transition-all duration-200 text-sm"
                    style={{ 
                      backgroundColor: 'rgba(42, 42, 58, 0.8)',
                      fontFamily: "'JetBrains Mono', monospace"
                    }}
                  >
                    ✕
                  </button>
                </div>
              </div>
            ) : (
              <h4
                className="m-0 cursor-pointer flex-1 text-base sm:text-lg font-semibold text-pure hover:text-neon-cyan transition-all duration-200"
                onClick={onStartEditTableName}
                title="Click to edit table name"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              >
                {(selectedTable?.data as any)?.label ||
                  `Table ${selectedTable?.id}`}
              </h4>
            )}

            <button
              onClick={onDeleteTable}
              className={`text-white rounded ${
                isEditingTableName ? "w-full mt-4" : "w-fit mt-0"
              } cursor-pointer px-3 py-1.5 sm:px-4 sm:py-2 transition-all duration-200 font-bold text-xs uppercase tracking-wider`}
              style={{ 
                background: 'linear-gradient(135deg, #ff3366, #cc2952)',
                fontFamily: "'JetBrains Mono', monospace",
                boxShadow: '0 0 15px rgba(255, 51, 102, 0.3)'
              }}
              title="Delete Table"
            >
              Delete
            </button>
          </div>

          {/* Color Picker Section */}
          <ColorPicker
            currentColor={(selectedTable?.data as any)?.color || '#00ffff'}
            onColorChange={(color) => onChangeTableColor?.(color)}
          />

          {/* Current Attributes */}
          <div 
            className="mb-5 p-3 sm:p-4 rounded"
            style={{
              backgroundColor: 'rgba(26, 26, 36, 0.5)',
              border: '1px solid rgba(42, 42, 58, 0.5)'
            }}
          >
            <h5 
              className="text-[10px] sm:text-xs font-semibold text-neon-cyan mb-3 uppercase tracking-widest"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              Current Attributes
            </h5>

            {attributes.length > 0 ? (
              <div className="max-h-80 overflow-y-auto">
                <ul className="space-y-2">
                  {attributes.map((attr, idx) => (
                    <li
                      key={idx}
                      className="p-2.5 sm:p-3 rounded"
                      style={{
                        backgroundColor: 'rgba(42, 42, 58, 0.3)',
                        border: '1px solid rgba(42, 42, 58, 0.5)'
                      }}
                    >
                      <div className="flex items-center justify-between">
                        {/* Attribute Name */}
                        {attr.isEditing ? (
                          <div className="flex flex-col gap-2.5 flex-1">
                            {/* Attribute Name Input */}
                            <div>
                              <label className="block text-xs font-medium text-slate-400 mb-1">
                                Attribute Name
                              </label>
                              <input
                                value={attr.editName || ""}
                                onChange={(e) =>
                                  onAttrEditNameChange?.(idx, e.target.value)
                                }
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") onSaveAttrName?.(idx);
                                  if (e.key === "Escape")
                                    onCancelAttrEdit?.(idx);
                                }}
                                className="w-full px-2 py-1.5 border border-slate-600 rounded-md bg-slate-600 text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                                title="Edit attribute name"
                                aria-label="Edit attribute name"
                                placeholder="Enter attribute name"
                                autoFocus
                              />
                            </div>

                            {/* Data Type Select */}
                            <div>
                              <label className="block text-xs font-medium text-slate-400 mb-1">
                                Data Type
                              </label>
                              <select
                                value={attr.editDataType || attr.dataType}
                                onChange={(e) =>
                                  onAttrEditDataTypeChange?.(
                                    idx,
                                    e.target.value as DataType
                                  )
                                }
                                className="w-full px-2 py-1.5 border border-slate-600 rounded-md bg-slate-600 text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                                title="Select data type"
                              >
                                {DATA_TYPES.map((type) => (
                                  <option key={type} value={type}>
                                    {type}
                                  </option>
                                ))}
                              </select>
                            </div>

                            {/* Attribute Type Select */}
                            <div>
                              <label className="block text-xs font-medium text-slate-400 mb-1">
                                Key Type
                              </label>
                              <select
                                value={attr.editType || attr.type}
                                onChange={(e) =>
                                  onAttrEditTypeChange?.(
                                    idx,
                                    e.target.value as AttributeType
                                  )
                                }
                                className="w-full px-2 py-1.5 border border-slate-600 rounded-md bg-slate-600 text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                                title="Select key type"
                              >
                                <option value="normal">Normal</option>
                                <option value="PK">Primary Key</option>
                                <option value="FK">Foreign Key</option>
                              </select>
                            </div>

                            {/* Foreign Key References */}
                            {(attr.editType === "FK" ||
                              (attr.editType === undefined &&
                                attr.type === "FK")) && (
                              <div className="space-y-2 p-2.5 bg-indigo-900/20 rounded-md border border-indigo-700/50">
                                <h6 className="text-xs font-medium text-indigo-300">
                                  Foreign Key Reference
                                </h6>
                                <div>
                                  <label className="block text-xs font-medium text-slate-400 mb-1">
                                    Reference Table
                                  </label>
                                  <select
                                    value={
                                      attr.editRefTable || attr.refTable || ""
                                    }
                                    onChange={(e) => {
                                      onAttrEditRefTableChange?.(
                                        idx,
                                        e.target.value
                                      );
                                      // Clear attribute selection when table changes
                                      if (e.target.value !== (attr.editRefTable || attr.refTable)) {
                                        onAttrEditRefAttrChange?.(idx, "");
                                      }
                                    }}
                                    className="w-full px-2 py-1.5 border border-slate-600 rounded-md bg-slate-600 text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                                    title="Select reference table for foreign key"
                                  >
                                    <option value="">Select table...</option>
                                    {getAvailableTables?.().map((table) => (
                                      <option key={table.id} value={table.label}>
                                        {table.label}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-slate-400 mb-1">
                                    Reference Attribute
                                  </label>
                                  <select
                                    value={
                                      attr.editRefAttr || attr.refAttr || ""
                                    }
                                    onChange={(e) =>
                                      onAttrEditRefAttrChange?.(
                                        idx,
                                        e.target.value
                                      )
                                    }
                                    className="w-full px-2 py-1.5 border border-slate-600 rounded-md bg-slate-600 text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                                    disabled={!(attr.editRefTable || attr.refTable)}
                                    title="Select reference attribute for foreign key"
                                  >
                                    <option value="">Select attribute...</option>
                                    {(attr.editRefTable || attr.refTable) && 
                                      getAvailableTables?.()
                                        .find(table => table.label === (attr.editRefTable || attr.refTable))
                                        ?.attributes?.map((refAttr: any) => (
                                          <option key={refAttr.name} value={refAttr.name}>
                                            {refAttr.name} ({refAttr.dataType})
                                          </option>
                                        ))
                                    }
                                  </select>
                                </div>
                                
                                {/* Cardinality */}
                                <div>
                                  <label className="block text-xs font-medium text-slate-400 mb-1">
                                    Relationship Type
                                  </label>
                                  <select
                                    value={attr.editCardinality || attr.cardinality || 'one-to-many'}
                                    onChange={(e) => onAttrEditCardinalityChange?.(idx, e.target.value as Cardinality)}
                                    className="w-full px-2 py-1.5 border border-slate-600 rounded-md bg-slate-600 text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                                    title="Select relationship cardinality"
                                  >
                                    {CARDINALITY_OPTIONS.map((opt) => (
                                      <option key={opt.value} value={opt.value} title={opt.description}>
                                        {opt.label}
                                      </option>
                                    ))}
                                  </select>
                                </div>

                                {/* Cascade Actions */}
                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <label className="block text-xs font-medium text-slate-400 mb-1">
                                      ON DELETE
                                    </label>
                                    <select
                                      value={attr.editOnDelete || attr.onDelete || 'NO ACTION'}
                                      onChange={(e) => onAttrEditOnDeleteChange?.(idx, e.target.value as CascadeAction)}
                                      className="w-full px-2 py-1.5 border border-slate-600 rounded-md bg-slate-600 text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs"
                                    >
                                      {CASCADE_ACTIONS.map((action) => (
                                        <option key={action} value={action}>{action}</option>
                                      ))}
                                    </select>
                                  </div>
                                  <div>
                                    <label className="block text-xs font-medium text-slate-400 mb-1">
                                      ON UPDATE
                                    </label>
                                    <select
                                      value={attr.editOnUpdate || attr.onUpdate || 'NO ACTION'}
                                      onChange={(e) => onAttrEditOnUpdateChange?.(idx, e.target.value as CascadeAction)}
                                      className="w-full px-2 py-1.5 border border-slate-600 rounded-md bg-slate-600 text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs"
                                    >
                                      {CASCADE_ACTIONS.map((action) => (
                                        <option key={action} value={action}>{action}</option>
                                      ))}
                                    </select>
                                  </div>
                                </div>

                                {/* Optional Toggle */}
                                <div className="flex items-center gap-2">
                                  <input
                                    type="checkbox"
                                    id={`optional-edit-${idx}`}
                                    checked={attr.editIsOptional ?? attr.isOptional ?? false}
                                    onChange={(e) => onAttrEditIsOptionalChange?.(idx, e.target.checked)}
                                    className="w-4 h-4 rounded border-slate-600 bg-slate-600 text-indigo-500 focus:ring-indigo-500"
                                  />
                                  <label htmlFor={`optional-edit-${idx}`} className="text-xs text-slate-300">
                                    Optional (nullable FK)
                                  </label>
                                </div>
                              </div>
                            )}

                            {/* Column Constraints (for non-FK columns) */}
                            {(attr.editType !== "FK" && attr.type !== "FK") && (
                              <div className="space-y-2 p-2.5 bg-slate-800/50 rounded-md border border-slate-600/50">
                                <h6 className="text-xs font-medium text-slate-400">
                                  Column Constraints
                                </h6>
                                
                                <div className="flex flex-wrap gap-3">
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="checkbox"
                                      id={`notnull-edit-${idx}`}
                                      checked={attr.editIsNotNull ?? attr.isNotNull ?? false}
                                      onChange={(e) => onAttrEditIsNotNullChange?.(idx, e.target.checked)}
                                      className="w-4 h-4 rounded border-slate-600 bg-slate-600 text-indigo-500 focus:ring-indigo-500"
                                    />
                                    <label htmlFor={`notnull-edit-${idx}`} className="text-xs text-slate-300">NOT NULL</label>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="checkbox"
                                      id={`unique-edit-${idx}`}
                                      checked={attr.editIsUnique ?? attr.isUnique ?? false}
                                      onChange={(e) => onAttrEditIsUniqueChange?.(idx, e.target.checked)}
                                      className="w-4 h-4 rounded border-slate-600 bg-slate-600 text-indigo-500 focus:ring-indigo-500"
                                    />
                                    <label htmlFor={`unique-edit-${idx}`} className="text-xs text-slate-300">UNIQUE</label>
                                  </div>
                                </div>

                                <div>
                                  <label className="block text-xs font-medium text-slate-400 mb-1">
                                    Default Value
                                  </label>
                                  <input
                                    value={attr.editDefaultValue ?? attr.defaultValue ?? ''}
                                    onChange={(e) => onAttrEditDefaultValueChange?.(idx, e.target.value)}
                                    placeholder="e.g., 0, 'active', NOW()"
                                    className="w-full px-2 py-1.5 border border-slate-600 rounded-md bg-slate-600 text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs"
                                  />
                                </div>

                                <div>
                                  <label className="block text-xs font-medium text-slate-400 mb-1">
                                    CHECK Constraint
                                  </label>
                                  <input
                                    value={attr.editCheckConstraint ?? attr.checkConstraint ?? ''}
                                    onChange={(e) => onAttrEditCheckConstraintChange?.(idx, e.target.value)}
                                    placeholder="e.g., age >= 0, status IN ('active','inactive')"
                                    className="w-full px-2 py-1.5 border border-slate-600 rounded-md bg-slate-600 text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs"
                                  />
                                </div>
                              </div>
                            )}

                            {/* Action Buttons */}
                            <div className="flex gap-2">
                              <button
                                onClick={() => onSaveAttrName?.(idx)}
                                className="bg-emerald-600 text-white px-3 py-1.5 rounded-md cursor-pointer flex-1 hover:bg-emerald-500 transition-colors text-sm"
                                title="Save changes"
                              >
                                ✓ Save
                              </button>
                              <button
                                onClick={() => onCancelAttrEdit?.(idx)}
                                className="bg-slate-600 text-white px-3 py-1.5 rounded-md cursor-pointer flex-1 hover:bg-slate-500 transition-colors text-sm"
                                title="Cancel edit"
                              >
                                ✕ Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between flex-1">
                            <span className="font-medium text-slate-100 text-sm">
                              {attr.name || "Unnamed"}
                            </span>
                            <span className="text-xs text-slate-400 ml-2">
                              {attr.dataType || "VARCHAR"}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      {!attr.isEditing && (
                        <div className="w-full mt-2.5 flex items-center justify-between gap-2">
                          <button
                            onClick={() => onStartAttrEdit?.(idx)}
                            className="text-indigo-400 hover:text-indigo-300 text-xs sm:text-sm px-2 sm:px-3 py-1.5 border border-indigo-500/50 rounded-md cursor-pointer hover:bg-indigo-500/10 transition-colors"
                          >
                            edit
                          </button>
                          <button
                            onClick={() => onDeleteAttribute?.(idx)}
                            className="text-rose-400 hover:text-rose-300 text-xs sm:text-sm px-2 sm:px-3 py-1.5 border border-rose-500/50 rounded-md cursor-pointer hover:bg-rose-500/10 transition-colors"
                          >
                            delete
                          </button>
                          <span
                            className={`px-2 sm:px-3 py-1.5 rounded-md text-xs font-medium ${
                              attr.type === "PK"
                                ? "bg-amber-900/40 text-amber-300"
                                : attr.type === "FK"
                                ? "bg-indigo-900/40 text-indigo-300"
                                : "bg-slate-600/50 text-slate-300"
                            }`}
                          >
                            {attr.type || "Normal"}
                          </span>
                        </div>
                      )}

                      {/* FK reference */}
                      {attr.type === "FK" && attr.refTable && attr.refAttr && (
                        <div className="mt-2 text-xs text-slate-400 space-y-1">
                          <div>
                            References:{" "}
                            <span className="font-medium text-slate-300">
                              {attr.refTable}.{attr.refAttr}
                            </span>
                          </div>
                          {attr.cardinality && (
                            <div className="flex items-center gap-2">
                              <span className="px-1.5 py-0.5 rounded bg-indigo-900/40 text-indigo-300 text-[10px]">
                                {attr.cardinality === 'one-to-one' ? '1:1' : 
                                 attr.cardinality === 'one-to-many' ? '1:N' : 'M:N'}
                              </span>
                              {attr.isOptional && (
                                <span className="px-1.5 py-0.5 rounded bg-amber-900/40 text-amber-300 text-[10px]">
                                  Optional
                                </span>
                              )}
                            </div>
                          )}
                          {(attr.onDelete && attr.onDelete !== 'NO ACTION') && (
                            <div className="text-[10px]">
                              ON DELETE: <span className="text-rose-400">{attr.onDelete}</span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Show constraints for non-FK columns */}
                      {attr.type !== "FK" && (attr.isNotNull || attr.isUnique || attr.defaultValue || attr.checkConstraint) && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {attr.isNotNull && (
                            <span className="px-1.5 py-0.5 rounded bg-blue-900/40 text-blue-300 text-[10px]">NOT NULL</span>
                          )}
                          {attr.isUnique && (
                            <span className="px-1.5 py-0.5 rounded bg-green-900/40 text-green-300 text-[10px]">UNIQUE</span>
                          )}
                          {attr.defaultValue && (
                            <span className="px-1.5 py-0.5 rounded bg-purple-900/40 text-purple-300 text-[10px]">
                              DEFAULT: {attr.defaultValue}
                            </span>
                          )}
                          {attr.checkConstraint && (
                            <span className="px-1.5 py-0.5 rounded bg-orange-900/40 text-orange-300 text-[10px]" title={attr.checkConstraint}>
                              CHECK
                            </span>
                          )}
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="text-slate-400 text-sm italic">
                No attributes defined yet
              </p>
            )}
          </div>

          {/* Add New Attribute */}
          <div className="space-y-3">
            <h5 className="text-xs sm:text-sm font-semibold text-slate-400 mb-3 uppercase tracking-wide">
              Add New Attribute
            </h5>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-slate-300 mb-1">
                Attribute Name
              </label>
              <input
                placeholder="Enter attribute name"
                value={attrName || ""}
                onChange={(e) => onAttrNameChange?.(e.target.value)}
                className="w-full px-3 py-2 border border-slate-600 rounded-md bg-slate-700 text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-slate-300 mb-1">
                Data Type
              </label>
              <select
                value={attrDataType || "VARCHAR"}
                onChange={(e) =>
                  onAttrDataTypeChange?.(e.target.value as DataType)
                }
                className="w-full px-3 py-2 border border-slate-600 rounded-md bg-slate-700 text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                title="Select data type for the attribute"
                aria-label="Data type selection"
              >
                {DATA_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-slate-300 mb-1">
                Attribute Type
              </label>
              <select
                value={attrType || "normal"}
                onChange={(e) =>
                  onAttrTypeChange?.(e.target.value as AttributeType)
                }
                className="w-full px-3 py-2 border border-slate-600 rounded-md bg-slate-700 text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                title="Select attribute type (normal, primary key, or foreign key)"
                aria-label="Attribute type selection"
              >
                <option value="normal">Normal</option>
                <option value="PK">Primary Key</option>
                <option value="FK">Foreign Key</option>
              </select>
            </div>

            {attrType === "FK" && (
              <div className="space-y-3 p-3 bg-indigo-900/20 rounded-md border border-indigo-700/50">
                <h6 className="text-xs sm:text-sm font-medium text-indigo-300">
                  Foreign Key Reference
                </h6>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-slate-300 mb-1">
                    Reference Table
                  </label>
                  <select
                    value={refTable || ""}
                    onChange={(e) => {
                      onRefTableChange?.(e.target.value);
                      // Clear attribute selection when table changes
                      if (e.target.value !== refTable) {
                        onRefAttrChange?.("");
                      }
                    }}
                    className="w-full px-3 py-2 border border-slate-600 rounded-md bg-slate-700 text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                    title="Select reference table for foreign key"
                  >
                    <option value="">Select table...</option>
                    {getAvailableTables?.().map((table) => (
                      <option key={table.id} value={table.label}>
                        {table.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-slate-300 mb-1">
                    Reference Attribute
                  </label>
                  <select
                    value={refAttr || ""}
                    onChange={(e) => onRefAttrChange?.(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-600 rounded-md bg-slate-700 text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                    disabled={!refTable}
                    title="Select reference attribute for foreign key"
                  >
                    <option value="">Select attribute...</option>
                    {refTable && 
                      getAvailableTables?.()
                        .find(table => table.label === refTable)
                        ?.attributes?.map((refAttribute: any) => (
                          <option key={refAttribute.name} value={refAttribute.name}>
                            {refAttribute.name} ({refAttribute.dataType})
                          </option>
                        ))
                    }
                  </select>
                </div>

                {/* Cardinality */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-slate-300 mb-1">
                    Relationship Type
                  </label>
                  <select
                    value={cardinality}
                    onChange={(e) => onCardinalityChange?.(e.target.value as Cardinality)}
                    className="w-full px-3 py-2 border border-slate-600 rounded-md bg-slate-700 text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                    title="Select relationship cardinality"
                  >
                    {CARDINALITY_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value} title={opt.description}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-slate-400 mt-1">
                    {CARDINALITY_OPTIONS.find(o => o.value === cardinality)?.description}
                  </p>
                </div>

                {/* Cascade Actions */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-slate-300 mb-1">
                      ON DELETE
                    </label>
                    <select
                      value={onDeleteCascade}
                      onChange={(e) => onOnDeleteChange?.(e.target.value as CascadeAction)}
                      className="w-full px-3 py-2 border border-slate-600 rounded-md bg-slate-700 text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs"
                    >
                      {CASCADE_ACTIONS.map((action) => (
                        <option key={action} value={action}>{action}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-slate-300 mb-1">
                      ON UPDATE
                    </label>
                    <select
                      value={onUpdateCascade}
                      onChange={(e) => onOnUpdateChange?.(e.target.value as CascadeAction)}
                      className="w-full px-3 py-2 border border-slate-600 rounded-md bg-slate-700 text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs"
                    >
                      {CASCADE_ACTIONS.map((action) => (
                        <option key={action} value={action}>{action}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Optional Toggle */}
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="optional-new"
                    checked={isOptional}
                    onChange={(e) => onIsOptionalChange?.(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-indigo-500 focus:ring-indigo-500"
                  />
                  <label htmlFor="optional-new" className="text-xs sm:text-sm text-slate-300">
                    Optional relationship (nullable FK)
                  </label>
                </div>
              </div>
            )}

            {/* Column Constraints (for non-FK columns) */}
            {attrType !== "FK" && (
              <div className="space-y-3 p-3 bg-slate-800/50 rounded-md border border-slate-600/50">
                <h6 className="text-xs sm:text-sm font-medium text-slate-400">
                  Column Constraints
                </h6>
                
                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="notnull-new"
                      checked={isNotNull}
                      onChange={(e) => onIsNotNullChange?.(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-indigo-500 focus:ring-indigo-500"
                    />
                    <label htmlFor="notnull-new" className="text-xs sm:text-sm text-slate-300">NOT NULL</label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="unique-new"
                      checked={isUnique}
                      onChange={(e) => onIsUniqueChange?.(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-indigo-500 focus:ring-indigo-500"
                    />
                    <label htmlFor="unique-new" className="text-xs sm:text-sm text-slate-300">UNIQUE</label>
                  </div>
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-slate-300 mb-1">
                    Default Value
                  </label>
                  <input
                    value={defaultValue}
                    onChange={(e) => onDefaultValueChange?.(e.target.value)}
                    placeholder="e.g., 0, 'active', NOW()"
                    className="w-full px-3 py-2 border border-slate-600 rounded-md bg-slate-700 text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-slate-300 mb-1">
                    CHECK Constraint
                  </label>
                  <input
                    value={checkConstraint}
                    onChange={(e) => onCheckConstraintChange?.(e.target.value)}
                    placeholder="e.g., age >= 0, status IN ('active','inactive')"
                    className="w-full px-3 py-2 border border-slate-600 rounded-md bg-slate-700 text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                  />
                </div>
              </div>
            )}

            <button
              onClick={onAddAttribute}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-2.5 rounded-md transition-colors duration-200 shadow-sm font-medium text-sm"
            >
              Add Attribute
            </button>
          </div>
        </>
      ) : (
        <div className="text-center text-slate-400 py-8">
          <div className="text-4xl mb-4">📊</div>
          <p className="text-base sm:text-lg font-medium mb-2 text-slate-300">No Table Selected</p>
          <p className="text-xs sm:text-sm">
            Select a table node to view and edit its attributes.
          </p>
        </div>
      )}
    </div>
  );
};
