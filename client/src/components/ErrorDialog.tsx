import React from 'react';

interface ErrorDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  details?: string;
  onClose: () => void;
  onRetry?: () => void;
}

export const ErrorDialog: React.FC<ErrorDialogProps> = ({
  isOpen,
  title,
  message,
  details,
  onClose,
  onRetry,
}) => {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
    >
      <div
        style={{
          backgroundColor: '#1f2937',
          borderRadius: 12,
          padding: 24,
          maxWidth: '90%',
          maxHeight: '80%',
          width: 500,
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
          border: '2px solid #ef4444',
        }}
      >
        {/* Header */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center',
          marginBottom: 16,
          paddingBottom: 12,
          borderBottom: '1px solid #7f1d1d'
        }}>
          <div
            style={{
              width: 24,
              height: 24,
              backgroundColor: '#ef4444',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontWeight: 'bold',
              marginRight: 12,
              fontSize: 14,
            }}
          >
            !
          </div>
          <h2 style={{ 
            margin: 0, 
            color: '#f87171',
            fontSize: 18,
            fontWeight: 600
          }}>
            {title}
          </h2>
        </div>
        
        {/* Main Message */}
        <div style={{ marginBottom: 16 }}>
          <p style={{ 
            margin: 0,
            color: '#e5e7eb',
            fontSize: 14,
            lineHeight: '1.5'
          }}>
            {message}
          </p>
        </div>

        {/* Error Details */}
        {details && (
          <div style={{ marginBottom: 20 }}>
            <details style={{ cursor: 'pointer' }}>
              <summary style={{
                color: '#9ca3af',
                fontSize: 12,
                fontWeight: 500,
                marginBottom: 8,
                userSelect: 'none'
              }}>
                Show Error Details
              </summary>
              <div
                style={{
                  backgroundColor: '#374151',
                  border: '1px solid #4b5563',
                  borderRadius: 6,
                  padding: 12,
                  fontFamily: 'monospace',
                  fontSize: 11,
                  color: '#e5e7eb',
                  maxHeight: 150,
                  overflow: 'auto',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word'
                }}
              >
                {details}
              </div>
            </details>
          </div>
        )}

        {/* Action Buttons */}
        <div style={{
          display: 'flex',
          gap: 12,
          justifyContent: 'flex-end',
          marginTop: 'auto'
        }}>
          {onRetry && (
            <button
              onClick={onRetry}
              style={{
                padding: '8px 16px',
                border: '1px solid #3b82f6',
                borderRadius: 6,
                background: '#1f2937',
                color: '#60a5fa',
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: 500,
                transition: 'all 0.2s',
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = '#1e3a5f';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = '#1f2937';
              }}
            >
              Try Again
            </button>
          )}
          <button
            onClick={onClose}
            style={{
              padding: '8px 16px',
              border: 'none',
              borderRadius: 6,
              background: '#ef4444',
              color: 'white',
              cursor: 'pointer',
              fontSize: 14,
              fontWeight: 500,
              transition: 'all 0.2s',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = '#dc2626';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = '#ef4444';
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};