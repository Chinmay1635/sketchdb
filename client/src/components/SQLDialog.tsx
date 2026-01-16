import React from 'react';

interface SQLDialogProps {
  isOpen: boolean;
  sqlText: string;
  onClose: () => void;
  onCopy: () => void;
}

export const SQLDialog: React.FC<SQLDialogProps> = ({
  isOpen,
  sqlText,
  onClose,
  onCopy,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="
        absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
        z-[100] bg-slate-800 border-2 border-indigo-500/50
        rounded-lg shadow-xl p-4 sm:p-6 w-[calc(100%-2rem)] sm:w-auto sm:min-w-[500px] lg:min-w-[600px] max-w-[90vw]
      "
    >
      <h2 className="mt-0 text-base sm:text-lg font-semibold text-slate-100">Exported SQL</h2>

      <textarea
        value={sqlText}
        readOnly
        aria-label="Generated SQL code"
        title="Generated SQL code for the database schema"
        className="
          mt-4 sm:mt-5 w-full min-h-[150px] sm:min-h-[200px] max-h-[60vh] font-mono text-xs sm:text-sm
          border border-slate-600 rounded-md bg-slate-700 text-slate-100
          p-2 mb-4 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500
        "
      />

      <div className="flex justify-between gap-3">
        <button
          onClick={onCopy}
          className="cursor-pointer flex-1 sm:flex-none
            bg-indigo-600 text-white px-4 py-2
            rounded-md hover:bg-indigo-500 transition-colors text-sm
          "
        >
          Copy
        </button>
        <button
          onClick={onClose}
          className="cursor-pointer flex-1 sm:flex-none
            bg-slate-600 text-white px-4 py-2
            rounded-md hover:bg-slate-500 transition-colors text-sm
          "
        >
          Close
        </button>
      </div>
    </div>
  );
};
