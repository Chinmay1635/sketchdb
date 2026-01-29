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
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[1000] p-4">
      <div
        className="w-full max-w-[95vw] sm:max-w-[600px] max-h-[90vh] flex flex-col"
        style={{
          backgroundColor: 'rgba(13, 13, 20, 0.95)',
          border: '1px solid #2a2a3a',
          boxShadow: '0 0 40px rgba(0, 255, 255, 0.1), 0 0 80px rgba(0, 0, 0, 0.5)',
          backdropFilter: 'blur(10px)'
        }}
      >
        {/* Top accent line */}
        <div 
          className="h-[2px] w-full"
          style={{ background: 'linear-gradient(90deg, transparent, #00ffff, #ff00ff, transparent)' }}
        />
        
        <div className="p-4 sm:p-6 flex flex-col flex-1 min-h-0">
          <div className="flex justify-between items-center mb-4">
            <h2 
              className="m-0 text-base sm:text-lg font-bold uppercase tracking-wider"
              style={{ 
                color: '#00ffff',
                fontFamily: "'Orbitron', sans-serif",
                textShadow: '0 0 10px rgba(0, 255, 255, 0.5)'
              }}
            >
              Import SQL Schema
            </h2>
            <button
              onClick={handleClose}
              className="bg-transparent border-none text-xl cursor-pointer p-1 transition-colors"
              style={{ color: '#8a8a9a' }}
            >
              ✕
            </button>
          </div>
          
          <div className="mb-4 flex-1 min-h-0">
            <label 
              className="block mb-2 font-semibold text-sm"
              style={{ 
                color: '#c0c0d0',
                fontFamily: "'JetBrains Mono', monospace"
              }}
            >
              // Paste your SQL schema here:
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
              className="w-full h-48 sm:h-[300px] p-3 text-xs sm:text-sm resize-y focus:outline-none"
              style={{
                backgroundColor: 'rgba(10, 10, 15, 0.8)',
                border: '1px solid #2a2a3a',
                color: '#c0c0d0',
                fontFamily: "'JetBrains Mono', monospace"
              }}
            />
          </div>
          
          <div className="flex gap-3 justify-end">
            <button
              onClick={handleClose}
              disabled={isLoading}
              className={`px-5 py-2.5 text-xs font-bold uppercase tracking-wider transition-all duration-300 ${
                isLoading ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'
              }`}
              style={{ 
                backgroundColor: 'rgba(42, 42, 58, 0.8)',
                color: '#c0c0d0',
                border: '1px solid rgba(42, 42, 58, 0.8)',
                fontFamily: "'JetBrains Mono', monospace"
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleImport}
              disabled={!sqlText.trim() || isLoading}
              className={`px-5 py-2.5 text-xs font-bold uppercase tracking-wider transition-all duration-300 ${
                !sqlText.trim() || isLoading ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
              }`}
              style={{ 
                background: !sqlText.trim() || isLoading 
                  ? 'rgba(42, 42, 58, 0.8)' 
                  : 'linear-gradient(135deg, #00ffff, #0088ff)',
                color: !sqlText.trim() || isLoading ? '#8a8a9a' : '#0a0a0f',
                fontFamily: "'JetBrains Mono', monospace",
                boxShadow: !sqlText.trim() || isLoading ? 'none' : '0 0 20px rgba(0, 255, 255, 0.3)'
              }}
            >
              {isLoading ? 'Importing...' : 'Import Schema'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};