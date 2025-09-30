import React from "react";

interface ToolbarProps {
  onAddTable: () => void;
  onExportSQL: () => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({ onAddTable, onExportSQL }) => {
  return (
    <div className="absolute top-4 left-4 flex space-x-4 z-10">
      <button
        onClick={onAddTable}
        className="cursor-pointer w-[250px] h-[75px] bg-yellow-400 hover:bg-yellow-500 rounded-md font-bold"
      >
        Add Table
      </button>
      <button
        onClick={onExportSQL}
        className="cursor-pointer w-[250px] h-[75px] bg-[#0074D9] hover:bg-blue-600 text-white rounded-md font-bold"
      >
        Export to SQL
      </button>
    </div>
  );
};
