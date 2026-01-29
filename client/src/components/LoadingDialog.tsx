import React from 'react';

interface LoadingDialogProps {
  isOpen: boolean;
  message?: string;
  onCancel?: () => void;
}

export const LoadingDialog: React.FC<LoadingDialogProps> = ({
  isOpen,
  message = "Parsing to SQL...",
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[100] p-6 sm:p-8 w-[calc(100%-2rem)] sm:w-auto sm:min-w-[400px] lg:min-w-[500px] max-w-[90vw] text-center rounded-lg"
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
      
      {/* Cyberpunk Loading Spinner */}
      <div className="relative w-12 h-12 sm:w-14 sm:h-14 mx-auto mb-5 sm:mb-6">
        <div 
          className="absolute inset-0 rounded-lg"
          style={{
            border: '2px solid rgba(0, 255, 255, 0.2)',
            animation: 'spin 1.5s linear infinite'
          }}
        />
        <div 
          className="absolute inset-0 rounded-lg"
          style={{
            border: '2px solid transparent',
            borderTopColor: '#00ffff',
            animation: 'spin 1s linear infinite reverse',
            boxShadow: '0 0 15px rgba(0, 255, 255, 0.4)'
          }}
        />
        <div 
          className="absolute inset-2 rounded"
          style={{
            border: '2px solid transparent',
            borderTopColor: '#ff00ff',
            animation: 'spin 0.8s linear infinite',
            boxShadow: '0 0 10px rgba(255, 0, 255, 0.4)'
          }}
        />
      </div>

      {/* Loading Message */}
      <h3 
        className="mt-0 mb-3 text-sm sm:text-base font-bold uppercase tracking-widest"
        style={{
          color: '#00ffff',
          fontFamily: "'Orbitron', sans-serif",
          textShadow: '0 0 10px rgba(0, 255, 255, 0.5)'
        }}
      >
        {message}
      </h3>

      <p
        className={`text-xs sm:text-sm ${onCancel ? "mb-5" : "mb-0"}`}
        style={{
          color: '#8a8a9a',
          fontFamily: "'JetBrains Mono', monospace"
        }}
      >
        Processing your schema...
      </p>

      {/* Cancel Button */}
      {onCancel && (
        <button
          onClick={onCancel}
          className="cursor-pointer px-6 py-2.5 rounded font-bold text-xs uppercase tracking-widest transition-all duration-300"
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            backgroundColor: 'rgba(42, 42, 58, 0.8)',
            color: '#c0c0d0',
            border: '1px solid rgba(42, 42, 58, 0.8)'
          }}
        >
          Cancel
        </button>
      )}
      
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};
