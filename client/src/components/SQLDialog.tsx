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
        z-[100] bg-gray-800 border-2 border-blue-500
        rounded-lg shadow-lg p-6 min-w-[600px]
      "
    >
      <h2 className="mt-0 text-lg font-semibold text-gray-100">Exported SQL</h2>

      <textarea
        value={sqlText}
        readOnly
        aria-label="Generated SQL code"
        title="Generated SQL code for the database schema"
        className="
          mt-5 w-full min-h-[200px] max-h-[500px] font-mono text-sm
          border border-gray-600 rounded-md bg-gray-700 text-gray-100
          p-2 mb-4 resize-none
        "
      />

      <div className="flex justify-between">
        <button
          onClick={onCopy}
          className="cursor-pointer
            bg-blue-600 text-white px-4 py-2
            rounded-md hover:bg-blue-700
          "
        >
          Copy
        </button>
        <button
          onClick={onClose}
          className="cursor-pointer
            bg-gray-600 text-white px-4 py-2
            rounded-md hover:bg-gray-700
          "
        >
          Close
        </button>
      </div>
    </div>
  );
};
