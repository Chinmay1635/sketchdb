import React, { useState, useEffect } from 'react';
import { useStorage } from '../context/storage-context';

interface CreateDiagramDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onDiagramCreated?: (diagramId: number) => void;
}

export const CreateDiagramDialog: React.FC<CreateDiagramDialogProps> = ({
  isOpen,
  onClose,
  onDiagramCreated
}) => {
  const { createDiagram, listDiagrams } = useStorage();
  const [diagramName, setDiagramName] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [diagramNumber, setDiagramNumber] = useState(1);

  // Calculate next diagram number when dialog opens
  useEffect(() => {
    if (isOpen) {
      const fetchDiagrams = async () => {
        try {
          const diagrams = await listDiagrams();
          const nextNumber = diagrams.length + 1;
          setDiagramNumber(nextNumber);
          setDiagramName(`Diagram ${nextNumber}`);
        } catch (error) {
          console.error('Failed to fetch diagrams for numbering:', error);
          setDiagramName('New Diagram');
        }
      };
      fetchDiagrams();
    }
  }, [isOpen, listDiagrams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!diagramName.trim()) return;

    try {
      setIsLoading(true);
      const newDiagram = await createDiagram(
        diagramName.trim(),
        description.trim() || undefined
      );
      
      if (newDiagram.id) {
        onDiagramCreated?.(newDiagram.id);
      }
      
      handleClose();
    } catch (error) {
      console.error('Failed to create diagram:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setDiagramName('');
    setDescription('');
    setIsLoading(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Create New Diagram</h2>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              disabled={isLoading}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="diagram-name" className="block text-sm font-medium text-gray-700 mb-2">
                Diagram Name
              </label>
              <input
                id="diagram-name"
                type="text"
                value={diagramName}
                onChange={(e) => setDiagramName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter diagram name..."
                autoFocus
                disabled={isLoading}
              />
            </div>

            <div>
              <label htmlFor="diagram-description" className="block text-sm font-medium text-gray-700 mb-2">
                Description (Optional)
              </label>
              <textarea
                id="diagram-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                placeholder="Add a description for this diagram..."
                disabled={isLoading}
              />
            </div>

            <div className="flex gap-3 justify-end pt-4">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                disabled={!diagramName.trim() || isLoading}
              >
                {isLoading && (
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
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
                )}
                Create Diagram
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};