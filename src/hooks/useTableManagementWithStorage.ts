import { useCallback, useEffect, useRef } from 'react';
import { Node, Edge } from '@xyflow/react';
import { useTableManagement } from './useTableManagement';
import { useStorage } from '../context/storage-context';
import { useLocalConfig } from '../context/local-config-context';
import { TableAttribute, TableData } from '../types';

interface UseTableManagementWithStorageProps {
  initialNodes?: Node[];
  setEdges?: React.Dispatch<React.SetStateAction<Edge[]>>;
}

export const useTableManagementWithStorage = ({ 
  initialNodes = [], 
  setEdges 
}: UseTableManagementWithStorageProps = {}) => {
  const tableManagement = useTableManagement(initialNodes, setEdges);
  const storage = useStorage();
  const config = useLocalConfig();
  
  // Track if we're in the initial load phase to prevent auto-save during load
  const isInitialLoad = useRef(true);
  const lastSaveTime = useRef<number>(0);

  // Auto-save functionality
  const saveToStorage = useCallback(async () => {
    if (!storage.currentDiagram?.id || storage.isLoading || isInitialLoad.current) {
      return;
    }

    // Prevent rapid consecutive saves
    const now = Date.now();
    if (now - lastSaveTime.current < 1000) { // Minimum 1 second between saves
      return;
    }
    lastSaveTime.current = now;

    try {
      // Save all tables to storage
      for (const node of tableManagement.nodes) {
        if (node.type === 'tableNode' && node.data) {
          const nodeData = node.data as TableData;
          await storage.saveTable({
            nodeId: node.id,
            name: nodeData.label || 'Unnamed Table',
            x: node.position.x,
            y: node.position.y,
            color: nodeData.color,
            attributes: nodeData.attributes || []
          });
        }
      }

      console.log('Auto-saved to storage successfully');
    } catch (error) {
      console.error('Failed to auto-save to storage:', error);
    }
  }, [tableManagement.nodes, storage]);

  // Load data from storage when diagram changes
  const loadFromStorage = useCallback(async () => {
    if (!storage.currentDiagram?.id || storage.isLoading) {
      return;
    }

    try {
      console.log(`Loading diagram: ${storage.currentDiagram.name} (ID: ${storage.currentDiagram.id})`);
      const { nodes, edges } = await storage.exportToNodes(storage.currentDiagram.id);
      
      // Always clear and then load - this ensures fresh canvas for new diagrams
      if (nodes.length > 0) {
        // Convert nodes to ensure compatibility
        const compatibleNodes = nodes.map(node => ({
          ...node,
          width: node.width || undefined,
          height: node.height || undefined
        }));
        
        tableManagement.importNodes(compatibleNodes);
        console.log(`Loaded ${nodes.length} tables from storage`);
      } else {
        // Clear canvas for empty diagram
        tableManagement.importNodes([]);
        console.log('Loaded empty diagram - cleared canvas');
      }

      // Always set edges (empty array for new diagrams)
      if (setEdges) {
        setEdges(edges);
        console.log(`Loaded ${edges.length} relationships from storage`);
      }
    } catch (error) {
      console.error('Failed to load from storage:', error);
    }
  }, [storage.currentDiagram?.id, storage.isLoading, setEdges]); // Remove tableManagement dependency to prevent infinite loops

  // Auto-save effect
  useEffect(() => {
    if (!config.autoSaveEnabled || !storage.currentDiagram || isInitialLoad.current) {
      return;
    }

    const autoSaveTimer = setInterval(() => {
      if (!isInitialLoad.current) {
        saveToStorage();
      }
    }, config.autoSaveInterval * 1000);

    return () => clearInterval(autoSaveTimer);
  }, [config.autoSaveEnabled, config.autoSaveInterval, saveToStorage, storage.currentDiagram?.id]);

  // Load data when current diagram changes
  useEffect(() => {
    if (storage.currentDiagram && !storage.isLoading) {
      console.log(`Diagram changed to: ${storage.currentDiagram.name} (ID: ${storage.currentDiagram.id})`);
      console.log('Current nodes before load:', tableManagement.nodes.length);
      
      // Force clear the canvas first
      tableManagement.importNodes([]);
      if (setEdges) {
        setEdges([]);
      }
      
      isInitialLoad.current = true; // Set loading flag
      loadFromStorage().finally(() => {
        // Small delay to ensure state has settled before allowing auto-saves
        setTimeout(() => {
          isInitialLoad.current = false;
          console.log('Initial load complete for diagram:', storage.currentDiagram?.name);
        }, 1000);
      });
    }
  }, [storage.currentDiagram?.id, storage.isLoading, loadFromStorage]); // Add loadFromStorage dependency

  // Enhanced functions that trigger auto-save
  const addTableWithStorageSync = useCallback(async () => {
    // Use the original function
    tableManagement.addTable();
    
    // Trigger immediate save if auto-save is enabled and not in initial load
    if (config.autoSaveEnabled && !isInitialLoad.current) {
      // Small delay to ensure the state has updated
      setTimeout(saveToStorage, 100);
    }
  }, [tableManagement, config.autoSaveEnabled, saveToStorage]);

  const deleteTableWithStorageSync = useCallback(async () => {
    // Delete from storage first if there's a selected table
    if (storage.currentDiagram && tableManagement.selectedTableId) {
      await storage.deleteTable(tableManagement.selectedTableId);
    }
    
    // Use the original function
    tableManagement.deleteTable();
  }, [tableManagement, storage]);

  const addAttributeWithStorageSync = useCallback(async () => {
    // Use the original function
    tableManagement.addAttribute();
    
    // Trigger immediate save if auto-save is enabled and not in initial load
    if (config.autoSaveEnabled && !isInitialLoad.current) {
      setTimeout(saveToStorage, 100);
    }
  }, [tableManagement, config.autoSaveEnabled, saveToStorage]);

  const deleteAttributeWithStorageSync = useCallback(async (attributeIndex: number) => {
    // Use the original function
    tableManagement.onDeleteAttribute(attributeIndex);
    
    // Trigger immediate save if auto-save is enabled and not in initial load
    if (config.autoSaveEnabled && !isInitialLoad.current) {
      setTimeout(saveToStorage, 100);
    }
  }, [tableManagement, config.autoSaveEnabled, saveToStorage]);

  const changeTableColorWithStorageSync = useCallback(async (newColor: string) => {
    // Use the original function
    tableManagement.changeTableColor(newColor);
    
    // Trigger immediate save if auto-save is enabled and not in initial load
    if (config.autoSaveEnabled && !isInitialLoad.current) {
      setTimeout(saveToStorage, 100);
    }
  }, [tableManagement, config.autoSaveEnabled, saveToStorage]);

  // Manual save function
  const manualSave = useCallback(async () => {
    await saveToStorage();
  }, [saveToStorage]);

  // Import/export functions
  const importDiagram = useCallback(async (nodes: Node[], edges: Edge[]) => {
    if (storage.currentDiagram) {
      // Convert nodes to ensure compatibility with storage
      const compatibleNodes = nodes.map(node => ({
        ...node,
        width: node.width ?? undefined,
        height: node.height ?? undefined,
        extent: node.extent === null ? undefined : node.extent
      }));
      
      await storage.importFromNodes(compatibleNodes as any, edges);
      await loadFromStorage();
    }
  }, [storage, loadFromStorage]);

  const exportDiagram = useCallback(async () => {
    if (storage.currentDiagram) {
      return await storage.exportToNodes(storage.currentDiagram.id);
    }
    return { nodes: [], edges: [] };
  }, [storage]);

  return {
    // All original table management functionality
    ...tableManagement,
    
    // Storage-enhanced functions (override the originals)
    addTable: addTableWithStorageSync,
    deleteTable: deleteTableWithStorageSync,
    addAttribute: addAttributeWithStorageSync,
    onDeleteAttribute: deleteAttributeWithStorageSync,
    changeTableColor: changeTableColorWithStorageSync,
    
    // Storage operations
    saveToStorage: manualSave,
    loadFromStorage,
    importDiagram,
    exportDiagram,
    
    // Storage state
    currentDiagram: storage.currentDiagram,
    isStorageLoading: storage.isLoading,
    autoSaveEnabled: config.autoSaveEnabled,
    
    // Storage context access
    storage,
    config
  };
};