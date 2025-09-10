const express = require('express');
const { body, validationResult } = require('express-validator');
const Page = require('../models/Page');
const PageVersion = require('../models/PageVersion');
const PageLink = require('../models/PageLink');
const Project = require('../models/Project');

const router = express.Router();

// Create page
router.post('/', [
  body('title').trim().isLength({ min: 1, max: 200 }).withMessage('Title is required'),
  body('projectId').isMongoId().withMessage('Valid project ID required'),
  body('parentPageId').optional().isMongoId(),
  body('content').optional().isString()
], async (req, res) => {
  try {
    console.log('=== CREATE PAGE REQUEST ===');
    console.log('Body:', req.body);

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, projectId, parentPageId, content = '' } = req.body;
    console.log('Extracted data:', { title, projectId, parentPageId, content });

    // Find the project
    const project = await Project.findById(projectId);
    console.log('Found project:', project);
    
    if (!project) {
      console.log('Project not found for ID:', projectId);
      return res.status(404).json({ message: 'Project not found' });
    }

    // Create the page
    const page = new Page({
      title,
      content,
      projectId,
      parentPageId,
      createdBy: 'anonymous',
      lastModifiedBy: 'anonymous'
    });

    await page.save();

    // Create initial version
    const version = new PageVersion({
      pageId: page._id,
      version: 1,
      title: page.title,
      content: page.content,
      changeType: 'create',
      changeDescription: 'Page created',
      createdBy: 'anonymous'
    });

    await version.save();

    // Convert _id to id for frontend compatibility
    const pageWithId = {
      ...page.toObject(),
      id: page._id.toString()
    };
    
    console.log('Page created successfully:', pageWithId);
    res.status(201).json(pageWithId);
  } catch (error) {
    console.error('Error creating page:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get pages for a project
router.get('/project/:projectId', async (req, res) => {
  try {
    const pages = await Page.find({ projectId: req.params.projectId });
    const pagesWithId = pages.map(page => ({
      ...page.toObject(),
      id: page._id.toString()
    }));
    res.json(pagesWithId);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update page content
router.put('/:pageId/content', [
  body('content').isString().withMessage('Content is required'),
  body('changeDescription').optional().isString()
], async (req, res) => {
  try {
    const { content, changeDescription } = req.body;
    
    const page = await Page.findById(req.params.pageId);
    if (!page) {
      return res.status(404).json({ message: 'Page not found' });
    }

    page.content = content;
    page.updatedAt = new Date();
    page.lastModifiedBy = 'anonymous';
    await page.save();

    // Create new version
    const version = new PageVersion({
      pageId: page._id,
      version: 1, // This should be calculated based on existing versions
      title: page.title,
      content: page.content,
      changeType: 'edit',
      changeDescription: changeDescription || 'Content updated',
      createdBy: 'anonymous'
    });

    await version.save();

    res.json({ message: 'Page content updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update page title
router.put('/:pageId/title', [
  body('title').trim().isLength({ min: 1, max: 200 }).withMessage('Title is required'),
  body('changeDescription').optional().isString()
], async (req, res) => {
  try {
    const { title, changeDescription } = req.body;
    
    const page = await Page.findById(req.params.pageId);
    if (!page) {
      return res.status(404).json({ message: 'Page not found' });
    }

    page.title = title;
    page.updatedAt = new Date();
    page.lastModifiedBy = 'anonymous';
    await page.save();

    // Create new version
    const version = new PageVersion({
      pageId: page._id,
      version: 1,
      title: page.title,
      content: page.content,
      changeType: 'rename',
      changeDescription: changeDescription || 'Title updated',
      createdBy: 'anonymous'
    });

    await version.save();

    res.json({ message: 'Page title updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get page versions
router.get('/:pageId/versions', async (req, res) => {
  try {
    const versions = await PageVersion.find({ pageId: req.params.pageId })
      .sort({ version: -1 });

    const versionsWithId = versions.map(version => ({
      ...version.toObject(),
      id: version._id.toString(),
      createdBy: 'anonymous' // Since we removed user system
    }));

    res.json(versionsWithId);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Restore page version
router.post('/:pageId/restore', [
  body('versionId').isMongoId().withMessage('Valid version ID required')
], async (req, res) => {
  try {
    const { versionId } = req.body;
    
    const version = await PageVersion.findById(versionId);
    if (!version) {
      return res.status(404).json({ message: 'Version not found' });
    }

    const page = await Page.findById(req.params.pageId);
    if (!page) {
      return res.status(404).json({ message: 'Page not found' });
    }

    // Update page with version content
    page.title = version.title;
    page.content = version.content;
    page.updatedAt = new Date();
    page.lastModifiedBy = 'anonymous';
    await page.save();

    // Create new version for the restore action
    const restoreVersion = new PageVersion({
      pageId: page._id,
      version: 1,
      title: page.title,
      content: page.content,
      changeType: 'edit',
      changeDescription: `Restored from version ${version.version}`,
      createdBy: 'anonymous'
    });

    await restoreVersion.save();

    res.json({ message: 'Page version restored successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create page link
router.post('/:pageId/links', [
  body('targetPageId').isMongoId().withMessage('Valid target page ID required'),
  body('linkText').trim().isLength({ min: 1 }).withMessage('Link text is required')
], async (req, res) => {
  try {
    const { targetPageId, linkText } = req.body;
    
    const link = new PageLink({
      sourcePageId: req.params.pageId,
      targetPageId,
      linkText,
      createdBy: 'anonymous'
    });

    await link.save();

    res.status(201).json({
      ...link.toObject(),
      id: link._id.toString()
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
