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
      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[100] p-5 sm:p-6 w-[calc(100%-2rem)] sm:w-auto sm:min-w-[500px] lg:min-w-[650px] max-w-[90vw] rounded-lg overflow-hidden"
      style={{
        backgroundColor: 'rgba(13, 13, 20, 0.98)',
        border: '1px solid rgba(0, 255, 255, 0.3)',
        boxShadow: '0 0 40px rgba(0, 255, 255, 0.15), 0 20px 60px rgba(0, 0, 0, 0.5)'
      }}
    >
      {/* Top accent line */}
      <div 
        className="absolute top-0 left-0 right-0 h-px"
        style={{ background: 'linear-gradient(90deg, transparent, #00ffff, transparent)' }}
      />
      
      <h2 
        className="mt-0 text-sm sm:text-base font-bold uppercase tracking-widest"
        style={{ 
          color: '#00ffff',
          fontFamily: "'Orbitron', sans-serif",
          textShadow: '0 0 10px rgba(0, 255, 255, 0.5)'
        }}
      >
        // Generated SQL
      </h2>

      <textarea
        value={sqlText}
        readOnly
        aria-label="Generated SQL code"
        title="Generated SQL code for the database schema"
        className="mt-4 sm:mt-5 w-full min-h-[150px] sm:min-h-[250px] max-h-[60vh] text-xs sm:text-sm p-4 mb-4 resize-none focus:outline-none"
        style={{
          fontFamily: "'JetBrains Mono', monospace",
          backgroundColor: 'rgba(18, 18, 24, 0.8)',
          border: '1px solid rgba(42, 42, 58, 0.8)',
          borderRadius: '4px',
          color: '#c0c0d0',
          lineHeight: '1.6'
        }}
      />

      <div className="flex justify-between gap-3">
        <button
          onClick={onCopy}
          className="cursor-pointer flex-1 sm:flex-none px-6 py-2.5 rounded font-bold text-xs uppercase tracking-widest transition-all duration-300"
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            background: 'linear-gradient(135deg, #00ffff, #0088ff)',
            color: '#0a0a0f',
            boxShadow: '0 0 20px rgba(0, 255, 255, 0.3)'
          }}
        >
          Copy to Clipboard
        </button>
        <button
          onClick={onClose}
          className="cursor-pointer flex-1 sm:flex-none px-6 py-2.5 rounded font-bold text-xs uppercase tracking-widest transition-all duration-300"
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            backgroundColor: 'rgba(42, 42, 58, 0.8)',
            color: '#c0c0d0',
            border: '1px solid rgba(42, 42, 58, 0.8)'
          }}
        >
          Close
        </button>
      </div>
    </div>
  );
};
