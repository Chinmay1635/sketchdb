import React from "react";
import { Node } from "@xyflow/react";
import { TableAttribute, AttributeType, DataType, DATA_TYPES } from "../types";

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
}) => {
  return (
    <div className="w-72 lg:w-80 xl:w-96 bg-white border-l border-gray-200 shadow-lg p-6 overflow-y-auto max-h-screen">
      <h3 className="text-xl font-bold text-gray-800 mb-4 border-b border-gray-200 pb-3">
        Table Attributes
      </h3>

      {selectedTable ? (
        <>
          {/* Table Name Section */}
          <div
            className={`${
              isEditingTableName
                ? "block"
                : "flex flex-col lg:flex-row justify-between items-center"
            } mb-6 bg-gray-50 p-4 rounded-lg border`}
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
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter table name"
                  title="Edit table name"
                  autoFocus
                />
                <div className="flex gap-2">
                  <button
                    onClick={onSaveTableName}
                    className="bg-green-500 hover:bg-green-600 text-white rounded-md w-1/2 px-3 py-2 transition-colors duration-200 shadow-sm"
                  >
                    ✓
                  </button>
                  <button
                    onClick={onCancelEditTableName}
                    className="bg-red-500 hover:bg-red-600 text-white rounded-md w-1/2 px-3 py-2 transition-colors duration-200 shadow-sm"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ) : (
              <h4
                className="m-0 cursor-pointer flex-1 text-lg font-semibold text-gray-800 hover:text-blue-600 transition-colors duration-200"
                onClick={onStartEditTableName}
                title="Click to edit table name"
              >
                {(selectedTable?.data as any)?.label ||
                  `Table ${selectedTable?.id}`}
              </h4>
            )}

            <button
              onClick={onDeleteTable}
              className={`bg-red-600 hover:bg-red-700 text-white rounded-md ${
                isEditingTableName ? "w-full mt-5" : "w-fit mt-0"
              } cursor-pointer px-4 py-2 transition-colors duration-200 shadow-sm font-medium`}
              title="Delete Table"
            >
              Delete
            </button>
          </div>

          {/* Current Attributes */}
          <div className="mb-6 bg-gray-50 p-4 rounded-lg border">
            <h5 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
              Current Attributes
            </h5>

            {attributes.length > 0 ? (
              <div className="max-h-80 overflow-y-auto">
                <ul className="space-y-2">
                  {attributes.map((attr, idx) => (
                    <li
                      key={idx}
                      className="bg-white p-3 rounded-md border border-gray-200 shadow-sm"
                    >
                      <div className="flex items-center justify-between">
                        {/* Attribute Name */}
                        {attr.isEditing ? (
                          <div className="flex flex-col gap-3 flex-1">
                            {/* Attribute Name Input */}
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">
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
                                className="w-full px-2 py-1 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                title="Edit attribute name"
                                aria-label="Edit attribute name"
                                placeholder="Enter attribute name"
                                autoFocus
                              />
                            </div>

                            {/* Data Type Select */}
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">
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
                                className="w-full px-2 py-1 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                              <label className="block text-xs font-medium text-gray-600 mb-1">
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
                                className="w-full px-2 py-1 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                              <div className="space-y-2 p-3 bg-blue-50 rounded-md border border-blue-200">
                                <h6 className="text-xs font-medium text-blue-800">
                                  Foreign Key Reference
                                </h6>
                                <div>
                                  <label className="block text-xs font-medium text-gray-600 mb-1">
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
                                    className="w-full px-2 py-1 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                                  <label className="block text-xs font-medium text-gray-600 mb-1">
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
                                    className="w-full px-2 py-1 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                                className="bg-green-500 text-white px-3 py-2 rounded-md cursor-pointer flex-1 hover:bg-green-600 transition-colors"
                                title="Save changes"
                              >
                                ✓ Save
                              </button>
                              <button
                                onClick={() => onCancelAttrEdit?.(idx)}
                                className="bg-red-500 text-white px-3 py-2 rounded-md cursor-pointer flex-1 hover:bg-red-600 transition-colors"
                                title="Cancel edit"
                              >
                                ✕ Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between flex-1">
                            <span className="font-medium text-gray-800">
                              {attr.name || "Unnamed"}
                            </span>
                            <span className="text-sm text-gray-500 ml-2">
                              {attr.dataType || "VARCHAR"}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      {!attr.isEditing && (
                        <div className="w-full mt-3 flex items-center justify-between gap-3">
                          <button
                            onClick={() => onStartAttrEdit?.(idx)}
                            className="text-blue-500 hover:text-blue-700 text-sm px-3 py-2 border border-blue-500 rounded-md cursor-pointer"
                          >
                            edit
                          </button>
                          <button
                            onClick={() => onDeleteAttribute?.(idx)}
                            className="text-red-500 hover:text-red-700 text-sm px-3 py-2 border border-red-500 rounded-md cursor-pointer"
                          >
                            delete
                          </button>
                          <span
                            className={`px-3 py-2 rounded-md text-xs font-medium ${
                              attr.type === "PK"
                                ? "bg-yellow-100 text-yellow-800"
                                : attr.type === "FK"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {attr.type || "Normal"}
                          </span>
                        </div>
                      )}

                      {/* FK reference */}
                      {attr.type === "FK" && attr.refTable && attr.refAttr && (
                        <div className="mt-2 text-xs text-gray-600">
                          References:{" "}
                          <span className="font-medium">
                            {attr.refTable}.{attr.refAttr}
                          </span>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="text-gray-500 text-sm italic">
                No attributes defined yet
              </p>
            )}
          </div>

          {/* Add New Attribute */}
          <div className="space-y-4">
            <h5 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
              Add New Attribute
            </h5>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Attribute Name
              </label>
              <input
                placeholder="Enter attribute name"
                value={attrName || ""}
                onChange={(e) => onAttrNameChange?.(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Data Type
              </label>
              <select
                value={attrDataType || "VARCHAR"}
                onChange={(e) =>
                  onAttrDataTypeChange?.(e.target.value as DataType)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Attribute Type
              </label>
              <select
                value={attrType || "normal"}
                onChange={(e) =>
                  onAttrTypeChange?.(e.target.value as AttributeType)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                title="Select attribute type (normal, primary key, or foreign key)"
                aria-label="Attribute type selection"
              >
                <option value="normal">Normal</option>
                <option value="PK">Primary Key</option>
                <option value="FK">Foreign Key</option>
              </select>
            </div>

            {attrType === "FK" && (
              <div className="space-y-4 p-4 bg-blue-50 rounded-md border border-blue-200">
                <h6 className="text-sm font-medium text-blue-800">
                  Foreign Key Reference
                </h6>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Reference Attribute
                  </label>
                  <select
                    value={refAttr || ""}
                    onChange={(e) => onRefAttrChange?.(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-md transition-colors duration-200 shadow-sm font-medium"
            >
              Add Attribute
            </button>
          </div>
        </>
      ) : (
        <div className="text-center text-gray-500 py-8">
          <div className="text-4xl mb-4">📊</div>
          <p className="text-lg font-medium mb-2">No Table Selected</p>
          <p className="text-sm">
            Select a table node to view and edit its attributes.
          </p>
        </div>
      )}
    </div>
  );
};
