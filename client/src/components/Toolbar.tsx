import React, { useState, useRef, useEffect } from "react";
import UserMenu from "./UserMenu";

interface ToolbarProps {
  onAddTable: () => void;
  onExportSQL: () => void;
  onImportSchema: () => void;
  onExportPNG: () => void;
  onExportPDF: () => void;
  onExportSQLFile: () => void;
  onImportSQLFile: (sqlText: string) => void;
  onSave?: () => void;
  onShare?: () => void;
  isSaving?: boolean;
  lastSavedAt?: Date | null;
  currentDiagramName?: string | null;
  currentDiagramId?: string | null;
  isAuthenticated?: boolean;
  onLoginClick?: () => void;
  onSavedDiagramsClick?: () => void;
  isReadOnly?: boolean;
}

// Dropdown Menu Component
interface DropdownMenuProps {
  label: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

const DropdownMenu: React.FC<DropdownMenuProps> = ({ label, icon, children, className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-200 hover:bg-gray-700 rounded-md transition-colors"
      >
        {icon}
        {label}
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 min-w-[200px] bg-gray-800 border border-gray-700 rounded-lg shadow-lg py-1 z-50">
          {children}
        </div>
      )}
    </div>
  );
};

// Dropdown Item Component
interface DropdownItemProps {
  onClick: () => void;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

const DropdownItem: React.FC<DropdownItemProps> = ({ onClick, icon, children, className = '' }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-200 hover:bg-gray-700 transition-colors ${className}`}
  >
    {icon}
    {children}
  </button>
);

const DropdownDivider = () => <div className="border-t border-gray-700 my-1" />;

export const Toolbar: React.FC<ToolbarProps> = ({ 
  onAddTable, 
  onExportSQL, 
  onImportSchema,
  onExportPNG,
  onExportPDF,
  onExportSQLFile,
  onImportSQLFile,
  onSave,
  onShare,
  isSaving,
  lastSavedAt,
  currentDiagramName,
  currentDiagramId,
  isAuthenticated,
  onLoginClick,
  onSavedDiagramsClick,
  isReadOnly
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const formatLastSaved = (date: Date | null | undefined) => {
    if (!date) return null;
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = typeof reader.result === 'string' ? reader.result : '';
      onImportSQLFile(text);
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.onerror = () => {
      console.error('Failed to read SQL file');
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  return (
    <>
      {/* Read-only banner for public viewers */}
      {isReadOnly && (
        <div className="fixed top-0 left-0 right-0 h-8 bg-yellow-600 text-black text-sm font-medium flex items-center justify-center z-[60]">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          View-only mode — Sign in to create your own diagrams
        </div>
      )}
      
      {/* Navbar */}
      <nav className={`fixed left-0 right-0 h-14 bg-gray-900 border-b border-gray-700 shadow-sm z-50 ${isReadOnly ? 'top-8' : 'top-0'}`}>
        <div className="h-full px-4 flex items-center justify-between">
          {/* Left section - Logo and Diagram info */}
          <div className="flex items-center gap-4">
            {/* Logo/Brand */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                </svg>
              </div>
              <span className="text-lg font-bold text-gray-100">SketchDB</span>
            </div>

            {/* Divider */}
            <div className="w-px h-6 bg-gray-700" />

            {/* Read-only diagram name */}
            {isReadOnly && currentDiagramName && (
              <span className="text-sm text-gray-300 max-w-[200px] truncate" title={currentDiagramName}>
                📄 {currentDiagramName}
              </span>
            )}
          </div>

          {/* Center section - Main actions (hidden in read-only mode) */}
          {!isReadOnly && (
          <div className="flex items-center gap-1">
            {/* Add Table Button */}
            <button
              onClick={onAddTable}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-yellow-500 hover:bg-yellow-600 rounded-md transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Add Table
            </button>

            {/* Import Dropdown */}
            <DropdownMenu
              label="Import"
              icon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
              }
            >
              <DropdownItem
                onClick={onImportSchema}
                icon={
                  <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                }
              >
                Import Schema
              </DropdownItem>
              <DropdownItem
                onClick={() => fileInputRef.current?.click()}
                icon={
                  <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                }
              >
                Import SQL File
              </DropdownItem>
            </DropdownMenu>

            {/* Export Dropdown */}
            <DropdownMenu
              label="Export"
              icon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              }
            >
              <DropdownItem
                onClick={onExportSQL}
                icon={
                  <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                }
              >
                View SQL
              </DropdownItem>
              <DropdownItem
                onClick={onExportSQLFile}
                icon={
                  <svg className="w-4 h-4 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                }
              >
                Download SQL
              </DropdownItem>
              <DropdownDivider />
              <DropdownItem
                onClick={onExportPNG}
                icon={
                  <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                }
              >
                Export as PNG
              </DropdownItem>
              <DropdownItem
                onClick={onExportPDF}
                icon={
                  <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                }
              >
                Export as PDF
              </DropdownItem>
            </DropdownMenu>
          </div>
          )}

          {/* Right section - Save button, Share button, status, and User Menu */}
          <div className="flex items-center gap-3">
            {/* Read-only mode: show View SQL button */}
            {isReadOnly && (
              <button
                onClick={onExportSQL}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                View SQL
              </button>
            )}
            
            {isAuthenticated && onSave && !isReadOnly && (
              <>
                {/* Last saved timestamp */}
                {lastSavedAt && (
                  <span className="text-xs text-gray-400">
                    Saved {formatLastSaved(lastSavedAt)}
                  </span>
                )}
                
                {/* Current diagram name */}
                {currentDiagramName && (
                  <span className="text-sm text-gray-300 max-w-[150px] truncate" title={currentDiagramName}>
                    {currentDiagramName}
                  </span>
                )}

                {/* Share button */}
                {currentDiagramId && onShare && (
                  <button
                    onClick={onShare}
                    className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                    </svg>
                    Share
                  </button>
                )}
                
                {/* Save button */}
                <button
                  onClick={onSave}
                  disabled={isSaving}
                  className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    isSaving 
                      ? 'bg-gray-600 text-gray-400 cursor-not-allowed' 
                      : 'bg-green-600 text-white hover:bg-green-700'
                  }`}
                >
                  {isSaving ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Saving...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                      </svg>
                      Save
                    </>
                  )}
                </button>
              </>
            )}
            
            {/* User Menu */}
            <UserMenu
              onLoginClick={onLoginClick || (() => {})}
              onSavedDiagramsClick={onSavedDiagramsClick || (() => {})}
            />
          </div>
        </div>
      </nav>

      {/* Hidden file input for SQL file import */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".sql,text/sql"
        className="hidden"
        onChange={handleFileChange}
        title="Upload SQL file"
        aria-label="Upload SQL file"
      />
    </>
  );
};
