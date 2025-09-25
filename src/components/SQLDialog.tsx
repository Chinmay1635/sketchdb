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
  onCopy 
}) => {
  if (!isOpen) return null;

  return (
    <div style={{ 
      position: 'absolute', 
      top: 100, 
      left: '50%', 
      transform: 'translateX(-50%)', 
      zIndex: 100, 
      background: 'white', 
      border: '2px solid #0074D9', 
      borderRadius: 8, 
      boxShadow: '0 2px 16px rgba(0,0,0,0.15)', 
      padding: 24, 
      minWidth: 400 
    }}>
      <h2 style={{ marginTop: 0 }}>Exported SQL</h2>
      <textarea
        value={sqlText}
        readOnly
        style={{ 
          width: '100%', 
          height: 200, 
          fontFamily: 'monospace', 
          fontSize: 14, 
          marginBottom: 16 
        }}
      />
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <button 
          onClick={onCopy} 
          style={{ 
            background: '#0074D9', 
            color: 'white', 
            padding: '8px 16px', 
            borderRadius: 4, 
            border: 'none' 
          }}
        >
          Copy
        </button>
        <button 
          onClick={onClose} 
          style={{ 
            background: '#aaa', 
            color: 'white', 
            padding: '8px 16px', 
            borderRadius: 4, 
            border: 'none' 
          }}
        >
          Close
        </button>
      </div>
    </div>
  );
};