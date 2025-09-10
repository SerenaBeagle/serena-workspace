const express = require('express');
const { body, validationResult } = require('express-validator');
const Project = require('../models/Project');

const router = express.Router();

// Get all projects
router.get('/', async (req, res) => {
  try {
    const projects = await Project.find({ isGlobal: true, isPublic: true });
    const projectsWithId = projects.map(project => ({
      ...project.toObject(),
      id: project._id.toString()
    }));
    res.json(projectsWithId);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create project
router.post('/', [
  body('title').trim().isLength({ min: 1, max: 200 }).withMessage('Title is required'),
  body('description').optional().isString(),
  body('isPublic').optional().isBoolean(),
  body('isGlobal').optional().isBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, description = '', isPublic = true, isGlobal = true } = req.body;

    const project = new Project({
      title,
      description,
      isPublic,
      isGlobal,
      createdBy: 'anonymous',
      lastModifiedBy: 'anonymous',
      collaborators: [],
      settings: {
        allowComments: true,
        allowVersionHistory: true
      }
    });

    await project.save();

    const projectWithId = {
      ...project.toObject(),
      id: project._id.toString()
    };

    res.status(201).json(projectWithId);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get project by ID
router.get('/:id', async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const projectWithId = {
      ...project.toObject(),
      id: project._id.toString()
    };

    res.json(projectWithId);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update project
router.put('/:id', [
  body('title').optional().trim().isLength({ min: 1, max: 200 }),
  body('description').optional().isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, description } = req.body;
    const project = await Project.findById(req.params.id);
    
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    if (title) project.title = title;
    if (description !== undefined) project.description = description;
    project.updatedAt = new Date();
    project.lastModifiedBy = 'anonymous';

    await project.save();

    const projectWithId = {
      ...project.toObject(),
      id: project._id.toString()
    };

    res.json(projectWithId);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete project
router.delete('/:id', async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Archive project instead of deleting
    project.isArchived = true;
    project.updatedAt = new Date();
    project.lastModifiedBy = 'anonymous';
    await project.save();

    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;