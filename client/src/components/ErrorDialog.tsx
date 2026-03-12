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
        className="w-full max-w-[95vw] sm:max-w-[500px] max-h-[80vh] flex flex-col rounded-xl overflow-hidden"
        style={{
          backgroundColor: 'rgba(17, 17, 20, 0.95)',
          border: '1px solid rgba(220, 38, 38, 0.4)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          backdropFilter: 'blur(12px)'
        }}
      >
        {/* Top accent line */}
        <div 
          className="h-[2px] w-full"
          style={{ background: 'linear-gradient(90deg, transparent, #dc2626, transparent)' }}
        />
        
        <div className="p-5 sm:p-6 flex flex-col flex-1">
          {/* Header */}
          <div className="flex items-center mb-4 pb-3" style={{ borderBottom: '1px solid rgba(220, 38, 38, 0.2)' }}>
            <div 
              className="w-7 h-7 flex items-center justify-center mr-3 text-sm font-bold rounded-lg"
              style={{ 
                backgroundColor: 'rgba(220, 38, 38, 0.15)',
                color: '#dc2626',
                border: '1px solid rgba(220, 38, 38, 0.4)'
              }}
            >
              !
            </div>
            <h2 
              className="m-0 text-base sm:text-lg font-bold uppercase tracking-wider"
              style={{ 
                color: '#dc2626',
                fontFamily: "'Space Grotesk', sans-serif"
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
                color: '#a1a1aa',
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
                    color: '#71717a',
                    fontFamily: "'JetBrains Mono', monospace"
                  }}
                >
                  // Show Error Details
                </summary>
                <div 
                  className="p-3 text-[10px] sm:text-xs max-h-36 overflow-auto whitespace-pre-wrap break-words rounded-lg"
                  style={{
                    backgroundColor: 'rgba(17, 17, 20, 0.8)',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                    color: '#dc2626',
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
                className="px-5 py-2.5 text-xs font-bold uppercase tracking-wider cursor-pointer transition-all duration-300 rounded-lg"
                style={{ 
                  backgroundColor: 'transparent',
                  color: '#14b8a6',
                  border: '1px solid rgba(20, 184, 166, 0.4)',
                  fontFamily: "'JetBrains Mono', monospace"
                }}
              >
                Try Again
              </button>
            )}
            <button
              onClick={onClose}
              className="px-5 py-2.5 text-xs font-bold uppercase tracking-wider cursor-pointer transition-all duration-300 rounded-lg"
              style={{ 
                background: '#dc2626',
                color: '#ffffff',
                fontFamily: "'JetBrains Mono', monospace",
                boxShadow: '0 4px 12px rgba(220, 38, 38, 0.25)'
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