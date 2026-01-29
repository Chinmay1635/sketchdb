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

  const tableName =
    typeof selectedTable?.data.label === 'string'
      ? selectedTable.data.label
      : `Table ${selectedTableId}`;

  return (
    <div
      className="absolute top-20 sm:top-[150px] left-1/2 -translate-x-1/2 z-[100] p-4 sm:p-6 w-[calc(100%-2rem)] sm:w-auto sm:min-w-[340px] max-w-[90vw]"
      style={{
        backgroundColor: 'rgba(13, 13, 20, 0.95)',
        border: '1px solid rgba(255, 51, 102, 0.5)',
        boxShadow: '0 0 30px rgba(255, 51, 102, 0.2), 0 0 60px rgba(0, 0, 0, 0.5)',
        backdropFilter: 'blur(10px)'
      }}
    >
      {/* Top accent line */}
      <div 
        className="absolute top-0 left-0 right-0 h-[2px]"
        style={{ background: 'linear-gradient(90deg, transparent, #ff3366, transparent)' }}
      />
      
      <h3 
        className="mt-0 font-semibold text-base sm:text-lg uppercase tracking-wider"
        style={{ 
          color: '#ff3366',
          fontFamily: "'Orbitron', sans-serif"
        }}
      >
        Delete Table
      </h3>
      <p 
        className="text-sm sm:text-base mt-2"
        style={{ 
          color: '#c0c0d0',
          fontFamily: "'JetBrains Mono', monospace"
        }}
      >
        Are you sure you want to delete "{tableName}"?
      </p>
      <p 
        className="text-xs sm:text-sm mt-1"
        style={{ 
          color: '#8a8a9a',
          fontFamily: "'JetBrains Mono', monospace"
        }}
      >
        // Warning: This action cannot be undone
      </p>
      <div className="flex justify-between gap-3 mt-5">
        <button
          onClick={onConfirm}
          className="cursor-pointer flex-1 sm:flex-none px-5 py-2.5 font-bold text-xs uppercase tracking-wider transition-all duration-300"
          style={{ 
            background: 'linear-gradient(135deg, #ff3366, #ff0044)',
            color: '#0a0a0f',
            fontFamily: "'JetBrains Mono', monospace",
            boxShadow: '0 0 20px rgba(255, 51, 102, 0.3)'
          }}
        >
          Delete
        </button>
        <button
          onClick={onCancel}
          className="cursor-pointer flex-1 sm:flex-none px-5 py-2.5 font-bold text-xs uppercase tracking-wider transition-all duration-300"
          style={{ 
            backgroundColor: 'rgba(42, 42, 58, 0.8)',
            color: '#c0c0d0',
            border: '1px solid rgba(42, 42, 58, 0.8)',
            fontFamily: "'JetBrains Mono', monospace"
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
};
