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
      className="absolute top-20 sm:top-[150px] left-1/2 -translate-x-1/2 z-[100] p-4 sm:p-6 w-[calc(100%-2rem)] sm:w-auto sm:min-w-[340px] max-w-[90vw] rounded-xl"
      style={{
        backgroundColor: 'rgba(17, 17, 20, 0.95)',
        border: '1px solid rgba(220, 38, 38, 0.4)',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        backdropFilter: 'blur(12px)'
      }}
    >
      {/* Top accent line */}
      <div 
        className="absolute top-0 left-0 right-0 h-[2px] rounded-t-xl"
        style={{ background: 'linear-gradient(90deg, transparent, #dc2626, transparent)' }}
      />
      
      <h3 
        className="mt-0 font-semibold text-base sm:text-lg uppercase tracking-wider"
        style={{ 
          color: '#dc2626',
          fontFamily: "'Space Grotesk', sans-serif"
        }}
      >
        Delete Table
      </h3>
      <p 
        className="text-sm sm:text-base mt-2"
        style={{ 
          color: '#a1a1aa',
          fontFamily: "'JetBrains Mono', monospace"
        }}
      >
        Are you sure you want to delete "{tableName}"?
      </p>
      <p 
        className="text-xs sm:text-sm mt-1"
        style={{ 
          color: '#71717a',
          fontFamily: "'JetBrains Mono', monospace"
        }}
      >
        // Warning: This action cannot be undone
      </p>
      <div className="flex justify-between gap-3 mt-5">
        <button
          onClick={onConfirm}
          className="cursor-pointer flex-1 sm:flex-none px-5 py-2.5 font-bold text-xs uppercase tracking-wider transition-all duration-300 rounded-lg"
          style={{ 
            background: '#dc2626',
            color: '#ffffff',
            fontFamily: "'JetBrains Mono', monospace",
            boxShadow: '0 4px 12px rgba(220, 38, 38, 0.25)'
          }}
        >
          Delete
        </button>
        <button
          onClick={onCancel}
          className="cursor-pointer flex-1 sm:flex-none px-5 py-2.5 font-bold text-xs uppercase tracking-wider transition-all duration-300 rounded-lg"
          style={{ 
            backgroundColor: 'transparent',
            color: '#a1a1aa',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            fontFamily: "'JetBrains Mono', monospace"
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
};
