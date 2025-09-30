import React from "react";
import { Node } from "@xyflow/react";
import { TableAttribute, AttributeType, DataType, DATA_TYPES } from "../types";

interface TableNodeData {
  label: string;
}

type TableNode = Node<TableNodeData>;

interface SidebarProps {
  selectedTable: TableNode | undefined;
  attributes: TableAttribute[];
  isEditingTableName: boolean;
  editTableName: string;
  attrName: string;
  attrType: AttributeType;
  attrDataType: DataType;
  refTable: string;
  refAttr: string;
  onStartEditTableName: () => void;
  onSaveTableName: () => void;
  onCancelEditTableName: () => void;
  onEditTableNameChange: (value: string) => void;
  onDeleteTable: () => void;
  onAttrNameChange: (value: string) => void;
  onAttrDataTypeChange: (value: DataType) => void;
  onAttrTypeChange: (value: AttributeType) => void;
  onRefTableChange: (value: string) => void;
  onRefAttrChange: (value: string) => void;
  onAddAttribute: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  selectedTable,
  attributes,
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
}) => {
  return (
    <div className="w-72 lg:w-80 xl:w-96 bg-white border-l border-gray-200 shadow-lg p-6 overflow-y-auto max-h-screen">
      <h3 className="text-xl font-bold text-gray-800 mb-6 border-b border-gray-200 pb-3">
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
                  value={editTableName}
                  onChange={(e) => onEditTableNameChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") onSaveTableName();
                    if (e.key === "Escape") onCancelEditTableName();
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
                {selectedTable.data.label || `Table ${selectedTable.id}`}
              </h4>
            )}
            <button
              onClick={onDeleteTable}
              className={`bg-red-600 hover:bg-red-700 text-white rounded-md ${isEditingTableName ? "w-full mt-5" :"w-fit mt-0"} px-4 py-2 transition-colors duration-200 shadow-sm font-medium`}
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
              <ul className="space-y-2">
                {attributes.map((attr, idx) => (
                  <li
                    key={idx}
                    className="bg-white p-3 rounded-md border border-gray-200 shadow-sm"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-medium text-gray-800">
                          {attr.name}
                        </span>
                        <span className="text-sm text-gray-500 ml-2">
                          {attr.dataType || "VARCHAR"}
                        </span>
                      </div>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          attr.type === "PK"
                            ? "bg-yellow-100 text-yellow-800"
                            : attr.type === "FK"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {attr.type}
                      </span>
                    </div>
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
                value={attrName}
                onChange={(e) => onAttrNameChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Data Type
              </label>
              <select
                value={attrDataType}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                  onAttrDataTypeChange(e.target.value as DataType)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                value={attrType}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                  onAttrTypeChange(e.target.value as AttributeType)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                  <input
                    placeholder="Enter reference table name"
                    value={refTable}
                    onChange={(e) => onRefTableChange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Reference Attribute
                  </label>
                  <input
                    placeholder="Enter reference attribute name"
                    value={refAttr}
                    onChange={(e) => onRefAttrChange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
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
