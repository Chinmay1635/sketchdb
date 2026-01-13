import Dexie, { Table } from 'dexie';
import { TableAttribute, DataType, AttributeType } from '../types';

// Database Interfaces
export interface Diagram {
  id?: number;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface DBTable {
  id?: number;
  diagramId: number;
  nodeId: string; // React Flow node ID
  name: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  color?: string;
  attributes: TableAttribute[];
  createdAt: Date;
  updatedAt: Date;
}

export interface DBRelationship {
  id?: number;
  diagramId: number;
  name?: string;
  sourceTableId: string; // nodeId of source table
  targetTableId: string; // nodeId of target table
  sourceAttributeName: string;
  targetAttributeName: string;
  type: 'one-to-one' | 'one-to-many' | 'many-to-many';
  createdAt: Date;
}

export interface AppConfig {
  id?: number;
  defaultDiagramId?: number;
  lastOpenedDiagramId?: number;
}

// Extended Dexie Database
export class SchemaDB extends Dexie {
  diagrams!: Table<Diagram>;
  db_tables!: Table<DBTable>;
  db_relationships!: Table<DBRelationship>;
  config!: Table<AppConfig>;

  constructor() {
    super('SchemaDesignerDB');
    
    this.version(1).stores({
      diagrams: '++id, name, createdAt, updatedAt',
      db_tables: '++id, diagramId, nodeId, name, x, y, createdAt, updatedAt',
      db_relationships: '++id, diagramId, sourceTableId, targetTableId, createdAt',
      config: '++id, defaultDiagramId, lastOpenedDiagramId'
    });

    // Hooks for automatic timestamps
    this.db_tables.hook('creating', function (primKey, obj, trans) {
      obj.createdAt = new Date();
      obj.updatedAt = new Date();
    });

    this.db_tables.hook('updating', function (modifications) {
      (modifications as any).updatedAt = new Date();
    });

    this.diagrams.hook('creating', function (primKey, obj, trans) {
      obj.createdAt = new Date();
      obj.updatedAt = new Date();
    });

    this.diagrams.hook('updating', function (modifications) {
      (modifications as any).updatedAt = new Date();
    });

    this.db_relationships.hook('creating', function (primKey, obj, trans) {
      obj.createdAt = new Date();
    });
  }
}

// Create the database instance
export const db = new SchemaDB();

// Default diagram utilities
export const getOrCreateDefaultDiagram = async (): Promise<Diagram> => {
  // Check if there's a default diagram set in config
  const config = await db.config.toCollection().first();
  
  if (config?.defaultDiagramId) {
    const diagram = await db.diagrams.get(config.defaultDiagramId);
    if (diagram) {
      return diagram;
    }
  }

  // Check if there are any existing diagrams
  const existingDiagram = await db.diagrams.toCollection().first();
  if (existingDiagram) {
    // Set it as default
    await db.config.clear();
    await db.config.add({ defaultDiagramId: existingDiagram.id });
    return existingDiagram;
  }

  // Create a new default diagram
  const defaultDiagram: Omit<Diagram, 'id'> = {
    name: 'Default Schema',
    description: 'Default database schema diagram',
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const diagramId = await db.diagrams.add(defaultDiagram);
  
  // Set as default in config
  await db.config.clear();
  await db.config.add({ defaultDiagramId: diagramId });

  return { ...defaultDiagram, id: diagramId };
};

// Initialize database
export const initializeDatabase = async () => {
  try {
    await db.open();
    console.log('Database initialized successfully');
    
    // Ensure we have a default diagram
    await getOrCreateDefaultDiagram();
    
    return true;
  } catch (error) {
    console.error('Failed to initialize database:', error);
    return false;
  }
};