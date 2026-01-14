import React, { useState, useEffect } from 'react';
import { diagramsAPI } from '../services/api';

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

  // Generate the public URL
  const publicUrl = ownerUsername && diagramSlug 
    ? `${window.location.origin}/${ownerUsername}/${diagramSlug}`
    : null;

  useEffect(() => {
    if (!isOpen) {
      setCopied(false);
      setError(null);
    }
  }, [isOpen]);

  const handleTogglePublic = async () => {
    if (!diagramId) return;
    
    setIsUpdating(true);
    setError(null);
    
    try {
      // Update the diagram's public status
      await diagramsAPI.updateVisibility(diagramId, !isPublic);
      onVisibilityChange(!isPublic);
    } catch (err: any) {
      setError(err.message || 'Failed to update visibility');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCopyLink = async () => {
    if (!publicUrl) return;
    
    try {
      await navigator.clipboard.writeText(publicUrl);
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
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-xl shadow-2xl w-full max-w-md border border-gray-700">
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
        <div className="p-4 space-y-4">
          {/* Error message */}
          {error && (
            <div className="p-3 bg-red-900/50 border border-red-700 rounded-lg text-red-300 text-sm">
              {error}
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
                        : 'Only you can access this diagram'}
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
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShareDialog;
