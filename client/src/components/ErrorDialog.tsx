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
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[1000] p-4">
      <div 
        className="w-full max-w-[95vw] sm:max-w-[500px] max-h-[80vh] flex flex-col"
        style={{
          backgroundColor: 'rgba(13, 13, 20, 0.95)',
          border: '1px solid rgba(255, 51, 102, 0.5)',
          boxShadow: '0 0 40px rgba(255, 51, 102, 0.2), 0 0 80px rgba(0, 0, 0, 0.5)',
          backdropFilter: 'blur(10px)'
        }}
      >
        {/* Top accent line */}
        <div 
          className="h-[2px] w-full"
          style={{ background: 'linear-gradient(90deg, transparent, #ff3366, transparent)' }}
        />
        
        <div className="p-5 sm:p-6 flex flex-col flex-1">
          {/* Header */}
          <div className="flex items-center mb-4 pb-3" style={{ borderBottom: '1px solid rgba(255, 51, 102, 0.2)' }}>
            <div 
              className="w-7 h-7 flex items-center justify-center mr-3 text-sm font-bold"
              style={{ 
                backgroundColor: 'rgba(255, 51, 102, 0.2)',
                color: '#ff3366',
                border: '1px solid rgba(255, 51, 102, 0.5)'
              }}
            >
              !
            </div>
            <h2 
              className="m-0 text-base sm:text-lg font-bold uppercase tracking-wider"
              style={{ 
                color: '#ff3366',
                fontFamily: "'Orbitron', sans-serif"
              }}
            >
              {title}
            </h2>
          </div>
          
          {/* Main Message */}
          <div className="mb-4">
            <p 
              className="m-0 text-sm leading-relaxed"
              style={{ 
                color: '#c0c0d0',
                fontFamily: "'JetBrains Mono', monospace"
              }}
            >
              {message}
            </p>
          </div>

          {/* Error Details */}
          {details && (
            <div className="mb-5">
              <details className="cursor-pointer">
                <summary 
                  className="text-xs font-medium mb-2 select-none"
                  style={{ 
                    color: '#8a8a9a',
                    fontFamily: "'JetBrains Mono', monospace"
                  }}
                >
                  // Show Error Details
                </summary>
                <div 
                  className="p-3 text-[10px] sm:text-xs max-h-36 overflow-auto whitespace-pre-wrap break-words"
                  style={{
                    backgroundColor: 'rgba(10, 10, 15, 0.8)',
                    border: '1px solid #2a2a3a',
                    color: '#ff3366',
                    fontFamily: "'JetBrains Mono', monospace"
                  }}
                >
                  {details}
                </div>
              </details>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 justify-end mt-auto">
            {onRetry && (
              <button
                onClick={onRetry}
                className="px-5 py-2.5 text-xs font-bold uppercase tracking-wider cursor-pointer transition-all duration-300"
                style={{ 
                  backgroundColor: 'transparent',
                  color: '#00ffff',
                  border: '1px solid rgba(0, 255, 255, 0.5)',
                  fontFamily: "'JetBrains Mono', monospace"
                }}
              >
                Try Again
              </button>
            )}
            <button
              onClick={onClose}
              className="px-5 py-2.5 text-xs font-bold uppercase tracking-wider cursor-pointer transition-all duration-300"
              style={{ 
                background: 'linear-gradient(135deg, #ff3366, #ff0044)',
                color: '#0a0a0f',
                fontFamily: "'JetBrains Mono', monospace",
                boxShadow: '0 0 20px rgba(255, 51, 102, 0.3)'
              }}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};