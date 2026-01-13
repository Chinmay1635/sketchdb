import { Node } from '@xyflow/react';
import { TableAttribute } from '../types';

export const generateSQL = (nodes: Node[]): string => {
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
  
  nodes.forEach((node, index) => {
    // Validate node structure
    if (!node || typeof node !== 'object') {
      validationErrors.push(`Node ${index + 1}: Invalid node structure`);
      return;
    }
    
    if (!node.data) {
      validationErrors.push(`Node ${index + 1}: Missing node data`);
      return;
    }
    
    // Validate table name
    const label = typeof node.data.label === 'string' ? node.data.label : `Table_${node.id}`;
    const tableName = label.replace(/\s+/g, '_');
    
    if (!tableName || tableName.trim() === '') {
      validationErrors.push(`Node ${index + 1}: Invalid or missing table name`);
    }
    
    // Check for duplicate table names
    if (tableNames.has(tableName)) {
      validationErrors.push(`Duplicate table name: ${tableName}`);
    }
    tableNames.add(tableName);
    
    // Validate attributes
    const attrs = Array.isArray(node.data.attributes) ? node.data.attributes : [];
    
    if (attrs.length === 0) {
      validationErrors.push(`Table ${tableName}: No attributes defined`);
    }
    
    // Validate individual attributes
    const attributeNames = new Set<string>();
    attrs.forEach((attr, attrIndex) => {
      if (!attr || typeof attr !== 'object') {
        validationErrors.push(`Table ${tableName}, attribute ${attrIndex + 1}: Invalid attribute structure`);
        return;
      }
      
      if (!attr.name || typeof attr.name !== 'string' || attr.name.trim() === '') {
        validationErrors.push(`Table ${tableName}, attribute ${attrIndex + 1}: Invalid or missing attribute name`);
      } else {
        // Check for duplicate attribute names
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
          // Check if referenced table exists in the nodes
          const referencedNode = nodes.find(n => {
            const refLabel = typeof n.data.label === 'string' ? n.data.label : `Table_${n.id}`;
            return refLabel.replace(/\s+/g, '_') === attr.refTable;
          });
          
          if (!referencedNode) {
            validationErrors.push(`Table ${tableName}, attribute ${attr.name}: References non-existent table '${attr.refTable}'`);
          } else {
            // Check if referenced attribute exists
            const refAttrs = Array.isArray(referencedNode.data.attributes) ? referencedNode.data.attributes : [];
            const referencedAttr = refAttrs.find(a => a.name === attr.refAttr);
            
            if (!referencedAttr) {
              validationErrors.push(`Table ${tableName}, attribute ${attr.name}: References non-existent attribute '${attr.refTable}.${attr.refAttr}'`);
            }
          }
        }
      }
    });
  });
  
  // Throw validation errors if any
  if (validationErrors.length > 0) {
    throw new Error(`Schema validation failed:\n${validationErrors.join('\n')}`);
  }
  
  // Generate SQL
  try {
    let allSQL = '';
    const generationErrors: string[] = [];
    
    nodes.forEach((node) => {
      try {
        const tableSQL = generateSingleTableManual(node);
        if (tableSQL) {
          allSQL += tableSQL + '\n\n';
        }
      } catch (error) {
        const tableName = typeof node.data.label === 'string' ? node.data.label : `Table_${node.id}`;
        const errorMsg = error instanceof Error ? error.message : String(error);
        generationErrors.push(`Failed to generate SQL for table ${tableName}: ${errorMsg}`);
      }
    });
    
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

// Generate SQL for a single table manually with clean formatting
const generateSingleTableManual = (node: Node): string => {
  try {
    const sqlType = (attr: TableAttribute) => attr.dataType || 'VARCHAR(255)';
    const label = typeof node.data.label === 'string' ? node.data.label : `Table_${node.id}`;
    const tableName = label.replace(/\s+/g, '_');
    const attrs = Array.isArray(node.data.attributes) ? node.data.attributes : [];
    
    if (!tableName || tableName.trim() === '') {
      throw new Error('Invalid table name');
    }
    
    if (!attrs.length) {
      throw new Error(`Table ${tableName} has no attributes to generate SQL`);
    }
    
    let sql = `CREATE TABLE ${tableName} (\n`;
    
    // Validate and add all columns
    const columnDefinitions: string[] = [];
    attrs.forEach((attr: TableAttribute, index: number) => {
      if (!attr.name || typeof attr.name !== 'string' || attr.name.trim() === '') {
        throw new Error(`Table ${tableName}: Attribute ${index + 1} has invalid name`);
      }
      
      let line = `  ${attr.name} ${sqlType(attr)}`;
      
      // Add IDENTITY for auto-increment
      if (attr.isAutoIncrement) {
        line += ' IDENTITY(1,1)';
      }
      
      // Add NOT NULL constraint
      if (attr.isNotNull || attr.type === 'PK') {
        line += ' NOT NULL';
      }
      
      // Add UNIQUE constraint
      if (attr.isUnique && attr.type !== 'PK') {
        line += ' UNIQUE';
      }
      
      // Add DEFAULT value
      if (attr.defaultValue) {
        line += ` DEFAULT ${attr.defaultValue}`;
      }
      
      // Add PRIMARY KEY constraint
      if (attr.type === 'PK') {
        line += ' PRIMARY KEY';
      }
      
      columnDefinitions.push(line);
    });
    
    sql += columnDefinitions.join(',\n');
    
    // Add foreign key constraints inline
    const fks = attrs.filter((a: TableAttribute) => a.type === 'FK' && a.refTable && a.refAttr);
    if (fks.length) {
      fks.forEach((fk: TableAttribute) => {
        if (!fk.refTable || !fk.refAttr) {
          throw new Error(`Table ${tableName}: Foreign key ${fk.name} has incomplete reference information`);
        }
        sql += `,\n  FOREIGN KEY (${fk.name}) REFERENCES ${fk.refTable}(${fk.refAttr})`;
      });
    }
    
    sql += '\n);';
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