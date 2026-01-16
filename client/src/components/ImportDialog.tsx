import React, { useState } from 'react';

interface ImportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (sqlText: string) => void;
  onError: (error: any) => void;
}

export const ImportDialog: React.FC<ImportDialogProps> = ({
  isOpen,
  onClose,
  onImport,
  onError,
}) => {
  const [sqlText, setSqlText] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleImport = async () => {
    if (!sqlText.trim()) {
      onError(new Error('Please enter some SQL code to import'));
      return;
    }
    
    setIsLoading(true);
    try {
      await onImport(sqlText);
      setSqlText('');
      onClose();
    } catch (error) {
      console.error('Import failed:', error);
      onError(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setSqlText('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000] p-4"
    >
      <div
        className="bg-slate-800 rounded-lg p-4 sm:p-6 w-full max-w-[95vw] sm:max-w-[600px] max-h-[90vh] flex flex-col shadow-xl"
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="m-0 text-indigo-400 text-base sm:text-lg font-semibold">Import SQL Schema</h2>
          <button
            onClick={handleClose}
            className="bg-transparent border-none text-xl cursor-pointer text-slate-400 p-1 hover:text-slate-200 transition-colors"
          >
            ✕
          </button>
        </div>
        
        <div className="mb-4 flex-1 min-h-0">
          <label className="block mb-2 font-semibold text-slate-200 text-sm">
            Paste your SQL schema here:
          </label>
          <textarea
            value={sqlText}
            onChange={(e) => setSqlText(e.target.value)}
            placeholder="CREATE TABLE users (
  id INT PRIMARY KEY,
  name VARCHAR(255),
  email VARCHAR(255)
);

CREATE TABLE posts (
  id INT PRIMARY KEY,
  title VARCHAR(255),
  user_id INT,
  FOREIGN KEY (user_id) REFERENCES users(id)
);"
            className="w-full h-48 sm:h-[300px] p-3 border border-slate-600 rounded-md font-mono text-xs sm:text-sm resize-y bg-slate-700 text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
        
        <div className="flex gap-3 justify-end">
          <button
            onClick={handleClose}
            disabled={isLoading}
            className={`px-4 py-2 border border-slate-600 rounded-md bg-slate-700 text-slate-200 text-sm ${
              isLoading ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:bg-slate-600'
            } transition-colors`}
          >
            Cancel
          </button>
          <button
            onClick={handleImport}
            disabled={!sqlText.trim() || isLoading}
            className={`px-4 py-2 border-none rounded-md text-white font-semibold text-sm ${
              !sqlText.trim() || isLoading 
                ? 'bg-slate-600 cursor-not-allowed' 
                : 'bg-indigo-600 cursor-pointer hover:bg-indigo-500'
            } transition-colors`}
          >
            {isLoading ? 'Importing...' : 'Import Schema'}
          </button>
        </div>
      </div>
    </div>
  );
};