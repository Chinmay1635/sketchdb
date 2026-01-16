import React from "react";
import { Node } from "@xyflow/react";
import { TableAttribute, AttributeType, DataType, DATA_TYPES } from "../types";
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
  onAddAttribute?: () => void;

  // Attribute editing
  onStartAttrEdit?: (idx: number) => void;
  onAttrEditNameChange?: (idx: number, val: string) => void;
  onAttrEditDataTypeChange?: (idx: number, val: DataType) => void;
  onAttrEditTypeChange?: (idx: number, val: AttributeType) => void;
  onAttrEditRefTableChange?: (idx: number, val: string) => void;
  onAttrEditRefAttrChange?: (idx: number, val: string) => void;
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
  onAddAttribute,
  onStartAttrEdit,
  onAttrEditNameChange,
  onAttrEditDataTypeChange,
  onAttrEditTypeChange,
  onAttrEditRefTableChange,
  onAttrEditRefAttrChange,
  onSaveAttrName,
  onCancelAttrEdit,
  onDeleteAttribute,
  getAvailableTables,
  getAttributesForTable,
  validateFKReference,
  onClose,
}) => {
  return (
    <div className="w-full sm:w-72 lg:w-80 xl:w-96 bg-slate-900 border-r border-slate-700/50 shadow-lg p-4 sm:p-5 overflow-y-auto max-h-screen">
      <div className="flex items-center justify-between mb-0 border-b border-slate-700/50 pb-3">
        <h3 className="text-lg sm:text-xl font-bold text-slate-100">
          Table Attributes
        </h3>
        {/* Close button - visible on mobile */}
        {onClose && (
          <button
            onClick={onClose}
            className="sm:hidden mt-25 p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-700/50 rounded-md transition-colors"
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
            } mb-5 bg-slate-800/50 p-3 sm:p-4 rounded-lg border border-slate-700/50`}
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
                  className="flex-1 px-3 py-2 border border-slate-600 rounded-md bg-slate-700 text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                  placeholder="Enter table name"
                  title="Edit table name"
                  autoFocus
                />
                <div className="flex gap-2">
                  <button
                    onClick={onSaveTableName}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-md w-1/2 px-3 py-2 transition-colors duration-200 shadow-sm text-sm"
                  >
                    ✓
                  </button>
                  <button
                    onClick={onCancelEditTableName}
                    className="bg-slate-600 hover:bg-slate-500 text-white rounded-md w-1/2 px-3 py-2 transition-colors duration-200 shadow-sm text-sm"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ) : (
              <h4
                className="m-0 cursor-pointer flex-1 text-base sm:text-lg font-semibold text-slate-100 hover:text-indigo-400 transition-colors duration-200"
                onClick={onStartEditTableName}
                title="Click to edit table name"
              >
                {(selectedTable?.data as any)?.label ||
                  `Table ${selectedTable?.id}`}
              </h4>
            )}

            <button
              onClick={onDeleteTable}
              className={`bg-rose-600/80 hover:bg-rose-500 text-white rounded-md ${
                isEditingTableName ? "w-full mt-4" : "w-fit mt-0"
              } cursor-pointer px-3 py-1.5 sm:px-4 sm:py-2 transition-colors duration-200 shadow-sm font-medium text-sm`}
              title="Delete Table"
            >
              Delete
            </button>
          </div>

          {/* Color Picker Section */}
          <ColorPicker
            currentColor={(selectedTable?.data as any)?.color || '#0074D9'}
            onColorChange={(color) => onChangeTableColor?.(color)}
          />

          {/* Current Attributes */}
          <div className="mb-5 bg-slate-800/50 p-3 sm:p-4 rounded-lg border border-slate-700/50">
            <h5 className="text-xs sm:text-sm font-semibold text-slate-400 mb-3 uppercase tracking-wide">
              Current Attributes
            </h5>

            {attributes.length > 0 ? (
              <div className="max-h-80 overflow-y-auto">
                <ul className="space-y-2">
                  {attributes.map((attr, idx) => (
                    <li
                      key={idx}
                      className="bg-slate-700/50 p-2.5 sm:p-3 rounded-md border border-slate-600/50 shadow-sm"
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
                        <div className="mt-2 text-xs text-slate-400">
                          References:{" "}
                          <span className="font-medium text-slate-300">
                            {attr.refTable}.{attr.refAttr}
                          </span>
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
