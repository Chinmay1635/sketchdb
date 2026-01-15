const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Diagram = require('../models/Diagram');
const User = require('../models/User');
const { protect, optionalAuth } = require('../middleware/auth');

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
    // Use .lean() for read-only queries - returns plain JS objects (faster, less memory)
    const diagrams = await Diagram.find({ user: req.user._id })
      .select('name description slug isPublic createdAt updatedAt')
      .sort({ updatedAt: -1 })
      .lean();

    res.json({
      success: true,
      count: diagrams.length,
      diagrams: diagrams.map(d => ({
        ...d,
        username: req.user.username
      }))
    });
  } catch (error) {
    console.error('Get diagrams error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching diagrams'
    });
  }
});

// @route   GET /api/diagrams/by-slug/:username/:slug
// @desc    Get a diagram by username and slug (for URL routing)
// @access  Public (if diagram is public) or Private (if owner/collaborator)
router.get('/by-slug/:username/:slug', optionalAuth, async (req, res) => {
  try {
    const { username, slug } = req.params;

    // Find the user by username (case-insensitive)
    const owner = await User.findOne({ 
      username: { $regex: new RegExp(`^${username}$`, 'i') }
    });
    
    if (!owner) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Find the diagram
    const diagram = await Diagram.findOne({
      slug: slug,
      user: owner._id
    }).populate('user', 'username email');

    if (!diagram) {
      return res.status(404).json({
        success: false,
        message: 'Diagram not found'
      });
    }

    // Check access permissions
    const isOwner = req.user && diagram.user._id.toString() === req.user._id.toString();
    const isCollaborator = req.user && diagram.collaborators && diagram.collaborators.some(
      c => c.user && c.user.toString() === req.user._id.toString()
    );
    const isPublic = diagram.isPublic;

    if (!isOwner && !isCollaborator && !isPublic) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to view this diagram'
      });
    }

    // Determine permission level
    let permission = 'view';
    if (isOwner) {
      permission = 'owner';
    } else if (isCollaborator) {
      const collaborator = diagram.collaborators.find(
        c => c.user && c.user.toString() === req.user._id.toString()
      );
      permission = collaborator?.permission || 'view';
    }

    res.json({
      success: true,
      diagram: {
        ...diagram.toObject(),
        ownerUsername: diagram.user.username,
        permission
      }
    });
  } catch (error) {
    console.error('Get diagram by slug error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching diagram'
    });
  }
});

// @route   GET /api/diagrams/:id
// @desc    Get a single diagram by ID (legacy support)
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const diagram = await Diagram.findOne({
      _id: req.params.id,
      user: req.user._id
    })
    .populate('user', 'username')
    .populate('collaborators.user', 'username email');

    if (!diagram) {
      return res.status(404).json({
        success: false,
        message: 'Diagram not found'
      });
    }

    res.json({
      success: true,
      diagram: {
        ...diagram.toObject(),
        ownerUsername: diagram.user.username,
        permission: 'owner'
      }
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

    const { name, description, nodes, edges, sqlContent, viewport, isPublic } = req.body;

    const diagram = await Diagram.create({
      user: req.user._id,
      name,
      description: description || '',
      nodes: nodes || [],
      edges: edges || [],
      sqlContent: sqlContent || '',
      viewport: viewport || { x: 0, y: 0, zoom: 1 },
      isPublic: isPublic || false
    });

    // Populate user info for response
    await diagram.populate('user', 'username');

    res.status(201).json({
      success: true,
      message: 'Diagram created successfully',
      diagram: {
        ...diagram.toObject(),
        ownerUsername: diagram.user.username,
        permission: 'owner'
      }
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
// @desc    Update a diagram by ID
// @access  Private (owner or collaborator with edit permission)
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

    const { name, description, nodes, edges, sqlContent, viewport, isPublic } = req.body;

    let diagram = await Diagram.findById(req.params.id);

    if (!diagram) {
      return res.status(404).json({
        success: false,
        message: 'Diagram not found'
      });
    }

    // Check permissions
    const isOwner = diagram.user.toString() === req.user._id.toString();
    const collaborator = diagram.collaborators && diagram.collaborators.find(
      c => c.user && c.user.toString() === req.user._id.toString() && c.permission === 'edit'
    );

    if (!isOwner && !collaborator) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to edit this diagram'
      });
    }

    // Update fields
    diagram.name = name;
    diagram.description = description || '';
    diagram.nodes = nodes || [];
    diagram.edges = edges || [];
    diagram.sqlContent = sqlContent || '';
    diagram.viewport = viewport || diagram.viewport;
    
    // Only owner can change public status
    if (isOwner && typeof isPublic === 'boolean') {
      diagram.isPublic = isPublic;
    }

    await diagram.save();
    await diagram.populate('user', 'username');

    res.json({
      success: true,
      message: 'Diagram updated successfully',
      diagram: {
        ...diagram.toObject(),
        ownerUsername: diagram.user.username,
        permission: isOwner ? 'owner' : 'edit'
      }
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

// @route   PUT /api/diagrams/by-slug/:slug
// @desc    Update a diagram by slug
// @access  Private (owner or collaborator with edit permission)
router.put('/by-slug/:slug', protect, diagramValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: errors.array()[0].msg,
        errors: errors.array()
      });
    }

    const { name, description, nodes, edges, sqlContent, viewport, isPublic } = req.body;

    let diagram = await Diagram.findOne({ slug: req.params.slug });

    if (!diagram) {
      return res.status(404).json({
        success: false,
        message: 'Diagram not found'
      });
    }

    // Check permissions
    const isOwner = diagram.user.toString() === req.user._id.toString();
    const collaborator = diagram.collaborators && diagram.collaborators.find(
      c => c.user && c.user.toString() === req.user._id.toString() && c.permission === 'edit'
    );

    if (!isOwner && !collaborator) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to edit this diagram'
      });
    }

    // Update fields
    diagram.name = name;
    diagram.description = description || '';
    diagram.nodes = nodes || [];
    diagram.edges = edges || [];
    diagram.sqlContent = sqlContent || '';
    diagram.viewport = viewport || diagram.viewport;
    
    // Only owner can change public status
    if (isOwner && typeof isPublic === 'boolean') {
      diagram.isPublic = isPublic;
    }

    await diagram.save();
    await diagram.populate('user', 'username');

    res.json({
      success: true,
      message: 'Diagram updated successfully',
      diagram: {
        ...diagram.toObject(),
        ownerUsername: diagram.user.username,
        permission: isOwner ? 'owner' : 'edit'
      }
    });
  } catch (error) {
    console.error('Update diagram by slug error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating diagram'
    });
  }
});

// @route   PATCH /api/diagrams/:id/visibility
// @desc    Update diagram visibility (public/private)
// @access  Private (owner only)
router.patch('/:id/visibility', protect, async (req, res) => {
  try {
    const { isPublic } = req.body;

    if (typeof isPublic !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'isPublic must be a boolean value'
      });
    }

    const diagram = await Diagram.findById(req.params.id);

    if (!diagram) {
      return res.status(404).json({
        success: false,
        message: 'Diagram not found'
      });
    }

    // Only owner can change visibility
    if (diagram.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only the owner can change diagram visibility'
      });
    }

    diagram.isPublic = isPublic;
    await diagram.save();

    res.json({
      success: true,
      message: `Diagram is now ${isPublic ? 'public' : 'private'}`,
      isPublic: diagram.isPublic
    });
  } catch (error) {
    console.error('Update visibility error:', error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'Diagram not found'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server error while updating visibility'
    });
  }
});

// @route   DELETE /api/diagrams/:id
// @desc    Delete a diagram
// @access  Private (owner only)
router.delete('/:id', protect, async (req, res) => {
  try {
    const diagram = await Diagram.findById(req.params.id);

    if (!diagram) {
      return res.status(404).json({
        success: false,
        message: 'Diagram not found'
      });
    }

    // Only owner can delete
    if (diagram.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to delete this diagram'
      });
    }

    await diagram.deleteOne();

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
      viewport: originalDiagram.viewport,
      isPublic: false // Copies are private by default
    });

    await newDiagram.populate('user', 'username');

    res.status(201).json({
      success: true,
      message: 'Diagram duplicated successfully',
      diagram: {
        ...newDiagram.toObject(),
        ownerUsername: newDiagram.user.username,
        permission: 'owner'
      }
    });
  } catch (error) {
    console.error('Duplicate diagram error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while duplicating diagram'
    });
  }
});

// @route   POST /api/diagrams/:id/collaborators
// @desc    Add a collaborator to a diagram (for future use)
// @access  Private (owner only)
router.post('/:id/collaborators', protect, async (req, res) => {
  try {
    const { email, permission } = req.body;

    if (!email || !['view', 'edit'].includes(permission)) {
      return res.status(400).json({
        success: false,
        message: 'Valid email and permission (view/edit) are required'
      });
    }

    const diagram = await Diagram.findById(req.params.id);

    if (!diagram) {
      return res.status(404).json({
        success: false,
        message: 'Diagram not found'
      });
    }

    // Only owner can add collaborators
    if (diagram.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only the owner can add collaborators'
      });
    }

    // Find the user to add
    const userToAdd = await User.findOne({ email: email.toLowerCase() });
    if (!userToAdd) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if already a collaborator
    const existingIndex = diagram.collaborators.findIndex(
      c => c.user && c.user.toString() === userToAdd._id.toString()
    );

    if (existingIndex >= 0) {
      diagram.collaborators[existingIndex].permission = permission;
    } else {
      diagram.collaborators.push({
        user: userToAdd._id,
        permission
      });
    }

    await diagram.save();

    res.json({
      success: true,
      message: 'Collaborator added successfully'
    });
  } catch (error) {
    console.error('Add collaborator error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while adding collaborator'
    });
  }
});

// @route   DELETE /api/diagrams/:id/collaborators/:userId
// @desc    Remove a collaborator from a diagram
// @access  Private (owner only)
router.delete('/:id/collaborators/:userId', protect, async (req, res) => {
  try {
    const diagram = await Diagram.findById(req.params.id);

    if (!diagram) {
      return res.status(404).json({
        success: false,
        message: 'Diagram not found'
      });
    }

    // Only owner can remove collaborators
    if (diagram.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only the owner can remove collaborators'
      });
    }

    diagram.collaborators = diagram.collaborators.filter(
      c => !c.user || c.user.toString() !== req.params.userId
    );

    await diagram.save();

    res.json({
      success: true,
      message: 'Collaborator removed successfully'
    });
  } catch (error) {
    console.error('Remove collaborator error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while removing collaborator'
    });
  }
});

module.exports = router;
