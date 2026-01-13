import React from "react";
import { Handle, Position } from "@xyflow/react";
import { TableAttribute } from "../types";
import { getLighterColor, getDarkerColor, isLightColor } from "../utils/colorUtils";

interface TableNodeProps {
  data: {
    label: string;
    attributes: TableAttribute[];
    color?: string;
  };
  id: string;
}

export const TableNode: React.FC<TableNodeProps> = ({ data, id }) => {
  const attributes = Array.isArray(data.attributes) ? data.attributes : [];
  const tableColor = data.color || '#0074D9'; // Default blue color
  const lightBackground = getLighterColor(tableColor, 0.05);
  const darkerBorder = getDarkerColor(tableColor);
  const textColor = isLightColor(tableColor) ? '#000000' : '#FFFFFF';

  return (
    <div 
      className="border-2 rounded-lg min-w-[200px] shadow-md relative"
      style={{
        backgroundColor: 'white',
        borderColor: tableColor,
        boxShadow: `0 4px 6px -1px ${getLighterColor(tableColor, 0.3)}`
      }}
    >
      {/* Table Header */}
      <div 
        className="text-white px-3 py-2 rounded-t-lg font-bold text-center"
        style={{
          backgroundColor: tableColor,
          color: textColor
        }}
      >
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
              style={{
                backgroundColor: idx % 2 === 0 ? lightBackground : 'transparent'
              }}
            >
              {/* Left handle (incoming connections) */}
              <Handle
                type="target"
                position={Position.Left}
                id={`${id}-${attr.name}-target`}
                style={{
                  width: 8,
                  height: 8,
                  backgroundColor: attr.type === "FK" ? "#FF6B6B" : tableColor,
                  position: 'absolute',
                  left: -4,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  borderRadius: '50%',
                  border: '1px solid white'
                }}
              />

              {/* Right handle (outgoing connections) */}
              <Handle
                type="source"
                position={Position.Right}
                id={`${id}-${attr.name}-source`}
                style={{
                  width: 8,
                  height: 8,
                  backgroundColor: attr.type === "PK" ? "#FFD700" : tableColor,
                  position: 'absolute',
                  right: -4,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  borderRadius: '50%',
                  border: '1px solid white'
                }}
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
