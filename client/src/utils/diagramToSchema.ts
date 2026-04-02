import { Node } from '@xyflow/react';
import { TableAttribute } from '../types';

const normalizeName = (value: string) => value.trim().replace(/\s+/g, '_');
const normalizeColumn = (value: string) => value.trim();

export interface NormalizedSchema {
  tables: Array<{
    name: string;
    columns: Array<{
      name: string;
      type: string;
      nullable: boolean;
      defaultValue: string | null;
      isPrimaryKey: boolean;
    }>;
    foreignKeys: Array<{
      columnName: string;
      refTable: string;
      refColumn: string;
    }>;
  }>;
}

export const diagramToSchema = (nodes: Node[]): NormalizedSchema => {
  const tables = nodes.map((node) => {
    const label = typeof node.data?.label === 'string' ? node.data.label : `Table_${node.id}`;
    const tableName = normalizeName(label);
    const attributes = Array.isArray(node.data?.attributes) ? (node.data.attributes as TableAttribute[]) : [];

    const columns = attributes.map((attr) => ({
      name: normalizeColumn(attr.name),
      type: attr.dataType || 'VARCHAR(255)',
      nullable: attr.type === 'PK' ? false : !attr.isNotNull,
      defaultValue: attr.defaultValue ?? null,
      isPrimaryKey: attr.type === 'PK',
    }));

    const foreignKeys = attributes
      .filter((attr) => attr.type === 'FK' && attr.refTable && attr.refAttr)
      .map((attr) => ({
        columnName: normalizeColumn(attr.name),
        refTable: normalizeName(attr.refTable || ''),
        refColumn: normalizeColumn(attr.refAttr || ''),
      }));

    return {
      name: tableName,
      columns,
      foreignKeys,
    };
  });

  return { tables };
};
