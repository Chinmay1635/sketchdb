import React from 'react';
import { useNavigate } from 'react-router-dom';

export const NotFound: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div 
      className="fixed inset-0 flex items-center justify-center"
      style={{ 
        backgroundColor: '#0a0a0f',
        backgroundImage: 'linear-gradient(rgba(0, 255, 255, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 255, 255, 0.03) 1px, transparent 1px)',
        backgroundSize: '40px 40px'
      }}
    >
      <div className="text-center max-w-md mx-auto px-4">
        {/* Glitchy 404 */}
        <div 
          className="text-7xl sm:text-8xl mb-6 font-bold"
          style={{ 
            fontFamily: "'Orbitron', sans-serif",
            background: 'linear-gradient(135deg, #00ffff, #ff00ff)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            textShadow: '0 0 40px rgba(0, 255, 255, 0.3)',
            filter: 'drop-shadow(0 0 20px rgba(0, 255, 255, 0.3))'
          }}
        >
          404
        </div>
        <h1 
          className="text-xl sm:text-2xl font-bold mb-3 uppercase tracking-widest"
          style={{ 
            color: '#f0f0ff',
            fontFamily: "'Orbitron', sans-serif"
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
            className="px-8 py-3 font-bold text-xs uppercase tracking-widest transition-all duration-300"
            style={{ 
              background: 'linear-gradient(135deg, #00ffff, #0088ff)',
              color: '#0a0a0f',
              fontFamily: "'JetBrains Mono', monospace",
              boxShadow: '0 0 20px rgba(0, 255, 255, 0.3)'
            }}
          >
            Go Home
          </button>
          <button
            onClick={() => navigate(-1)}
            className="px-8 py-3 font-bold text-xs uppercase tracking-widest transition-all duration-300"
            style={{ 
              backgroundColor: 'rgba(42, 42, 58, 0.8)',
              color: '#c0c0d0',
              border: '1px solid rgba(42, 42, 58, 0.8)',
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
