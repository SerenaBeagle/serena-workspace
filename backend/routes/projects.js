const express = require('express');
const { body, validationResult } = require('express-validator');
const Project = require('../models/Project');
const Page = require('../models/Page');
const { auth } = require('../middleware/auth');
const { checkProjectPermission } = require('../middleware/permissions');

const router = express.Router();

// Get all projects for user
router.get('/', auth, async (req, res) => {
  try {
    const projects = await Project.find({
      'collaborators.userId': req.user._id
    })
    .populate('createdBy', 'name email avatar')
    .populate('collaborators.userId', 'name email avatar')
    .sort({ updatedAt: -1 });

    res.json(projects);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create new project
router.post('/', auth, [
  body('title').trim().isLength({ min: 1, max: 100 }).withMessage('Title is required'),
  body('description').optional().trim().isLength({ max: 500 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, description } = req.body;

    const project = new Project({
      title,
      description,
      createdBy: req.user._id
    });

    await project.save();
    await project.populate('createdBy', 'name email avatar');
    await project.populate('collaborators.userId', 'name email avatar');

    res.status(201).json(project);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get project by ID
router.get('/:projectId', auth, checkProjectPermission('viewer'), async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId)
      .populate('createdBy', 'name email avatar')
      .populate('collaborators.userId', 'name email avatar');

    // Get pages for this project
    const pages = await Page.find({ 
      projectId: req.params.projectId,
      isArchived: false 
    })
    .populate('createdBy', 'name email avatar')
    .populate('lastModifiedBy', 'name email avatar')
    .sort({ updatedAt: -1 });

    res.json({ project, pages });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update project
router.put('/:projectId', auth, checkProjectPermission('editor'), [
  body('title').optional().trim().isLength({ min: 1, max: 100 }),
  body('description').optional().trim().isLength({ max: 500 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, description } = req.body;
    const updateData = {};
    
    if (title) updateData.title = title;
    if (description !== undefined) updateData.description = description;

    const project = await Project.findByIdAndUpdate(
      req.params.projectId,
      updateData,
      { new: true }
    ).populate('createdBy', 'name email avatar')
     .populate('collaborators.userId', 'name email avatar');

    res.json(project);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete project
router.delete('/:projectId', auth, checkProjectPermission('owner'), async (req, res) => {
  try {
    // Delete all pages in this project
    await Page.deleteMany({ projectId: req.params.projectId });
    
    // Delete the project
    await Project.findByIdAndDelete(req.params.projectId);

    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Add collaborator
router.post('/:projectId/collaborators', auth, checkProjectPermission('owner'), [
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('role').isIn(['editor', 'viewer']).withMessage('Role must be editor or viewer')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, role } = req.body;
    const User = require('../models/User');

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if user is already a collaborator
    const existingCollaborator = req.project.collaborators.find(
      c => c.userId.toString() === user._id.toString()
    );

    if (existingCollaborator) {
      return res.status(400).json({ message: 'User is already a collaborator' });
    }

    // Add collaborator
    req.project.collaborators.push({
      userId: user._id,
      role,
      addedBy: req.user._id
    });

    await req.project.save();
    await req.project.populate('collaborators.userId', 'name email avatar');

    res.json({ message: 'Collaborator added successfully', project: req.project });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Remove collaborator
router.delete('/:projectId/collaborators/:userId', auth, checkProjectPermission('owner'), async (req, res) => {
  try {
    const { userId } = req.params;

    // Don't allow removing the owner
    if (req.project.createdBy.toString() === userId) {
      return res.status(400).json({ message: 'Cannot remove project owner' });
    }

    req.project.collaborators = req.project.collaborators.filter(
      c => c.userId.toString() !== userId
    );

    await req.project.save();
    await req.project.populate('collaborators.userId', 'name email avatar');

    res.json({ message: 'Collaborator removed successfully', project: req.project });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
