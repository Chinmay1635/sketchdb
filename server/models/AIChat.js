const mongoose = require('mongoose');

// Schema for individual chat messages
const chatMessageSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ['user', 'assistant', 'system'],
    required: true
  },
  content: {
    type: String,
    required: true
  },
  // Store generated schema if this is an AI response with schema
  generatedSchema: {
    nodes: mongoose.Schema.Types.Mixed,
    edges: mongoose.Schema.Types.Mixed
  },
  // Whether the user applied this schema
  schemaApplied: {
    type: Boolean,
    default: false
  },
  // Metadata
  timestamp: {
    type: Date,
    default: Date.now
  },
  // Token usage for monitoring
  tokenUsage: {
    prompt: Number,
    completion: Number,
    total: Number
  }
}, { _id: true });

// Main AI Chat schema - one per diagram
const aiChatSchema = new mongoose.Schema({
  diagram: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Diagram',
    required: true,
    unique: true // One chat per diagram
  },
  messages: [chatMessageSchema],
  // Track total tokens used for this diagram's chat
  totalTokensUsed: {
    type: Number,
    default: 0
  },
  // Last activity for cleanup
  lastActivity: {
    type: Date,
    default: Date.now
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for fast lookups
aiChatSchema.index({ diagram: 1 });
aiChatSchema.index({ lastActivity: -1 });

// Update lastActivity on save
aiChatSchema.pre('save', function(next) {
  this.lastActivity = new Date();
  next();
});

module.exports = mongoose.model('AIChat', aiChatSchema);
