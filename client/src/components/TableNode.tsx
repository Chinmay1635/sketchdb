import React from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";
import { TableAttribute } from "../types";
import { getLighterColor, getDarkerColor, isLightColor } from "../utils/colorUtils";

// Interface for collaborator selection info passed to the node
export interface CollaboratorSelection {
  odUserId: string;
  username: string;
  color: string;
}

// Custom data type for TableNode
interface TableNodeData {
  label: string;
  attributes: TableAttribute[];
  color?: string;
  selectedBy?: CollaboratorSelection[]; // Collaborators who have selected this node
}

export const TableNode: React.FC<NodeProps> = ({ data, id, selected }) => {
  // Cast data to our expected type (ReactFlow passes data as Record<string, unknown>)
  const nodeData = data as unknown as TableNodeData;
  const attributes = Array.isArray(nodeData.attributes) ? nodeData.attributes : [];
  const tableColor = nodeData.color || '#0074D9'; // Default blue color
  const lightBackground = getLighterColor(tableColor, 0.05);
  const darkerBorder = getDarkerColor(tableColor);
  const textColor = isLightColor(tableColor) ? '#000000' : '#FFFFFF';
  
  // Get collaborators who selected this node
  const selectedBy = nodeData.selectedBy || [];
  const hasCollaboratorSelection = selectedBy.length > 0;
  
  // Use the first collaborator's color for the selection border, or combine multiple
  const selectionBorderColor = hasCollaboratorSelection 
    ? selectedBy[0].color 
    : tableColor;

  return (
    <div 
      className="border-2 rounded-lg min-w-[160px] sm:min-w-[200px] shadow-md relative"
      style={{
        backgroundColor: '#1e293b',
        borderColor: hasCollaboratorSelection ? selectionBorderColor : tableColor,
        borderWidth: hasCollaboratorSelection ? '3px' : '2px',
        boxShadow: hasCollaboratorSelection 
          ? `0 0 0 2px ${selectionBorderColor}40, 0 4px 12px -1px ${selectionBorderColor}60`
          : `0 4px 6px -1px ${getLighterColor(tableColor, 0.3)}`,
        transition: 'border-color 0.2s ease, box-shadow 0.2s ease'
      }}
    >
      {/* Collaborator selection indicator badges */}
      {hasCollaboratorSelection && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 flex -space-x-1 z-10">
          {selectedBy.slice(0, 3).map((collab, index) => (
            <div
              key={collab.odUserId}
              className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white border-2 border-slate-800 shadow-sm"
              style={{ 
                backgroundColor: collab.color,
                zIndex: selectedBy.length - index
              }}
              title={`Selected by ${collab.username}`}
            >
              {collab.username.slice(0, 1).toUpperCase()}
            </div>
          ))}
          {selectedBy.length > 3 && (
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white bg-slate-600 border-2 border-slate-800 shadow-sm"
              title={`+${selectedBy.length - 3} more`}
            >
              +{selectedBy.length - 3}
            </div>
          )}
        </div>
      )}

      {/* "Editing" tooltip when collaborator has selection */}
      {hasCollaboratorSelection && (
        <div 
          className="absolute -top-8 left-1/2 transform -translate-x-1/2 px-2 py-0.5 rounded text-[10px] text-white whitespace-nowrap shadow-lg z-20"
          style={{ backgroundColor: selectionBorderColor }}
        >
          {selectedBy.length === 1 
            ? `${selectedBy[0].username} is viewing`
            : `${selectedBy.length} users viewing`
          }
        </div>
      )}

      {/* Table Header */}
      <div 
        className="text-white px-3 py-2 rounded-t-lg font-bold text-center"
        style={{
          backgroundColor: tableColor,
          color: textColor
        }}
      >
        {typeof nodeData.label === "string" ? nodeData.label : `Table ${id}`}
      </div>

      {/* Attributes List */}
      <div className="py-1.5 sm:py-2">
        {attributes.length > 0 ? (
          attributes.map((attr, idx) => (
            <div
              key={idx}
              className={`px-2 sm:px-3 py-0.5 sm:py-1 text-[10px] sm:text-xs flex justify-between items-center relative min-h-[20px] sm:min-h-[24px] text-slate-200 ${
                idx < attributes.length - 1 ? "border-b border-slate-700" : ""
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

              <span className="text-slate-400 text-[8px] sm:text-[10px]">
                {attr.dataType || "VARCHAR(255)"}
              </span>
            </div>
          ))
        ) : (
          <div className="px-2 sm:px-3 py-1.5 sm:py-2 text-[10px] sm:text-xs text-slate-500 italic">
            No attributes
          </div>
        )}
      </div>
    </div>
  );
};
