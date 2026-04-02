const migrationService = require('../services/migrationService');

const generateMigration = async (req, res) => {
  try {
    const { connectionId, diagramId, diagramSchema } = req.body;
    if (!connectionId || !diagramId || !diagramSchema) {
      return res.status(400).json({
        success: false,
        message: 'connectionId, diagramId, and diagramSchema are required',
      });
    }

    const plan = await migrationService.generateMigration(
      connectionId,
      diagramId,
      diagramSchema,
      req.user._id
    );

    res.status(201).json({ success: true, plan });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error?.message || 'Failed to generate migration plan',
    });
  }
};

const approveMigration = async (req, res) => {
  try {
    const plan = await migrationService.approveMigration(req.params.planId, req.user._id);
    res.json({ success: true, plan });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error?.message || 'Failed to approve migration',
    });
  }
};

const applyMigration = async (req, res) => {
  try {
    const result = await migrationService.applyMigration(req.params.planId, req.user._id);
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error?.message || 'Failed to apply migration',
    });
  }
};

const getMigrationPlan = async (req, res) => {
  try {
    const plan = await migrationService.getMigrationPlan(req.params.planId, req.user._id);
    res.json({ success: true, plan });
  } catch (error) {
    res.status(404).json({
      success: false,
      message: error?.message || 'Migration plan not found',
    });
  }
};

const listMigrationHistory = async (req, res) => {
  try {
    const plans = await migrationService.listMigrationHistory(req.params.diagramId, req.user._id);
    res.json({ success: true, plans });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error?.message || 'Failed to load migration history',
    });
  }
};

module.exports = {
  generateMigration,
  approveMigration,
  applyMigration,
  getMigrationPlan,
  listMigrationHistory,
};
