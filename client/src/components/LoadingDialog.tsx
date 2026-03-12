import React from 'react';

interface LoadingDialogProps {
  isOpen: boolean;
  message?: string;
  onCancel?: () => void;
}

export const LoadingDialog: React.FC<LoadingDialogProps> = ({
  isOpen,
  message = "Processing...",
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[100] p-8 sm:p-10 w-[calc(100%-2rem)] sm:w-auto sm:min-w-[380px] max-w-[90vw] text-center"
      style={{
        backgroundColor: 'rgba(17, 17, 20, 0.95)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255, 255, 255, 0.06)',
        borderRadius: '16px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.03) inset'
      }}
    >
      {/* Futuristic Orbital Loader */}
      <div className="relative w-20 h-20 mx-auto mb-8">
        {/* Outer ring - slow rotation */}
        <div 
          className="absolute inset-0 rounded-full"
          style={{
            border: '2px solid transparent',
            borderTopColor: '#14b8a6',
            borderRightColor: 'rgba(20, 184, 166, 0.3)',
            animation: 'spin 2s linear infinite',
          }}
        />
        
        {/* Middle ring - reverse rotation */}
        <div 
          className="absolute rounded-full"
          style={{
            inset: '8px',
            border: '2px solid transparent',
            borderBottomColor: '#14b8a6',
            borderLeftColor: 'rgba(20, 184, 166, 0.2)',
            animation: 'spin 1.5s linear infinite reverse',
          }}
        />
        
        {/* Inner ring - fast rotation */}
        <div 
          className="absolute rounded-full"
          style={{
            inset: '16px',
            border: '2px solid transparent',
            borderTopColor: 'rgba(20, 184, 166, 0.8)',
            animation: 'spin 1s linear infinite',
          }}
        />
        
        {/* Center glow dot */}
        <div 
          className="absolute rounded-full"
          style={{
            inset: '50%',
            width: '8px',
            height: '8px',
            marginTop: '-4px',
            marginLeft: '-4px',
            backgroundColor: '#14b8a6',
            boxShadow: '0 0 20px rgba(20, 184, 166, 0.6), 0 0 40px rgba(20, 184, 166, 0.3)',
            animation: 'pulse 1.5s ease-in-out infinite',
          }}
        />
        
        {/* Orbiting dots */}
        <div 
          className="absolute inset-0"
          style={{ animation: 'spin 3s linear infinite' }}
        >
          <div 
            className="absolute w-2 h-2 rounded-full"
            style={{
              top: '0',
              left: '50%',
              marginLeft: '-4px',
              backgroundColor: '#14b8a6',
              boxShadow: '0 0 8px rgba(20, 184, 166, 0.8)',
            }}
          />
        </div>
        
        <div 
          className="absolute inset-0"
          style={{ animation: 'spin 3s linear infinite reverse' }}
        >
          <div 
            className="absolute w-1.5 h-1.5 rounded-full"
            style={{
              bottom: '4px',
              left: '50%',
              marginLeft: '-3px',
              backgroundColor: 'rgba(20, 184, 166, 0.6)',
              boxShadow: '0 0 6px rgba(20, 184, 166, 0.6)',
            }}
          />
        </div>
      </div>

      {/* Loading Message */}
      <h3 
        className="mt-0 mb-2 text-base font-medium tracking-wide"
        style={{
          color: '#fafafa',
          fontFamily: "'Space Grotesk', sans-serif",
        }}
      >
        {message}
      </h3>

      <p
        className="text-sm mb-0"
        style={{
          color: '#71717a',
          fontFamily: "'Space Grotesk', sans-serif"
        }}
      >
        This may take a moment
      </p>

      {/* Progress bar animation */}
      <div 
        className="mt-6 h-1 rounded-full overflow-hidden"
        style={{ backgroundColor: 'rgba(39, 39, 42, 0.5)' }}
      >
        <div 
          className="h-full rounded-full"
          style={{
            width: '40%',
            background: 'linear-gradient(90deg, transparent, #14b8a6, transparent)',
            animation: 'progressSlide 1.5s ease-in-out infinite',
          }}
        />
      </div>

      {/* Cancel Button */}
      {onCancel && (
        <button
          onClick={onCancel}
          className="mt-6 cursor-pointer px-5 py-2 rounded-md font-medium text-sm transition-all duration-200"
          style={{
            fontFamily: "'Space Grotesk', sans-serif",
            backgroundColor: 'transparent',
            color: '#71717a',
            border: '1px solid #27272a'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#18181b';
            e.currentTarget.style.color = '#a1a1aa';
            e.currentTarget.style.borderColor = '#3f3f46';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = '#71717a';
            e.currentTarget.style.borderColor = '#27272a';
          }}
        >
          Cancel
        </button>
      )}
      
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.1); }
        }
        @keyframes progressSlide {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(350%); }
        }
      `}</style>
    </div>
  );
};

export default LoadingDialog;
//         }
//       `}</style>
//     </div>
//   );
// };
