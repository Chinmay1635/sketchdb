import React from "react";
import { Handle, Position } from "@xyflow/react";
import { TableAttribute } from "../types";

interface TableNodeProps {
  data: {
    label: string;
    attributes: TableAttribute[];
  };
  id: string;
}

export const TableNode: React.FC<TableNodeProps> = ({ data, id }) => {
  const attributes = Array.isArray(data.attributes) ? data.attributes : [];

  return (
    <div className="bg-white border-2 border-[#0074D9] rounded-lg min-w-[200px] shadow-md relative">
      {/* Table Header */}
      <div className="bg-[#0074D9] text-white px-3 py-2 rounded-t-lg font-bold text-center">
        {typeof data.label === "string" ? data.label : `Table ${id}`}
      </div>

      {/* Attributes List */}
      <div className="py-2">
        {attributes.length > 0 ? (
          attributes.map((attr, idx) => (
            <div
              key={idx}
              className={`px-3 py-1 text-xs flex justify-between items-center relative min-h-[24px] ${
                idx < attributes.length - 1 ? "border-b border-gray-200" : ""
              }`}
            >
              {/* Left handle (incoming connections) */}
              <Handle
                type="target"
                position={Position.Left}
                id={`${id}-${attr.name}-target`}
                className={`!w-2 !h-2 !bg-${
                  attr.type === "FK" ? "[#FF6B6B]" : "[#0074D9]"
                } absolute left-[-4px] top-1/2 -translate-y-1/2 rounded-full`}
              />

              {/* Right handle (outgoing connections) */}
              <Handle
                type="source"
                position={Position.Right}
                id={`${id}-${attr.name}-source`}
                className={`!w-2 !h-2 !bg-${
                  attr.type === "PK" ? "[#FFD700]" : "[#0074D9]"
                } absolute right-[-4px] top-1/2 -translate-y-1/2 rounded-full`}
              />

              <span className={attr.type === "PK" ? "font-bold" : ""}>
                {attr.name}
                {attr.type === "PK" && (
                  <span className="text-[#FFD700] ml-1">🔑</span>
                )}
                {attr.type === "FK" && (
                  <span className="text-[#FF6B6B] ml-1">🔗</span>
                )}
              </span>

              <span className="text-gray-500 text-[10px]">
                {attr.dataType || "VARCHAR(255)"}
              </span>
            </div>
          ))
        ) : (
          <div className="px-3 py-2 text-xs text-gray-400 italic">
            No attributes
          </div>
        )}
      </div>
    </div>
  );
};
