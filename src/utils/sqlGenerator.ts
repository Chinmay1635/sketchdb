import { Node } from '@xyflow/react';
import { TableAttribute } from '../types';

export const generateSQL = (nodes: Node[]): string => {
  const sqlType = (attr: TableAttribute) => attr.dataType || 'VARCHAR(255)';
  let sql = '';
  
  // First pass: Create all tables with their columns and primary keys
  nodes.forEach((node) => {
    const label = typeof node.data.label === 'string' ? node.data.label : `Table_${node.id}`;
    const tableName = label.replace(/\s+/g, '_');
    const attrs = Array.isArray(node.data.attributes) ? node.data.attributes : [];
    if (!attrs.length) return;
    
    sql += `CREATE TABLE ${tableName} (\n`;
    sql += attrs.map((attr: TableAttribute) => {
      let line = `  ${attr.name} ${sqlType(attr)}`;
      if (attr.type === 'PK') line += ' PRIMARY KEY';
      if (attr.type === 'FK') line += ' NOT NULL'; // FK columns should typically not be null
      return line;
    }).join(',\n');
    sql += '\n);\n\n';
  });
  
  // Second pass: Add foreign key constraints
  nodes.forEach((node) => {
    const label = typeof node.data.label === 'string' ? node.data.label : `Table_${node.id}`;
    const tableName = label.replace(/\s+/g, '_');
    const attrs = Array.isArray(node.data.attributes) ? node.data.attributes : [];
    const fks = attrs.filter((a: TableAttribute) => a.type === 'FK' && a.refTable && a.refAttr);
    
    if (fks.length) {
      fks.forEach((fk: TableAttribute) => {
        sql += `ALTER TABLE ${tableName} ADD CONSTRAINT FK_${tableName}_${fk.name}\n`;
        sql += `  FOREIGN KEY (${fk.name}) REFERENCES ${fk.refTable}(${fk.refAttr});\n\n`;
      });
    }
  });
  
  return sql || 'No tables to export!';
};

export const copyToClipboard = (text: string): void => {
  navigator.clipboard.writeText(text);
};