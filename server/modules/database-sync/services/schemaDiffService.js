const normalizeType = (type) => {
  const raw = (type || '').trim().toLowerCase();
  if (!raw) return '';

  const cleaned = raw.replace(/`/g, '').replace(/\s+/g, ' ');

  if (/^int(\(\d+\))?$/.test(cleaned) || cleaned === 'integer') return 'int';
  if (/^bigint(\(\d+\))?$/.test(cleaned)) return 'bigint';
  if (/^smallint(\(\d+\))?$/.test(cleaned)) return 'smallint';
  if (/^tinyint(\(\d+\))?$/.test(cleaned)) return 'tinyint';

  const varcharMatch = cleaned.match(/^varchar\((\d+)\)$/);
  if (varcharMatch) return `varchar(${varcharMatch[1]})`;

  const charMatch = cleaned.match(/^char\((\d+)\)$/);
  if (charMatch) return `char(${charMatch[1]})`;

  const decimalMatch = cleaned.match(/^decimal\((\d+),\s*(\d+)\)$/);
  if (decimalMatch) return `decimal(${decimalMatch[1]},${decimalMatch[2]})`;

  if (cleaned === 'double precision') return 'double';
  if (cleaned === 'boolean') return 'tinyint';

  return cleaned;
};
const normalizeKey = (value) => (value || '').trim().toLowerCase();

const normalizeDefault = (value) => {
  if (value === null || value === undefined) return null;
  return String(value).trim();
};

const getFkName = (tableName, columnName) => `fk_${tableName}_${columnName}`;

const formatDefault = (value) => {
  if (value === null || value === undefined || value === '') return null;
  const trimmed = String(value).trim();
  if (/^current_timestamp$/i.test(trimmed)) {
    return 'CURRENT_TIMESTAMP';
  }
  if (/^null$/i.test(trimmed)) {
    return 'NULL';
  }
  if (/^\d+(\.\d+)?$/.test(trimmed)) {
    return trimmed;
  }
  return `'${trimmed.replace(/'/g, "''")}'`;
};

const buildColumnDefinition = (column) => {
  const parts = ["`" + column.name + "`", column.type];
  if (!column.nullable) {
    parts.push('NOT NULL');
  }
  const defaultValue = formatDefault(column.defaultValue);
  if (defaultValue !== null) {
    parts.push(`DEFAULT ${defaultValue}`);
  }
  return parts.join(' ');
};

const diffSchemas = (currentDbSchema, newDiagramSchema) => {
  const statements = [];
  const warnings = [];

  const currentTables = new Map();
  const newTables = new Map();

  (currentDbSchema.tables || []).forEach((table) => {
    currentTables.set(normalizeKey(table.name), table);
  });

  (newDiagramSchema.tables || []).forEach((table) => {
    newTables.set(normalizeKey(table.name), table);
  });

  for (const [tableKey, newTable] of newTables.entries()) {
    if (!currentTables.has(tableKey)) {
      const tableName = newTable.name;
      const columnDefs = (newTable.columns || []).map((column) => buildColumnDefinition(column));
      const pkColumns = (newTable.columns || [])
        .filter((column) => column.isPrimaryKey)
        .map((column) => `\`${column.name}\``);

      if (pkColumns.length > 0) {
        columnDefs.push(`PRIMARY KEY (${pkColumns.join(', ')})`);
      }

      const fkDefs = (newTable.foreignKeys || []).map((fk) => {
        const fkName = getFkName(tableName, fk.columnName);
        return `CONSTRAINT \`${fkName}\` FOREIGN KEY (\`${fk.columnName}\`) REFERENCES \`${fk.refTable}\`(\`${fk.refColumn}\`)`;
      });

      statements.push(
        `CREATE TABLE \`${tableName}\` (\n  ${[...columnDefs, ...fkDefs].join(',\n  ')}\n);`
      );
    }
  }

  for (const [tableKey, currentTable] of currentTables.entries()) {
    if (!newTables.has(tableKey)) {
      statements.push(`DROP TABLE \`${currentTable.name}\`;`);
      warnings.push(`DROP TABLE \`${currentTable.name}\` will permanently delete all data`);
    }
  }

  for (const [tableKey, newTable] of newTables.entries()) {
    const currentTable = currentTables.get(tableKey);
    if (!currentTable) continue;
    const tableName = newTable.name;

    const currentColumns = new Map();
    const newColumns = new Map();

    (currentTable.columns || []).forEach((column) => {
      currentColumns.set(normalizeKey(column.name), column);
    });

    (newTable.columns || []).forEach((column) => {
      newColumns.set(normalizeKey(column.name), column);
    });

    for (const [columnKey, column] of newColumns.entries()) {
      if (!currentColumns.has(columnKey)) {
        statements.push(
          `ALTER TABLE \`${tableName}\` ADD COLUMN ${buildColumnDefinition(column)};`
        );
      }
    }

    for (const [columnKey, column] of currentColumns.entries()) {
      if (!newColumns.has(columnKey)) {
        statements.push(`ALTER TABLE \`${tableName}\` DROP COLUMN \`${column.name}\`;`);
        warnings.push(`DROP COLUMN \`${column.name}\` on \`${tableName}\` will delete all data in that column`);
      }
    }

    for (const [columnKey, newColumn] of newColumns.entries()) {
      const currentColumn = currentColumns.get(columnKey);
      if (!currentColumn) continue;

      const typeChanged = normalizeType(currentColumn.type) !== normalizeType(newColumn.type);
      const nullableChanged = Boolean(currentColumn.nullable) !== Boolean(newColumn.nullable);
      const defaultChanged =
        normalizeDefault(currentColumn.defaultValue) !== normalizeDefault(newColumn.defaultValue);

      if (typeChanged || nullableChanged || defaultChanged) {
        statements.push(
          `ALTER TABLE \`${tableName}\` MODIFY COLUMN ${buildColumnDefinition(newColumn)};`
        );
      }
    }

    const currentFks = new Set(
      (currentTable.foreignKeys || []).map(
        (fk) => `${normalizeKey(fk.columnName)}|${normalizeKey(fk.refTable)}|${normalizeKey(fk.refColumn)}`
      )
    );
    const newFks = new Set(
      (newTable.foreignKeys || []).map(
        (fk) => `${normalizeKey(fk.columnName)}|${normalizeKey(fk.refTable)}|${normalizeKey(fk.refColumn)}`
      )
    );

    (newTable.foreignKeys || []).forEach((fk) => {
      const key = `${normalizeKey(fk.columnName)}|${normalizeKey(fk.refTable)}|${normalizeKey(fk.refColumn)}`;
      if (!currentFks.has(key)) {
        const fkName = getFkName(tableName, fk.columnName);
        statements.push(
          `ALTER TABLE \`${tableName}\` ADD CONSTRAINT \`${fkName}\` FOREIGN KEY (\`${fk.columnName}\`) REFERENCES \`${fk.refTable}\`(\`${fk.refColumn}\`);`
        );
      }
    });

    (currentTable.foreignKeys || []).forEach((fk) => {
      const key = `${normalizeKey(fk.columnName)}|${normalizeKey(fk.refTable)}|${normalizeKey(fk.refColumn)}`;
      if (!newFks.has(key)) {
        const fkName = getFkName(tableName, fk.columnName);
        statements.push(`ALTER TABLE \`${tableName}\` DROP FOREIGN KEY \`${fkName}\`;`);
      }
    });
  }

  return { statements, warnings };
};

module.exports = {
  diffSchemas,
};
