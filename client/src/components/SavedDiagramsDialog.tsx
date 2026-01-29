import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { diagramsAPI } from '../services/api';
import { diagramToasts } from '../utils/toast';

interface Diagram {
  _id: string;
  name: string;
  description: string;
  slug: string;
  username?: string;
  createdAt: string;
  updatedAt: string;
}

interface SavedDiagramsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onLoad: (diagram: any) => void;
  onSaveComplete?: (diagramId: string, diagramName: string, slug?: string) => void;
  currentNodes: any[];
  currentEdges: any[];
  sqlContent: string;
  viewport: { x: number; y: number; zoom: number };
  currentDiagramId?: string | null;
}

const SavedDiagramsDialog: React.FC<SavedDiagramsDialogProps> = ({
  isOpen,
  onClose,
  onLoad,
  onSaveComplete,
  currentNodes,
  currentEdges,
  sqlContent,
  viewport,
  currentDiagramId,
}) => {
  const { isAuthenticated } = useAuth();
  const [diagrams, setDiagrams] = useState<Diagram[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [mode, setMode] = useState<'list' | 'save'>('list');
  const [diagramName, setDiagramName] = useState('');
  const [diagramDescription, setDiagramDescription] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && isAuthenticated) {
      fetchDiagrams();
    }
  }, [isOpen, isAuthenticated]);

  // When dialog opens and there's a loaded diagram, pre-populate for update
  useEffect(() => {
    if (isOpen && currentDiagramId && diagrams.length > 0) {
      const currentDiagram = diagrams.find(d => d._id === currentDiagramId);
      if (currentDiagram) {
        setEditingId(currentDiagramId);
        setDiagramName(currentDiagram.name);
        setDiagramDescription(currentDiagram.description || '');
      }
    }
  }, [isOpen, currentDiagramId, diagrams]);

  const fetchDiagrams = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await diagramsAPI.getAll();
      setDiagrams(data.diagrams);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!diagramName.trim()) {
      setError('Diagram name is required');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const diagramData = {
        name: diagramName,
        description: diagramDescription,
        nodes: currentNodes,
        edges: currentEdges,
        sqlContent,
        viewport,
      };

      let savedDiagramId = editingId;
      let savedSlug: string | undefined;
      
      if (editingId) {
        const result = await diagramsAPI.update(editingId, diagramData);
        savedSlug = result.diagram?.slug;
        setSuccess('Diagram updated successfully!');
      } else {
        const result = await diagramsAPI.create(diagramData);
        savedDiagramId = result.diagram._id;
        savedSlug = result.diagram.slug;
        setSuccess('Diagram saved successfully!');
      }

      // Notify parent of save completion
      if (onSaveComplete && savedDiagramId) {
        onSaveComplete(savedDiagramId, diagramName, savedSlug);
      }

      setDiagramName('');
      setDiagramDescription('');
      setEditingId(null);
      setMode('list');
      fetchDiagrams();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoad = async (id: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await diagramsAPI.getById(id);
      onLoad(data.diagram);
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    setIsLoading(true);
    setError(null);

    try {
      await diagramsAPI.delete(id);
      diagramToasts.deleted();
      setSuccess('Diagram deleted successfully!');
      setDeleteConfirmId(null);
      fetchDiagrams();
    } catch (err: any) {
      diagramToasts.deleteError(err.message);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDuplicate = async (id: string) => {
    setIsLoading(true);
    setError(null);

    try {
      await diagramsAPI.duplicate(id);
      diagramToasts.created('Diagram copy');
      setSuccess('Diagram duplicated successfully!');
      fetchDiagrams();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (diagram: Diagram) => {
    setDiagramName(diagram.name);
    setDiagramDescription(diagram.description);
    setEditingId(diagram._id);
    setMode('save');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!isOpen) return null;

  // Check if we have a currently loaded diagram
  const currentDiagram = currentDiagramId ? diagrams.find(d => d._id === currentDiagramId) : null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50" style={{ backgroundColor: 'rgba(10, 10, 15, 0.95)', backdropFilter: 'blur(4px)' }}>
      <div className="w-full max-w-2xl mx-4 overflow-hidden max-h-[80vh] flex flex-col" style={{ backgroundColor: '#0a0a0f', border: '1px solid #2a2a3a', boxShadow: '0 0 40px rgba(0, 255, 255, 0.15), inset 0 1px 0 rgba(255,255,255,0.05)' }}>
        {/* Gradient accent line */}
        <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg, #00ffff, #00ff88)' }} />
        
        {/* Header */}
        <div className="px-6 py-4 flex-shrink-0" style={{ backgroundColor: '#0d0d14', borderBottom: '1px solid #2a2a3a' }}>
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold" style={{ color: '#00ffff', fontFamily: "'Orbitron', monospace", textTransform: 'uppercase', letterSpacing: '0.1em', textShadow: '0 0 20px rgba(0,255,255,0.5)' }}>
              {mode === 'list' ? 'MY DIAGRAMS' : editingId ? 'UPDATE DIAGRAM' : 'SAVE DIAGRAM'}
            </h2>
            <div className="flex items-center gap-2">
              {mode === 'list' && (
                <>
                  {currentDiagram && (
                    <button
                      onClick={() => {
                        setMode('save');
                        setEditingId(currentDiagramId || null);
                        setDiagramName(currentDiagram.name);
                        setDiagramDescription(currentDiagram.description || '');
                      }}
                      className="px-3 py-1 text-sm font-mono transition-all"
                      style={{ background: 'linear-gradient(135deg, #00ff88, #00ffff)', color: '#0a0a0f', fontWeight: '600' }}
                      onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 0 15px rgba(0,255,136,0.5)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'none'; }}
                    >
                      UPDATE "{currentDiagram.name}"
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setMode('save');
                      setEditingId(null);
                      setDiagramName('');
                      setDiagramDescription('');
                    }}
                    className="px-3 py-1 text-sm font-mono transition-all"
                    style={{ backgroundColor: 'rgba(0, 255, 255, 0.1)', border: '1px solid rgba(0, 255, 255, 0.3)', color: '#00ffff' }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(0, 255, 255, 0.2)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(0, 255, 255, 0.1)'; }}
                  >
                    SAVE AS NEW
                  </button>
                </>
              )}
              <button
                onClick={onClose}
                className="transition-all p-1"
                style={{ color: '#8a8a9a' }}
                onMouseEnter={(e) => { e.currentTarget.style.color = '#ff3366'; e.currentTarget.style.textShadow = '0 0 10px rgba(255,51,102,0.5)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = '#8a8a9a'; e.currentTarget.style.textShadow = 'none'; }}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1" style={{ backgroundColor: '#0a0a0f' }}>
          {/* Error/Success Messages */}
          {error && (
            <div className="mb-4 p-3 font-mono text-sm" style={{ backgroundColor: 'rgba(255, 51, 102, 0.1)', border: '1px solid rgba(255, 51, 102, 0.4)', color: '#ff3366' }}>
              {error}
            </div>
          )}
          {success && (
            <div className="mb-4 p-3 font-mono text-sm" style={{ backgroundColor: 'rgba(0, 255, 136, 0.1)', border: '1px solid rgba(0, 255, 136, 0.4)', color: '#00ff88' }}>
              {success}
            </div>
          )}

          {/* Save Form */}
          {mode === 'save' && (
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: '#c0c0d0', fontFamily: "'Space Grotesk', sans-serif" }}>
                  Diagram Name *
                </label>
                <input
                  type="text"
                  value={diagramName}
                  onChange={(e) => setDiagramName(e.target.value)}
                  className="w-full px-3 py-2 font-mono text-sm transition-all focus:outline-none"
                  style={{ backgroundColor: '#121218', border: '1px solid #2a2a3a', color: '#f0f0ff' }}
                  placeholder="Enter diagram name"
                  required
                  onFocus={(e) => { e.target.style.borderColor = '#00ffff'; e.target.style.boxShadow = '0 0 10px rgba(0,255,255,0.3)'; }}
                  onBlur={(e) => { e.target.style.borderColor = '#2a2a3a'; e.target.style.boxShadow = 'none'; }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: '#c0c0d0', fontFamily: "'Space Grotesk', sans-serif" }}>
                  Description (Optional)
                </label>
                <textarea
                  value={diagramDescription}
                  onChange={(e) => setDiagramDescription(e.target.value)}
                  className="w-full px-3 py-2 font-mono text-sm transition-all focus:outline-none"
                  style={{ backgroundColor: '#121218', border: '1px solid #2a2a3a', color: '#f0f0ff' }}
                  placeholder="Enter description"
                  rows={3}
                  onFocus={(e) => { e.target.style.borderColor = '#00ffff'; e.target.style.boxShadow = '0 0 10px rgba(0,255,255,0.3)'; }}
                  onBlur={(e) => { e.target.style.borderColor = '#2a2a3a'; e.target.style.boxShadow = 'none'; }}
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setMode('list');
                    setEditingId(null);
                    setDiagramName('');
                    setDiagramDescription('');
                  }}
                  className="flex-1 px-4 py-2 font-mono text-sm transition-all"
                  style={{ backgroundColor: '#1a1a24', border: '1px solid #2a2a3a', color: '#8a8a9a' }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#00ffff'; e.currentTarget.style.color = '#00ffff'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#2a2a3a'; e.currentTarget.style.color = '#8a8a9a'; }}
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 px-4 py-2 font-mono text-sm font-medium transition-all disabled:opacity-50"
                  style={{ background: 'linear-gradient(135deg, #00ffff, #0088ff)', color: '#0a0a0f' }}
                  onMouseEnter={(e) => { if (!e.currentTarget.disabled) e.currentTarget.style.boxShadow = '0 0 15px rgba(0,255,255,0.5)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'none'; }}
                >
                  {isLoading ? 'SAVING...' : editingId ? 'UPDATE' : 'SAVE'}
                </button>
              </div>
            </form>
          )}

          {/* Diagrams List */}
          {mode === 'list' && (
            <>
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="relative inline-block w-8 h-8">
                    <div className="absolute inset-0 animate-spin" style={{ border: '3px solid transparent', borderTopColor: '#00ffff', borderRightColor: '#ff00ff' }} />
                    <div className="absolute inset-1 animate-spin" style={{ border: '2px solid transparent', borderBottomColor: '#00ff88', animationDirection: 'reverse' }} />
                  </div>
                  <p className="mt-2 font-mono text-sm" style={{ color: '#8a8a9a' }}>Loading diagrams...</p>
                </div>
              ) : diagrams.length === 0 ? (
                <div className="text-center py-8">
                  <svg className="mx-auto h-12 w-12" style={{ color: '#2a2a3a' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium" style={{ color: '#c0c0d0', fontFamily: "'Space Grotesk', sans-serif" }}>No diagrams</h3>
                  <p className="mt-1 text-sm font-mono" style={{ color: '#4a4a5a' }}>Get started by saving your first diagram.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {diagrams.map((diagram) => (
                    <div
                      key={diagram._id}
                      className="p-4 transition-all"
                      style={{ backgroundColor: '#0d0d14', border: '1px solid #2a2a3a' }}
                      onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#00ffff'; e.currentTarget.style.boxShadow = '0 0 15px rgba(0,255,255,0.2)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#2a2a3a'; e.currentTarget.style.boxShadow = 'none'; }}
                    >
                      {deleteConfirmId === diagram._id ? (
                        <div className="text-center">
                          <p className="text-sm font-mono mb-3" style={{ color: '#c0c0d0' }}>
                            Delete "<span style={{ color: '#ff3366' }}>{diagram.name}</span>"?
                          </p>
                          <div className="flex gap-2 justify-center">
                            <button
                              onClick={() => setDeleteConfirmId(null)}
                              className="px-3 py-1 text-sm font-mono transition-all"
                              style={{ backgroundColor: '#1a1a24', border: '1px solid #2a2a3a', color: '#8a8a9a' }}
                              onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#00ffff'; e.currentTarget.style.color = '#00ffff'; }}
                              onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#2a2a3a'; e.currentTarget.style.color = '#8a8a9a'; }}
                            >
                              CANCEL
                            </button>
                            <button
                              onClick={() => handleDelete(diagram._id)}
                              className="px-3 py-1 text-sm font-mono font-medium transition-all"
                              style={{ background: 'linear-gradient(135deg, #ff3366, #ff0055)', color: '#fff' }}
                              onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 0 15px rgba(255,51,102,0.5)'; }}
                              onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'none'; }}
                            >
                              DELETE
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex justify-between items-start">
                            <div className="flex-1 min-w-0">
                              <h3 className="text-lg font-medium truncate" style={{ color: '#f0f0ff', fontFamily: "'Space Grotesk', sans-serif" }}>
                                {diagram.name}
                              </h3>
                              {diagram.description && (
                                <p className="text-sm truncate mt-1 font-mono" style={{ color: '#8a8a9a' }}>
                                  {diagram.description}
                                </p>
                              )}
                              <p className="text-xs mt-2 font-mono" style={{ color: '#4a4a5a' }}>
                                Updated: {formatDate(diagram.updatedAt)}
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-2 mt-3">
                            <button
                              onClick={() => handleLoad(diagram._id)}
                              className="flex-1 px-3 py-1.5 text-sm font-mono font-medium transition-all"
                              style={{ background: 'linear-gradient(135deg, #00ffff, #0088ff)', color: '#0a0a0f' }}
                              onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 0 15px rgba(0,255,255,0.5)'; }}
                              onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'none'; }}
                            >
                              LOAD
                            </button>
                            <button
                              onClick={() => handleEdit(diagram)}
                              className="px-3 py-1.5 transition-all"
                              title="Edit"
                              style={{ backgroundColor: '#1a1a24', border: '1px solid #2a2a3a', color: '#8a8a9a' }}
                              onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#ff8800'; e.currentTarget.style.color = '#ff8800'; }}
                              onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#2a2a3a'; e.currentTarget.style.color = '#8a8a9a'; }}
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleDuplicate(diagram._id)}
                              className="px-3 py-1.5 transition-all"
                              title="Duplicate"
                              style={{ backgroundColor: '#1a1a24', border: '1px solid #2a2a3a', color: '#8a8a9a' }}
                              onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#8855ff'; e.currentTarget.style.color = '#8855ff'; }}
                              onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#2a2a3a'; e.currentTarget.style.color = '#8a8a9a'; }}
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => setDeleteConfirmId(diagram._id)}
                              className="px-3 py-1.5 transition-all"
                              title="Delete"
                              style={{ backgroundColor: '#1a1a24', border: '1px solid rgba(255, 51, 102, 0.4)', color: '#ff3366' }}
                              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255, 51, 102, 0.1)'; e.currentTarget.style.boxShadow = '0 0 10px rgba(255,51,102,0.3)'; }}
                              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#1a1a24'; e.currentTarget.style.boxShadow = 'none'; }}
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default SavedDiagramsDialog;
