import React, { useState, useEffect } from 'react';
import { useStorage } from '../context/storage-context';
import { Diagram } from '../lib/database';
import { CreateDiagramDialog } from './CreateDiagramDialog';
import { OpenDiagramDialog } from './OpenDiagramDialog';

interface DiagramSelectorProps {
  className?: string;
}

export const DiagramSelector: React.FC<DiagramSelectorProps> = ({ className = '' }) => {
  const { currentDiagram, updateDiagram } = useStorage();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showOpenDialog, setShowOpenDialog] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState('');

  // Update edited name when current diagram changes
  useEffect(() => {
    if (currentDiagram) {
      setEditedName(currentDiagram.name);
    }
  }, [currentDiagram]);

  const handleStartEditing = () => {
    if (currentDiagram) {
      setIsEditingName(true);
      setEditedName(currentDiagram.name);
    }
  };

  const handleSaveName = async () => {
    if (!currentDiagram?.id || !editedName.trim()) {
      setIsEditingName(false);
      return;
    }

    if (editedName.trim() !== currentDiagram.name) {
      try {
        await updateDiagram(currentDiagram.id, { name: editedName.trim() });
      } catch (error) {
        console.error('Failed to update diagram name:', error);
        setEditedName(currentDiagram.name); // Revert on error
      }
    }
    
    setIsEditingName(false);
  };

  const handleCancelEditing = () => {
    setIsEditingName(false);
    if (currentDiagram) {
      setEditedName(currentDiagram.name);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveName();
    } else if (e.key === 'Escape') {
      handleCancelEditing();
    }
  };

  return (
    <>
      <div className={`bg-white border rounded-lg shadow-sm ${className}`}>
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-800">Schema Diagrams</h3>
            <div className="flex gap-2">
              <button
                onClick={() => setShowOpenDialog(true)}
                className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors flex items-center gap-1"
                title="Open diagram"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-5l-2-2H5a2 2 0 00-2 2z" />
                </svg>
                Open
              </button>
              <button
                onClick={() => setShowCreateDialog(true)}
                className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors flex items-center gap-1"
                title="Create new diagram"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                New
              </button>
            </div>
          </div>
        </div>

        {/* Current diagram */}
        <div className="p-4">
          {currentDiagram ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm font-medium text-gray-600">Current Diagram</span>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                {/* Diagram name - editable */}
                {isEditingName ? (
                  <div className="flex items-center gap-2 mb-2">
                    <input
                      type="text"
                      value={editedName}
                      onChange={(e) => setEditedName(e.target.value)}
                      onKeyDown={handleKeyPress}
                      onBlur={handleSaveName}
                      className="flex-1 px-2 py-1 text-lg font-semibold bg-white border border-blue-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      autoFocus
                    />
                    <button
                      onClick={handleSaveName}
                      className="p-1 text-green-600 hover:text-green-700"
                      title="Save name"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </button>
                    <button
                      onClick={handleCancelEditing}
                      className="p-1 text-red-600 hover:text-red-700"
                      title="Cancel"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ) : (
                  <div 
                    className="flex items-center justify-between mb-2 group cursor-pointer"
                    onClick={handleStartEditing}
                  >
                    <h4 className="text-lg font-semibold text-blue-900">
                      {currentDiagram.name}
                    </h4>
                    <button
                      className="opacity-0 group-hover:opacity-100 p-1 text-blue-600 hover:text-blue-700 transition-opacity"
                      title="Edit name"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                  </div>
                )}

                {/* Diagram description */}
                {currentDiagram.description && (
                  <p className="text-sm text-blue-700 mb-2">{currentDiagram.description}</p>
                )}

                {/* Diagram metadata */}
                <div className="flex items-center gap-4 text-xs text-blue-600">
                  <span>
                    Modified: {new Date(currentDiagram.updatedAt).toLocaleDateString()}
                  </span>
                  <span>
                    Created: {new Date(currentDiagram.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {/* Quick actions */}
              <div className="flex gap-2 text-sm">
                <button
                  onClick={() => setShowOpenDialog(true)}
                  className="flex items-center gap-1 px-2 py-1 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                  </svg>
                  Switch Diagram
                </button>
                <button
                  onClick={() => setShowCreateDialog(true)}
                  className="flex items-center gap-1 px-2 py-1 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  New Diagram
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-gray-400 mb-4">
                <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h4 className="text-lg font-medium text-gray-900 mb-2">No diagram selected</h4>
              <p className="text-gray-600 mb-4">Create a new diagram or open an existing one to get started</p>
              <div className="flex gap-2 justify-center">
                <button
                  onClick={() => setShowCreateDialog(true)}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
                >
                  Create New Diagram
                </button>
                <button
                  onClick={() => setShowOpenDialog(true)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                >
                  Open Existing
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Dialogs */}
      <CreateDiagramDialog
        isOpen={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
      />
      
      <OpenDiagramDialog
        isOpen={showOpenDialog}
        onClose={() => setShowOpenDialog(false)}
      />
    </>
  );
};