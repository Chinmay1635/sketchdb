import React from 'react';
import { Node, Edge } from '@xyflow/react';
import { Diagram, DBTable, DBRelationship } from '../../lib/database';
import { TableAttribute } from '../../types';

export interface StorageContextType {
  // Current diagram
  currentDiagram: Diagram | null;
  isLoading: boolean;
  
  // Diagram operations
  createDiagram: (name: string, description?: string) => Promise<Diagram>;
  loadDiagram: (diagramId: number) => Promise<void>;
  updateDiagram: (diagramId: number, updates: Partial<Diagram>) => Promise<void>;
  deleteDiagram: (diagramId: number) => Promise<void>;
  listDiagrams: () => Promise<Diagram[]>;
  
  // Table operations
  saveTable: (table: {
    nodeId: string;
    name: string;
    x: number;
    y: number;
    width?: number;
    height?: number;
    color?: string;
    attributes: TableAttribute[];
  }) => Promise<DBTable>;
  updateTable: (nodeId: string, updates: Partial<Omit<DBTable, 'id' | 'diagramId' | 'nodeId'>>) => Promise<void>;
  deleteTable: (nodeId: string) => Promise<void>;
  getTable: (nodeId: string) => Promise<DBTable | null>;
  listTables: (diagramId?: number) => Promise<DBTable[]>;
  
  // Relationship operations
  saveRelationship: (relationship: {
    name?: string;
    sourceTableId: string;
    targetTableId: string;
    sourceAttributeName: string;
    targetAttributeName: string;
    type: 'one-to-one' | 'one-to-many' | 'many-to-many';
  }) => Promise<DBRelationship>;
  deleteRelationship: (id: number) => Promise<void>;
  listRelationships: (diagramId?: number) => Promise<DBRelationship[]>;
  
  // Bulk operations
  importFromNodes: (nodes: Node[], edges: Edge[]) => Promise<void>;
  exportToNodes: (diagramId?: number) => Promise<{ nodes: Node[], edges: Edge[] }>;
  
  // Auto-save
  enableAutoSave: boolean;
  setEnableAutoSave: (enabled: boolean) => void;
}

export const StorageContext = React.createContext<StorageContextType | null>(null);

export const useStorage = () => {
  const context = React.useContext(StorageContext);
  if (!context) {
    throw new Error('useStorage must be used within a StorageProvider');
  }
  return context;
};