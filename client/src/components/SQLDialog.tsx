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
      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[100] p-5 sm:p-6 w-[calc(100%-2rem)] sm:w-auto sm:min-w-[500px] lg:min-w-[650px] max-w-[90vw] rounded-xl overflow-hidden"
      style={{
        backgroundColor: 'rgba(17, 17, 20, 0.95)',
        border: '1px solid rgba(255, 255, 255, 0.06)',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        backdropFilter: 'blur(12px)'
      }}
    >
      {/* Top accent line */}
      <div 
        className="absolute top-0 left-0 right-0 h-px"
        style={{ background: 'linear-gradient(90deg, transparent, #14b8a6, transparent)' }}
      />
      
      <h2 
        className="mt-0 text-sm sm:text-base font-bold uppercase tracking-widest"
        style={{ 
          color: '#14b8a6',
          fontFamily: "'Space Grotesk', sans-serif"
        }}
      >
        // Generated SQL
      </h2>

      <textarea
        value={sqlText}
        readOnly
        aria-label="Generated SQL code"
        title="Generated SQL code for the database schema"
        className="mt-4 sm:mt-5 w-full min-h-[150px] sm:min-h-[250px] max-h-[60vh] text-xs sm:text-sm p-4 mb-4 resize-none focus:outline-none rounded-lg"
        style={{
          fontFamily: "'JetBrains Mono', monospace",
          backgroundColor: 'rgba(17, 17, 20, 0.8)',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          color: '#a1a1aa',
          lineHeight: '1.6'
        }}
      />

      <div className="flex justify-between gap-3">
        <button
          onClick={onCopy}
          className="cursor-pointer flex-1 sm:flex-none px-6 py-2.5 rounded-lg font-bold text-xs uppercase tracking-widest transition-all duration-300"
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            background: '#14b8a6',
            color: '#09090b',
            boxShadow: '0 4px 12px rgba(20, 184, 166, 0.25)'
          }}
        >
          Copy to Clipboard
        </button>
        <button
          onClick={onClose}
          className="cursor-pointer flex-1 sm:flex-none px-6 py-2.5 rounded-lg font-bold text-xs uppercase tracking-widest transition-all duration-300"
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            backgroundColor: 'transparent',
            color: '#a1a1aa',
            border: '1px solid rgba(255, 255, 255, 0.06)'
          }}
        >
          Close
        </button>
      </div>
    </div>
  );
};
