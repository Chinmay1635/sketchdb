const connectionService = require('../services/connectionService');

const createConnection = async (req, res) => {
  try {
    const { diagramId, ...data } = req.body;
    if (!diagramId) {
      return res.status(400).json({ success: false, message: 'diagramId is required' });
    }

    const connection = await connectionService.createConnection(
      req.user._id,
      diagramId,
      data
    );

    res.status(201).json({ success: true, connection });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error?.message || 'Failed to create connection',
    });
  }
};

const getConnection = async (req, res) => {
  try {
    const connection = await connectionService.getConnection(req.params.id, req.user._id);
    res.json({ success: true, connection });
  } catch (error) {
    res.status(404).json({
      success: false,
      message: error?.message || 'Connection not found',
    });
  }
};

const deleteConnection = async (req, res) => {
  try {
    await connectionService.deleteConnection(req.params.id, req.user._id);
    res.json({ success: true });
  } catch (error) {
    res.status(404).json({
      success: false,
      message: error?.message || 'Connection not found',
    });
  }
};

const testExistingConnection = async (req, res) => {
  try {
    const result = await connectionService.testExistingConnection(req.params.id, req.user._id);
    res.json({ success: true, result });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error?.message || 'Failed to test connection',
    });
  }
};

module.exports = {
  createConnection,
  getConnection,
  deleteConnection,
  testExistingConnection,
};
