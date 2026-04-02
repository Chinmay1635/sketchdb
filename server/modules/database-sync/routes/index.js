const express = require('express');
const connectionController = require('../controllers/connectionController');
const migrationController = require('../controllers/migrationController');

const router = express.Router();

router.post('/connections', connectionController.createConnection);
router.get('/connections/:id', connectionController.getConnection);
router.delete('/connections/:id', connectionController.deleteConnection);
router.post('/connections/:id/test', connectionController.testExistingConnection);

router.post('/migrations/generate', migrationController.generateMigration);
router.post('/migrations/:planId/approve', migrationController.approveMigration);
router.post('/migrations/:planId/apply', migrationController.applyMigration);
router.get('/migrations/:planId', migrationController.getMigrationPlan);
router.get('/migrations/history/:diagramId', migrationController.listMigrationHistory);

module.exports = router;
