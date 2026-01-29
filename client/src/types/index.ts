// Relationship cardinality types
export type Cardinality = 'one-to-one' | 'one-to-many' | 'many-to-many';

// Cascade action types for referential integrity
export type CascadeAction = 'NO ACTION' | 'CASCADE' | 'SET NULL' | 'SET DEFAULT' | 'RESTRICT';

export const CASCADE_ACTIONS: CascadeAction[] = [
  'NO ACTION',
  'CASCADE', 
  'SET NULL',
  'SET DEFAULT',
  'RESTRICT'
];

export const CARDINALITY_OPTIONS: { value: Cardinality; label: string; description: string }[] = [
  { value: 'one-to-one', label: '1:1', description: 'One-to-One (e.g., User → Profile)' },
  { value: 'one-to-many', label: '1:N', description: 'One-to-Many (e.g., User → Orders)' },
  { value: 'many-to-many', label: 'M:N', description: 'Many-to-Many (e.g., Students ↔ Courses)' },
];

export interface TableAttribute {
  name: string;
  type: 'PK' | 'FK' | 'normal';
  dataType: string;
  refTable?: string;
  refAttr?: string;
  isEditing?: boolean;
  editName?: string;
  editDataType?: DataType;
  editType?: AttributeType;
  editRefTable?: string;
  editRefAttr?: string;
  // SQL constraints
  isNotNull?: boolean;
  isUnique?: boolean;
  defaultValue?: string;
  isAutoIncrement?: boolean;
  checkConstraint?: string; // e.g., "age > 0", "status IN ('active', 'inactive')"
  // Enhanced FK options
  cardinality?: Cardinality;
  onDelete?: CascadeAction;
  onUpdate?: CascadeAction;
  relationshipName?: string; // Custom name for the relationship
  isOptional?: boolean; // If true, FK can be NULL (optional relationship)
  // Edit state for enhanced FK options
  editCardinality?: Cardinality;
  editOnDelete?: CascadeAction;
  editOnUpdate?: CascadeAction;
  editIsOptional?: boolean;
  // Edit state for column constraints
  editCheckConstraint?: string;
  editDefaultValue?: string;
  editIsNotNull?: boolean;
  editIsUnique?: boolean;
}

export interface TableData {
  label: string;
  attributes: TableAttribute[];
  color?: string; // Visual color for the table (doesn't affect SQL)
  [key: string]: unknown;
}

export interface TableNodeData extends TableData {
  id?: string;
}

export type AttributeType = 'PK' | 'FK' | 'normal';

export type DataType = 
  | 'VARCHAR(255)' 
  | 'VARCHAR(100)' 
  | 'VARCHAR(50)' 
  | 'TEXT' 
  | 'INTEGER' 
  | 'BIGINT' 
  | 'SMALLINT'
  | 'SERIAL'
  | 'BIGSERIAL'
  | 'DECIMAL(10,2)' 
  | 'DECIMAL(18,4)'
  | 'FLOAT' 
  | 'DOUBLE' 
  | 'BOOLEAN' 
  | 'DATE' 
  | 'DATETIME' 
  | 'TIMESTAMP' 
  | 'TIMESTAMPTZ'
  | 'TIME' 
  | 'CHAR(10)' 
  | 'CHAR(36)'
  | 'UUID'
  | 'JSON' 
  | 'JSONB'
  | 'BLOB'
  | 'BYTEA'
  | 'ENUM';

export const DATA_TYPES: DataType[] = [
  'VARCHAR(255)',
  'VARCHAR(100)',
  'VARCHAR(50)',
  'TEXT',
  'INTEGER',
  'BIGINT',
  'SMALLINT',
  'SERIAL',
  'BIGSERIAL',
  'DECIMAL(10,2)',
  'DECIMAL(18,4)',
  'FLOAT',
  'DOUBLE',
  'BOOLEAN',
  'DATE',
  'DATETIME',
  'TIMESTAMP',
  'TIMESTAMPTZ',
  'TIME',
  'CHAR(10)',
  'CHAR(36)',
  'UUID',
  'JSON',
  'JSONB',
  'BLOB',
  'BYTEA',
  'ENUM'
];

// Helper to get default cascade actions
export const getDefaultCascadeActions = (cardinality: Cardinality): { onDelete: CascadeAction; onUpdate: CascadeAction } => {
  switch (cardinality) {
    case 'one-to-one':
      return { onDelete: 'CASCADE', onUpdate: 'CASCADE' };
    case 'one-to-many':
      return { onDelete: 'CASCADE', onUpdate: 'CASCADE' };
    case 'many-to-many':
      return { onDelete: 'CASCADE', onUpdate: 'CASCADE' };
    default:
      return { onDelete: 'NO ACTION', onUpdate: 'NO ACTION' };
  }
};