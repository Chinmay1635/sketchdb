import React from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";
import { TableAttribute } from "../types";
import { isLightColor } from "../utils/colorUtils";

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
  const nodeData = data as unknown as TableNodeData;
  const attributes = Array.isArray(nodeData.attributes) ? nodeData.attributes : [];
  const tableColor = nodeData.color || '#14b8a6';
  
  const selectedBy = nodeData.selectedBy || [];
  const hasCollaboratorSelection = selectedBy.length > 0;
  const selectionBorderColor = hasCollaboratorSelection ? selectedBy[0].color : tableColor;

  return (
    <div 
      className="relative min-w-[180px] sm:min-w-[240px]"
      style={{ transition: 'all 0.2s ease' }}
    >
      {/* Collaborator selection indicator */}
      {hasCollaboratorSelection && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 flex -space-x-1 z-20">
          {selectedBy.slice(0, 3).map((collab, index) => (
            <div
              key={collab.odUserId}
              className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-semibold border-2"
              style={{ 
                backgroundColor: collab.color,
                borderColor: '#1a1a2e',
                color: isLightColor(collab.color) ? '#0a0a0f' : '#ffffff',
                zIndex: selectedBy.length - index,
              }}
              title={`Selected by ${collab.username}`}
            >
              {collab.username.slice(0, 1).toUpperCase()}
            </div>
          ))}
        </div>
      )}

      {/* Editing tooltip */}
      {hasCollaboratorSelection && (
        <div 
          className="absolute -top-8 left-1/2 transform -translate-x-1/2 px-2 py-0.5 rounded text-[9px] whitespace-nowrap z-20"
          style={{ 
            backgroundColor: selectionBorderColor,
            color: isLightColor(selectionBorderColor) ? '#0a0a0f' : '#ffffff',
          }}
        >
          {selectedBy.length === 1 ? `${selectedBy[0].username} viewing` : `${selectedBy.length} users`}
        </div>
      )}
      
      {/* Main card */}
      <div 
        className="relative rounded-md overflow-hidden"
        style={{
          backgroundColor: '#1a1a2e',
          border: selected 
            ? `1.5px solid ${tableColor}` 
            : hasCollaboratorSelection 
              ? `1.5px solid ${selectionBorderColor}` 
              : '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: selected 
            ? `0 2px 12px rgba(0,0,0,0.4)` 
            : '0 1px 4px rgba(0,0,0,0.3)',
        }}
      >
        {/* Colored top bar - thin accent stripe */}
        <div style={{ height: '3px', backgroundColor: tableColor }} />

        {/* Table Header */}
        <div 
          className="px-3 py-2 flex items-center gap-2"
          style={{
            borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
            backgroundColor: 'rgba(255, 255, 255, 0.02)',
          }}
        >
          {/* Table icon */}
          <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke={tableColor} viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M3 14h18M3 6h18M3 18h18" />
          </svg>
          <span 
            className="text-sm font-semibold truncate"
            style={{ color: '#e2e8f0' }}
          >
            {typeof nodeData.label === "string" ? nodeData.label : `Table ${id}`}
          </span>
        </div>

        {/* Attributes List */}
        <div className="py-0.5">
          {attributes.length > 0 ? (
            attributes.map((attr, idx) => (
              <div
                key={idx}
                className="px-3 py-1.5 text-xs flex items-center justify-between relative"
                style={{
                  borderBottom: idx < attributes.length - 1 ? '1px solid rgba(255, 255, 255, 0.04)' : 'none',
                }}
              >
                {/* Left handle */}
                <Handle
                  type="target"
                  position={Position.Left}
                  id={`${id}-${attr.name}-target`}
                  style={{
                    width: 8,
                    height: 8,
                    backgroundColor: attr.type === "FK" ? tableColor : '#1a1a2e',
                    position: 'absolute',
                    left: -4,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    borderRadius: '50%',
                    border: `1.5px solid ${attr.type === "FK" ? tableColor : 'rgba(255,255,255,0.15)'}`,
                  }}
                />

                {/* Right handle */}
                <Handle
                  type="source"
                  position={Position.Right}
                  id={`${id}-${attr.name}-source`}
                  style={{
                    width: 8,
                    height: 8,
                    backgroundColor: attr.type === "PK" ? tableColor : '#1a1a2e',
                    position: 'absolute',
                    right: -4,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    borderRadius: '50%',
                    border: `1.5px solid ${attr.type === "PK" ? tableColor : 'rgba(255,255,255,0.15)'}`,
                  }}
                />

                {/* Field name + key icon */}
                <div className="flex items-center gap-1.5 min-w-0 flex-1">
                  <span 
                    className="truncate"
                    style={{ 
                      color: attr.type === "PK" ? '#e2e8f0' : attr.type === "FK" ? tableColor : '#94a3b8',
                      fontWeight: attr.type === "PK" ? 600 : 400,
                    }}
                  >
                    {attr.name}
                  </span>
                  {attr.type === "PK" && (
                    <svg className="w-3 h-3 flex-shrink-0" viewBox="0 0 24 24" fill={tableColor} stroke="none">
                      <path d="M12.65 10A5.99 5.99 0 007 6c-3.31 0-6 2.69-6 6s2.69 6 6 6a5.99 5.99 0 005.65-4H17v4h4v-4h2v-4H12.65zM7 14c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"/>
                    </svg>
                  )}
                  {attr.type === "FK" && (
                    <svg className="w-3 h-3 flex-shrink-0" viewBox="0 0 24 24" fill={tableColor} stroke="none">
                      <path d="M12.65 10A5.99 5.99 0 007 6c-3.31 0-6 2.69-6 6s2.69 6 6 6a5.99 5.99 0 005.65-4H17v4h4v-4h2v-4H12.65zM7 14c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"/>
                    </svg>
                  )}
                </div>

                {/* Data type */}
                <span 
                  className="text-[10px] ml-2 flex-shrink-0"
                  style={{ color: '#64748b' }}
                >
                  {attr.dataType || "varchar"}
                  {!attr.isNotNull && <span style={{ color: '#475569' }}>?</span>}
                </span>
              </div>
            ))
          ) : (
            <div 
              className="px-3 py-3 text-xs text-center"
              style={{ color: '#475569' }}
            >
              No fields defined
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
