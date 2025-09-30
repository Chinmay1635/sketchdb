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
        absolute top-[100px] left-1/2 -translate-x-1/2
        z-[100] bg-white border-2 border-[#0074D9]
        rounded-lg shadow-lg p-6 min-w-[400px]
      "
    >
      <h2 className="mt-0 text-lg font-semibold">Exported SQL</h2>

      <textarea
        value={sqlText}
        readOnly
        className="
          w-full h-[200px] font-mono text-sm
          border border-gray-300 rounded-md
          p-2 mb-4 resize-none
        "
      />

      <div className="flex justify-between">
        <button
          onClick={onCopy}
          className="cursor-pointer
            bg-[#0074D9] text-white px-4 py-2
            rounded-md hover:bg-blue-600
          "
        >
          Copy
        </button>
        <button
          onClick={onClose}
          className="cursor-pointer
            bg-gray-400 text-white px-4 py-2
            rounded-md hover:bg-gray-500
          "
        >
          Close
        </button>
      </div>
    </div>
  );
};
