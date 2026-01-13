import React, { useState, useEffect } from "react";
import { useStorage } from "../context/storage-context";
import { CreateDiagramDialog } from "./CreateDiagramDialog";
import { OpenDiagramDialog } from "./OpenDiagramDialog";

interface ToolbarProps {
  onAddTable: () => void;
  onExportSQL: () => void;
  onImportSchema: () => void;
  onExportPNG: () => void;
  onExportPDF: () => void;
  onManualSave?: () => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({ 
  onAddTable, 
  onExportSQL, 
  onImportSchema,
  onExportPNG,
  onExportPDF,
  onManualSave
}) => {
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showManageMenu, setShowManageMenu] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showOpenDialog, setShowOpenDialog] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState('');

  const { currentDiagram, updateDiagram } = useStorage();

  // Update edited name when current diagram changes
  useEffect(() => {
    if (currentDiagram) {
      setEditedName(currentDiagram.name);
    }
  }, [currentDiagram]);

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
        setEditedName(currentDiagram.name);
      }
    }
    
    setIsEditingName(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveName();
    } else if (e.key === 'Escape') {
      setIsEditingName(false);
      if (currentDiagram) {
        setEditedName(currentDiagram.name);
      }
    }
  };

  const exportOptions = [
    {
      label: "Export SQL",
      onClick: onExportSQL,
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      description: "Export as SQL script"
    },
    {
      label: "Export PNG",
      onClick: onExportPNG,
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      description: "Export as PNG image"
    },
    {
      label: "Export PDF", 
      onClick: onExportPDF,
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      ),
      description: "Export as PDF document"
    }
  ];

  const manageOptions = [
    {
      label: "New Diagram",
      onClick: () => {
        setShowCreateDialog(true);
        setShowManageMenu(false);
      },
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
      ),
      description: "Create a new diagram"
    },
    {
      label: "Open Diagram",
      onClick: () => {
        setShowOpenDialog(true);
        setShowManageMenu(false);
      },
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-5l-2-2H5a2 2 0 00-2 2z" />
        </svg>
      ),
      description: "Open an existing diagram"
    },
    {
      label: "Rename Diagram",
      onClick: () => {
        if (currentDiagram) {
          setIsEditingName(true);
          setShowManageMenu(false);
        }
      },
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      ),
      description: "Rename current diagram",
      disabled: !currentDiagram
    }
  ];

  return (
    <>
      {/* Navbar */}
      <nav className="absolute top-0 left-0 right-0 h-14 bg-slate-800 shadow-lg z-20 flex items-center px-4">
        {/* Logo/Brand */}
        <div className="flex items-center gap-2 mr-6">
          <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
          </svg>
          <span className="text-white font-bold text-lg hidden sm:block">Schema Designer</span>
        </div>

        {/* Current Diagram Name */}
        <div className="flex items-center gap-2 mr-4 min-w-0">
          {isEditingName ? (
            <input
              type="text"
              value={editedName}
              onChange={(e) => setEditedName(e.target.value)}
              onKeyDown={handleKeyPress}
              onBlur={handleSaveName}
              className="px-2 py-1 text-sm bg-slate-700 border border-slate-500 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500 w-48"
              autoFocus
            />
          ) : (
            <div className="flex items-center gap-2 text-slate-300 text-sm truncate">
              <span className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></span>
              <span className="truncate max-w-[150px]" title={currentDiagram?.name || 'No diagram'}>
                {currentDiagram?.name || 'No diagram selected'}
              </span>
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="w-px h-8 bg-slate-600 mr-4"></div>

        {/* Navigation Buttons */}
        <div className="flex items-center gap-1">
          {/* Manage Dropdown */}
          <div 
            className="relative"
            onMouseEnter={() => setShowManageMenu(true)}
            onMouseLeave={() => setShowManageMenu(false)}
          >
            <button
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-200 hover:bg-slate-700 rounded-md transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <span>Manage</span>
              <svg 
                className={`w-3 h-3 transition-transform duration-200 ${showManageMenu ? 'rotate-180' : ''}`}
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Manage Dropdown Menu */}
            {showManageMenu && (
              <div className="absolute top-full left-0 mt-1 w-56 bg-white rounded-lg shadow-xl border border-gray-200 py-1 z-30">
                {manageOptions.map((option, index) => (
                  <button
                    key={index}
                    onClick={option.onClick}
                    disabled={option.disabled}
                    className={`w-full px-3 py-2.5 text-left flex items-center gap-3 transition-colors ${
                      option.disabled 
                        ? 'opacity-50 cursor-not-allowed bg-gray-50' 
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <span className="text-gray-600">{option.icon}</span>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 text-sm">{option.label}</div>
                      <div className="text-xs text-gray-500">{option.description}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Add Table Button */}
          <button
            onClick={onAddTable}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-200 hover:bg-slate-700 rounded-md transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span>Add Table</span>
          </button>

          {/* Import Schema Button */}
          <button
            onClick={onImportSchema}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-200 hover:bg-slate-700 rounded-md transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            <span>Import</span>
          </button>

          {/* Export Dropdown */}
          <div 
            className="relative"
            onMouseEnter={() => setShowExportMenu(true)}
            onMouseLeave={() => setShowExportMenu(false)}
          >
            <button
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-200 hover:bg-slate-700 rounded-md transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>Export</span>
              <svg 
                className={`w-3 h-3 transition-transform duration-200 ${showExportMenu ? 'rotate-180' : ''}`}
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Export Dropdown Menu */}
            {showExportMenu && (
              <div className="absolute top-full left-0 mt-1 w-56 bg-white rounded-lg shadow-xl border border-gray-200 py-1 z-30">
                {exportOptions.map((option, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      option.onClick();
                      setShowExportMenu(false);
                    }}
                    className="w-full px-3 py-2.5 text-left hover:bg-gray-50 flex items-center gap-3 transition-colors"
                  >
                    <span className="text-gray-600">{option.icon}</span>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 text-sm">{option.label}</div>
                      <div className="text-xs text-gray-500">{option.description}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Save Button */}
          {onManualSave && (
            <button
              onClick={onManualSave}
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 rounded-md transition-colors ml-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
              </svg>
              <span>Save</span>
            </button>
          )}
        </div>
      </nav>

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
