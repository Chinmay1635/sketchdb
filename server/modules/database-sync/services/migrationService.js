const DatabaseConnection = require('../../../models/DatabaseConnection');
const MigrationPlan = require('../../../models/MigrationPlan');
const mysqlAdapter = require('../adapters/mysqlAdapter');
const { diffSchemas } = require('./schemaDiffService');

const generateMigration = async (connectionId, diagramId, newDiagramSchema, userId) => {
  try {
    const connection = await DatabaseConnection.findOne({
      _id: connectionId,
      userId,
    }).select('+encryptedPassword');

    if (!connection) {
      throw new Error('Connection not found');
    }

    const password = connection.getDecryptedPassword();

    const liveSchema = await mysqlAdapter.introspectSchema({
      host: connection.host,
      port: connection.port,
      user: connection.username,
      password,
      database: connection.database,
      ssl: connection.ssl,
    });

    const diffResult = diffSchemas(liveSchema, newDiagramSchema);

    const plan = new MigrationPlan({
      diagramId,
      connectionId: connection._id,
      sqlStatements: diffResult.statements,
      riskWarnings: diffResult.warnings,
      status: 'draft',
      createdBy: userId,
    });

    await plan.save();

    return plan;
  } catch (error) {
    throw error;
  }
};

const approveMigration = async (planId, userId) => {
  try {
    const plan = await MigrationPlan.findOne({ _id: planId, createdBy: userId });

    if (!plan) {
      throw new Error('Migration plan not found');
    }

    plan.status = 'approved';
    plan.approvedBy = userId;
    await plan.save();

    return plan;
  } catch (error) {
    throw error;
  }
};

const applyMigration = async (planId, userId) => {
  let plan;
  try {
    plan = await MigrationPlan.findOne({ _id: planId, createdBy: userId });

    if (!plan) {
      throw new Error('Migration plan not found');
    }

    if (plan.status !== 'approved') {
      throw new Error('Migration plan must be approved before applying');
    }

    const connection = await DatabaseConnection.findOne({
      _id: plan.connectionId,
      userId,
    }).select('+encryptedPassword');

    if (!connection) {
      throw new Error('Connection not found');
    }

    const password = connection.getDecryptedPassword();

    const result = await mysqlAdapter.executeStatements(
      {
        host: connection.host,
        port: connection.port,
        user: connection.username,
        password,
        database: connection.database,
        ssl: connection.ssl,
      },
      plan.sqlStatements
    );

    plan.status = 'applied';
    plan.appliedAt = new Date();
    plan.errorMessage = null;
    await plan.save();

    return { plan, result };
  } catch (error) {
    if (plan) {
      plan.status = 'failed';
      plan.errorMessage = error?.message || 'Migration failed';
      await plan.save();
    }
    throw error;
  }
};

const getMigrationPlan = async (planId, userId) => {
  try {
    const plan = await MigrationPlan.findOne({ _id: planId, createdBy: userId });
    if (!plan) {
      throw new Error('Migration plan not found');
    }
    return plan;
  } catch (error) {
    throw error;
  }
};

const listMigrationHistory = async (diagramId, userId) => {
  try {
    return await MigrationPlan.find({ diagramId, createdBy: userId })
      .sort({ createdAt: -1 })
      .lean();
  } catch (error) {
    throw error;
  }
};

module.exports = {
  generateMigration,
  approveMigration,
  applyMigration,
  getMigrationPlan,
  listMigrationHistory,
};
