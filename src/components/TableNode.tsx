import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { TableAttribute } from '../types';

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
    <div style={{
      background: 'white',
      border: '2px solid #0074D9',
      borderRadius: 8,
      minWidth: 200,
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      position: 'relative'
    }}>
      {/* Table Header */}
      <div style={{
        background: '#0074D9',
        color: 'white',
        padding: '8px 12px',
        borderRadius: '6px 6px 0 0',
        fontWeight: 'bold',
        textAlign: 'center'
      }}>
        {typeof data.label === 'string' ? data.label : `Table ${id}`}
      </div>
      
      {/* Attributes List */}
      <div style={{ padding: '8px 0' }}>
        {attributes.length > 0 ? (
          attributes.map((attr, idx) => (
            <div key={idx} style={{
              padding: '4px 12px',
              borderBottom: idx < attributes.length - 1 ? '1px solid #eee' : 'none',
              fontSize: 12,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              position: 'relative',
              minHeight: 24
            }}>
              {/* Left handle for incoming connections */}
              <Handle
                type="target"
                position={Position.Left}
                id={`${id}-${attr.name}-target`}
                style={{
                  background: attr.type === 'FK' ? '#FF6B6B' : '#0074D9',
                  width: 8,
                  height: 8,
                  left: -4,
                  top: '50%',
                  transform: 'translateY(-50%)'
                }}
              />
              
              {/* Right handle for outgoing connections */}
              <Handle
                type="source"
                position={Position.Right}
                id={`${id}-${attr.name}-source`}
                style={{
                  background: attr.type === 'PK' ? '#FFD700' : '#0074D9',
                  width: 8,
                  height: 8,
                  right: -4,
                  top: '50%',
                  transform: 'translateY(-50%)'
                }}
              />
              
              <span style={{ fontWeight: attr.type === 'PK' ? 'bold' : 'normal' }}>
                {attr.name}
                {attr.type === 'PK' && <span style={{ color: '#FFD700', marginLeft: 4 }}>🔑</span>}
                {attr.type === 'FK' && <span style={{ color: '#FF6B6B', marginLeft: 4 }}>🔗</span>}
              </span>
              <span style={{ color: '#666', fontSize: 10 }}>
                {attr.dataType || 'VARCHAR(255)'}
              </span>
            </div>
          ))
        ) : (
          <div style={{ padding: '8px 12px', fontSize: 12, color: '#999', fontStyle: 'italic' }}>
            No attributes
          </div>
        )}
      </div>
    </div>
  );
};