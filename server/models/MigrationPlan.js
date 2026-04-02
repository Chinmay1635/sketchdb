const mongoose = require('mongoose');

const migrationPlanSchema = new mongoose.Schema(
  {
    diagramId: {
      type: String,
      required: true,
    },
    connectionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DatabaseConnection',
      required: true,
    },
    sqlStatements: {
      type: [String],
      default: [],
    },
    riskWarnings: {
      type: [String],
      default: [],
    },
    status: {
      type: String,
      enum: ['draft', 'approved', 'applied', 'failed'],
      default: 'draft',
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    appliedAt: {
      type: Date,
      default: null,
    },
    errorMessage: {
      type: String,
      default: null,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('MigrationPlan', migrationPlanSchema);
