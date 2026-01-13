import React from 'react';

export type Theme = 'light' | 'dark' | 'system';

export interface LocalConfigContextType {
  // Theme settings
  theme: Theme;
  setTheme: (theme: Theme) => void;
  
  // UI preferences
  showMinimap: boolean;
  setShowMinimap: (show: boolean) => void;
  
  showGrid: boolean;
  setShowGrid: (show: boolean) => void;
  
  showAttributeTypes: boolean;
  setShowAttributeTypes: (show: boolean) => void;
  
  showTableColors: boolean;
  setShowTableColors: (show: boolean) => void;
  
  // Auto-save settings
  autoSaveEnabled: boolean;
  setAutoSaveEnabled: (enabled: boolean) => void;
  
  autoSaveInterval: number; // in seconds
  setAutoSaveInterval: (interval: number) => void;
  
  // Canvas settings
  snapToGrid: boolean;
  setSnapToGrid: (snap: boolean) => void;
  
  gridSize: number;
  setGridSize: (size: number) => void;
  
  // Zoom settings
  defaultZoom: number;
  setDefaultZoom: (zoom: number) => void;
  
  // Connection settings
  showConnectionHandles: boolean;
  setShowConnectionHandles: (show: boolean) => void;
  
  // Recently opened diagrams
  recentDiagrams: number[];
  addRecentDiagram: (diagramId: number) => void;
  clearRecentDiagrams: () => void;
  
  // Workspace ID for analytics
  workspaceId: string;
  
  // Reset all settings
  resetToDefaults: () => void;
}

export const LocalConfigContext = React.createContext<LocalConfigContextType | null>(null);

export const useLocalConfig = () => {
  const context = React.useContext(LocalConfigContext);
  if (!context) {
    throw new Error('useLocalConfig must be used within a LocalConfigProvider');
  }
  return context;
};