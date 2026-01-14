import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { diagramsAPI } from '../services/api';

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
        navigate('/', { replace: true });
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await diagramsAPI.getBySlug(username, slug);
        if (response.success && response.diagram) {
          onLoadDiagram(response.diagram);
        } else {
          setError('Diagram not found');
        }
      } catch (err: any) {
        console.error('Failed to load diagram:', err);
        if (err.message?.includes('not found') || err.message?.includes('404')) {
          setError('Diagram not found');
        } else if (err.message?.includes('permission') || err.message?.includes('403')) {
          setError('You do not have permission to view this diagram');
        } else {
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
      <div className="fixed inset-0 flex items-center justify-center bg-gray-900">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-300 text-lg">Loading diagram...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-gray-900">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="text-6xl mb-4">🔍</div>
          <h1 className="text-2xl font-bold text-white mb-2">
            {error === 'Diagram not found' ? 'Diagram Not Found' : 'Error'}
          </h1>
          <p className="text-gray-400 mb-6">{error}</p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => navigate('/')}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Go to Home
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              Try Again
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
