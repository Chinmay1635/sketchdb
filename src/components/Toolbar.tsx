import React from 'react';

interface ToolbarProps {
  onAddTable: () => void;
  onExportSQL: () => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({ onAddTable, onExportSQL }) => {
  return (
    <>
      <button 
        onClick={onAddTable} 
        style={{ 
          position: 'absolute', 
          zIndex: 10, 
          width: '250px', 
          height: '75px', 
          backgroundColor: 'yellow' 
        }}
      >
        Add Table
      </button>
      <button 
        onClick={onExportSQL} 
        style={{ 
          position: 'absolute', 
          left: 270, 
          zIndex: 10, 
          width: '250px', 
          height: '75px', 
          backgroundColor: '#0074D9', 
          color: 'white' 
        }}
      >
        Export to SQL
      </button>
    </>
  );
};