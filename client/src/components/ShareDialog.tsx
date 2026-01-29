import React, { useState, useEffect, useCallback } from 'react';
import { diagramsAPI } from '../services/api';
import { shareToasts } from '../utils/toast';

interface Collaborator {
  user: {
    _id: string;
    username: string;
    email: string;
  };
  permission: 'view' | 'edit';
}

interface ShareDialogProps {
  isOpen: boolean;
  onClose: () => void;
  diagramId: string | null;
  diagramSlug: string | null;
  ownerUsername: string | null;
  diagramName: string | null;
  isPublic: boolean;
  onVisibilityChange: (isPublic: boolean) => void;
}

const ShareDialog: React.FC<ShareDialogProps> = ({
  isOpen,
  onClose,
  diagramId,
  diagramSlug,
  ownerUsername,
  diagramName,
  isPublic,
  onVisibilityChange,
}) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Collaborator management
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [newCollaboratorEmail, setNewCollaboratorEmail] = useState('');
  const [newCollaboratorPermission, setNewCollaboratorPermission] = useState<'view' | 'edit'>('edit');
  const [isAddingCollaborator, setIsAddingCollaborator] = useState(false);
  const [isLoadingCollaborators, setIsLoadingCollaborators] = useState(false);

  // Generate the public URL with /playground prefix
  const publicUrl = ownerUsername && diagramSlug 
    ? `${window.location.origin}/playground/${ownerUsername}/${diagramSlug}`
    : null;

  // Load collaborators when dialog opens
  const loadCollaborators = useCallback(async () => {
    if (!diagramId) return;
    
    setIsLoadingCollaborators(true);
    try {
      const response = await diagramsAPI.getById(diagramId);
      if (response.success && response.diagram?.collaborators) {
        setCollaborators(response.diagram.collaborators);
      }
    } catch (err) {
      console.error('Failed to load collaborators:', err);
    } finally {
      setIsLoadingCollaborators(false);
    }
  }, [diagramId]);

  useEffect(() => {
    if (isOpen && diagramId) {
      loadCollaborators();
    }
    if (!isOpen) {
      setCopied(false);
      setError(null);
      setSuccessMessage(null);
      setNewCollaboratorEmail('');
    }
  }, [isOpen, diagramId, loadCollaborators]);

  const handleTogglePublic = async () => {
    if (!diagramId) return;
    
    setIsUpdating(true);
    setError(null);
    
    try {
      // Update the diagram's public status
      await diagramsAPI.updateVisibility(diagramId, !isPublic);
      onVisibilityChange(!isPublic);
      shareToasts.visibilityChanged(!isPublic);
    } catch (err: any) {
      shareToasts.shareError(err.message);
      setError(err.message || 'Failed to update visibility');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAddCollaborator = async () => {
    if (!diagramId || !newCollaboratorEmail.trim()) return;
    
    setIsAddingCollaborator(true);
    setError(null);
    setSuccessMessage(null);
    
    try {
      await diagramsAPI.addCollaborator(diagramId, newCollaboratorEmail.trim(), newCollaboratorPermission);
      setNewCollaboratorEmail('');
      shareToasts.collaboratorAdded(newCollaboratorEmail.trim(), newCollaboratorPermission);
      setSuccessMessage(`Collaborator added with ${newCollaboratorPermission} permission`);
      await loadCollaborators();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      shareToasts.shareError(err.message);
      setError(err.message || 'Failed to add collaborator');
    } finally {
      setIsAddingCollaborator(false);
    }
  };

  const handleRemoveCollaborator = async (userId: string) => {
    if (!diagramId) return;
    
    try {
      const removedUser = collaborators.find(c => c.user._id === userId);
      await diagramsAPI.removeCollaborator(diagramId, userId);
      setCollaborators(prev => prev.filter(c => c.user._id !== userId));
      shareToasts.collaboratorRemoved(removedUser?.user.username || 'User');
      setSuccessMessage('Collaborator removed');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      shareToasts.shareError(err.message);
      setError(err.message || 'Failed to remove collaborator');
    }
  };

  const handleUpdateCollaboratorPermission = async (userId: string, permission: 'view' | 'edit') => {
    if (!diagramId) return;
    
    try {
      const collaborator = collaborators.find(c => c.user._id === userId);
      if (collaborator) {
        await diagramsAPI.removeCollaborator(diagramId, userId);
        await diagramsAPI.addCollaborator(diagramId, collaborator.user.email, permission);
        await loadCollaborators();
        shareToasts.permissionUpdated(collaborator.user.username, permission);
        setSuccessMessage('Permission updated');
        setTimeout(() => setSuccessMessage(null), 3000);
      }
    } catch (err: any) {
      shareToasts.shareError(err.message);
      setError(err.message || 'Failed to update permission');
    }
  };

  const handleCopyLink = async () => {
    if (!publicUrl) return;
    
    try {
      await navigator.clipboard.writeText(publicUrl);
      shareToasts.linkCopied();
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      // Fallback for browsers that don't support clipboard API
      const textArea = document.createElement('textarea');
      textArea.value = publicUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      shareToasts.linkCopied();
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ backgroundColor: 'rgba(10, 10, 15, 0.95)', backdropFilter: 'blur(4px)' }}>
      <div className="w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col" style={{ backgroundColor: '#0a0a0f', border: '1px solid #2a2a3a', boxShadow: '0 0 40px rgba(0, 255, 255, 0.15), inset 0 1px 0 rgba(255,255,255,0.05)' }}>
        {/* Gradient accent line */}
        <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg, #00ffff, #ff00ff)' }} />
        
        {/* Header */}
        <div className="flex items-center justify-between p-4" style={{ borderBottom: '1px solid #2a2a3a' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #00ffff, #0088ff)', boxShadow: '0 0 15px rgba(0,255,255,0.3)' }}>
              <svg className="w-5 h-5" style={{ color: '#0a0a0f' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold" style={{ color: '#00ffff', fontFamily: "'Orbitron', monospace", textTransform: 'uppercase', letterSpacing: '0.05em', textShadow: '0 0 10px rgba(0,255,255,0.5)' }}>Share</h2>
              <p className="text-sm truncate max-w-[250px] font-mono" style={{ color: '#8a8a9a' }}>{diagramName || 'Untitled Diagram'}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 transition-all"
            style={{ color: '#8a8a9a' }}
            onMouseEnter={(e) => { e.currentTarget.style.color = '#ff3366'; e.currentTarget.style.textShadow = '0 0 10px rgba(255,51,102,0.5)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = '#8a8a9a'; e.currentTarget.style.textShadow = 'none'; }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4 overflow-y-auto flex-1" style={{ backgroundColor: '#0a0a0f' }}>
          {/* Error message */}
          {error && (
            <div className="p-3 text-sm font-mono" style={{ backgroundColor: 'rgba(255, 51, 102, 0.1)', border: '1px solid rgba(255, 51, 102, 0.4)', color: '#ff3366' }}>
              {error}
            </div>
          )}

          {/* Success message */}
          {successMessage && (
            <div className="p-3 text-sm font-mono" style={{ backgroundColor: 'rgba(0, 255, 136, 0.1)', border: '1px solid rgba(0, 255, 136, 0.4)', color: '#00ff88' }}>
              {successMessage}
            </div>
          )}

          {/* No diagram saved message */}
          {!diagramId && (
            <div className="p-4" style={{ backgroundColor: 'rgba(255, 136, 0, 0.1)', border: '1px solid rgba(255, 136, 0, 0.4)' }}>
              <div className="flex items-center gap-2" style={{ color: '#ff8800' }}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span className="font-medium font-mono text-sm">SAVE DIAGRAM FIRST</span>
              </div>
              <p className="text-sm mt-2 font-mono" style={{ color: '#8a8a9a' }}>
                You need to save your diagram before you can share it with others.
              </p>
            </div>
          )}

          {/* Collaborator section */}
          {diagramId && (
            <>
              {/* Add Collaborator Section */}
              <div className="space-y-3">
                <label className="text-sm font-medium flex items-center gap-2" style={{ color: '#c0c0d0', fontFamily: "'Space Grotesk', sans-serif" }}>
                  <svg className="w-4 h-4" style={{ color: '#00ffff' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                  Add Collaborator
                </label>
                <div className="flex gap-2">
                  <input
                    type="email"
                    value={newCollaboratorEmail}
                    onChange={(e) => setNewCollaboratorEmail(e.target.value)}
                    placeholder="Enter email address"
                    className="flex-1 px-3 py-2 text-sm font-mono transition-all focus:outline-none"
                    style={{ backgroundColor: '#121218', border: '1px solid #2a2a3a', color: '#f0f0ff' }}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddCollaborator()}
                    onFocus={(e) => { e.target.style.borderColor = '#00ffff'; e.target.style.boxShadow = '0 0 10px rgba(0,255,255,0.3)'; }}
                    onBlur={(e) => { e.target.style.borderColor = '#2a2a3a'; e.target.style.boxShadow = 'none'; }}
                  />
                  <select
                    value={newCollaboratorPermission}
                    onChange={(e) => setNewCollaboratorPermission(e.target.value as 'view' | 'edit')}
                    className="px-3 py-2 text-sm font-mono transition-all focus:outline-none cursor-pointer"
                    style={{ backgroundColor: '#121218', border: '1px solid #2a2a3a', color: '#c0c0d0' }}
                  >
                    <option value="edit">CAN EDIT</option>
                    <option value="view">CAN VIEW</option>
                  </select>
                  <button
                    onClick={handleAddCollaborator}
                    disabled={isAddingCollaborator || !newCollaboratorEmail.trim()}
                    className="px-4 py-2 font-mono text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ background: 'linear-gradient(135deg, #00ffff, #0088ff)', color: '#0a0a0f' }}
                    onMouseEnter={(e) => { if (!e.currentTarget.disabled) e.currentTarget.style.boxShadow = '0 0 15px rgba(0,255,255,0.5)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'none'; }}
                  >
                    {isAddingCollaborator ? (
                      <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                    ) : (
                      'ADD'
                    )}
                  </button>
                </div>
              </div>

              {/* Current Collaborators */}
              {(collaborators.length > 0 || isLoadingCollaborators) && (
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2" style={{ color: '#c0c0d0', fontFamily: "'Space Grotesk', sans-serif" }}>
                    <svg className="w-4 h-4" style={{ color: '#ff00ff' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                    Collaborators ({collaborators.length})
                  </label>
                  
                  {isLoadingCollaborators ? (
                    <div className="flex items-center justify-center py-4">
                      <div className="relative w-6 h-6">
                        <div className="absolute inset-0 animate-spin" style={{ border: '2px solid transparent', borderTopColor: '#00ffff' }} />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {collaborators.map((collab) => (
                        <div
                          key={collab.user._id}
                          className="flex items-center justify-between p-3"
                          style={{ backgroundColor: '#0d0d14', border: '1px solid #2a2a3a' }}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 flex items-center justify-center text-sm font-bold font-mono" style={{ background: 'linear-gradient(135deg, #8855ff, #ff00ff)', color: '#fff' }}>
                              {collab.user.username.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="text-sm font-medium" style={{ color: '#f0f0ff', fontFamily: "'Space Grotesk', sans-serif" }}>{collab.user.username}</p>
                              <p className="text-xs font-mono" style={{ color: '#4a4a5a' }}>{collab.user.email}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <select
                              value={collab.permission}
                              onChange={(e) => handleUpdateCollaboratorPermission(collab.user._id, e.target.value as 'view' | 'edit')}
                              className="px-2 py-1 text-xs font-mono transition-all focus:outline-none cursor-pointer"
                              style={{ backgroundColor: '#121218', border: '1px solid #2a2a3a', color: '#c0c0d0' }}
                            >
                              <option value="edit">CAN EDIT</option>
                              <option value="view">CAN VIEW</option>
                            </select>
                            <button
                              onClick={() => handleRemoveCollaborator(collab.user._id)}
                              className="p-1 transition-all"
                              title="Remove collaborator"
                              style={{ color: '#4a4a5a' }}
                              onMouseEnter={(e) => { e.currentTarget.style.color = '#ff3366'; e.currentTarget.style.textShadow = '0 0 10px rgba(255,51,102,0.5)'; }}
                              onMouseLeave={(e) => { e.currentTarget.style.color = '#4a4a5a'; e.currentTarget.style.textShadow = 'none'; }}
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Divider */}
              <div style={{ borderTop: '1px solid #2a2a3a' }} />
            </>
          )}

          {/* Public toggle */}
          {diagramId && (
            <>
              <div className="flex items-center justify-between p-4" style={{ backgroundColor: '#0d0d14', border: '1px solid #2a2a3a' }}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 flex items-center justify-center" style={{ backgroundColor: isPublic ? 'rgba(0, 255, 136, 0.2)' : 'rgba(138, 138, 154, 0.2)', border: `1px solid ${isPublic ? 'rgba(0, 255, 136, 0.4)' : 'rgba(138, 138, 154, 0.4)'}` }}>
                    {isPublic ? (
                      <svg className="w-5 h-5" style={{ color: '#00ff88' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" style={{ color: '#8a8a9a' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    )}
                  </div>
                  <div>
                    <p className="font-medium" style={{ color: isPublic ? '#00ff88' : '#c0c0d0', fontFamily: "'Space Grotesk', sans-serif" }}>
                      {isPublic ? 'PUBLIC' : 'PRIVATE'}
                    </p>
                    <p className="text-sm font-mono" style={{ color: '#4a4a5a' }}>
                      {isPublic 
                        ? 'Anyone with the link can view' 
                        : 'Only you and collaborators can access'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleTogglePublic}
                  disabled={isUpdating}
                  className="relative inline-flex h-6 w-11 items-center transition-all"
                  style={{ 
                    backgroundColor: isPublic ? '#00ff88' : '#2a2a3a',
                    opacity: isUpdating ? 0.5 : 1,
                    cursor: isUpdating ? 'not-allowed' : 'pointer',
                    boxShadow: isPublic ? '0 0 10px rgba(0,255,136,0.5)' : 'none'
                  }}
                >
                  <span
                    className="inline-block h-4 w-4 transform transition-transform"
                    style={{ 
                      backgroundColor: '#0a0a0f',
                      transform: isPublic ? 'translateX(1.5rem)' : 'translateX(0.25rem)'
                    }}
                  />
                </button>
              </div>

              {/* Share link */}
              {publicUrl && (
                <div className="space-y-2">
                  <label className="text-sm font-medium" style={{ color: '#c0c0d0', fontFamily: "'Space Grotesk', sans-serif" }}>Share Link</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={publicUrl}
                      readOnly
                      className="flex-1 px-3 py-2 text-sm font-mono focus:outline-none"
                      style={{ backgroundColor: '#121218', border: '1px solid #2a2a3a', color: '#8a8a9a' }}
                    />
                    <button
                      onClick={handleCopyLink}
                      className="px-4 py-2 font-mono text-sm font-medium transition-all"
                      style={{ 
                        background: copied ? 'linear-gradient(135deg, #00ff88, #00ffff)' : 'linear-gradient(135deg, #00ffff, #0088ff)',
                        color: '#0a0a0f'
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 0 15px rgba(0,255,255,0.5)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'none'; }}
                    >
                      {copied ? (
                        <span className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          COPIED!
                        </span>
                      ) : (
                        <span className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                          </svg>
                          COPY
                        </span>
                      )}
                    </button>
                  </div>
                  
                  {!isPublic && (
                    <p className="text-xs flex items-center gap-1 font-mono" style={{ color: '#ff8800' }}>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      Enable public access to share this link with others
                    </p>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 flex justify-end" style={{ borderTop: '1px solid #2a2a3a' }}>
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-mono transition-all"
            style={{ color: '#8a8a9a' }}
            onMouseEnter={(e) => { e.currentTarget.style.color = '#00ffff'; e.currentTarget.style.textShadow = '0 0 10px rgba(0,255,255,0.5)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = '#8a8a9a'; e.currentTarget.style.textShadow = 'none'; }}
          >
            DONE
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShareDialog;
