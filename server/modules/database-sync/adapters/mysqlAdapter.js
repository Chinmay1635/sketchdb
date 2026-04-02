const mysql = require('mysql2/promise');

const buildConnectionOptions = (config) => {
  const { host, port, user, password, database, ssl } = config;
  const options = {
    host,
    port,
    user,
    password,
    database,
  };

  if (ssl) {
    options.ssl = { rejectUnauthorized: false };
  }

  return options;
};

const testConnection = async (config) => {
  let connection;
  try {
    connection = await mysql.createConnection(buildConnectionOptions(config));
    await connection.query('SELECT 1');
    return { success: true };
  } catch (error) {
    throw new Error('Unable to connect to MySQL. Please verify host, credentials, and SSL settings.');
  } finally {
    if (connection) {
      await connection.end();
    }
  }
};

const introspectSchema = async (config) => {
  let connection;
  try {
    connection = await mysql.createConnection(buildConnectionOptions(config));
    const [columns] = await connection.query(
      `SELECT TABLE_NAME, COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE, COLUMN_DEFAULT
       FROM information_schema.COLUMNS
       WHERE TABLE_SCHEMA = ?
       ORDER BY TABLE_NAME, ORDINAL_POSITION`,
      [config.database]
    );

    const [keys] = await connection.query(
      `SELECT TABLE_NAME, COLUMN_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME, CONSTRAINT_NAME
       FROM information_schema.KEY_COLUMN_USAGE
       WHERE TABLE_SCHEMA = ?`,
      [config.database]
    );

    const tableMap = new Map();

    columns.forEach((row) => {
      const tableName = row.TABLE_NAME;
      if (!tableMap.has(tableName)) {
        tableMap.set(tableName, {
          name: tableName,
          columns: [],
          foreignKeys: [],
        });
      }

      const table = tableMap.get(tableName);
      table.columns.push({
        name: row.COLUMN_NAME,
        type: row.COLUMN_TYPE,
        nullable: row.IS_NULLABLE === 'YES',
        defaultValue: row.COLUMN_DEFAULT === undefined ? null : row.COLUMN_DEFAULT,
        isPrimaryKey: false,
      });
    });

    keys.forEach((row) => {
      const tableName = row.TABLE_NAME;
      const table = tableMap.get(tableName);
      if (!table) return;

      if (row.CONSTRAINT_NAME === 'PRIMARY') {
        const column = table.columns.find((col) => col.name === row.COLUMN_NAME);
        if (column) {
          column.isPrimaryKey = true;
        }
        return;
      }

      if (row.REFERENCED_TABLE_NAME && row.REFERENCED_COLUMN_NAME) {
        table.foreignKeys.push({
          columnName: row.COLUMN_NAME,
          refTable: row.REFERENCED_TABLE_NAME,
          refColumn: row.REFERENCED_COLUMN_NAME,
        });
      }
    });

    return {
      tables: Array.from(tableMap.values()),
    };
  } catch (error) {
    throw new Error('Failed to introspect MySQL schema. Please verify the database exists and credentials are valid.');
  } finally {
    if (connection) {
      await connection.end();
    }
  }
};

const executeStatements = async (config, sqlStatements) => {
  let connection;
  try {
    connection = await mysql.createConnection(buildConnectionOptions(config));
    await connection.beginTransaction();

    for (const statement of sqlStatements) {
      await connection.query(statement);
    }

    await connection.commit();
    return { success: true, appliedCount: sqlStatements.length };
  } catch (error) {
    if (connection) {
      await connection.rollback();
    }
    throw new Error(error?.message || 'Failed to apply migration statements.');
  } finally {
    if (connection) {
      await connection.end();
    }
  }
};

module.exports = {
  testConnection,
  introspectSchema,
  executeStatements,
};
