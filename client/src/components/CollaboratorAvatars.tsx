/**
 * CollaboratorAvatars Component
 * 
 * Displays avatars of all collaborators currently in the diagram
 * Shows who is online and their permission level
 */

import React, { useState } from 'react';
import type { CollaboratorInfo } from '../types/collaboration';

interface CollaboratorAvatarsProps {
  collaborators: CollaboratorInfo[];
  ownerUsername?: string | null;
  currentUserPermission?: 'view' | 'edit' | null;
  maxVisible?: number;
}

export const CollaboratorAvatars: React.FC<CollaboratorAvatarsProps> = ({
  collaborators,
  ownerUsername,
  currentUserPermission,
  maxVisible = 5
}) => {
  const [showTooltip, setShowTooltip] = useState<string | null>(null);
  const [showOverflow, setShowOverflow] = useState(false);

  const visibleCollaborators = collaborators.slice(0, maxVisible);
  const overflowCount = Math.max(0, collaborators.length - maxVisible);
  const overflowCollaborators = collaborators.slice(maxVisible);

  if (collaborators.length === 0) {
    return null;
  }

  const getInitials = (username: string): string => {
    return username.slice(0, 2).toUpperCase();
  };

  const getPermissionIcon = (permission: 'view' | 'edit') => {
    if (permission === 'edit') {
      return (
        <svg width="10" height="10" viewBox="0 0 16 16" fill="currentColor">
          <path d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708l-10 10a.5.5 0 0 1-.168.11l-5 2a.5.5 0 0 1-.65-.65l2-5a.5.5 0 0 1 .11-.168l10-10zM11.207 2.5L13.5 4.793 14.793 3.5 12.5 1.207 11.207 2.5zm1.586 3L10.5 3.207 4 9.707V10h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.293l6.5-6.5z"/>
        </svg>
      );
    }
    return (
      <svg width="10" height="10" viewBox="0 0 16 16" fill="currentColor">
        <path d="M16 8s-3-5.5-8-5.5S0 8 0 8s3 5.5 8 5.5S16 8 16 8zM1.173 8a13.133 13.133 0 0 1 1.66-2.043C4.12 4.668 5.88 3.5 8 3.5c2.12 0 3.879 1.168 5.168 2.457A13.133 13.133 0 0 1 14.828 8c-.058.087-.122.183-.195.288-.335.48-.83 1.12-1.465 1.755C11.879 11.332 10.119 12.5 8 12.5c-2.12 0-3.879-1.168-5.168-2.457A13.134 13.134 0 0 1 1.172 8z"/>
        <path d="M8 5.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5zM4.5 8a3.5 3.5 0 1 1 7 0 3.5 3.5 0 0 1-7 0z"/>
      </svg>
    );
  };

  return (
    <div className="flex items-center gap-2 relative">
      {/* Collaborator count label */}
      <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <path d="M15 14s1 0 1-1-1-4-5-4-5 3-5 4 1 1 1 1h8zm-7.978-1A.261.261 0 0 1 7 12.996c.001-.264.167-1.03.76-1.72C8.312 10.629 9.282 10 11 10c1.717 0 2.687.63 3.24 1.276.593.69.758 1.457.76 1.72l-.008.002a.274.274 0 0 1-.014.002H7.022zM11 7a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm3-2a3 3 0 1 1-6 0 3 3 0 0 1 6 0zM6.936 9.28a5.88 5.88 0 0 0-1.23-.247A7.35 7.35 0 0 0 5 9c-4 0-5 3-5 4 0 .667.333 1 1 1h4.216A2.238 2.238 0 0 1 5 13c0-1.01.377-2.042 1.09-2.904.243-.294.526-.569.846-.816zM4.92 10A5.493 5.493 0 0 0 4 13H1c0-.26.164-1.03.76-1.724.545-.636 1.492-1.256 3.16-1.275zM1.5 5.5a3 3 0 1 1 6 0 3 3 0 0 1-6 0zm3-2a2 2 0 1 0 0 4 2 2 0 0 0 0-4z"/>
        </svg>
        <span>{collaborators.length} online</span>
      </div>

      {/* Separator */}
      <div className="w-px h-4 bg-gray-300 dark:bg-gray-600"></div>

      {/* Avatar stack */}
      <div className="flex -space-x-2">
        {visibleCollaborators.map((collab, index) => (
          <div
            key={collab.id}
            className="relative"
            style={{ zIndex: visibleCollaborators.length - index }}
            onMouseEnter={() => setShowTooltip(collab.id)}
            onMouseLeave={() => setShowTooltip(null)}
          >
            {/* Avatar */}
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold border-2 border-white dark:border-gray-800 cursor-default transition-transform hover:scale-110 hover:z-50"
              style={{ backgroundColor: collab.color }}
            >
              {getInitials(collab.username)}
            </div>

            {/* Permission indicator */}
            <div
              className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-white dark:bg-gray-800 flex items-center justify-center shadow-sm"
              style={{ color: collab.permission === 'edit' ? '#22c55e' : '#6b7280' }}
            >
              {getPermissionIcon(collab.permission)}
            </div>

            {/* Tooltip */}
            {showTooltip === collab.id && (
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap shadow-lg z-50">
                <div className="font-medium">{collab.username}</div>
                <div className="text-gray-400 text-[10px]">
                  Can {collab.permission}
                </div>
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full">
                  <div className="border-4 border-transparent border-t-gray-900"></div>
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Overflow indicator */}
        {overflowCount > 0 && (
          <div
            className="relative"
            onMouseEnter={() => setShowOverflow(true)}
            onMouseLeave={() => setShowOverflow(false)}
          >
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-gray-600 dark:text-gray-300 text-xs font-bold border-2 border-white dark:border-gray-800 bg-gray-200 dark:bg-gray-700 cursor-default hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
              +{overflowCount}
            </div>

            {/* Overflow dropdown */}
            {showOverflow && (
              <div className="absolute top-full right-0 mt-2 py-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50 min-w-[150px]">
                {overflowCollaborators.map(collab => (
                  <div
                    key={collab.id}
                    className="flex items-center gap-2 px-3 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold"
                      style={{ backgroundColor: collab.color }}
                    >
                      {getInitials(collab.username)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {collab.username}
                      </div>
                    </div>
                    <div style={{ color: collab.permission === 'edit' ? '#22c55e' : '#6b7280' }}>
                      {getPermissionIcon(collab.permission)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Current user permission badge */}
      {currentUserPermission && (
        <>
          <div className="w-px h-4 bg-gray-300 dark:bg-gray-600"></div>
          <div
            className={`px-2 py-0.5 rounded text-xs font-medium ${
              currentUserPermission === 'edit'
                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
            }`}
          >
            {currentUserPermission === 'edit' ? 'Can Edit' : 'View Only'}
          </div>
        </>
      )}
    </div>
  );
};

export default CollaboratorAvatars;
