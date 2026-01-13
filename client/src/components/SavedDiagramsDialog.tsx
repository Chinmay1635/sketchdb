import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { diagramsAPI } from '../services/api';

interface Diagram {
  _id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

interface SavedDiagramsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onLoad: (diagram: any) => void;
  onSaveComplete?: (diagramId: string, diagramName: string) => void;
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
      
      if (editingId) {
        await diagramsAPI.update(editingId, diagramData);
        setSuccess('Diagram updated successfully!');
      } else {
        const result = await diagramsAPI.create(diagramData);
        savedDiagramId = result.diagram._id;
        setSuccess('Diagram saved successfully!');
      }

      // Notify parent of save completion
      if (onSaveComplete && savedDiagramId) {
        onSaveComplete(savedDiagramId, diagramName);
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
      setSuccess('Diagram deleted successfully!');
      setDeleteConfirmId(null);
      fetchDiagrams();
    } catch (err: any) {
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 overflow-hidden max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4 flex-shrink-0">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-white">
              {mode === 'list' ? 'My Diagrams' : editingId ? 'Update Diagram' : 'Save Diagram'}
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
                      className="bg-green-500/80 text-white px-3 py-1 rounded hover:bg-green-500 transition-colors text-sm"
                    >
                      Update "{currentDiagram.name}"
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setMode('save');
                      setEditingId(null);
                      setDiagramName('');
                      setDiagramDescription('');
                    }}
                    className="bg-white/20 text-white px-3 py-1 rounded hover:bg-white/30 transition-colors text-sm"
                  >
                    Save as New
                  </button>
                </>
              )}
              <button
                onClick={onClose}
                className="text-white hover:text-gray-200 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {/* Error/Success Messages */}
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
              {success}
            </div>
          )}

          {/* Save Form */}
          {mode === 'save' && (
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Diagram Name *
                </label>
                <input
                  type="text"
                  value={diagramName}
                  onChange={(e) => setDiagramName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Enter diagram name"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description (Optional)
                </label>
                <textarea
                  value={diagramDescription}
                  onChange={(e) => setDiagramDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Enter description"
                  rows={3}
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
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors disabled:opacity-50"
                >
                  {isLoading ? 'Saving...' : editingId ? 'Update' : 'Save'}
                </button>
              </div>
            </form>
          )}

          {/* Diagrams List */}
          {mode === 'list' && (
            <>
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-indigo-600 border-t-transparent"></div>
                  <p className="mt-2 text-gray-600">Loading diagrams...</p>
                </div>
              ) : diagrams.length === 0 ? (
                <div className="text-center py-8">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No diagrams</h3>
                  <p className="mt-1 text-sm text-gray-500">Get started by saving your first diagram.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {diagrams.map((diagram) => (
                    <div
                      key={diagram._id}
                      className="border border-gray-200 rounded-lg p-4 hover:border-indigo-300 hover:shadow-sm transition-all"
                    >
                      {deleteConfirmId === diagram._id ? (
                        <div className="text-center">
                          <p className="text-sm text-gray-700 mb-3">
                            Are you sure you want to delete "{diagram.name}"?
                          </p>
                          <div className="flex gap-2 justify-center">
                            <button
                              onClick={() => setDeleteConfirmId(null)}
                              className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => handleDelete(diagram._id)}
                              className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex justify-between items-start">
                            <div className="flex-1 min-w-0">
                              <h3 className="text-lg font-medium text-gray-900 truncate">
                                {diagram.name}
                              </h3>
                              {diagram.description && (
                                <p className="text-sm text-gray-500 truncate mt-1">
                                  {diagram.description}
                                </p>
                              )}
                              <p className="text-xs text-gray-400 mt-2">
                                Updated: {formatDate(diagram.updatedAt)}
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-2 mt-3">
                            <button
                              onClick={() => handleLoad(diagram._id)}
                              className="flex-1 bg-indigo-600 text-white px-3 py-1.5 rounded text-sm hover:bg-indigo-700 transition-colors"
                            >
                              Load
                            </button>
                            <button
                              onClick={() => handleEdit(diagram)}
                              className="px-3 py-1.5 border border-gray-300 rounded text-sm hover:bg-gray-50 transition-colors"
                              title="Edit"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleDuplicate(diagram._id)}
                              className="px-3 py-1.5 border border-gray-300 rounded text-sm hover:bg-gray-50 transition-colors"
                              title="Duplicate"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => setDeleteConfirmId(diagram._id)}
                              className="px-3 py-1.5 border border-red-300 text-red-600 rounded text-sm hover:bg-red-50 transition-colors"
                              title="Delete"
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
