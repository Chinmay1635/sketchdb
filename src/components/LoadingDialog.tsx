import React from 'react';

interface LoadingDialogProps {
  isOpen: boolean;
  message?: string;
  onCancel?: () => void;
}

export const LoadingDialog: React.FC<LoadingDialogProps> = ({ 
  isOpen, 
  message = "Parsing to SQL...",
  onCancel
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
      padding: 32, 
      minWidth: 300,
      textAlign: 'center'
    }}>
      {/* Loading Spinner */}
      <div style={{
        width: 40,
        height: 40,
        border: '4px solid #f3f3f3',
        borderTop: '4px solid #0074D9',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
        margin: '0 auto 20px auto'
      }}></div>
      
      {/* Loading Message */}
      <h3 style={{ 
        color: '#0074D9', 
        marginTop: 0, 
        marginBottom: 10,
        fontSize: 18,
        fontWeight: 'bold'
      }}>
        {message}
      </h3>
      
      <p style={{ 
        color: '#666', 
        margin: 0,
        fontSize: 14,
        marginBottom: onCancel ? 20 : 0
      }}>
        Please wait while we generate your SQL schema...
      </p>
      
      {/* Cancel Button */}
      {onCancel && (
        <button 
          onClick={onCancel}
          style={{
            background: '#aaa',
            color: 'white',
            border: 'none',
            borderRadius: 4,
            padding: '8px 16px',
            cursor: 'pointer',
            fontSize: 14
          }}
        >
          Cancel
        </button>
      )}
      
      {/* CSS Animation */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.5; }
          100% { opacity: 1; }
        }
      `}</style>
    </div>
  );
};