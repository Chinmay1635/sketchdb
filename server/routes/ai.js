/**
 * AI Chat Routes
 * 
 * Handles:
 * - Chat message sending and receiving
 * - Schema generation from prompts
 * - Chat history management
 */

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const AIChat = require('../models/AIChat');
const Diagram = require('../models/Diagram');
const { generateSchema } = require('../services/aiService');

// Rate limiting for AI requests (in-memory, per user)
const rateLimits = new Map();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const RATE_LIMIT_MAX = 10; // 10 requests per minute

function checkRateLimit(userId) {
  const now = Date.now();
  const userLimit = rateLimits.get(userId);
  
  if (!userLimit || now > userLimit.resetTime) {
    rateLimits.set(userId, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return { allowed: true, remaining: RATE_LIMIT_MAX - 1 };
  }
  
  if (userLimit.count >= RATE_LIMIT_MAX) {
    const waitTime = Math.ceil((userLimit.resetTime - now) / 1000);
    return { allowed: false, remaining: 0, waitTime };
  }
  
  userLimit.count++;
  return { allowed: true, remaining: RATE_LIMIT_MAX - userLimit.count };
}

// @route   GET /api/ai/chat/:diagramId
// @desc    Get chat history for a diagram
// @access  Private
router.get('/chat/:diagramId', protect, async (req, res) => {
  try {
    const { diagramId } = req.params;

    // Verify user has access to diagram
    const diagram = await Diagram.findById(diagramId);
    if (!diagram) {
      return res.status(404).json({ success: false, message: 'Diagram not found' });
    }

    const isOwner = diagram.user.toString() === req.user._id.toString();
    const isCollaborator = diagram.collaborators?.some(
      c => c.user?.toString() === req.user._id.toString()
    );

    if (!isOwner && !isCollaborator) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    // Get or create chat
    let chat = await AIChat.findOne({ diagram: diagramId });
    
    if (!chat) {
      chat = new AIChat({
        diagram: diagramId,
        messages: []
      });
      await chat.save();
    }

    res.json({
      success: true,
      chat: {
        _id: chat._id,
        messages: chat.messages,
        totalTokensUsed: chat.totalTokensUsed
      }
    });
  } catch (error) {
    console.error('Get chat error:', error);
    res.status(500).json({ success: false, message: 'Failed to get chat history' });
  }
});

// @route   POST /api/ai/chat/:diagramId
// @desc    Send a message and get AI response
// @access  Private
router.post('/chat/:diagramId', protect, async (req, res) => {
  try {
    const { diagramId } = req.params;
    const { message, currentSchema } = req.body;

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Message is required' });
    }

    if (message.length > 2000) {
      return res.status(400).json({ success: false, message: 'Message too long (max 2000 characters)' });
    }

    // Check rate limit
    const rateCheck = checkRateLimit(req.user._id.toString());
    if (!rateCheck.allowed) {
      return res.status(429).json({
        success: false,
        message: `Rate limit exceeded. Please wait ${rateCheck.waitTime} seconds.`,
        retryAfter: rateCheck.waitTime
      });
    }

    // Verify user has edit access to diagram
    const diagram = await Diagram.findById(diagramId);
    if (!diagram) {
      return res.status(404).json({ success: false, message: 'Diagram not found' });
    }

    const isOwner = diagram.user.toString() === req.user._id.toString();
    const collaborator = diagram.collaborators?.find(
      c => c.user?.toString() === req.user._id.toString()
    );
    const hasEditAccess = isOwner || collaborator?.permission === 'edit';

    if (!hasEditAccess) {
      return res.status(403).json({ success: false, message: 'Edit access required to use AI assistant' });
    }

    // Get or create chat
    let chat = await AIChat.findOne({ diagram: diagramId });
    if (!chat) {
      chat = new AIChat({
        diagram: diagramId,
        messages: []
      });
    }

    // Add user message
    chat.messages.push({
      role: 'user',
      content: message.trim(),
      timestamp: new Date()
    });

    // Generate AI response
    const existingSchema = currentSchema || {
      nodes: diagram.nodes || [],
      edges: diagram.edges || []
    };

    const aiResponse = await generateSchema(
      message.trim(),
      existingSchema,
      chat.messages.slice(-10) // Last 10 messages for context
    );

    // Add AI response to chat
    const assistantMessage = {
      role: 'assistant',
      content: aiResponse.message,
      generatedSchema: aiResponse.success ? aiResponse.schema : null,
      schemaApplied: false,
      timestamp: new Date(),
      tokenUsage: aiResponse.tokenUsage
    };
    chat.messages.push(assistantMessage);

    // Update total tokens
    chat.totalTokensUsed += aiResponse.tokenUsage?.total || 0;

    await chat.save();

    res.json({
      success: true,
      response: {
        message: aiResponse.message,
        schema: aiResponse.schema,
        explanation: aiResponse.explanation,
        messageId: chat.messages[chat.messages.length - 1]._id
      },
      rateLimitRemaining: rateCheck.remaining
    });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ success: false, message: 'Failed to process message' });
  }
});

// @route   POST /api/ai/chat/:diagramId/apply/:messageId
// @desc    Mark a schema as applied
// @access  Private
router.post('/chat/:diagramId/apply/:messageId', protect, async (req, res) => {
  try {
    const { diagramId, messageId } = req.params;

    const chat = await AIChat.findOne({ diagram: diagramId });
    if (!chat) {
      return res.status(404).json({ success: false, message: 'Chat not found' });
    }

    const message = chat.messages.id(messageId);
    if (!message) {
      return res.status(404).json({ success: false, message: 'Message not found' });
    }

    message.schemaApplied = true;
    await chat.save();

    res.json({ success: true, message: 'Schema marked as applied' });
  } catch (error) {
    console.error('Apply schema error:', error);
    res.status(500).json({ success: false, message: 'Failed to update message' });
  }
});

// @route   DELETE /api/ai/chat/:diagramId
// @desc    Clear chat history for a diagram
// @access  Private
router.delete('/chat/:diagramId', protect, async (req, res) => {
  try {
    const { diagramId } = req.params;

    // Verify ownership
    const diagram = await Diagram.findById(diagramId);
    if (!diagram) {
      return res.status(404).json({ success: false, message: 'Diagram not found' });
    }

    if (diagram.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Only diagram owner can clear chat' });
    }

    await AIChat.findOneAndDelete({ diagram: diagramId });

    res.json({ success: true, message: 'Chat history cleared' });
  } catch (error) {
    console.error('Clear chat error:', error);
    res.status(500).json({ success: false, message: 'Failed to clear chat' });
  }
});

// Cleanup old rate limit entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [userId, limit] of rateLimits.entries()) {
    if (now > limit.resetTime + 60000) {
      rateLimits.delete(userId);
    }
  }
}, 60000);

module.exports = router;
