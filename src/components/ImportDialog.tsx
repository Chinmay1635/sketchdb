import React, { useState } from 'react';

interface ImportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (sqlText: string) => void;
}

export const ImportDialog: React.FC<ImportDialogProps> = ({
  isOpen,
  onClose,
  onImport,
}) => {
  const [sqlText, setSqlText] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleImport = async () => {
    if (!sqlText.trim()) return;
    
    setIsLoading(true);
    try {
      onImport(sqlText);
      setSqlText('');
      onClose();
    } catch (error) {
      console.error('Import failed:', error);
      alert('Failed to import schema. Please check your SQL syntax.');
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
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
    >
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: 8,
          padding: 24,
          maxWidth: '80%',
          maxHeight: '80%',
          width: 600,
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
        }}
      >
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: 16 
        }}>
          <h2 style={{ margin: 0, color: '#0074D9' }}>Import SQL Schema</h2>
          <button
            onClick={handleClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: 20,
              cursor: 'pointer',
              color: '#666',
              padding: 4,
            }}
          >
            ✕
          </button>
        </div>
        
        <div style={{ marginBottom: 16 }}>
          <label style={{ 
            display: 'block', 
            marginBottom: 8, 
            fontWeight: 'bold',
            color: '#333'
          }}>
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
            style={{
              width: '100%',
              height: 300,
              padding: 12,
              border: '1px solid #ddd',
              borderRadius: 4,
              fontFamily: 'monospace',
              fontSize: 14,
              resize: 'vertical',
              outline: 'none',
            }}
            onFocus={(e) => {
              e.target.style.borderColor = '#0074D9';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = '#ddd';
            }}
          />
        </div>
        
        <div style={{
          display: 'flex',
          gap: 12,
          justifyContent: 'flex-end',
        }}>
          <button
            onClick={handleClose}
            disabled={isLoading}
            style={{
              padding: '8px 16px',
              border: '1px solid #ddd',
              borderRadius: 4,
              background: 'white',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              opacity: isLoading ? 0.6 : 1,
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleImport}
            disabled={!sqlText.trim() || isLoading}
            style={{
              padding: '8px 16px',
              border: 'none',
              borderRadius: 4,
              background: !sqlText.trim() || isLoading ? '#ccc' : '#0074D9',
              color: 'white',
              cursor: !sqlText.trim() || isLoading ? 'not-allowed' : 'pointer',
              fontWeight: 'bold',
            }}
          >
            {isLoading ? 'Importing...' : 'Import Schema'}
          </button>
        </div>
      </div>
    </div>
  );
};