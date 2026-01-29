import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { diagramsAPI } from '../services/api';
import { diagramToasts } from '../utils/toast';

interface DiagramPageProps {
  onLoadDiagram: (diagram: any) => void;
  onError: (error: Error) => void;
}

export const DiagramPage: React.FC<DiagramPageProps> = ({ onLoadDiagram, onError }) => {
  const { username, slug } = useParams<{ username: string; slug: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadDiagram = async () => {
      if (!username || !slug) {
        navigate('/playground', { replace: true });
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await diagramsAPI.getBySlug(username, slug);
        if (response.success && response.diagram) {
          diagramToasts.loaded(response.diagram.name);
          onLoadDiagram(response.diagram);
        } else {
          diagramToasts.notFound();
          setError('Diagram not found');
        }
      } catch (err: any) {
        console.error('Failed to load diagram:', err);
        if (err.message?.includes('not found') || err.message?.includes('404')) {
          diagramToasts.notFound();
          setError('Diagram not found');
        } else if (err.message?.includes('permission') || err.message?.includes('403')) {
          diagramToasts.permissionDenied();
          setError('You do not have permission to view this diagram');
        } else {
          diagramToasts.loadError(err.message);
          setError(err.message || 'Failed to load diagram');
          onError(err);
        }
      } finally {
        setLoading(false);
      }
    };

    loadDiagram();
  }, [username, slug, navigate, onLoadDiagram, onError]);

  if (loading) {
    return (
      <div 
        className="fixed inset-0 flex items-center justify-center"
        style={{ backgroundColor: '#0a0a0f' }}
      >
        <div className="flex flex-col items-center gap-6">
          {/* Cyberpunk loading spinner */}
          <div className="relative">
            <div 
              className="w-16 h-16 rounded-lg"
              style={{
                border: '2px solid rgba(0, 255, 255, 0.2)',
                animation: 'spin 1s linear infinite'
              }}
            />
            <div 
              className="absolute inset-0 w-16 h-16 rounded-lg"
              style={{
                border: '2px solid transparent',
                borderTopColor: '#00ffff',
                animation: 'spin 0.8s linear infinite reverse',
                boxShadow: '0 0 20px rgba(0, 255, 255, 0.3)'
              }}
            />
            <div 
              className="absolute inset-2 w-12 h-12 rounded"
              style={{
                border: '2px solid transparent',
                borderTopColor: '#ff00ff',
                animation: 'spin 0.6s linear infinite',
                boxShadow: '0 0 15px rgba(255, 0, 255, 0.3)'
              }}
            />
          </div>
          <p 
            className="text-sm uppercase tracking-widest"
            style={{ 
              color: '#c0c0d0',
              fontFamily: "'JetBrains Mono', monospace"
            }}
          >
            Loading diagram<span className="cursor-blink"></span>
          </p>
        </div>
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div 
        className="fixed inset-0 flex items-center justify-center"
        style={{ backgroundColor: '#0a0a0f' }}
      >
        <div className="text-center max-w-md mx-auto px-4">
          <div 
            className="text-6xl mb-6"
            style={{ filter: 'drop-shadow(0 0 10px rgba(255, 51, 102, 0.5))' }}
          >
            ⚠
          </div>
          <h1 
            className="text-2xl font-bold mb-3"
            style={{ 
              color: '#f0f0ff',
              fontFamily: "'Orbitron', sans-serif"
            }}
          >
            {error === 'Diagram not found' ? 'NOT FOUND' : 'ERROR'}
          </h1>
          <p 
            className="mb-8 text-sm"
            style={{ 
              color: '#8a8a9a',
              fontFamily: "'JetBrains Mono', monospace"
            }}
          >
            {error}
          </p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => navigate('/playground')}
              className="px-6 py-3 font-bold text-xs uppercase tracking-widest transition-all duration-300"
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
              onClick={() => window.location.reload()}
              className="px-6 py-3 font-bold text-xs uppercase tracking-widest transition-all duration-300"
              style={{ 
                backgroundColor: 'rgba(42, 42, 58, 0.8)',
                color: '#c0c0d0',
                border: '1px solid rgba(42, 42, 58, 0.8)',
                fontFamily: "'JetBrains Mono', monospace"
              }}
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  // If diagram loaded successfully, the parent component will render the canvas
  return null;
};

export default DiagramPage;
