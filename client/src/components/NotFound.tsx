import React from 'react';
import { useNavigate } from 'react-router-dom';

export const NotFound: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div 
      className="fixed inset-0 flex items-center justify-center"
      style={{ 
        backgroundColor: '#09090b',
        backgroundImage: 'linear-gradient(rgba(20, 184, 166, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(20, 184, 166, 0.03) 1px, transparent 1px)',
        backgroundSize: '40px 40px'
      }}
    >
      <div className="text-center max-w-md mx-auto px-4">
        {/* 404 */}
        <div 
          className="text-7xl sm:text-8xl mb-6 font-bold"
          style={{ 
            fontFamily: "'Space Grotesk', sans-serif",
            background: 'linear-gradient(135deg, #14b8a6, #0d9488)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            filter: 'drop-shadow(0 4px 12px rgba(20, 184, 166, 0.3))'
          }}
        >
          404
        </div>
        <h1 
          className="text-xl sm:text-2xl font-bold mb-3 uppercase tracking-widest"
          style={{ 
            color: '#fafafa',
            fontFamily: "'Space Grotesk', sans-serif"
          }}
        >
          Page Not Found
        </h1>
        <p 
          className="mb-10 text-sm"
          style={{ 
            color: '#8a8a9a',
            fontFamily: "'JetBrains Mono', monospace"
          }}
        >
          // Error: The requested resource does not exist
        </p>
        <div className="flex gap-4 justify-center flex-wrap">
          <button
            onClick={() => navigate('/playground')}
            className="px-8 py-3 font-bold text-xs uppercase tracking-widest transition-all duration-300 rounded-lg"
            style={{ 
              background: '#14b8a6',
              color: '#09090b',
              fontFamily: "'JetBrains Mono', monospace",
              boxShadow: '0 4px 12px rgba(20, 184, 166, 0.25)'
            }}
          >
            Go Home
          </button>
          <button
            onClick={() => navigate(-1)}
            className="px-8 py-3 font-bold text-xs uppercase tracking-widest transition-all duration-300 rounded-lg"
            style={{ 
              backgroundColor: 'transparent',
              color: '#a1a1aa',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              fontFamily: "'JetBrains Mono', monospace"
            }}
          >
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
