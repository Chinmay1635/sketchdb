import React from 'react';
import { Node } from '@xyflow/react';

interface DeleteConfirmDialogProps {
  isOpen: boolean;
  selectedTable: Node | undefined;
  selectedTableId: string | null;
  onConfirm: () => void;
  onCancel: () => void;
}

export const DeleteConfirmDialog: React.FC<DeleteConfirmDialogProps> = ({
  isOpen,
  selectedTable,
  selectedTableId,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  const tableName = typeof selectedTable?.data.label === 'string' 
    ? selectedTable.data.label 
    : `Table ${selectedTableId}`;

  return (
    <div style={{ 
      position: 'absolute', 
      top: 150, 
      left: '50%', 
      transform: 'translateX(-50%)', 
      zIndex: 100, 
      background: 'white', 
      border: '2px solid #ff4444', 
      borderRadius: 8, 
      boxShadow: '0 2px 16px rgba(0,0,0,0.15)', 
      padding: 24, 
      minWidth: 300 
    }}>
      <h3 style={{ marginTop: 0, color: '#ff4444' }}>Delete Table</h3>
      <p>Are you sure you want to delete "{tableName}"?</p>
      <p style={{ fontSize: 14, color: '#666' }}>This action cannot be undone.</p>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <button 
          onClick={onConfirm} 
          style={{ 
            background: '#ff4444', 
            color: 'white', 
            padding: '8px 16px', 
            borderRadius: 4, 
            border: 'none' 
          }}
        >
          Delete
        </button>
        <button 
          onClick={onCancel} 
          style={{ 
            background: '#aaa', 
            color: 'white', 
            padding: '8px 16px', 
            borderRadius: 4, 
            border: 'none' 
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
};