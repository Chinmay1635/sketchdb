import { Node } from '@xyflow/react';
import { TableAttribute, AttributeType, DataType } from '../types';

interface ParsedTable {
  name: string;
  attributes: TableAttribute[];
}

interface ParsedForeignKey {
  table: string;
  column: string;
  referencedTable: string;
  referencedColumn: string;
}

export const parseSQLSchema = (sqlText: string): Node[] => {
  const tables: ParsedTable[] = [];
  const foreignKeys: ParsedForeignKey[] = [];
  
  // Clean up the SQL text
  const cleanSQL = sqlText
    .replace(/--.*$/gm, '') // Remove line comments
    .replace(/\/\*[\s\S]*?\*\//g, '') // Remove block comments
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();

  // Split by semicolons to get individual statements
  const statements = cleanSQL.split(';').filter(stmt => stmt.trim());

  statements.forEach(statement => {
    const trimmedStmt = statement.trim();
    
    if (trimmedStmt.toUpperCase().startsWith('CREATE TABLE')) {
      parseCreateTable(trimmedStmt, tables, foreignKeys);
    } else if (trimmedStmt.toUpperCase().startsWith('ALTER TABLE')) {
      parseAlterTable(trimmedStmt, foreignKeys);
    }
  });

  // Apply foreign key relationships to tables
  applyForeignKeys(tables, foreignKeys);

  // Convert to React Flow nodes
  return convertToNodes(tables);
};

const parseCreateTable = (statement: string, tables: ParsedTable[], foreignKeys: ParsedForeignKey[]) => {
  console.log('Parsing CREATE TABLE:', statement);
  
  // Extract table name
  const tableNameMatch = statement.match(/CREATE\s+TABLE\s+(\w+)\s*\(/i);
  if (!tableNameMatch) return;
  
  const tableName = tableNameMatch[1];
  console.log('Table name:', tableName);
  
  // Extract the content between parentheses
  const contentMatch = statement.match(/\(([\s\S]*)\)/);
  if (!contentMatch) return;
  
  const content = contentMatch[1];
  console.log('Table content:', content);
  const attributes: TableAttribute[] = [];
  
  // Split by commas, but be careful with nested parentheses
  const parts = splitByCommas(content);
  console.log('Split parts:', parts);
  
  parts.forEach(part => {
    const trimmedPart = part.trim();
    console.log('Parsing part:', trimmedPart);
    
    if (trimmedPart.toUpperCase().includes('FOREIGN KEY')) {
      // Parse inline foreign key constraint
      const fkMatch = trimmedPart.match(/FOREIGN\s+KEY\s*\(\s*(\w+)\s*\)\s+REFERENCES\s+(\w+)\s*\(\s*(\w+)\s*\)/i);
      if (fkMatch) {
        foreignKeys.push({
          table: tableName,
          column: fkMatch[1],
          referencedTable: fkMatch[2],
          referencedColumn: fkMatch[3],
        });
      }
    } else if (trimmedPart.toUpperCase().includes('PRIMARY KEY') && !trimmedPart.match(/^\w+\s+/)) {
      // Handle separate primary key constraints like "PRIMARY KEY (id)"
      const pkMatch = trimmedPart.match(/PRIMARY\s+KEY\s*\(\s*(\w+)\s*\)/i);
      if (pkMatch) {
        // Mark the specified column as PK
        const pkColumnName = pkMatch[1];
        const existingAttr = attributes.find(attr => attr.name === pkColumnName);
        if (existingAttr) {
          existingAttr.type = 'PK';
        }
      }
    } else if (trimmedPart.match(/^\w+\s+/)) {
      // Parse column definition - must start with a word (column name) followed by space
      const columnMatch = trimmedPart.match(/^(\w+)\s+([^,\s]+(?:\s*\([^)]*\))?)(.*)/i);
      if (columnMatch) {
        const columnName = columnMatch[1];
        let dataType = columnMatch[2].trim();
        const constraints = columnMatch[3].trim().toUpperCase();
        
        console.log('Parsed column:', { columnName, dataType, constraints });
        
        let attributeType: AttributeType = 'normal';
        let isNotNull = false;
        let isUnique = false;
        let defaultValue: string | undefined;
        let isAutoIncrement = false;
        
        // Check for inline REFERENCES (foreign key)
        const inlineFkMatch = constraints.match(/REFERENCES\s+(\w+)\s*\(\s*(\w+)\s*\)/i);
        if (inlineFkMatch) {
          attributeType = 'FK';
          foreignKeys.push({
            table: tableName,
            column: columnName,
            referencedTable: inlineFkMatch[1],
            referencedColumn: inlineFkMatch[2],
          });
        }
        
        // Check for PRIMARY KEY
        if (constraints.includes('PRIMARY KEY')) {
          attributeType = 'PK';
        }
        
        // Check for NOT NULL
        if (constraints.includes('NOT NULL')) {
          isNotNull = true;
        }
        
        // Check for UNIQUE
        if (constraints.includes('UNIQUE')) {
          isUnique = true;
        }
        
        // Check for IDENTITY (auto-increment)
        if (constraints.includes('IDENTITY')) {
          isAutoIncrement = true;
        }
        
        // Extract DEFAULT value
        const defaultMatch = constraints.match(/DEFAULT\s+([^,\s]+(?:\([^)]*\))?)/i);
        if (defaultMatch) {
          defaultValue = defaultMatch[1];
        }
        
        // Preserve original data type more accurately
        const originalDataType = dataType;
        const normalizedDataType = normalizeDataType(dataType);
        
        attributes.push({
          name: columnName,
          type: attributeType,
          dataType: normalizedDataType,
          isNotNull,
          isUnique,
          defaultValue,
          isAutoIncrement,
        });
      }
    }
  });
  
  console.log('Final attributes for table', tableName, ':', attributes);
  tables.push({ name: tableName, attributes });
};

const parseAlterTable = (statement: string, foreignKeys: ParsedForeignKey[]) => {
  // Parse ALTER TABLE ADD CONSTRAINT foreign key statements
  const fkMatch = statement.match(/ALTER\s+TABLE\s+(\w+)\s+ADD\s+(?:CONSTRAINT\s+\w+\s+)?FOREIGN\s+KEY\s*\(\s*(\w+)\s*\)\s+REFERENCES\s+(\w+)\s*\(\s*(\w+)\s*\)/i);
  if (fkMatch) {
    foreignKeys.push({
      table: fkMatch[1],
      column: fkMatch[2],
      referencedTable: fkMatch[3],
      referencedColumn: fkMatch[4],
    });
  }
};

const splitByCommas = (content: string): string[] => {
  const parts: string[] = [];
  let current = '';
  let parentheses = 0;
  
  for (let i = 0; i < content.length; i++) {
    const char = content[i];
    
    if (char === '(') {
      parentheses++;
    } else if (char === ')') {
      parentheses--;
    } else if (char === ',' && parentheses === 0) {
      parts.push(current.trim());
      current = '';
      continue;
    }
    
    current += char;
  }
  
  if (current.trim()) {
    parts.push(current.trim());
  }
  
  return parts;
};

const applyForeignKeys = (tables: ParsedTable[], foreignKeys: ParsedForeignKey[]) => {
  foreignKeys.forEach(fk => {
    const table = tables.find(t => t.name.toLowerCase() === fk.table.toLowerCase());
    const referencedTable = tables.find(t => t.name.toLowerCase() === fk.referencedTable.toLowerCase());
    
    if (table && referencedTable) {
      // Mark the foreign key column (preserve existing constraints)
      const fkAttribute = table.attributes.find(attr => attr.name.toLowerCase() === fk.column.toLowerCase());
      if (fkAttribute) {
        fkAttribute.type = 'FK';
        fkAttribute.refTable = referencedTable.name;
        fkAttribute.refAttr = fk.referencedColumn;
        // Preserve existing constraints like isNotNull, isUnique, etc.
      }
      
      // Mark the referenced column as primary key if not already marked
      const pkAttribute = referencedTable.attributes.find(attr => attr.name.toLowerCase() === fk.referencedColumn.toLowerCase());
      if (pkAttribute && pkAttribute.type === 'normal') {
        pkAttribute.type = 'PK';
        // Preserve existing constraints
      }
    }
  });
};

const normalizeDataType = (dataType: string): DataType => {
  const normalized = dataType.toUpperCase().replace(/\s+/g, ' ').trim();
  
  // Map common SQL types to our DataType enum
  if (normalized.startsWith('VARCHAR')) return 'VARCHAR(255)';
  if (normalized.startsWith('CHAR')) return 'CHAR(10)';
  if (normalized.includes('INTEGER') || normalized === 'INT') return 'INTEGER';
  if (normalized.includes('BIGINT')) return 'BIGINT';
  if (normalized.includes('DECIMAL') || normalized.includes('NUMERIC')) return 'DECIMAL(10,2)';
  if (normalized.includes('FLOAT')) return 'FLOAT';
  if (normalized.includes('DOUBLE')) return 'DOUBLE';
  if (normalized.includes('BOOLEAN') || normalized.includes('BOOL')) return 'BOOLEAN';
  if (normalized.includes('DATE') && !normalized.includes('TIME')) return 'DATE';
  if (normalized.includes('DATETIME')) return 'DATETIME';
  if (normalized.includes('TIMESTAMP')) return 'TIMESTAMP';
  if (normalized.includes('TIME') && !normalized.includes('DATE')) return 'TIME';
  if (normalized.includes('TEXT')) return 'TEXT';
  if (normalized.includes('JSON')) return 'JSON';
  if (normalized.includes('BLOB')) return 'BLOB';
  
  // Default fallback
  return 'VARCHAR(255)';
};

const convertToNodes = (tables: ParsedTable[]): Node[] => {
  return tables.map((table, index) => ({
    id: `table-${index + 1}`,
    type: 'tableNode',
    position: { 
      x: 100 + (index % 3) * 300, 
      y: 100 + Math.floor(index / 3) * 200 
    },
    data: {
      label: table.name,
      attributes: table.attributes,
    },
  }));
};