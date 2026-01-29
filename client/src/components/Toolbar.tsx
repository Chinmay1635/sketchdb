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

// Dropdown Menu Component with cyberpunk styling
interface DropdownMenuProps {
  label: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  align?: 'left' | 'right';
}

const DropdownMenu: React.FC<DropdownMenuProps> = ({ label, icon, children, className = '', align = 'left' }) => {
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
        className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-ghost hover:text-neon-cyan hover:bg-steel/30 rounded transition-all duration-200"
        style={{ fontFamily: "'JetBrains Mono', monospace" }}
      >
        {icon}
        <span className="hidden sm:inline uppercase tracking-wider text-xs">{label}</span>
        <svg
          className={`w-3 h-3 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div 
          className={`absolute top-full mt-2 min-w-[200px] bg-abyss border border-steel rounded overflow-hidden z-50 ${align === 'right' ? 'right-0' : 'left-0'}`}
          style={{ 
            boxShadow: '0 0 20px rgba(0, 255, 255, 0.1), 0 4px 20px rgba(0, 0, 0, 0.5)',
          }}
        >
          {/* Top accent line */}
          <div className="h-px bg-gradient-to-r from-transparent via-neon-cyan to-transparent" />
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

// Dropdown Item Component with cyberpunk styling
interface DropdownItemProps {
  onClick: () => void;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

const DropdownItem: React.FC<DropdownItemProps> = ({ onClick, icon, children, className = '' }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-2.5 text-xs text-ghost hover:text-neon-cyan hover:bg-steel/30 transition-all duration-200 ${className}`}
    style={{ fontFamily: "'JetBrains Mono', monospace" }}
  >
    {icon}
    {children}
  </button>
);

const DropdownDivider = () => <div className="border-t border-steel/50 my-1" />;

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

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      if (mobileMenuOpen) setMobileMenuOpen(false);
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [mobileMenuOpen]);

  return (
    <>
      {/* Read-only banner for public viewers */}
      {isReadOnly && (
        <div 
          className="fixed top-0 left-0 right-0 h-8 text-xs sm:text-sm font-medium flex items-center justify-center z-[60] px-2"
          style={{ 
            backgroundColor: 'rgba(255, 136, 0, 0.9)',
            color: '#0a0a0f',
            fontFamily: "'JetBrains Mono', monospace",
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            boxShadow: '0 0 20px rgba(255, 136, 0, 0.3)'
          }}
        >
          <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          <span className="truncate">
            View Only — {isAuthenticated ? 'You have view-only access' : 'Sign in to create your own'}
          </span>
        </div>
      )}
      
      {/* Navbar */}
      <nav 
        className={`fixed left-0 right-0 h-14 z-50 ${isReadOnly ? 'top-8' : 'top-0'}`}
        style={{
          backgroundColor: 'rgba(10, 10, 15, 0.95)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(42, 42, 58, 0.5)',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3), 0 0 40px rgba(0, 255, 255, 0.03)'
        }}
      >
        <div className="h-full px-3 sm:px-4 flex items-center justify-between gap-2">
          {/* Left section - Logo and brand */}
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            {/* Logo/Brand */}
            <a href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity group">
              <div 
                className="relative w-9 h-9 rounded-lg flex items-center justify-center overflow-hidden"
                style={{
                  background: 'linear-gradient(135deg, #00ffff, #0088ff)',
                  boxShadow: '0 0 15px rgba(0, 255, 255, 0.3)'
                }}
              >
                <img className='w-full h-full' src="/logo.png" alt="SketchDB" />
              </div>
              <span 
                className="text-base sm:text-lg font-bold text-pure hidden xs:inline"
                style={{ fontFamily: "'Orbitron', sans-serif", letterSpacing: '0.05em' }}
              >
                SKETCH<span className="text-neon-cyan">DB</span>
              </span>
            </a>

            {/* Current diagram name - desktop */}
            {currentDiagramName && (
              <>
                <div className="w-px h-5 bg-steel hidden md:block" />
                <span 
                  className="text-xs text-chrome max-w-[120px] lg:max-w-[200px] truncate hidden md:block"
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                  title={currentDiagramName}
                >
                  {currentDiagramName}
                </span>
              </>
            )}
          </div>

          {/* Center section - Main actions (Desktop) */}
          {!isReadOnly && (
            <div className="hidden md:flex items-center gap-1">
              {/* My Diagrams Button */}
              {isAuthenticated && onMyDiagramsClick && (
                <button
                  onClick={onMyDiagramsClick}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-ghost hover:text-neon-cyan hover:bg-steel/30 rounded transition-all duration-200"
                  style={{ fontFamily: "'JetBrains Mono', monospace", textTransform: 'uppercase', letterSpacing: '0.05em' }}
                  title="View all your diagrams"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  <span className="hidden lg:inline">Diagrams</span>
                </button>
              )}

              {/* Add Table Button */}
              <button
                onClick={onAddTable}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded transition-all duration-200"
                style={{ 
                  fontFamily: "'JetBrains Mono', monospace", 
                  textTransform: 'uppercase', 
                  letterSpacing: '0.1em',
                  background: 'linear-gradient(135deg, #00ff88, #00cc6a)',
                  color: '#0a0a0f',
                  boxShadow: '0 0 15px rgba(0, 255, 136, 0.3)'
                }}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span className="hidden lg:inline">Add Table</span>
              </button>

              {/* AI Assistant Button */}
              {isAuthenticated && currentDiagramId && onAIAssistantClick && (
                <button
                  onClick={onAIAssistantClick}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded transition-all duration-200"
                  style={{ 
                    fontFamily: "'JetBrains Mono', monospace", 
                    textTransform: 'uppercase', 
                    letterSpacing: '0.1em',
                    background: 'linear-gradient(135deg, #8855ff, #6633cc)',
                    color: '#ffffff',
                    boxShadow: '0 0 15px rgba(136, 85, 255, 0.3)'
                  }}
                  title="AI Assistant"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  <span className="hidden lg:inline">AI</span>
                </button>
              )}

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
                    <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  }
                >
                  Import Schema
                </DropdownItem>
                <DropdownItem
                  onClick={() => fileInputRef.current?.click()}
                  icon={
                    <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                    <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  }
                >
                  View SQL
                </DropdownItem>
                <DropdownItem
                  onClick={onExportSQLFile}
                  icon={
                    <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                    <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  }
                >
                  Export as PNG
                </DropdownItem>
                <DropdownItem
                  onClick={onExportPDF}
                  icon={
                    <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  }
                >
                  Export as PDF
                </DropdownItem>
              </DropdownMenu>
            </div>
          )}

          {/* Read-only diagram name for mobile */}
          {isReadOnly && currentDiagramName && (
            <span className="text-sm text-slate-300 max-w-[150px] truncate md:hidden" title={currentDiagramName}>
              {currentDiagramName}
            </span>
          )}

          {/* Right section */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Read-only mode: show View SQL button */}
            {isReadOnly && (
              <button
                onClick={onExportSQL}
                className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-500 rounded-md transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="hidden sm:inline">View SQL</span>
              </button>
            )}
            
            {/* Save status and buttons - desktop */}
            {isAuthenticated && onSave && !isReadOnly && (
              <div className="hidden sm:flex items-center gap-2">
                {/* Last saved timestamp */}
                {lastSavedAt && (
                  <span className="text-xs text-slate-500 hidden lg:inline">
                    Saved {formatLastSaved(lastSavedAt)}
                  </span>
                )}

                {/* Share button */}
                {currentDiagramId && onShare && (
                  <button
                    onClick={onShare}
                    className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-200 bg-slate-700 hover:bg-slate-600 rounded-md transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                    </svg>
                    <span className="hidden lg:inline">Share</span>
                  </button>
                )}
                
                {/* Save button */}
                <button
                  onClick={onSave}
                  disabled={isSaving}
                  className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    isSaving 
                      ? 'bg-slate-600 text-slate-400 cursor-not-allowed' 
                      : 'bg-indigo-600 text-white hover:bg-indigo-500'
                  }`}
                >
                  {isSaving ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span className="hidden lg:inline">Saving...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                      </svg>
                      <span className="hidden lg:inline">Save</span>
                    </>
                  )}
                </button>
              </div>
            )}
            
            {/* Mobile menu button */}
            {!isReadOnly && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setMobileMenuOpen(!mobileMenuOpen);
                }}
                className="md:hidden flex items-center justify-center w-10 h-10 text-slate-300 hover:bg-slate-700/50 rounded-md transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

      {/* Mobile menu dropdown */}
      {mobileMenuOpen && !isReadOnly && (
        <div 
          className={`fixed left-0 right-0 bg-slate-800/95 backdrop-blur-sm border-b border-slate-700/50 shadow-xl z-40 md:hidden ${isReadOnly ? 'top-[88px]' : 'top-14'}`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-3 space-y-1 max-h-[calc(100vh-4rem)] overflow-y-auto">
            {/* My Diagrams */}
            {isAuthenticated && onMyDiagramsClick && (
              <button
                onClick={() => { onMyDiagramsClick(); setMobileMenuOpen(false); }}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-slate-200 hover:bg-slate-700/50 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                My Diagrams
              </button>
            )}

            {/* Add Table */}
            <button
              onClick={() => { onAddTable(); setMobileMenuOpen(false); }}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-slate-900 bg-emerald-500 hover:bg-emerald-400 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Add Table
            </button>

            {/* AI Assistant */}
            {isAuthenticated && currentDiagramId && onAIAssistantClick && (
              <button
                onClick={() => { onAIAssistantClick(); setMobileMenuOpen(false); }}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-white bg-violet-600 hover:bg-violet-500 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                AI Assistant
              </button>
            )}

            <div className="border-t border-slate-700/50 my-2" />

            {/* Import section */}
            <div className="px-4 py-2">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Import</span>
            </div>
            <button
              onClick={() => { onImportSchema(); setMobileMenuOpen(false); }}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-200 hover:bg-slate-700/50 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Import Schema
            </button>
            <button
              onClick={() => { fileInputRef.current?.click(); setMobileMenuOpen(false); }}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-200 hover:bg-slate-700/50 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              Import SQL File
            </button>

            <div className="border-t border-slate-700/50 my-2" />

            {/* Export section */}
            <div className="px-4 py-2">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Export</span>
            </div>
            <button
              onClick={() => { onExportSQL(); setMobileMenuOpen(false); }}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-200 hover:bg-slate-700/50 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              View SQL
            </button>
            <button
              onClick={() => { onExportSQLFile(); setMobileMenuOpen(false); }}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-200 hover:bg-slate-700/50 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Download SQL
            </button>
            <button
              onClick={() => { onExportPNG(); setMobileMenuOpen(false); }}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-200 hover:bg-slate-700/50 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Export as PNG
            </button>
            <button
              onClick={() => { onExportPDF(); setMobileMenuOpen(false); }}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-200 hover:bg-slate-700/50 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              Export as PDF
            </button>

            {/* Save & Share - Mobile */}
            {isAuthenticated && onSave && (
              <>
                <div className="border-t border-slate-700/50 my-2" />
                <div className="flex gap-2 px-1">
                  {currentDiagramId && onShare && (
                    <button
                      onClick={() => { onShare(); setMobileMenuOpen(false); }}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-slate-200 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                      </svg>
                      Share
                    </button>
                  )}
                  <button
                    onClick={() => { onSave(); setMobileMenuOpen(false); }}
                    disabled={isSaving}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                      isSaving 
                        ? 'bg-slate-600 text-slate-400 cursor-not-allowed' 
                        : 'bg-indigo-600 text-white hover:bg-indigo-500'
                    }`}
                  >
                    {isSaving ? (
                      <>
                        <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Saving...
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                        </svg>
                        Save
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

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
