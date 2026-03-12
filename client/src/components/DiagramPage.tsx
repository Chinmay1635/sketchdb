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
        style={{ backgroundColor: '#0d0d18' }}
      >
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div 
              className="w-10 h-10 rounded-full"
              style={{
                border: '2px solid rgba(20, 184, 166, 0.15)',
              }}
            />
            <div 
              className="absolute inset-0 w-10 h-10 rounded-full"
              style={{
                border: '2px solid transparent',
                borderTopColor: '#14b8a6',
                animation: 'spin 0.8s linear infinite',
              }}
            />
          </div>
          <p className="text-xs text-slate-400">
            Loading diagram...
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
        style={{ backgroundColor: '#0d0d18' }}
      >
        <div className="text-center max-w-md mx-auto px-4">
          <div className="text-4xl mb-4">⚠</div>
          <h1 className="text-xl font-semibold text-slate-100 mb-2">
            {error === 'Diagram not found' ? 'Not Found' : 'Error'}
          </h1>
          <p className="mb-6 text-sm text-slate-400">{error}</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => navigate('/playground')}
              className="px-5 py-2 text-sm font-medium rounded transition-colors"
              style={{ backgroundColor: '#14b8a6', color: '#0a0a0f' }}
            >
              Go Home
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-5 py-2 text-sm font-medium rounded text-slate-300 transition-colors"
              style={{ backgroundColor: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
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
