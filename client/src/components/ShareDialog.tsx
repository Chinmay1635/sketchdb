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
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-xl shadow-2xl w-full max-w-lg border border-gray-700 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Share Diagram</h2>
              <p className="text-sm text-gray-400 truncate max-w-[250px]">{diagramName || 'Untitled Diagram'}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors p-1"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4 overflow-y-auto flex-1">
          {/* Error message */}
          {error && (
            <div className="p-3 bg-red-900/50 border border-red-700 rounded-lg text-red-300 text-sm">
              {error}
            </div>
          )}

          {/* Success message */}
          {successMessage && (
            <div className="p-3 bg-green-900/50 border border-green-700 rounded-lg text-green-300 text-sm">
              {successMessage}
            </div>
          )}

          {/* No diagram saved message */}
          {!diagramId && (
            <div className="p-4 bg-yellow-900/30 border border-yellow-700 rounded-lg">
              <div className="flex items-center gap-2 text-yellow-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span className="font-medium">Save your diagram first</span>
              </div>
              <p className="text-sm text-gray-400 mt-2">
                You need to save your diagram before you can share it with others.
              </p>
            </div>
          )}

          {/* Collaborator section */}
          {diagramId && (
            <>
              {/* Add Collaborator Section */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                    className="flex-1 px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-500"
                    onKeyDown={(e) => e.key === 'Enter' && handleAddCollaborator()}
                  />
                  <select
                    value={newCollaboratorPermission}
                    onChange={(e) => setNewCollaboratorPermission(e.target.value as 'view' | 'edit')}
                    className="px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="edit">Can edit</option>
                    <option value="view">Can view</option>
                  </select>
                  <button
                    onClick={handleAddCollaborator}
                    disabled={isAddingCollaborator || !newCollaboratorEmail.trim()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isAddingCollaborator ? (
                      <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                    ) : (
                      'Add'
                    )}
                  </button>
                </div>
              </div>

              {/* Current Collaborators */}
              {(collaborators.length > 0 || isLoadingCollaborators) && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                    Collaborators ({collaborators.length})
                  </label>
                  
                  {isLoadingCollaborators ? (
                    <div className="flex items-center justify-center py-4">
                      <svg className="w-6 h-6 animate-spin text-gray-400" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {collaborators.map((collab) => (
                        <div
                          key={collab.user._id}
                          className="flex items-center justify-between p-3 bg-gray-900 rounded-lg border border-gray-700"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-medium text-sm">
                              {collab.user.username.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-white">{collab.user.username}</p>
                              <p className="text-xs text-gray-400">{collab.user.email}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <select
                              value={collab.permission}
                              onChange={(e) => handleUpdateCollaboratorPermission(collab.user._id, e.target.value as 'view' | 'edit')}
                              className="px-2 py-1 bg-gray-800 border border-gray-600 rounded text-gray-300 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                            >
                              <option value="edit">Can edit</option>
                              <option value="view">Can view</option>
                            </select>
                            <button
                              onClick={() => handleRemoveCollaborator(collab.user._id)}
                              className="p-1 text-gray-400 hover:text-red-400 transition-colors"
                              title="Remove collaborator"
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
              <div className="border-t border-gray-700" />
            </>
          )}

          {/* Public toggle */}
          {diagramId && (
            <>
              <div className="flex items-center justify-between p-4 bg-gray-750 rounded-lg border border-gray-700">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isPublic ? 'bg-green-600' : 'bg-gray-600'}`}>
                    {isPublic ? (
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-white">
                      {isPublic ? 'Public' : 'Private'}
                    </p>
                    <p className="text-sm text-gray-400">
                      {isPublic 
                        ? 'Anyone with the link can view' 
                        : 'Only you and collaborators can access'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleTogglePublic}
                  disabled={isUpdating}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    isPublic ? 'bg-green-600' : 'bg-gray-600'
                  } ${isUpdating ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      isPublic ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Share link */}
              {publicUrl && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300">Share Link</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={publicUrl}
                      readOnly
                      className="flex-1 px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      onClick={handleCopyLink}
                      className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                        copied
                          ? 'bg-green-600 text-white'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                    >
                      {copied ? (
                        <span className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Copied!
                        </span>
                      ) : (
                        <span className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                          </svg>
                          Copy
                        </span>
                      )}
                    </button>
                  </div>
                  
                  {!isPublic && (
                    <p className="text-xs text-yellow-500 flex items-center gap-1">
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
        <div className="p-4 border-t border-gray-700 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShareDialog;
