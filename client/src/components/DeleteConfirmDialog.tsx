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
      className="
        absolute top-20 sm:top-[150px] left-1/2 -translate-x-1/2 
        z-[100] bg-slate-800 border-2 border-rose-500/50 
        rounded-lg shadow-xl p-4 sm:p-6 w-[calc(100%-2rem)] sm:w-auto sm:min-w-[300px] max-w-[90vw]
      "
    >
      <h3 className="mt-0 text-rose-400 font-semibold text-base sm:text-lg">Delete Table</h3>
      <p className="text-slate-200 text-sm sm:text-base">Are you sure you want to delete "{tableName}"?</p>
      <p className="text-xs sm:text-sm text-slate-400">This action cannot be undone.</p>
      <div className="flex justify-between gap-3 mt-4">
        <button
          onClick={onConfirm}
          className="cursor-pointer flex-1 sm:flex-none bg-rose-600 text-white px-4 py-2 rounded-md hover:bg-rose-500 transition-colors text-sm"
        >
          Delete
        </button>
        <button
          onClick={onCancel}
          className="cursor-pointer flex-1 sm:flex-none bg-slate-600 text-white px-4 py-2 rounded-md hover:bg-slate-500 transition-colors text-sm"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};
