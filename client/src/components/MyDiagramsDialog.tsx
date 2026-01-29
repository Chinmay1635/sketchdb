import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { diagramsAPI } from '../services/api';

interface DiagramItem {
  _id: string;
  name: string;
  description: string;
  slug: string;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  ownerUsername: string;
  permission: 'owner' | 'edit' | 'view';
  tableCount: number;
  role: 'owner' | 'collaborator';
}

interface MyDiagramsDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

type FilterType = 'all' | 'owned' | 'collaborated';
type SortType = 'recent' | 'name' | 'created';

const MyDiagramsDialog: React.FC<MyDiagramsDialogProps> = ({
  isOpen,
  onClose,
}) => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [diagrams, setDiagrams] = useState<DiagramItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');
  const [sortBy, setSortBy] = useState<SortType>('recent');
  const [ownedCount, setOwnedCount] = useState(0);
  const [collaboratedCount, setCollaboratedCount] = useState(0);

  useEffect(() => {
    if (isOpen && isAuthenticated) {
      fetchDiagrams();
    }
  }, [isOpen, isAuthenticated]);

  // Reset state when dialog closes
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('');
      setFilter('all');
      setError(null);
    }
  }, [isOpen]);

  const fetchDiagrams = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await diagramsAPI.getMyDiagrams();
      setDiagrams(data.diagrams);
      setOwnedCount(data.ownedCount);
      setCollaboratedCount(data.collaboratedCount);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch diagrams');
    } finally {
      setIsLoading(false);
    }
  };

  // Filter and sort diagrams
  const filteredDiagrams = useMemo(() => {
    let result = [...diagrams];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        d =>
          d.name.toLowerCase().includes(query) ||
          d.description?.toLowerCase().includes(query) ||
          d.ownerUsername.toLowerCase().includes(query)
      );
    }

    // Apply role filter
    if (filter === 'owned') {
      result = result.filter(d => d.role === 'owner');
    } else if (filter === 'collaborated') {
      result = result.filter(d => d.role === 'collaborator');
    }

    // Apply sorting
    result.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'created':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'recent':
        default:
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      }
    });

    return result;
  }, [diagrams, searchQuery, filter, sortBy]);

  const handleOpenDiagram = (diagram: DiagramItem) => {
    onClose();
    // Navigate to the diagram using the owner's username and slug
    navigate(`/playground/${diagram.ownerUsername}/${diagram.slug}`);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  };

  const getPermissionBadge = (permission: string, role: string) => {
    if (role === 'owner') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium font-mono" style={{ backgroundColor: 'rgba(136, 85, 255, 0.2)', color: '#8855ff', border: '1px solid rgba(136, 85, 255, 0.4)' }}>
          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
          </svg>
          OWNER
        </span>
      );
    }
    
    if (permission === 'edit') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium font-mono" style={{ backgroundColor: 'rgba(0, 255, 136, 0.2)', color: '#00ff88', border: '1px solid rgba(0, 255, 136, 0.4)' }}>
          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          EDIT
        </span>
      );
    }
    
    return (
      <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium font-mono" style={{ backgroundColor: 'rgba(138, 138, 154, 0.2)', color: '#8a8a9a', border: '1px solid rgba(138, 138, 154, 0.4)' }}>
        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
        VIEW
      </span>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50" style={{ backgroundColor: 'rgba(10, 10, 15, 0.95)', backdropFilter: 'blur(4px)' }}>
      <div className="w-full max-w-4xl mx-4 overflow-hidden max-h-[85vh] flex flex-col" style={{ backgroundColor: '#0a0a0f', border: '1px solid #2a2a3a', boxShadow: '0 0 40px rgba(0, 255, 255, 0.15), inset 0 1px 0 rgba(255,255,255,0.05)' }}>
        {/* Gradient accent line */}
        <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg, #00ffff, #ff00ff, #00ff88)' }} />
        
        {/* Header */}
        <div className="px-6 py-5 flex-shrink-0" style={{ backgroundColor: '#0d0d14', borderBottom: '1px solid #2a2a3a' }}>
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-2" style={{ color: '#00ffff', fontFamily: "'Orbitron', monospace", textTransform: 'uppercase', letterSpacing: '0.1em', textShadow: '0 0 20px rgba(0,255,255,0.5)' }}>
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                My Diagrams
              </h2>
              <p className="text-sm mt-1 font-mono" style={{ color: '#8a8a9a' }}>
                <span style={{ color: '#8855ff' }}>{ownedCount}</span> owned · <span style={{ color: '#00ff88' }}>{collaboratedCount}</span> shared with you
              </p>
            </div>
            <button
              onClick={onClose}
              className="transition-all p-2"
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

        {/* Search and Filters */}
        <div className="px-6 py-4 flex-shrink-0" style={{ backgroundColor: '#0d0d14', borderBottom: '1px solid #2a2a3a' }}>
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="flex-1 relative">
              <svg
                className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5"
                style={{ color: '#00ffff' }}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search diagrams..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 font-mono text-sm transition-all focus:outline-none"
                style={{ backgroundColor: '#121218', border: '1px solid #2a2a3a', color: '#f0f0ff' }}
                onFocus={(e) => { e.target.style.borderColor = '#00ffff'; e.target.style.boxShadow = '0 0 10px rgba(0,255,255,0.3)'; }}
                onBlur={(e) => { e.target.style.borderColor = '#2a2a3a'; e.target.style.boxShadow = 'none'; }}
              />
            </div>

            {/* Filter Tabs */}
            <div className="flex overflow-hidden" style={{ border: '1px solid #2a2a3a' }}>
              <button
                onClick={() => setFilter('all')}
                className="px-4 py-2 text-sm font-mono transition-all"
                style={{ 
                  backgroundColor: filter === 'all' ? '#00ffff' : '#121218',
                  color: filter === 'all' ? '#0a0a0f' : '#8a8a9a',
                  fontWeight: filter === 'all' ? '600' : '400'
                }}
              >
                ALL ({diagrams.length})
              </button>
              <button
                onClick={() => setFilter('owned')}
                className="px-4 py-2 text-sm font-mono transition-all"
                style={{ 
                  backgroundColor: filter === 'owned' ? '#8855ff' : '#121218',
                  color: filter === 'owned' ? '#fff' : '#8a8a9a',
                  borderLeft: '1px solid #2a2a3a',
                  fontWeight: filter === 'owned' ? '600' : '400'
                }}
              >
                OWNED ({ownedCount})
              </button>
              <button
                onClick={() => setFilter('collaborated')}
                className="px-4 py-2 text-sm font-mono transition-all"
                style={{ 
                  backgroundColor: filter === 'collaborated' ? '#00ff88' : '#121218',
                  color: filter === 'collaborated' ? '#0a0a0f' : '#8a8a9a',
                  borderLeft: '1px solid #2a2a3a',
                  fontWeight: filter === 'collaborated' ? '600' : '400'
                }}
              >
                SHARED ({collaboratedCount})
              </button>
            </div>

            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortType)}
              className="px-3 py-2 text-sm font-mono transition-all focus:outline-none cursor-pointer"
              style={{ backgroundColor: '#121218', border: '1px solid #2a2a3a', color: '#c0c0d0' }}
            >
              <option value="recent">RECENT</option>
              <option value="created">CREATED</option>
              <option value="name">NAME (A-Z)</option>
            </select>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6" style={{ backgroundColor: '#0a0a0f' }}>
          {error && (
            <div className="mb-4 flex items-center gap-2 px-4 py-3 font-mono text-sm" style={{ backgroundColor: 'rgba(255, 51, 102, 0.1)', border: '1px solid rgba(255, 51, 102, 0.4)', color: '#ff3366' }}>
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
          )}

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="relative w-12 h-12">
                <div className="absolute inset-0 animate-spin" style={{ border: '2px solid transparent', borderTopColor: '#00ffff', borderRightColor: '#ff00ff' }} />
                <div className="absolute inset-2 animate-spin" style={{ border: '2px solid transparent', borderBottomColor: '#00ff88', animationDirection: 'reverse', animationDuration: '0.8s' }} />
              </div>
              <p className="mt-4 font-mono text-sm" style={{ color: '#8a8a9a' }}>Loading diagrams...</p>
            </div>
          ) : filteredDiagrams.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <svg className="w-16 h-16 mb-4" style={{ color: '#2a2a3a' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              {searchQuery || filter !== 'all' ? (
                <>
                  <h3 className="text-lg font-medium mb-1" style={{ color: '#c0c0d0', fontFamily: "'Space Grotesk', sans-serif" }}>No diagrams found</h3>
                  <p className="font-mono text-sm" style={{ color: '#8a8a9a' }}>
                    Try adjusting your search or filter
                  </p>
                </>
              ) : (
                <>
                  <h3 className="text-lg font-medium mb-1" style={{ color: '#c0c0d0', fontFamily: "'Space Grotesk', sans-serif" }}>No diagrams yet</h3>
                  <p className="font-mono text-sm mb-4" style={{ color: '#8a8a9a' }}>
                    Create your first diagram to get started
                  </p>
                  <button
                    onClick={onClose}
                    className="px-4 py-2 font-mono text-sm transition-all"
                    style={{ background: 'linear-gradient(135deg, #00ffff, #0088ff)', color: '#0a0a0f', fontWeight: '600' }}
                    onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 0 20px rgba(0,255,255,0.5)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'none'; }}
                  >
                    CREATE DIAGRAM
                  </button>
                </>
              )}
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredDiagrams.map((diagram) => (
                <div
                  key={diagram._id}
                  onClick={() => handleOpenDiagram(diagram)}
                  className="group p-4 transition-all cursor-pointer"
                  style={{ backgroundColor: '#0d0d14', border: '1px solid #2a2a3a' }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#00ffff'; e.currentTarget.style.boxShadow = '0 0 20px rgba(0,255,255,0.2)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#2a2a3a'; e.currentTarget.style.boxShadow = 'none'; }}
                >
                  {/* Diagram Preview/Icon */}
                  <div className="p-4 mb-3 flex items-center justify-center" style={{ background: 'linear-gradient(135deg, rgba(0,255,255,0.1), rgba(136,85,255,0.1))', border: '1px solid #2a2a3a' }}>
                    <svg className="w-12 h-12 transition-colors" style={{ color: '#4a4a5a' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                    </svg>
                  </div>

                  {/* Diagram Info */}
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold truncate flex-1 transition-colors" style={{ color: '#c0c0d0', fontFamily: "'Space Grotesk', sans-serif" }}>
                        {diagram.name}
                      </h3>
                      {diagram.isPublic && (
                        <span className="flex-shrink-0" title="Public diagram">
                          <svg className="w-4 h-4" style={{ color: '#00ff88' }} fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM4.332 8.027a6.012 6.012 0 011.912-2.706C6.512 5.73 6.974 6 7.5 6A1.5 1.5 0 019 7.5V8a2 2 0 004 0 2 2 0 011.523-1.943A5.977 5.977 0 0116 10c0 .34-.028.675-.083 1H15a2 2 0 00-2 2v2.197A5.973 5.973 0 0110 16v-2a2 2 0 00-2-2 2 2 0 01-2-2 2 2 0 00-1.668-1.973z" clipRule="evenodd" />
                          </svg>
                        </span>
                      )}
                    </div>

                    {diagram.description && (
                      <p className="text-sm line-clamp-2 font-mono" style={{ color: '#8a8a9a' }}>
                        {diagram.description}
                      </p>
                    )}

                    <div className="flex items-center gap-2 text-xs font-mono" style={{ color: '#4a4a5a' }}>
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7" />
                        </svg>
                        {diagram.tableCount} table{diagram.tableCount !== 1 ? 's' : ''}
                      </span>
                      <span style={{ color: '#2a2a3a' }}>·</span>
                      <span>{formatDate(diagram.updatedAt)}</span>
                    </div>

                    <div className="flex items-center justify-between pt-2" style={{ borderTop: '1px solid #1a1a24' }}>
                      {getPermissionBadge(diagram.permission, diagram.role)}
                      {diagram.role === 'collaborator' && (
                        <span className="text-xs font-mono" style={{ color: '#4a4a5a' }}>
                          by @{diagram.ownerUsername}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 flex-shrink-0" style={{ backgroundColor: '#0d0d14', borderTop: '1px solid #2a2a3a' }}>
          <div className="flex justify-between items-center">
            <p className="text-sm font-mono" style={{ color: '#4a4a5a' }}>
              <span style={{ color: '#00ffff' }}>{filteredDiagrams.length}</span> diagram{filteredDiagrams.length !== 1 ? 's' : ''} 
              {filter !== 'all' && <span style={{ color: '#8a8a9a' }}> (filtered from {diagrams.length})</span>}
            </p>
            <button
              onClick={onClose}
              className="px-4 py-2 font-mono text-sm transition-all"
              style={{ backgroundColor: '#1a1a24', border: '1px solid #2a2a3a', color: '#8a8a9a' }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#00ffff'; e.currentTarget.style.color = '#00ffff'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#2a2a3a'; e.currentTarget.style.color = '#8a8a9a'; }}
            >
              CLOSE
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyDiagramsDialog;
