const mongoose = require('mongoose');

// Use flexible schema for nodes and edges to preserve all ReactFlow data
// This ensures all attributes, positions, colors, and relationships are saved exactly as sent

// Schema for table attributes (matching client's TableAttribute interface)
const attributeSchema = new mongoose.Schema({
  name: String,
  type: {
    type: String,
    enum: ['PK', 'FK', 'normal']
  },
  dataType: String,
  refTable: String,
  refAttr: String,
  isNotNull: Boolean,
  isUnique: Boolean,
  defaultValue: String,
  isAutoIncrement: Boolean
}, { _id: false, strict: false });

// Schema for table nodes (ReactFlow nodes) - flexible to store all data
const tableNodeSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true
  },
  type: {
    type: String,
    default: 'tableNode'
  },
  position: {
    x: Number,
    y: Number
  },
  data: {
    label: String,
    attributes: [attributeSchema],
    color: String
  },
  // Store any additional ReactFlow node properties
  width: Number,
  height: Number,
  selected: Boolean,
  dragging: Boolean,
  measured: mongoose.Schema.Types.Mixed
}, { _id: false, strict: false });

// Schema for edges (ReactFlow edges) - flexible to store all edge data
const edgeSchema = new mongoose.Schema({
  id: String,
  source: String,
  target: String,
  sourceHandle: String,
  targetHandle: String,
  type: String,
  animated: Boolean,
  style: mongoose.Schema.Types.Mixed,
  data: mongoose.Schema.Types.Mixed,
  markerEnd: mongoose.Schema.Types.Mixed,
  markerStart: mongoose.Schema.Types.Mixed,
  label: String,
  labelStyle: mongoose.Schema.Types.Mixed,
  labelShowBg: Boolean,
  labelBgStyle: mongoose.Schema.Types.Mixed,
  labelBgPadding: mongoose.Schema.Types.Mixed,
  labelBgBorderRadius: Number
}, { _id: false, strict: false });

// Main diagram schema
const diagramSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: [true, 'Diagram name is required'],
    trim: true
  },
  description: {
    type: String,
    trim: true,
    default: ''
  },
  nodes: [tableNodeSchema],
  edges: [edgeSchema],
  sqlContent: {
    type: String,
    default: ''
  },
  viewport: {
    x: { type: Number, default: 0 },
    y: { type: Number, default: 0 },
    zoom: { type: Number, default: 1 }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { strict: false }); // Allow additional fields for future compatibility

// Update the updatedAt timestamp before saving
diagramSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Also update on findOneAndUpdate
diagramSchema.pre('findOneAndUpdate', function(next) {
  this.set({ updatedAt: new Date() });
  next();
});

// Index for faster queries
diagramSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('Diagram', diagramSchema);
