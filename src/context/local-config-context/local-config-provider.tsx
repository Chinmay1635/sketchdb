import React, { useState, useEffect, useCallback } from 'react';
import { LocalConfigContext, LocalConfigContextType, Theme } from './local-config-context';

interface LocalConfigProviderProps {
  children: React.ReactNode;
}

// Default configuration values
const DEFAULT_CONFIG = {
  theme: 'system' as Theme,
  showMinimap: true,
  showGrid: true,
  showAttributeTypes: true,
  showTableColors: true,
  autoSaveEnabled: true,
  autoSaveInterval: 10, // 10    seconds
  snapToGrid: false,
  gridSize: 20,
  defaultZoom: 1,
  showConnectionHandles: true,
  recentDiagrams: [] as number[]
};

// Generate a unique workspace ID
const generateWorkspaceId = (): string => {
  return `workspace_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Helper functions for localStorage
function getLocalStorageItem<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch {
    return defaultValue;
  }
}

const setLocalStorageItem = (key: string, value: any): void => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn(`Failed to save ${key} to localStorage:`, error);
  }
};

export const LocalConfigProvider: React.FC<LocalConfigProviderProps> = ({ children }) => {
  // Theme settings
  const [theme, setThemeState] = useState<Theme>(
    () => getLocalStorageItem('schema-designer-theme', DEFAULT_CONFIG.theme)
  );
  
  // UI preferences
  const [showMinimap, setShowMinimapState] = useState<boolean>(
    () => getLocalStorageItem('schema-designer-show-minimap', DEFAULT_CONFIG.showMinimap)
  );
  
  const [showGrid, setShowGridState] = useState<boolean>(
    () => getLocalStorageItem('schema-designer-show-grid', DEFAULT_CONFIG.showGrid)
  );
  
  const [showAttributeTypes, setShowAttributeTypesState] = useState<boolean>(
    () => getLocalStorageItem('schema-designer-show-attribute-types', DEFAULT_CONFIG.showAttributeTypes)
  );
  
  const [showTableColors, setShowTableColorsState] = useState<boolean>(
    () => getLocalStorageItem('schema-designer-show-table-colors', DEFAULT_CONFIG.showTableColors)
  );
  
  // Auto-save settings
  const [autoSaveEnabled, setAutoSaveEnabledState] = useState<boolean>(
    () => getLocalStorageItem('schema-designer-auto-save-enabled', DEFAULT_CONFIG.autoSaveEnabled)
  );
  
  const [autoSaveInterval, setAutoSaveIntervalState] = useState<number>(
    () => getLocalStorageItem('schema-designer-auto-save-interval', DEFAULT_CONFIG.autoSaveInterval)
  );
  
  // Canvas settings
  const [snapToGrid, setSnapToGridState] = useState<boolean>(
    () => getLocalStorageItem('schema-designer-snap-to-grid', DEFAULT_CONFIG.snapToGrid)
  );
  
  const [gridSize, setGridSizeState] = useState<number>(
    () => getLocalStorageItem('schema-designer-grid-size', DEFAULT_CONFIG.gridSize)
  );
  
  // Zoom settings
  const [defaultZoom, setDefaultZoomState] = useState<number>(
    () => getLocalStorageItem('schema-designer-default-zoom', DEFAULT_CONFIG.defaultZoom)
  );
  
  // Connection settings
  const [showConnectionHandles, setShowConnectionHandlesState] = useState<boolean>(
    () => getLocalStorageItem('schema-designer-show-connection-handles', DEFAULT_CONFIG.showConnectionHandles)
  );
  
  // Recently opened diagrams
  const [recentDiagrams, setRecentDiagramsState] = useState<number[]>(
    () => getLocalStorageItem('schema-designer-recent-diagrams', DEFAULT_CONFIG.recentDiagrams)
  );
  
  // Workspace ID
  const [workspaceId] = useState<string>(
    () => getLocalStorageItem('schema-designer-workspace-id', generateWorkspaceId())
  );

  // Save workspaceId to localStorage on first creation
  useEffect(() => {
    setLocalStorageItem('schema-designer-workspace-id', workspaceId);
  }, [workspaceId]);

  // Theme setter with localStorage persistence
  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
    setLocalStorageItem('schema-designer-theme', newTheme);
  }, []);

  // UI preference setters with localStorage persistence
  const setShowMinimap = useCallback((show: boolean) => {
    setShowMinimapState(show);
    setLocalStorageItem('schema-designer-show-minimap', show);
  }, []);

  const setShowGrid = useCallback((show: boolean) => {
    setShowGridState(show);
    setLocalStorageItem('schema-designer-show-grid', show);
  }, []);

  const setShowAttributeTypes = useCallback((show: boolean) => {
    setShowAttributeTypesState(show);
    setLocalStorageItem('schema-designer-show-attribute-types', show);
  }, []);

  const setShowTableColors = useCallback((show: boolean) => {
    setShowTableColorsState(show);
    setLocalStorageItem('schema-designer-show-table-colors', show);
  }, []);

  // Auto-save setters
  const setAutoSaveEnabled = useCallback((enabled: boolean) => {
    setAutoSaveEnabledState(enabled);
    setLocalStorageItem('schema-designer-auto-save-enabled', enabled);
  }, []);

  const setAutoSaveInterval = useCallback((interval: number) => {
    setAutoSaveIntervalState(interval);
    setLocalStorageItem('schema-designer-auto-save-interval', interval);
  }, []);

  // Canvas setters
  const setSnapToGrid = useCallback((snap: boolean) => {
    setSnapToGridState(snap);
    setLocalStorageItem('schema-designer-snap-to-grid', snap);
  }, []);

  const setGridSize = useCallback((size: number) => {
    setGridSizeState(size);
    setLocalStorageItem('schema-designer-grid-size', size);
  }, []);

  // Zoom setter
  const setDefaultZoom = useCallback((zoom: number) => {
    setDefaultZoomState(zoom);
    setLocalStorageItem('schema-designer-default-zoom', zoom);
  }, []);

  // Connection setter
  const setShowConnectionHandles = useCallback((show: boolean) => {
    setShowConnectionHandlesState(show);
    setLocalStorageItem('schema-designer-show-connection-handles', show);
  }, []);

  // Recent diagrams management
  const addRecentDiagram = useCallback((diagramId: number) => {
    setRecentDiagramsState(prev => {
      const updated = [diagramId, ...prev.filter(id => id !== diagramId)].slice(0, 10); // Keep last 10
      setLocalStorageItem('schema-designer-recent-diagrams', updated);
      return updated;
    });
  }, []);

  const clearRecentDiagrams = useCallback(() => {
    setRecentDiagramsState([]);
    setLocalStorageItem('schema-designer-recent-diagrams', []);
  }, []);

  // Reset all settings to defaults
  const resetToDefaults = useCallback(() => {
    setTheme(DEFAULT_CONFIG.theme);
    setShowMinimap(DEFAULT_CONFIG.showMinimap);
    setShowGrid(DEFAULT_CONFIG.showGrid);
    setShowAttributeTypes(DEFAULT_CONFIG.showAttributeTypes);
    setShowTableColors(DEFAULT_CONFIG.showTableColors);
    setAutoSaveEnabled(DEFAULT_CONFIG.autoSaveEnabled);
    setAutoSaveInterval(DEFAULT_CONFIG.autoSaveInterval);
    setSnapToGrid(DEFAULT_CONFIG.snapToGrid);
    setGridSize(DEFAULT_CONFIG.gridSize);
    setDefaultZoom(DEFAULT_CONFIG.defaultZoom);
    setShowConnectionHandles(DEFAULT_CONFIG.showConnectionHandles);
    clearRecentDiagrams();
  }, [
    setTheme, setShowMinimap, setShowGrid, setShowAttributeTypes, setShowTableColors,
    setAutoSaveEnabled, setAutoSaveInterval, setSnapToGrid, setGridSize, setDefaultZoom,
    setShowConnectionHandles, clearRecentDiagrams
  ]);

  const contextValue: LocalConfigContextType = {
    theme,
    setTheme,
    showMinimap,
    setShowMinimap,
    showGrid,
    setShowGrid,
    showAttributeTypes,
    setShowAttributeTypes,
    showTableColors,
    setShowTableColors,
    autoSaveEnabled,
    setAutoSaveEnabled,
    autoSaveInterval,
    setAutoSaveInterval,
    snapToGrid,
    setSnapToGrid,
    gridSize,
    setGridSize,
    defaultZoom,
    setDefaultZoom,
    showConnectionHandles,
    setShowConnectionHandles,
    recentDiagrams,
    addRecentDiagram,
    clearRecentDiagrams,
    workspaceId,
    resetToDefaults
  };

  return (
    <LocalConfigContext.Provider value={contextValue}>
      {children}
    </LocalConfigContext.Provider>
  );
};