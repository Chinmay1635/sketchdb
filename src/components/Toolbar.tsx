import React, { useState, useEffect } from "react";
import { useStorage } from "../context/storage-context";
import { CreateDiagramDialog } from "./CreateDiagramDialog";
import { OpenDiagramDialog } from "./OpenDiagramDialog";

interface ToolbarProps {
  onAddTable: () => void;
  onExportSQL: () => void;
  onImportSchema: () => void;
  onExportPNG: () => void;
  onExportPDF: () => void;
  onExportSQLFile: () => void;
  onImportSQLFile: (sqlText: string) => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({ 
  onAddTable, 
  onExportSQL, 
  onImportSchema,
  onExportPNG,
  onExportPDF 
  ,onExportSQLFile
  ,onImportSQLFile
}) => {
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = typeof reader.result === 'string' ? reader.result : '';
      onImportSQLFile(text);
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.onerror = () => {
      console.error('Failed to read SQL file');
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };
  return (
    <div className="absolute top-4 left-4 flex space-x-4 z-10">
      <button
        onClick={onAddTable}
        className="cursor-pointer w-[200px] h-[75px] bg-yellow-400 hover:bg-yellow-500 rounded-md font-bold"
      >
        Add Table
      </button>
      <button
        onClick={onImportSchema}
        className="cursor-pointer w-[200px] h-[75px] bg-green-500 hover:bg-green-600 text-white rounded-md font-bold"
      >
        Import Schema
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept=".sql,text/sql"
        className="hidden"
        onChange={handleFileChange}
        title="Upload SQL file"
        aria-label="Upload SQL file"
      />
      <button
        onClick={() => fileInputRef.current?.click()}
        className="cursor-pointer w-[200px] h-[75px] bg-indigo-500 hover:bg-indigo-600 text-white rounded-md font-bold"
        title="Import schema from .sql file"
      >
        Import SQL File
      </button>
      <button
        onClick={onExportSQL}
        className="cursor-pointer w-[200px] h-[75px] bg-[#0074D9] hover:bg-blue-600 text-white rounded-md font-bold"
      >
        Export to SQL
      </button>
      <button
        onClick={onExportSQLFile}
        className="cursor-pointer w-[200px] h-[75px] bg-teal-600 hover:bg-teal-700 text-white rounded-md font-bold"
        title="Download generated SQL as .sql file"
      >
        Download SQL
      </button>
      <button
        onClick={onExportPNG}
        className="cursor-pointer w-[200px] h-[75px] bg-purple-500 hover:bg-purple-600 text-white rounded-md font-bold"
      >
        Export as PNG
      </button>
      <button
        onClick={onExportPDF}
        className="cursor-pointer w-[200px] h-[75px] bg-red-500 hover:bg-red-600 text-white rounded-md font-bold"
      >
        Export as PDF
      </button>
    </div>
  );
};
