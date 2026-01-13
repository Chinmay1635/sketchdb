import React, { useState, useEffect } from 'react';
import { useStorage } from '../context/storage-context';
import { Diagram } from '../lib/database';

interface OpenDiagramDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onDiagramSelected?: (diagramId: number) => void;
}

export const OpenDiagramDialog: React.FC<OpenDiagramDialogProps> = ({
  isOpen,
  onClose,
  onDiagramSelected
}) => {
  const { currentDiagram, listDiagrams, loadDiagram, deleteDiagram } = useStorage();
  const [diagrams, setDiagrams] = useState<Diagram[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  // Load diagrams when dialog opens
  useEffect(() => {
    if (isOpen) {
      loadDiagramList();
    }
  }, [isOpen]);

  const loadDiagramList = async () => {
    try {
      setIsLoading(true);
      const diagramList = await listDiagrams();
      // Sort by most recently updated (ChartDB style)
      const sortedDiagrams = diagramList.sort((a, b) => 
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
      setDiagrams(sortedDiagrams);
    } catch (error) {
      console.error('Failed to load diagrams:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDiagramSelect = async (diagramId: number) => {
    if (diagramId === currentDiagram?.id) {
      onClose();
      return;
    }
    
    try {
      setIsLoading(true);
      await loadDiagram(diagramId);
      onDiagramSelected?.(diagramId);
      onClose();
    } catch (error) {
      console.error('Failed to load diagram:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteDiagram = async (diagramId: number) => {
    try {
      setIsLoading(true);
      await deleteDiagram(diagramId);
      await loadDiagramList(); // Refresh the list
      setDeleteConfirmId(null);
    } catch (error) {
      console.error('Failed to delete diagram:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - new Date(date).getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return new Date(date).toLocaleDateString();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Open Diagram</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              disabled={isLoading}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-96">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="flex items-center gap-2 text-gray-500">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Loading diagrams...
              </div>
            </div>
          ) : diagrams.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <div className="text-lg mb-2">No diagrams found</div>
              <div className="text-sm">Create your first diagram to get started</div>
            </div>
          ) : (
            <div className="space-y-3">
              {diagrams.map((diagram) => (
                <div
                  key={diagram.id}
                  className={`group flex items-center justify-between p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                    diagram.id === currentDiagram?.id
                      ? 'bg-blue-50 border-blue-300 shadow-sm'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => diagram.id && handleDiagramSelect(diagram.id)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium text-gray-900 truncate">
                        {diagram.name}
                      </h3>
                      {diagram.id === currentDiagram?.id && (
                        <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full">
                          Current
                        </span>
                      )}
                    </div>
                    
                    {diagram.description && (
                      <p className="text-sm text-gray-600 truncate mb-1">
                        {diagram.description}
                      </p>
                    )}
                    
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>Modified: {formatDate(diagram.updatedAt)}</span>
                      <span>Created: {formatDate(diagram.createdAt)}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    {diagram.id !== currentDiagram?.id && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteConfirmId(diagram.id || null);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-all"
                        title={`Delete ${diagram.name}`}
                        disabled={isLoading}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Delete confirmation dialog */}
        {deleteConfirmId && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Diagram</h3>
              <p className="text-gray-600 mb-4">
                Are you sure you want to delete this diagram? This action cannot be undone.
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setDeleteConfirmId(null)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                  disabled={isLoading}
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeleteDiagram(deleteConfirmId)}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors disabled:opacity-50"
                  disabled={isLoading}
                >
                  {isLoading ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};