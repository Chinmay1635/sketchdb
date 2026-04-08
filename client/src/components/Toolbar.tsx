import React, { useState, useRef, useEffect } from "react";
import UserMenu from "./UserMenu";

interface ToolbarProps {
  onAddTable: () => void;
  onUndo?: () => void;
  canUndo?: boolean;
  onExportSQL: () => void;
  onSyncDatabase?: () => void;
  onImportSchema: () => void;
  onExportPNG: () => void;
  onExportPDF: () => void;
  onExportSQLFile: () => void;
  onImportSQLFile: (sqlText: string) => void;
  onSave?: () => void;
  onShare?: () => void;
  onAIAssistantClick?: () => void;
  isSaving?: boolean;
  lastSavedAt?: Date | null;
  currentDiagramName?: string | null;
  currentDiagramId?: string | null;
  isAuthenticated?: boolean;
  onLoginClick?: () => void;
  onSavedDiagramsClick?: () => void;
  onMyDiagramsClick?: () => void;
  isReadOnly?: boolean;
}

// Clean dropdown menu
interface DropdownMenuProps {
  label: string;
  children: React.ReactNode;
  className?: string;
}

const DropdownMenu: React.FC<DropdownMenuProps> = ({ label, children, className = '' }) => {
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
        className="px-3 py-1.5 text-sm text-slate-300 hover:text-white hover:bg-white/5 rounded transition-colors"
      >
        {label}
      </button>
      {isOpen && (
        <div 
          className="absolute top-full mt-1 min-w-[180px] rounded-md overflow-hidden z-50"
          style={{ 
            backgroundColor: '#1e1e2e',
            border: '1px solid rgba(255,255,255,0.08)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          }}
        >
          <div className="py-1">
            {React.Children.map(children, child => {
              if (React.isValidElement(child)) {
                return React.cloneElement(child as React.ReactElement<any>, {
                  onClick: () => {
                    (child as React.ReactElement<any>).props.onClick?.();
                    setIsOpen(false);
                  }
                });
              }
              return child;
            })}
          </div>
        </div>
      )}
    </div>
  );
};

// Clean dropdown item
interface DropdownItemProps {
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
  shortcut?: string;
}

const DropdownItem: React.FC<DropdownItemProps> = ({ onClick, children, className = '', shortcut }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center justify-between px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-white/5 transition-colors ${className}`}
  >
    <span>{children}</span>
    {shortcut && <span className="text-xs text-slate-500 ml-4">{shortcut}</span>}
  </button>
);

const DropdownDivider = () => <div className="border-t border-white/5 my-1" />;

export const Toolbar: React.FC<ToolbarProps> = ({ 
  onAddTable, 
  onUndo,
  canUndo = false,
  onExportSQL, 
  onSyncDatabase,
  onImportSchema,
  onExportPNG,
  onExportPDF,
  onExportSQLFile,
  onImportSQLFile,
  onSave,
  onShare,
  onAIAssistantClick,
  isSaving,
  lastSavedAt,
  currentDiagramName,
  currentDiagramId,
  isAuthenticated,
  onLoginClick,
  onSavedDiagramsClick,
  onMyDiagramsClick,
  isReadOnly
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  useEffect(() => {
    const handleClickOutside = () => {
      if (mobileMenuOpen) setMobileMenuOpen(false);
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [mobileMenuOpen]);

  return (
    <>
      {/* Read-only banner */}
      {isReadOnly && (
        <div 
          className="fixed top-0 left-0 right-0 h-7 text-xs font-medium flex items-center justify-center z-[60]"
          style={{ backgroundColor: '#f59e0b', color: '#1a1a2e' }}
        >
          <svg className="w-3.5 h-3.5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          View Only — {isAuthenticated ? 'You have view-only access' : 'Sign in to create your own'}
        </div>
      )}
      
      {/* Navbar */}
      <nav 
        className={`fixed left-0 right-0 h-12 z-50 flex items-center ${isReadOnly ? 'top-7' : 'top-0'}`}
        style={{
          backgroundColor: '#141420',
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
        }}
      >
        <div className="h-full w-full px-3 flex items-center">
          {/* Left: Logo + Menu Items */}
          <div className="flex items-center gap-1 flex-shrink-0">
            {/* Logo */}
            <a href="/" className="flex items-center gap-2 mr-3 hover:opacity-90 transition-opacity">
              <div className="w-7 h-7 rounded flex items-center justify-center overflow-hidden">
                <img className='w-full h-full' src="/logo.png" alt="SketchDB" />
              </div>
              <span className="text-sm font-bold text-white hidden sm:inline">
                Sketch<span style={{ color: '#14b8a6' }}>DB</span>
              </span>
            </a>

            {/* Desktop Menu Items */}
            {!isReadOnly && (
              <div className="hidden md:flex items-center">
                {/* Actions menu */}
                <DropdownMenu label="Actions">
                  <DropdownItem onClick={onAddTable}>Add Table</DropdownItem>
                  {onUndo && (
                    <DropdownItem onClick={onUndo} shortcut="Ctrl+Z" className={!canUndo ? 'opacity-50 pointer-events-none' : ''}>
                      Undo
                    </DropdownItem>
                  )}
                  {isAuthenticated && onSave && (
                    <DropdownItem onClick={onSave} shortcut="Ctrl+S">
                      {isSaving ? 'Saving...' : 'Save'}
                    </DropdownItem>
                  )}
                  {isAuthenticated && onMyDiagramsClick && (
                    <DropdownItem onClick={onMyDiagramsClick}>My Diagrams</DropdownItem>
                  )}
                  <DropdownDivider />
                  {isAuthenticated && currentDiagramId && onAIAssistantClick && (
                    <DropdownItem onClick={onAIAssistantClick}>AI Assistant</DropdownItem>
                  )}
                </DropdownMenu>

                {/* Edit menu */}
                <DropdownMenu label="Edit">
                  <DropdownItem onClick={onImportSchema}>Import Schema</DropdownItem>
                  <DropdownItem onClick={() => fileInputRef.current?.click()}>Import SQL File</DropdownItem>
                </DropdownMenu>

                {/* View menu */}
                <DropdownMenu label="View">
                  <DropdownItem onClick={onExportSQL}>View SQL</DropdownItem>
                  {onSyncDatabase && (
                    <DropdownItem onClick={onSyncDatabase}>Sync to Database</DropdownItem>
                  )}
                </DropdownMenu>

                {/* Export menu */}
                <DropdownMenu label="Export">
                  <DropdownItem onClick={onExportSQLFile}>Download SQL</DropdownItem>
                  <DropdownDivider />
                  <DropdownItem onClick={onExportPNG}>Export as PNG</DropdownItem>
                  <DropdownItem onClick={onExportPDF}>Export as PDF</DropdownItem>
                </DropdownMenu>
              </div>
            )}
          </div>

          {/* Center: Diagram name + badge */}
          <div className="flex-1 flex items-center justify-center gap-2 min-w-0">
            {currentDiagramName ? (
              <>
                <span className="text-sm text-slate-300 truncate max-w-[200px]" title={currentDiagramName}>
                  {currentDiagramName}
                </span>
                <span 
                  className="text-[10px] px-2 py-0.5 rounded-full font-medium flex-shrink-0"
                  style={{ backgroundColor: '#7c3aed', color: '#fff' }}
                >
                  {isReadOnly ? 'View Only' : 'Playground'}
                </span>
              </>
            ) : (
              <>
                <span className="text-sm text-slate-400">Untitled</span>
                <span 
                  className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                  style={{ backgroundColor: '#7c3aed', color: '#fff' }}
                >
                  Playground
                </span>
              </>
            )}
          </div>

          {/* Right: Share + Sign in */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Read-only view SQL */}
            {isReadOnly && (
              <button
                onClick={onExportSQL}
                className="px-3 py-1.5 text-xs text-slate-300 hover:text-white hover:bg-white/5 rounded transition-colors"
              >
                View SQL
              </button>
            )}

            {onUndo && !isReadOnly && (
              <button
                onClick={onUndo}
                disabled={!canUndo}
                className="hidden sm:flex p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                title="Undo (Ctrl+Z)"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a7 7 0 110 14h-1" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10l4-4" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10l4 4" />
                </svg>
              </button>
            )}

            {/* Save status */}
            {isAuthenticated && onSave && !isReadOnly && lastSavedAt && (
              <span className="text-[10px] text-slate-500 hidden lg:inline">
                Saved
              </span>
            )}

            {/* Share button */}
            {isAuthenticated && currentDiagramId && onShare && !isReadOnly && (
              <button
                onClick={onShare}
                className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded transition-colors"
                title="Share"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
              </button>
            )}

            {/* Save button (icon) */}
            {isAuthenticated && onSave && !isReadOnly && (
              <button
                onClick={onSave}
                disabled={isSaving}
                className="hidden sm:flex p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded transition-colors disabled:opacity-40"
                title="Save"
              >
                {isSaving ? (
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                  </svg>
                )}
              </button>
            )}

            {/* Mobile menu */}
            {!isReadOnly && (
              <button
                onClick={(e) => { e.stopPropagation(); setMobileMenuOpen(!mobileMenuOpen); }}
                className="md:hidden p-2 text-slate-400 hover:text-white rounded transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {mobileMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            )}

            {/* User Menu */}
            <UserMenu
              onLoginClick={onLoginClick || (() => {})}
              onSavedDiagramsClick={onSavedDiagramsClick || (() => {})}
              onMyDiagramsClick={onMyDiagramsClick}
            />
          </div>
        </div>
      </nav>

      {/* Mobile dropdown */}
      {mobileMenuOpen && !isReadOnly && (
        <div 
          className={`fixed left-0 right-0 z-40 md:hidden ${isReadOnly ? 'top-[76px]' : 'top-12'}`}
          style={{ backgroundColor: '#1e1e2e', borderBottom: '1px solid rgba(255,255,255,0.06)' }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-2 space-y-0.5 max-h-[70vh] overflow-y-auto">
            <button onClick={() => { onAddTable(); setMobileMenuOpen(false); }} className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-white bg-teal-600 hover:bg-teal-500 rounded transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
              Add Table
            </button>
            {onUndo && (
              <button
                onClick={() => { if (canUndo) onUndo(); setMobileMenuOpen(false); }}
                disabled={!canUndo}
                className="w-full px-3 py-2.5 text-sm text-slate-300 hover:bg-white/5 rounded text-left transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Undo
              </button>
            )}
            {isAuthenticated && currentDiagramId && onAIAssistantClick && (
              <button onClick={() => { onAIAssistantClick(); setMobileMenuOpen(false); }} className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-slate-200 hover:bg-white/5 rounded transition-colors">AI Assistant</button>
            )}
            {isAuthenticated && onMyDiagramsClick && (
              <button onClick={() => { onMyDiagramsClick(); setMobileMenuOpen(false); }} className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-slate-200 hover:bg-white/5 rounded transition-colors">My Diagrams</button>
            )}
            <div className="border-t border-white/5 my-1" />
            <button onClick={() => { onImportSchema(); setMobileMenuOpen(false); }} className="w-full px-3 py-2.5 text-sm text-slate-300 hover:bg-white/5 rounded text-left transition-colors">Import Schema</button>
            <button onClick={() => { fileInputRef.current?.click(); setMobileMenuOpen(false); }} className="w-full px-3 py-2.5 text-sm text-slate-300 hover:bg-white/5 rounded text-left transition-colors">Import SQL File</button>
            <div className="border-t border-white/5 my-1" />
            <button onClick={() => { onExportSQL(); setMobileMenuOpen(false); }} className="w-full px-3 py-2.5 text-sm text-slate-300 hover:bg-white/5 rounded text-left transition-colors">View SQL</button>
            {onSyncDatabase && (
              <button onClick={() => { onSyncDatabase(); setMobileMenuOpen(false); }} className="w-full px-3 py-2.5 text-sm text-slate-300 hover:bg-white/5 rounded text-left transition-colors">Sync to Database</button>
            )}
            <button onClick={() => { onExportSQLFile(); setMobileMenuOpen(false); }} className="w-full px-3 py-2.5 text-sm text-slate-300 hover:bg-white/5 rounded text-left transition-colors">Download SQL</button>
            <button onClick={() => { onExportPNG(); setMobileMenuOpen(false); }} className="w-full px-3 py-2.5 text-sm text-slate-300 hover:bg-white/5 rounded text-left transition-colors">Export PNG</button>
            <button onClick={() => { onExportPDF(); setMobileMenuOpen(false); }} className="w-full px-3 py-2.5 text-sm text-slate-300 hover:bg-white/5 rounded text-left transition-colors">Export PDF</button>
            {isAuthenticated && onSave && (
              <>
                <div className="border-t border-white/5 my-1" />
                <div className="flex gap-2 px-1">
                  {currentDiagramId && onShare && (
                    <button onClick={() => { onShare(); setMobileMenuOpen(false); }} className="flex-1 py-2.5 text-sm text-slate-200 bg-slate-700 hover:bg-slate-600 rounded text-center transition-colors">Share</button>
                  )}
                  <button onClick={() => { onSave(); setMobileMenuOpen(false); }} disabled={isSaving} className="flex-1 py-2.5 text-sm text-white bg-teal-600 hover:bg-teal-500 rounded text-center transition-colors disabled:opacity-50">
                    {isSaving ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <input ref={fileInputRef} type="file" accept=".sql,text/sql" className="hidden" onChange={handleFileChange} title="Upload SQL file" aria-label="Upload SQL file" />
    </>
  );
};
