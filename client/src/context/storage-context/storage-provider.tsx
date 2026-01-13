import React, { useState, useCallback, useEffect } from 'react';
import { Node, Edge } from '@xyflow/react';
import { StorageContext, StorageContextType } from './storage-context';
import { db, Diagram, DBTable, DBRelationship, getOrCreateDefaultDiagram, initializeDatabase } from '../../lib/database';
import { TableAttribute } from '../../types';

interface StorageProviderProps {
  children: React.ReactNode;
}

export const StorageProvider: React.FC<StorageProviderProps> = ({ children }) => {
  const [currentDiagram, setCurrentDiagram] = useState<Diagram | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [enableAutoSave, setEnableAutoSave] = useState(true);

  // Initialize database and load default diagram
  useEffect(() => {
    const initialize = async () => {
      try {
        setIsLoading(true);
        const initialized = await initializeDatabase();
        
        if (initialized) {
          const defaultDiagram = await getOrCreateDefaultDiagram();
          setCurrentDiagram(defaultDiagram);
        }
      } catch (error) {
        console.error('Failed to initialize storage:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initialize();
  }, []);

  // Diagram operations
  const createDiagram = useCallback(async (name: string, description?: string): Promise<Diagram> => {
    const newDiagram: Omit<Diagram, 'id'> = {
      name,
      description,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const id = await db.diagrams.add(newDiagram);
    const diagram = { ...newDiagram, id };
    
    // Set as current diagram
    setCurrentDiagram(diagram);
    
    // Update config to make this the default
    await db.config.clear();
    await db.config.add({ defaultDiagramId: id });

    return diagram;
  }, []);

  const loadDiagram = useCallback(async (diagramId: number): Promise<void> => {
    const diagram = await db.diagrams.get(diagramId);
    if (diagram) {
      setCurrentDiagram(diagram);
      
      // Update last opened diagram
      const config = await db.config.toCollection().first();
      if (config) {
        await db.config.update(config.id!, { lastOpenedDiagramId: diagramId });
      } else {
        await db.config.add({ lastOpenedDiagramId: diagramId });
      }
    } else {
      throw new Error(`Diagram with id ${diagramId} not found`);
    }
  }, []);

  const updateDiagram = useCallback(async (diagramId: number, updates: Partial<Diagram>): Promise<void> => {
    await db.diagrams.update(diagramId, { ...updates, updatedAt: new Date() });
    
    // Update current diagram if it's the one being updated
    if (currentDiagram?.id === diagramId) {
      setCurrentDiagram(prev => prev ? { ...prev, ...updates, updatedAt: new Date() } : null);
    }
  }, [currentDiagram]);

  const deleteDiagram = useCallback(async (diagramId: number): Promise<void> => {
    // Delete all related data
    await db.transaction('rw', [db.diagrams, db.db_tables, db.db_relationships], async () => {
      await db.db_tables.where('diagramId').equals(diagramId).delete();
      await db.db_relationships.where('diagramId').equals(diagramId).delete();
      await db.diagrams.delete(diagramId);
    });

    // If this was the current diagram, load another one or create a new one
    if (currentDiagram?.id === diagramId) {
      const remainingDiagrams = await db.diagrams.toArray();
      if (remainingDiagrams.length > 0) {
        await loadDiagram(remainingDiagrams[0].id!);
      } else {
        // Create a new default diagram
        await createDiagram('Default Schema', 'Default database schema diagram');
      }
    }
  }, [currentDiagram, loadDiagram, createDiagram]);

  const listDiagrams = useCallback(async (): Promise<Diagram[]> => {
    return await db.diagrams.orderBy('updatedAt').reverse().toArray();
  }, []);

  // Table operations
  const saveTable = useCallback(async (table: {
    nodeId: string;
    name: string;
    x: number;
    y: number;
    width?: number;
    height?: number;
    color?: string;
    attributes: TableAttribute[];
  }): Promise<DBTable> => {
    if (!currentDiagram?.id) {
      throw new Error('No current diagram selected');
    }

    const dbTable: Omit<DBTable, 'id'> = {
      diagramId: currentDiagram.id,
      nodeId: table.nodeId,
      name: table.name,
      x: table.x,
      y: table.y,
      width: table.width,
      height: table.height,
      color: table.color,
      attributes: table.attributes,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Check if table already exists (for updates)
    const existingTable = await db.db_tables
      .where('diagramId').equals(currentDiagram.id)
      .and(t => t.nodeId === table.nodeId)
      .first();

    if (existingTable) {
      await db.db_tables.update(existingTable.id!, {
        ...dbTable,
        createdAt: existingTable.createdAt // Keep original creation date
      });
      return { ...dbTable, id: existingTable.id!, createdAt: existingTable.createdAt };
    } else {
      const id = await db.db_tables.add(dbTable);
      return { ...dbTable, id };
    }
  }, [currentDiagram]);

  const updateTable = useCallback(async (nodeId: string, updates: Partial<Omit<DBTable, 'id' | 'diagramId' | 'nodeId'>>): Promise<void> => {
    if (!currentDiagram?.id) return;

    const table = await db.db_tables
      .where('diagramId').equals(currentDiagram.id)
      .and(t => t.nodeId === nodeId)
      .first();

    if (table) {
      await db.db_tables.update(table.id!, { ...updates, updatedAt: new Date() });
    }
  }, [currentDiagram]);

  const deleteTable = useCallback(async (nodeId: string): Promise<void> => {
    if (!currentDiagram?.id) return;

    await db.transaction('rw', [db.db_tables, db.db_relationships], async () => {
      // Delete the table
      await db.db_tables
        .where('diagramId').equals(currentDiagram.id!)
        .and(t => t.nodeId === nodeId)
        .delete();

      // Delete related relationships
      await db.db_relationships
        .where('diagramId').equals(currentDiagram.id!)
        .and(r => r.sourceTableId === nodeId || r.targetTableId === nodeId)
        .delete();
    });
  }, [currentDiagram]);

  const getTable = useCallback(async (nodeId: string): Promise<DBTable | null> => {
    if (!currentDiagram?.id) return null;

    return await db.db_tables
      .where('diagramId').equals(currentDiagram.id)
      .and(t => t.nodeId === nodeId)
      .first() || null;
  }, [currentDiagram]);

  const listTables = useCallback(async (diagramId?: number): Promise<DBTable[]> => {
    const targetDiagramId = diagramId || currentDiagram?.id;
    if (!targetDiagramId) return [];

    return await db.db_tables
      .where('diagramId').equals(targetDiagramId)
      .toArray();
  }, [currentDiagram]);

  // Relationship operations
  const saveRelationship = useCallback(async (relationship: {
    name?: string;
    sourceTableId: string;
    targetTableId: string;
    sourceAttributeName: string;
    targetAttributeName: string;
    type: 'one-to-one' | 'one-to-many' | 'many-to-many';
  }): Promise<DBRelationship> => {
    if (!currentDiagram?.id) {
      throw new Error('No current diagram selected');
    }

    const dbRelationship: Omit<DBRelationship, 'id'> = {
      diagramId: currentDiagram.id,
      ...relationship,
      createdAt: new Date()
    };

    const id = await db.db_relationships.add(dbRelationship);
    return { ...dbRelationship, id };
  }, [currentDiagram]);

  const deleteRelationship = useCallback(async (id: number): Promise<void> => {
    await db.db_relationships.delete(id);
  }, []);

  const listRelationships = useCallback(async (diagramId?: number): Promise<DBRelationship[]> => {
    const targetDiagramId = diagramId || currentDiagram?.id;
    if (!targetDiagramId) return [];

    return await db.db_relationships
      .where('diagramId').equals(targetDiagramId)
      .toArray();
  }, [currentDiagram]);

  // Bulk operations
  const importFromNodes = useCallback(async (nodes: Node[], edges: Edge[]): Promise<void> => {
    if (!currentDiagram?.id) return;

    await db.transaction('rw', [db.db_tables, db.db_relationships], async () => {
      // Clear existing data for this diagram
      await db.db_tables.where('diagramId').equals(currentDiagram.id!).delete();
      await db.db_relationships.where('diagramId').equals(currentDiagram.id!).delete();

      // Import tables from nodes
      for (const node of nodes) {
        if (node.type === 'tableNode' && node.data) {
          const nodeData = node.data as { label?: string; color?: string; attributes?: TableAttribute[] };
          await saveTable({
            nodeId: node.id,
            name: nodeData.label || 'Unnamed Table',
            x: node.position.x,
            y: node.position.y,
            color: nodeData.color,
            attributes: nodeData.attributes || []
          });
        }
      }

      // Import relationships from edges
      for (const edge of edges) {
        // You can extend this to parse edge data for relationship details
        await saveRelationship({
          sourceTableId: edge.source,
          targetTableId: edge.target,
          sourceAttributeName: edge.sourceHandle || 'id',
          targetAttributeName: edge.targetHandle || 'id',
          type: 'one-to-many' // Default, can be enhanced
        });
      }
    });
  }, [currentDiagram, saveTable, saveRelationship]);

  const exportToNodes = useCallback(async (diagramId?: number): Promise<{ nodes: Node[], edges: Edge[] }> => {
    const targetDiagramId = diagramId || currentDiagram?.id;
    if (!targetDiagramId) return { nodes: [], edges: [] };

    const tables = await listTables(targetDiagramId);
    const relationships = await listRelationships(targetDiagramId);

    // Convert tables to nodes
    const nodes: Node[] = tables.map(table => ({
      id: table.nodeId,
      type: 'tableNode',
      position: { x: table.x, y: table.y },
      data: {
        label: table.name,
        attributes: table.attributes,
        color: table.color
      }
    }));

    // Convert relationships to edges
    const edges: Edge[] = relationships.map((rel, index) => ({
      id: `edge-${rel.id || index}`,
      source: rel.sourceTableId,
      target: rel.targetTableId,
      sourceHandle: rel.sourceAttributeName,
      targetHandle: rel.targetAttributeName,
      type: 'customEdge', // Use the same custom edge type as the app
      style: { stroke: "#0074D9", strokeWidth: 2 },
      markerEnd: { type: "arrowclosed", color: "#0074D9" },
      labelBgStyle: { fill: "#ffffff", fillOpacity: 0.8 },
      labelStyle: { fill: "#0074D9", fontWeight: "bold" },
      data: {
        relationshipType: rel.type,
        name: rel.name
      }
    }));

    return { nodes, edges };
  }, [currentDiagram, listTables, listRelationships]);

  const contextValue: StorageContextType = {
    currentDiagram,
    isLoading,
    createDiagram,
    loadDiagram,
    updateDiagram,
    deleteDiagram,
    listDiagrams,
    saveTable,
    updateTable,
    deleteTable,
    getTable,
    listTables,
    saveRelationship,
    deleteRelationship,
    listRelationships,
    importFromNodes,
    exportToNodes,
    enableAutoSave,
    setEnableAutoSave
  };

  return (
    <StorageContext.Provider value={contextValue}>
      {children}
    </StorageContext.Provider>
  );
};