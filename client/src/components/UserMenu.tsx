import React from 'react';
import { useAuth } from '../context/AuthContext';
import { authToasts } from '../utils/toast';

interface UserMenuProps {
  onLoginClick: () => void;
  onSavedDiagramsClick: () => void;
  onMyDiagramsClick?: () => void;
}

const UserMenu: React.FC<UserMenuProps> = ({ onLoginClick, onSavedDiagramsClick, onMyDiagramsClick }) => {
  const { user, isAuthenticated, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  if (!isAuthenticated) {
    return (
      <button
        onClick={onLoginClick}
        className="flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all duration-300"
        style={{ 
          background: 'linear-gradient(135deg, #00ffff, #0088ff)',
          color: '#0a0a0f',
          fontFamily: "'JetBrains Mono', monospace",
          boxShadow: '0 0 15px rgba(0, 255, 255, 0.3)'
        }}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
        </svg>
        Login
      </button>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        className="flex items-center gap-1 px-2 py-1 transition-all duration-300"
        style={{ 
          backgroundColor: 'rgba(26, 26, 36, 0.8)',
          border: '1px solid #2a2a3a'
        }}
      >
        <div 
          className="w-6 h-6 flex items-center justify-center font-bold text-xs"
          style={{ 
            background: 'linear-gradient(135deg, #00ffff, #ff00ff)',
            color: '#0a0a0f',
            fontFamily: "'Orbitron', sans-serif"
          }}
        >
          {user?.username?.charAt(0).toUpperCase()}
        </div>
        <svg
          className={`w-3 h-3 transition-transform ${isMenuOpen ? 'rotate-180' : ''}`}
          style={{ color: '#8a8a9a' }}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isMenuOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsMenuOpen(false)}
          />
          <div 
            className="absolute right-0 mt-2 w-56 z-20 overflow-hidden"
            style={{
              backgroundColor: 'rgba(13, 13, 20, 0.95)',
              border: '1px solid #2a2a3a',
              boxShadow: '0 0 30px rgba(0, 0, 0, 0.5)',
              backdropFilter: 'blur(10px)'
            }}
          >
            {/* Top accent line */}
            <div 
              className="h-[2px] w-full"
              style={{ background: 'linear-gradient(90deg, #00ffff, #ff00ff)' }}
            />
            <div 
              className="px-4 py-3"
              style={{ borderBottom: '1px solid #2a2a3a' }}
            >
              <p 
                className="text-sm font-bold"
                style={{ 
                  color: '#f0f0ff',
                  fontFamily: "'Orbitron', sans-serif"
                }}
              >
                {user?.username}
              </p>
              <p 
                className="text-xs truncate mt-1"
                style={{ 
                  color: '#8a8a9a',
                  fontFamily: "'JetBrains Mono', monospace"
                }}
              >
                {user?.email}
              </p>
              <p 
                className="text-xs mt-0.5"
                style={{ 
                  color: '#4a4a5a',
                  fontFamily: "'JetBrains Mono', monospace"
                }}
              >
                PRN: {user?.prn}
              </p>
            </div>
            <div className="py-1">
              {/* My Diagrams */}
              {onMyDiagramsClick && (
                <button
                  onClick={() => {
                    onMyDiagramsClick();
                    setIsMenuOpen(false);
                  }}
                  className="w-full px-4 py-2 text-left text-xs flex items-center gap-2 transition-colors"
                  style={{ 
                    color: '#c0c0d0',
                    fontFamily: "'JetBrains Mono', monospace"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(0, 255, 255, 0.1)';
                    e.currentTarget.style.color = '#00ffff';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = '#c0c0d0';
                  }}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  My Diagrams
                </button>
              )}
              {/* Save/Load */}
              <button
                onClick={() => {
                  onSavedDiagramsClick();
                  setIsMenuOpen(false);
                }}
                className="w-full px-4 py-2 text-left text-xs flex items-center gap-2 transition-colors"
                style={{ 
                  color: '#c0c0d0',
                  fontFamily: "'JetBrains Mono', monospace"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(0, 255, 255, 0.1)';
                  e.currentTarget.style.color = '#00ffff';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = '#c0c0d0';
                }}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                </svg>
                Save / Load
              </button>
              <div style={{ borderTop: '1px solid #2a2a3a', margin: '4px 0' }} />
              <button
                onClick={() => {
                  logout();
                  authToasts.logoutSuccess();
                  setIsMenuOpen(false);
                }}
                className="w-full px-4 py-2 text-left text-xs flex items-center gap-2 transition-colors"
                style={{ 
                  color: '#ff3366',
                  fontFamily: "'JetBrains Mono', monospace"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 51, 102, 0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Logout
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default UserMenu;
