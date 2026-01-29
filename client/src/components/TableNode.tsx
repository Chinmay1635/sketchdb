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

// Neon color palette for table headers
const neonColors: Record<string, { glow: string; text: string }> = {
  '#0074D9': { glow: '0 0 20px rgba(0, 116, 217, 0.6)', text: '#ffffff' },
  '#00ffff': { glow: '0 0 20px rgba(0, 255, 255, 0.6)', text: '#0a0a0f' },
  '#ff00ff': { glow: '0 0 20px rgba(255, 0, 255, 0.6)', text: '#ffffff' },
  '#00ff88': { glow: '0 0 20px rgba(0, 255, 136, 0.6)', text: '#0a0a0f' },
  '#ff8800': { glow: '0 0 20px rgba(255, 136, 0, 0.6)', text: '#0a0a0f' },
  '#ff3366': { glow: '0 0 20px rgba(255, 51, 102, 0.6)', text: '#ffffff' },
  '#8855ff': { glow: '0 0 20px rgba(136, 85, 255, 0.6)', text: '#ffffff' },
};

const getGlowForColor = (color: string) => {
  if (neonColors[color.toLowerCase()]) {
    return neonColors[color.toLowerCase()];
  }
  // Default glow based on the color
  return {
    glow: `0 0 20px ${color}99`,
    text: isLightColor(color) ? '#0a0a0f' : '#ffffff'
  };
};

export const TableNode: React.FC<NodeProps> = ({ data, id, selected }) => {
  // Cast data to our expected type (ReactFlow passes data as Record<string, unknown>)
  const nodeData = data as unknown as TableNodeData;
  const attributes = Array.isArray(nodeData.attributes) ? nodeData.attributes : [];
  const tableColor = nodeData.color || '#00ffff'; // Default cyan (neon) color
  const colorConfig = getGlowForColor(tableColor);
  
  // Get collaborators who selected this node
  const selectedBy = nodeData.selectedBy || [];
  const hasCollaboratorSelection = selectedBy.length > 0;
  
  // Use the first collaborator's color for the selection border, or combine multiple
  const selectionBorderColor = hasCollaboratorSelection 
    ? selectedBy[0].color 
    : tableColor;

  return (
    <div 
      className="relative min-w-[160px] sm:min-w-[220px] group"
      style={{
        filter: selected ? 'brightness(1.1)' : 'brightness(1)',
        transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
      }}
    >
      {/* Outer glow effect */}
      <div 
        className="absolute -inset-1 rounded-lg opacity-60 blur-sm transition-opacity duration-300"
        style={{
          background: hasCollaboratorSelection 
            ? `linear-gradient(135deg, ${selectionBorderColor}, ${tableColor})`
            : tableColor,
          opacity: hasCollaboratorSelection || selected ? 0.6 : 0.3,
        }}
      />
      
      {/* Main card */}
      <div 
        className="relative rounded-lg overflow-hidden"
        style={{
          backgroundColor: '#0d0d14',
          border: `1px solid ${hasCollaboratorSelection ? selectionBorderColor : tableColor}`,
          boxShadow: hasCollaboratorSelection 
            ? `0 0 30px ${selectionBorderColor}50, inset 0 1px 0 ${selectionBorderColor}20`
            : `0 0 20px ${tableColor}30, inset 0 1px 0 ${tableColor}20`,
        }}
      >
        {/* Scan line effect */}
        <div 
          className="absolute inset-0 pointer-events-none opacity-10"
          style={{
            background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.03) 2px, rgba(255,255,255,0.03) 4px)'
          }}
        />
        
        {/* Collaborator selection indicator badges */}
        {hasCollaboratorSelection && (
          <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 flex -space-x-1 z-20">
            {selectedBy.slice(0, 3).map((collab, index) => (
              <div
                key={collab.odUserId}
                className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border-2 shadow-lg"
                style={{ 
                  backgroundColor: collab.color,
                  borderColor: '#0d0d14',
                  color: isLightColor(collab.color) ? '#0a0a0f' : '#ffffff',
                  zIndex: selectedBy.length - index,
                  boxShadow: `0 0 10px ${collab.color}80`
                }}
                title={`Selected by ${collab.username}`}
              >
                {collab.username.slice(0, 1).toUpperCase()}
              </div>
            ))}
            {selectedBy.length > 3 && (
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border-2 shadow-lg"
                style={{ 
                  backgroundColor: '#2a2a3a',
                  borderColor: '#0d0d14',
                  color: '#c0c0d0'
                }}
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
            className="absolute -top-9 left-1/2 transform -translate-x-1/2 px-3 py-1 rounded text-[10px] font-mono uppercase tracking-wider whitespace-nowrap shadow-lg z-20"
            style={{ 
              backgroundColor: selectionBorderColor,
              color: isLightColor(selectionBorderColor) ? '#0a0a0f' : '#ffffff',
              boxShadow: `0 0 15px ${selectionBorderColor}60`
            }}
          >
            {selectedBy.length === 1 
              ? `${selectedBy[0].username} viewing`
              : `${selectedBy.length} users`
            }
          </div>
        )}

        {/* Table Header */}
        <div 
          className="relative px-4 py-2.5 font-bold text-center overflow-hidden"
          style={{
            background: `linear-gradient(135deg, ${tableColor}, ${getDarkerColor(tableColor)})`,
            color: colorConfig.text,
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '0.8rem',
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            textShadow: colorConfig.text === '#ffffff' ? '0 1px 2px rgba(0,0,0,0.3)' : 'none'
          }}
        >
          {/* Header shine effect */}
          <div 
            className="absolute inset-0 opacity-20"
            style={{
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3) 50%, transparent)'
            }}
          />
          <span className="relative">
            {typeof nodeData.label === "string" ? nodeData.label : `Table ${id}`}
          </span>
        </div>

        {/* Attributes List */}
        <div className="py-1">
          {attributes.length > 0 ? (
            attributes.map((attr, idx) => (
              <div
                key={idx}
                className="px-3 py-1.5 text-xs flex justify-between items-center relative group/attr"
                style={{
                  backgroundColor: idx % 2 === 0 ? 'rgba(42, 42, 58, 0.3)' : 'transparent',
                  borderBottom: idx < attributes.length - 1 ? '1px solid rgba(42, 42, 58, 0.5)' : 'none',
                  fontFamily: "'JetBrains Mono', monospace",
                }}
              >
                {/* Left handle (incoming connections) */}
                <Handle
                  type="target"
                  position={Position.Left}
                  id={`${id}-${attr.name}-target`}
                  className="transition-all duration-200"
                  style={{
                    width: 10,
                    height: 10,
                    backgroundColor: attr.type === "FK" ? "#ff3366" : "#121218",
                    position: 'absolute',
                    left: -5,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    borderRadius: '2px',
                    border: `2px solid ${attr.type === "FK" ? "#ff3366" : tableColor}`,
                    boxShadow: attr.type === "FK" ? '0 0 8px rgba(255, 51, 102, 0.5)' : `0 0 8px ${tableColor}50`
                  }}
                />

                {/* Right handle (outgoing connections) */}
                <Handle
                  type="source"
                  position={Position.Right}
                  id={`${id}-${attr.name}-source`}
                  className="transition-all duration-200"
                  style={{
                    width: 10,
                    height: 10,
                    backgroundColor: attr.type === "PK" ? "#ffff00" : "#121218",
                    position: 'absolute',
                    right: -5,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    borderRadius: '2px',
                    border: `2px solid ${attr.type === "PK" ? "#ffff00" : tableColor}`,
                    boxShadow: attr.type === "PK" ? '0 0 8px rgba(255, 255, 0, 0.5)' : `0 0 8px ${tableColor}50`
                  }}
                />

                <span 
                  className="flex items-center gap-1.5"
                  style={{ 
                    color: attr.type === "PK" ? "#ffff00" : attr.type === "FK" ? "#ff3366" : "#c0c0d0",
                    fontWeight: attr.type === "PK" ? 600 : 400,
                    textShadow: attr.type === "PK" ? '0 0 8px rgba(255, 255, 0, 0.4)' : 
                               attr.type === "FK" ? '0 0 8px rgba(255, 51, 102, 0.4)' : 'none'
                  }}
                >
                  {attr.name}
                  {attr.type === "PK" && (
                    <span 
                      className="px-1 py-0.5 text-[8px] font-bold rounded"
                      style={{ 
                        backgroundColor: 'rgba(255, 255, 0, 0.15)',
                        color: '#ffff00',
                        border: '1px solid rgba(255, 255, 0, 0.3)'
                      }}
                    >
                      PK
                    </span>
                  )}
                  {attr.type === "FK" && (
                    <span 
                      className="px-1 py-0.5 text-[8px] font-bold rounded"
                      style={{ 
                        backgroundColor: 'rgba(255, 51, 102, 0.15)',
                        color: '#ff3366',
                        border: '1px solid rgba(255, 51, 102, 0.3)'
                      }}
                    >
                      FK
                    </span>
                  )}
                </span>

                <span 
                  className="text-[10px]"
                  style={{ 
                    color: '#6a6a7a',
                    fontFamily: "'JetBrains Mono', monospace"
                  }}
                >
                  {attr.dataType || "VARCHAR"}
                </span>
              </div>
            ))
          ) : (
            <div 
              className="px-3 py-3 text-xs italic text-center"
              style={{ 
                color: '#4a4a5a',
                fontFamily: "'JetBrains Mono', monospace"
              }}
            >
              // No attributes defined
            </div>
          )}
        </div>
        
        {/* Bottom accent line */}
        <div 
          className="h-0.5"
          style={{
            background: `linear-gradient(90deg, transparent, ${tableColor}, transparent)`
          }}
        />
      </div>
    </div>
  );
};
