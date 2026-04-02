const DatabaseConnection = require('../../../models/DatabaseConnection');
const mysqlAdapter = require('../adapters/mysqlAdapter');

const validateConnectionData = (data) => {
  const required = ['name', 'host', 'database', 'username', 'password'];
  const missing = required.filter((field) => !data[field]);
  if (missing.length) {
    throw new Error(`Missing required fields: ${missing.join(', ')}`);
  }
};

const sanitizeConnection = (connection) => {
  if (!connection) return null;
  const obj = connection.toObject({ getters: true });
  delete obj.encryptedPassword;
  delete obj.password;
  return obj;
};

const createConnection = async (userId, diagramId, data) => {
  try {
    validateConnectionData(data);

    const connection = new DatabaseConnection({
      userId,
      diagramId,
      name: data.name,
      host: data.host,
      port: data.port || 3306,
      database: data.database,
      username: data.username,
      password: data.password,
      ssl: Boolean(data.ssl),
      encryptedPassword: 'pending',
    });

    await connection.save();
    return sanitizeConnection(connection);
  } catch (error) {
    throw error;
  }
};

const getConnection = async (connectionId, userId) => {
  try {
    const connection = await DatabaseConnection.findOne({
      _id: connectionId,
      userId,
    });

    if (!connection) {
      throw new Error('Connection not found');
    }

    return sanitizeConnection(connection);
  } catch (error) {
    throw error;
  }
};

const deleteConnection = async (connectionId, userId) => {
  try {
    const connection = await DatabaseConnection.findOneAndDelete({
      _id: connectionId,
      userId,
    });

    if (!connection) {
      throw new Error('Connection not found');
    }

    return { success: true };
  } catch (error) {
    throw error;
  }
};

const testExistingConnection = async (connectionId, userId) => {
  try {
    const connection = await DatabaseConnection.findOne({
      _id: connectionId,
      userId,
    }).select('+encryptedPassword');

    if (!connection) {
      throw new Error('Connection not found');
    }

    const password = connection.getDecryptedPassword();

    return await mysqlAdapter.testConnection({
      host: connection.host,
      port: connection.port,
      user: connection.username,
      password,
      database: connection.database,
      ssl: connection.ssl,
    });
  } catch (error) {
    throw error;
  }
};

module.exports = {
  createConnection,
  getConnection,
  deleteConnection,
  testExistingConnection,
};
