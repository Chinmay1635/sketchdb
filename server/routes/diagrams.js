const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Diagram = require('../models/Diagram');
const { protect } = require('../middleware/auth');

// Validation for diagram
const diagramValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Diagram name is required')
    .isLength({ max: 100 })
    .withMessage('Diagram name must be less than 100 characters')
];

// @route   GET /api/diagrams
// @desc    Get all diagrams for current user
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const diagrams = await Diagram.find({ user: req.user._id })
      .select('name description createdAt updatedAt')
      .sort({ updatedAt: -1 });

    res.json({
      success: true,
      count: diagrams.length,
      diagrams
    });
  } catch (error) {
    console.error('Get diagrams error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching diagrams'
    });
  }
});

// @route   GET /api/diagrams/:id
// @desc    Get a single diagram by ID
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const diagram = await Diagram.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!diagram) {
      return res.status(404).json({
        success: false,
        message: 'Diagram not found'
      });
    }

    res.json({
      success: true,
      diagram
    });
  } catch (error) {
    console.error('Get diagram error:', error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'Diagram not found'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server error while fetching diagram'
    });
  }
});

// @route   POST /api/diagrams
// @desc    Create a new diagram
// @access  Private
router.post('/', protect, diagramValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: errors.array()[0].msg,
        errors: errors.array()
      });
    }

    const { name, description, nodes, edges, sqlContent, viewport } = req.body;

    const diagram = await Diagram.create({
      user: req.user._id,
      name,
      description: description || '',
      nodes: nodes || [],
      edges: edges || [],
      sqlContent: sqlContent || '',
      viewport: viewport || { x: 0, y: 0, zoom: 1 }
    });

    res.status(201).json({
      success: true,
      message: 'Diagram created successfully',
      diagram
    });
  } catch (error) {
    console.error('Create diagram error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating diagram'
    });
  }
});

// @route   PUT /api/diagrams/:id
// @desc    Update a diagram
// @access  Private
router.put('/:id', protect, diagramValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: errors.array()[0].msg,
        errors: errors.array()
      });
    }

    const { name, description, nodes, edges, sqlContent, viewport } = req.body;

    let diagram = await Diagram.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!diagram) {
      return res.status(404).json({
        success: false,
        message: 'Diagram not found'
      });
    }

    // Update fields
    diagram.name = name;
    diagram.description = description || '';
    diagram.nodes = nodes || [];
    diagram.edges = edges || [];
    diagram.sqlContent = sqlContent || '';
    diagram.viewport = viewport || diagram.viewport;

    await diagram.save();

    res.json({
      success: true,
      message: 'Diagram updated successfully',
      diagram
    });
  } catch (error) {
    console.error('Update diagram error:', error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'Diagram not found'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server error while updating diagram'
    });
  }
});

// @route   DELETE /api/diagrams/:id
// @desc    Delete a diagram
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const diagram = await Diagram.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id
    });

    if (!diagram) {
      return res.status(404).json({
        success: false,
        message: 'Diagram not found'
      });
    }

    res.json({
      success: true,
      message: 'Diagram deleted successfully'
    });
  } catch (error) {
    console.error('Delete diagram error:', error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'Diagram not found'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server error while deleting diagram'
    });
  }
});

// @route   POST /api/diagrams/:id/duplicate
// @desc    Duplicate a diagram
// @access  Private
router.post('/:id/duplicate', protect, async (req, res) => {
  try {
    const originalDiagram = await Diagram.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!originalDiagram) {
      return res.status(404).json({
        success: false,
        message: 'Diagram not found'
      });
    }

    const newDiagram = await Diagram.create({
      user: req.user._id,
      name: `${originalDiagram.name} (Copy)`,
      description: originalDiagram.description,
      nodes: originalDiagram.nodes,
      edges: originalDiagram.edges,
      sqlContent: originalDiagram.sqlContent,
      viewport: originalDiagram.viewport
    });

    res.status(201).json({
      success: true,
      message: 'Diagram duplicated successfully',
      diagram: newDiagram
    });
  } catch (error) {
    console.error('Duplicate diagram error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while duplicating diagram'
    });
  }
});

module.exports = router;
