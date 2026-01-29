import { Node } from '@xyflow/react';
import { TableAttribute, Cardinality } from '../types';

// SQL Dialect options
export type SQLDialect = 'mysql' | 'postgresql' | 'sqlite' | 'sqlserver';

interface GenerateSQLOptions {
  dialect?: SQLDialect;
  includeDropStatements?: boolean;
  includeComments?: boolean;
}

// Generate junction table name for M:N relationships
const generateJunctionTableName = (table1: string, table2: string): string => {
  // Sort alphabetically for consistency
  const sorted = [table1, table2].sort();
  return `${sorted[0]}_${sorted[1]}`;
};

// Track M:N relationships to generate junction tables
interface ManyToManyRelationship {
  table1: string;
  table1PK: string;
  table1PKType: string;
  table2: string;
  table2PK: string;
  table2PKType: string;
  onDelete?: string;
  onUpdate?: string;
}

export const generateSQL = (nodes: Node[], options: GenerateSQLOptions = {}): string => {
  const { dialect = 'mysql', includeDropStatements = false, includeComments = true } = options;
  
  // Input validation
  if (!nodes) {
    throw new Error('Invalid input: Nodes array is required');
  }
  
  if (!Array.isArray(nodes)) {
    throw new Error('Invalid input: Nodes must be an array');
  }
  
  if (nodes.length === 0) {
    return 'No tables to export!';
  }
  
  // Validate nodes structure
  const validationErrors: string[] = [];
  const tableNames = new Set<string>();
  const manyToManyRelationships: ManyToManyRelationship[] = [];
  
  nodes.forEach((node, index) => {
    if (!node || typeof node !== 'object') {
      validationErrors.push(`Node ${index + 1}: Invalid node structure`);
      return;
    }
    
    if (!node.data) {
      validationErrors.push(`Node ${index + 1}: Missing node data`);
      return;
    }
    
    const label = typeof node.data.label === 'string' ? node.data.label : `Table_${node.id}`;
    const tableName = label.replace(/\s+/g, '_');
    
    if (!tableName || tableName.trim() === '') {
      validationErrors.push(`Node ${index + 1}: Invalid or missing table name`);
    }
    
    if (tableNames.has(tableName)) {
      validationErrors.push(`Duplicate table name: ${tableName}`);
    }
    tableNames.add(tableName);
    
    const attrs = Array.isArray(node.data.attributes) ? node.data.attributes : [];
    const attributeNames = new Set<string>();
    
    attrs.forEach((attr, attrIndex) => {
      if (!attr || typeof attr !== 'object') {
        validationErrors.push(`Table ${tableName}, attribute ${attrIndex + 1}: Invalid attribute structure`);
        return;
      }
      
      if (!attr.name || typeof attr.name !== 'string' || attr.name.trim() === '') {
        validationErrors.push(`Table ${tableName}, attribute ${attrIndex + 1}: Invalid or missing attribute name`);
      } else {
        if (attributeNames.has(attr.name)) {
          validationErrors.push(`Table ${tableName}: Duplicate attribute name '${attr.name}'`);
        }
        attributeNames.add(attr.name);
      }
      
      // Validate foreign key references
      if (attr.type === 'FK') {
        if (!attr.refTable || !attr.refAttr) {
          validationErrors.push(`Table ${tableName}, attribute ${attr.name}: Foreign key missing reference information`);
        } else {
          const referencedNode = nodes.find(n => {
            const refLabel = typeof n.data.label === 'string' ? n.data.label : `Table_${n.id}`;
            const normalizedLabel = refLabel.replace(/\s+/g, '_');
            const normalizedRefTable = attr.refTable.replace(/\s+/g, '_');
            return refLabel === attr.refTable || 
                   normalizedLabel === normalizedRefTable || 
                   n.id === attr.refTable;
          });
          
          if (!referencedNode) {
            validationErrors.push(`Table ${tableName}, attribute ${attr.name}: References non-existent table '${attr.refTable}'`);
          } else {
            const refAttrs = Array.isArray(referencedNode.data.attributes) ? referencedNode.data.attributes : [];
            const referencedAttr = refAttrs.find(a => a.name === attr.refAttr);
            
            if (!referencedAttr) {
              validationErrors.push(`Table ${tableName}, attribute ${attr.name}: References non-existent attribute '${attr.refTable}.${attr.refAttr}'`);
            }
            
            // Track M:N relationships for junction table generation
            if (attr.cardinality === 'many-to-many') {
              const pk = attrs.find(a => a.type === 'PK');
              const refPK = refAttrs.find(a => a.type === 'PK');
              
              if (pk && refPK) {
                // Check if this M:N relationship already exists (avoid duplicates)
                const exists = manyToManyRelationships.some(r => 
                  (r.table1 === tableName && r.table2 === attr.refTable) ||
                  (r.table1 === attr.refTable && r.table2 === tableName)
                );
                
                if (!exists) {
                  manyToManyRelationships.push({
                    table1: tableName,
                    table1PK: pk.name,
                    table1PKType: pk.dataType || 'INTEGER',
                    table2: attr.refTable.replace(/\s+/g, '_'),
                    table2PK: refPK.name,
                    table2PKType: refPK.dataType || 'INTEGER',
                    onDelete: attr.onDelete,
                    onUpdate: attr.onUpdate,
                  });
                }
              }
            }
          }
        }
      }
    });
  });
  
  if (validationErrors.length > 0) {
    throw new Error(`Schema validation failed:\n${validationErrors.join('\n')}`);
  }
  
  // Generate SQL
  try {
    let allSQL = '';
    const generationErrors: string[] = [];
    
    // Add header comment
    if (includeComments) {
      allSQL += `-- Generated by SketchDB\n`;
      allSQL += `-- Dialect: ${dialect.toUpperCase()}\n`;
      allSQL += `-- Generated at: ${new Date().toISOString()}\n\n`;
    }
    
    // Add drop statements if requested
    if (includeDropStatements) {
      // Drop junction tables first
      manyToManyRelationships.forEach(rel => {
        const junctionName = generateJunctionTableName(rel.table1, rel.table2);
        allSQL += `DROP TABLE IF EXISTS ${junctionName};\n`;
      });
      
      // Drop main tables in reverse order
      [...nodes].reverse().forEach(node => {
        const label = typeof node.data.label === 'string' ? node.data.label : `Table_${node.id}`;
        const tableName = label.replace(/\s+/g, '_');
        allSQL += `DROP TABLE IF EXISTS ${tableName};\n`;
      });
      allSQL += '\n';
    }
    
    // Generate main tables
    nodes.forEach((node) => {
      try {
        const tableSQL = generateSingleTableManual(node, dialect, manyToManyRelationships);
        if (tableSQL) {
          allSQL += tableSQL + '\n\n';
        }
      } catch (error) {
        const tableName = typeof node.data.label === 'string' ? node.data.label : `Table_${node.id}`;
        const errorMsg = error instanceof Error ? error.message : String(error);
        generationErrors.push(`Failed to generate SQL for table ${tableName}: ${errorMsg}`);
      }
    });
    
    // Generate junction tables for M:N relationships
    if (manyToManyRelationships.length > 0) {
      if (includeComments) {
        allSQL += `-- Junction Tables for Many-to-Many Relationships\n\n`;
      }
      
      manyToManyRelationships.forEach(rel => {
        const junctionSQL = generateJunctionTable(rel, dialect);
        allSQL += junctionSQL + '\n\n';
      });
    }
    
    if (generationErrors.length > 0) {
      throw new Error(`SQL generation failed for some tables:\n${generationErrors.join('\n')}`);
    }
    
    const result = allSQL.trim();
    if (!result) {
      throw new Error('No SQL was generated from the provided tables');
    }
    
    return result;
  } catch (error) {
    console.error('SQL generation error:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(`Failed to generate SQL: ${String(error)}`);
  }
};

// Generate junction table for M:N relationship
const generateJunctionTable = (rel: ManyToManyRelationship, dialect: SQLDialect): string => {
  const junctionName = generateJunctionTableName(rel.table1, rel.table2);
  const fk1Name = `${rel.table1.toLowerCase()}_${rel.table1PK}`;
  const fk2Name = `${rel.table2.toLowerCase()}_${rel.table2PK}`;
  
  const onDelete = rel.onDelete || 'CASCADE';
  const onUpdate = rel.onUpdate || 'CASCADE';
  
  let sql = `CREATE TABLE ${junctionName} (\n`;
  sql += `  ${fk1Name} ${rel.table1PKType} NOT NULL,\n`;
  sql += `  ${fk2Name} ${rel.table2PKType} NOT NULL,\n`;
  sql += `  created_at ${dialect === 'postgresql' ? 'TIMESTAMPTZ' : 'TIMESTAMP'} DEFAULT ${dialect === 'postgresql' ? 'NOW()' : 'CURRENT_TIMESTAMP'},\n`;
  sql += `  PRIMARY KEY (${fk1Name}, ${fk2Name}),\n`;
  sql += `  FOREIGN KEY (${fk1Name}) REFERENCES ${rel.table1}(${rel.table1PK}) ON DELETE ${onDelete} ON UPDATE ${onUpdate},\n`;
  sql += `  FOREIGN KEY (${fk2Name}) REFERENCES ${rel.table2}(${rel.table2PK}) ON DELETE ${onDelete} ON UPDATE ${onUpdate}\n`;
  sql += `);`;
  
  return sql;
};

// Generate SQL for a single table
const generateSingleTableManual = (node: Node, dialect: SQLDialect, manyToManyRels: ManyToManyRelationship[]): string => {
  try {
    const sqlType = (attr: TableAttribute) => {
      let type = attr.dataType || 'VARCHAR(255)';
      
      // Dialect-specific type mappings
      if (dialect === 'postgresql') {
        if (type === 'DATETIME') type = 'TIMESTAMP';
        if (type === 'BLOB') type = 'BYTEA';
        if (type === 'DOUBLE') type = 'DOUBLE PRECISION';
      } else if (dialect === 'mysql') {
        if (type === 'SERIAL') type = 'INT AUTO_INCREMENT';
        if (type === 'BIGSERIAL') type = 'BIGINT AUTO_INCREMENT';
        if (type === 'TIMESTAMPTZ') type = 'TIMESTAMP';
        if (type === 'JSONB') type = 'JSON';
        if (type === 'BYTEA') type = 'BLOB';
      } else if (dialect === 'sqlite') {
        if (type.startsWith('VARCHAR')) type = 'TEXT';
        if (type === 'SERIAL' || type === 'BIGSERIAL') type = 'INTEGER';
        if (type === 'BOOLEAN') type = 'INTEGER';
        if (type === 'TIMESTAMPTZ') type = 'TEXT';
        if (type === 'JSONB') type = 'TEXT';
      }
      
      return type;
    };
    
    const label = typeof node.data.label === 'string' ? node.data.label : `Table_${node.id}`;
    const tableName = label.replace(/\s+/g, '_');
    const attrs = Array.isArray(node.data.attributes) ? node.data.attributes : [];
    
    if (!tableName || tableName.trim() === '') {
      throw new Error('Invalid table name');
    }
    
    if (!attrs.length) {
      return `-- Table ${tableName} has no attributes defined (skipped)`;
    }
    
    let sql = `CREATE TABLE ${tableName} (\n`;
    
    const columnDefinitions: string[] = [];
    attrs.forEach((attr: TableAttribute, index: number) => {
      if (!attr.name || typeof attr.name !== 'string' || attr.name.trim() === '') {
        throw new Error(`Table ${tableName}: Attribute ${index + 1} has invalid name`);
      }
      
      let line = `  ${attr.name} ${sqlType(attr)}`;
      
      // Add AUTO_INCREMENT / SERIAL handling
      if (attr.isAutoIncrement) {
        if (dialect === 'mysql') {
          line += ' AUTO_INCREMENT';
        } else if (dialect === 'sqlserver') {
          line += ' IDENTITY(1,1)';
        }
        // PostgreSQL uses SERIAL type instead
      }
      
      // Add NOT NULL constraint (PKs are always NOT NULL)
      // For optional FK relationships, don't add NOT NULL
      if (attr.type === 'PK' || (attr.isNotNull && !(attr.type === 'FK' && attr.isOptional))) {
        line += ' NOT NULL';
      }
      
      // Add UNIQUE constraint (except for PKs which are inherently unique)
      if (attr.isUnique && attr.type !== 'PK') {
        line += ' UNIQUE';
      }
      
      // Add DEFAULT value
      if (attr.defaultValue) {
        // Handle special defaults
        if (attr.defaultValue.toUpperCase() === 'NOW()' || attr.defaultValue.toUpperCase() === 'CURRENT_TIMESTAMP') {
          line += dialect === 'postgresql' ? ' DEFAULT NOW()' : ' DEFAULT CURRENT_TIMESTAMP';
        } else if (attr.defaultValue.toUpperCase() === 'UUID()' || attr.defaultValue.toUpperCase() === 'GEN_RANDOM_UUID()') {
          line += dialect === 'postgresql' ? ' DEFAULT gen_random_uuid()' : ' DEFAULT (UUID())';
        } else {
          line += ` DEFAULT ${attr.defaultValue}`;
        }
      }
      
      // Add CHECK constraint
      if (attr.checkConstraint) {
        line += ` CHECK (${attr.checkConstraint})`;
      }
      
      // Add PRIMARY KEY constraint
      if (attr.type === 'PK') {
        line += ' PRIMARY KEY';
      }
      
      columnDefinitions.push(line);
    });
    
    sql += columnDefinitions.join(',\n');
    
    // Add foreign key constraints (skip M:N as they use junction tables)
    const fks = attrs.filter((a: TableAttribute) => 
      a.type === 'FK' && 
      a.refTable && 
      a.refAttr && 
      a.cardinality !== 'many-to-many'
    );
    
    if (fks.length) {
      fks.forEach((fk: TableAttribute) => {
        if (!fk.refTable || !fk.refAttr) {
          throw new Error(`Table ${tableName}: Foreign key ${fk.name} has incomplete reference information`);
        }
        
        const refTableNormalized = fk.refTable.replace(/\s+/g, '_');
        let fkLine = `,\n  FOREIGN KEY (${fk.name}) REFERENCES ${refTableNormalized}(${fk.refAttr})`;
        
        // Add ON DELETE action
        if (fk.onDelete && fk.onDelete !== 'NO ACTION') {
          fkLine += ` ON DELETE ${fk.onDelete}`;
        }
        
        // Add ON UPDATE action
        if (fk.onUpdate && fk.onUpdate !== 'NO ACTION') {
          fkLine += ` ON UPDATE ${fk.onUpdate}`;
        }
        
        sql += fkLine;
      });
    }
    
    sql += '\n);';
    
    // Add indexes for FKs (good practice)
    const fkIndexes = fks.map((fk: TableAttribute) => 
      `CREATE INDEX idx_${tableName}_${fk.name} ON ${tableName}(${fk.name});`
    ).join('\n');
    
    if (fkIndexes) {
      sql += '\n\n' + fkIndexes;
    }
    
    return sql;
  } catch (error) {
    const tableName = typeof node.data?.label === 'string' ? node.data.label : `Table_${node.id}`;
    const errorMsg = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to generate SQL for table ${tableName}: ${errorMsg}`);
  }
};

export const copyToClipboard = (text: string): void => {
  navigator.clipboard.writeText(text);
};