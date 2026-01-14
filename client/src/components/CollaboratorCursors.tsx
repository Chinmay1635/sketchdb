/**
 * CollaboratorCursors Component
 * 
 * Displays cursors of collaborators on the ReactFlow canvas
 * Each cursor shows the username and moves smoothly with interpolation
 */

import React, { useEffect, useState, useCallback } from 'react';
import { useViewport } from 'reactflow';
import type { CollaboratorInfo } from '../types/collaboration';

interface CollaboratorCursorsProps {
  collaborators: CollaboratorInfo[];
}

interface CursorState {
  x: number;
  y: number;
  targetX: number;
  targetY: number;
}

// Smooth cursor interpolation factor (0-1, higher = faster)
const LERP_FACTOR = 0.3;

export const CollaboratorCursors: React.FC<CollaboratorCursorsProps> = ({ collaborators }) => {
  const viewport = useViewport();
  const [cursorStates, setCursorStates] = useState<Map<string, CursorState>>(new Map());

  // Update target positions when collaborators change
  useEffect(() => {
    setCursorStates(prev => {
      const newStates = new Map(prev);
      
      collaborators.forEach(collab => {
        if (collab.cursor) {
          const existing = newStates.get(collab.id);
          if (existing) {
            // Update target position
            newStates.set(collab.id, {
              ...existing,
              targetX: collab.cursor.x,
              targetY: collab.cursor.y
            });
          } else {
            // New cursor - start at target position
            newStates.set(collab.id, {
              x: collab.cursor.x,
              y: collab.cursor.y,
              targetX: collab.cursor.x,
              targetY: collab.cursor.y
            });
          }
        }
      });

      // Remove cursors for collaborators who left
      const currentIds = new Set(collaborators.map(c => c.id));
      for (const id of newStates.keys()) {
        if (!currentIds.has(id)) {
          newStates.delete(id);
        }
      }

      return newStates;
    });
  }, [collaborators]);

  // Smooth animation loop
  useEffect(() => {
    let animationFrameId: number;
    
    const animate = () => {
      setCursorStates(prev => {
        const newStates = new Map();
        let needsUpdate = false;

        prev.forEach((state, id) => {
          const dx = state.targetX - state.x;
          const dy = state.targetY - state.y;
          
          // Only update if there's significant movement
          if (Math.abs(dx) > 0.1 || Math.abs(dy) > 0.1) {
            needsUpdate = true;
            newStates.set(id, {
              ...state,
              x: state.x + dx * LERP_FACTOR,
              y: state.y + dy * LERP_FACTOR
            });
          } else {
            newStates.set(id, state);
          }
        });

        return needsUpdate ? newStates : prev;
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  // Convert flow coordinates to screen coordinates
  const flowToScreen = useCallback((x: number, y: number) => {
    return {
      x: x * viewport.zoom + viewport.x,
      y: y * viewport.zoom + viewport.y
    };
  }, [viewport]);

  // Only show collaborators with cursors
  const collaboratorsWithCursors = collaborators.filter(c => {
    const state = cursorStates.get(c.id);
    return state && c.cursor;
  });

  if (collaboratorsWithCursors.length === 0) {
    return null;
  }

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        overflow: 'hidden',
        zIndex: 1000
      }}
    >
      {collaboratorsWithCursors.map(collab => {
        const state = cursorStates.get(collab.id);
        if (!state) return null;

        const screenPos = flowToScreen(state.x, state.y);
        const color = collab.color || '#666';

        return (
          <div
            key={collab.id}
            style={{
              position: 'absolute',
              left: screenPos.x,
              top: screenPos.y,
              transform: 'translate(-2px, -2px)',
              transition: 'opacity 0.2s',
              pointerEvents: 'none'
            }}
          >
            {/* Cursor SVG */}
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.3))' }}
            >
              <path
                d="M5.65376 3.15327L19.2892 15.5081C19.6839 15.8592 19.4672 16.5 18.9461 16.5H12.3889L12.3889 16.5051C12.0583 16.5051 11.7497 16.6683 11.5664 16.9413L8.30113 21.7927C8.05023 22.1663 7.5 21.9889 7.5 21.5341L7.5 4.01631C7.5 3.51539 8.0725 3.21758 8.4694 3.49929L5.65376 3.15327Z"
                fill={color}
                stroke="white"
                strokeWidth="1.5"
              />
            </svg>
            
            {/* Username label */}
            <div
              style={{
                position: 'absolute',
                left: 16,
                top: 16,
                backgroundColor: color,
                color: 'white',
                padding: '2px 8px',
                borderRadius: '4px',
                fontSize: '12px',
                fontWeight: 500,
                whiteSpace: 'nowrap',
                boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
              }}
            >
              {collab.username}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default CollaboratorCursors;
