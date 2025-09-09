const express = require('express');
const { body, validationResult } = require('express-validator');
const Page = require('../models/Page');
const PageVersion = require('../models/PageVersion');
const PageLink = require('../models/PageLink');
const { auth } = require('../middleware/auth');
const { checkProjectPermission, checkPagePermission } = require('../middleware/permissions');

const router = express.Router();

// Create page
router.post('/', auth, [
  body('title').trim().isLength({ min: 1, max: 200 }).withMessage('Title is required'),
  body('projectId').isMongoId().withMessage('Valid project ID required'),
  body('parentPageId').optional().isMongoId(),
  body('content').optional().isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, projectId, parentPageId, content = '' } = req.body;

    // Check project permission
    const Project = require('../models/Project');
    const project = await Project.findById(projectId);
    if (!project || !project.hasPermission(req.user._id, 'editor')) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }

    const page = new Page({
      title,
      content,
      projectId,
      parentPageId,
      createdBy: req.user._id,
      lastModifiedBy: req.user._id
    });

    await page.save();
    await page.populate('createdBy', 'name email avatar');
    await page.populate('lastModifiedBy', 'name email avatar');

    // Create initial version
    const version = new PageVersion({
      pageId: page._id,
      title: page.title,
      content: page.content,
      createdBy: req.user._id,
      changeType: 'create',
      changeDescription: 'Page created'
    });
    await version.save();

    res.status(201).json(page);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get page by ID
router.get('/:pageId', auth, checkPagePermission, async (req, res) => {
  try {
    const page = await Page.findById(req.params.pageId)
      .populate('createdBy', 'name email avatar')
      .populate('lastModifiedBy', 'name email avatar')
      .populate('childPages', 'title createdAt updatedAt')
      .populate('linkedPages', 'title createdAt updatedAt');

    res.json(page);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update page content
router.put('/:pageId/content', auth, checkPagePermission, [
  body('content').isString().withMessage('Content is required'),
  body('changeDescription').optional().trim().isLength({ max: 500 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { content, changeDescription } = req.body;

    // Check edit permission
    if (!req.page.projectId.hasPermission(req.user._id, 'editor')) {
      return res.status(403).json({ message: 'Insufficient permissions to edit' });
    }

    const oldContent = req.page.content;
    req.page.content = content;
    req.page.lastModifiedBy = req.user._id;
    await req.page.save();

    // Create version if content changed significantly
    if (oldContent !== content) {
      const version = new PageVersion({
        pageId: req.page._id,
        title: req.page.title,
        content: req.page.content,
        createdBy: req.user._id,
        changeType: 'edit',
        changeDescription: changeDescription || 'Content updated'
      });
      await version.save();
    }

    await req.page.populate('lastModifiedBy', 'name email avatar');
    res.json(req.page);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update page title
router.put('/:pageId/title', auth, checkPagePermission, [
  body('title').trim().isLength({ min: 1, max: 200 }).withMessage('Title is required'),
  body('changeDescription').optional().trim().isLength({ max: 500 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, changeDescription } = req.body;

    // Check edit permission
    if (!req.page.projectId.hasPermission(req.user._id, 'editor')) {
      return res.status(403).json({ message: 'Insufficient permissions to edit' });
    }

    const oldTitle = req.page.title;
    req.page.title = title;
    req.page.lastModifiedBy = req.user._id;
    await req.page.save();

    // Create version if title changed
    if (oldTitle !== title) {
      const version = new PageVersion({
        pageId: req.page._id,
        title: req.page.title,
        content: req.page.content,
        createdBy: req.user._id,
        changeType: 'rename',
        changeDescription: changeDescription || `Title changed from "${oldTitle}" to "${title}"`
      });
      await version.save();
    }

    await req.page.populate('lastModifiedBy', 'name email avatar');
    res.json(req.page);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete page
router.delete('/:pageId', auth, checkPagePermission, async (req, res) => {
  try {
    // Check delete permission
    if (!req.page.projectId.hasPermission(req.user._id, 'editor')) {
      return res.status(403).json({ message: 'Insufficient permissions to delete' });
    }

    // Create version for deletion
    const version = new PageVersion({
      pageId: req.page._id,
      title: req.page.title,
      content: req.page.content,
      createdBy: req.user._id,
      changeType: 'delete',
      changeDescription: 'Page deleted'
    });
    await version.save();

    // Archive page instead of deleting
    req.page.isArchived = true;
    await req.page.save();

    res.json({ message: 'Page deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get page versions
router.get('/:pageId/versions', auth, checkPagePermission, async (req, res) => {
  try {
    const versions = await PageVersion.find({ pageId: req.params.pageId })
      .populate('createdBy', 'name email avatar')
      .sort({ version: -1 });

    res.json(versions);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Restore page version
router.post('/:pageId/restore', auth, checkPagePermission, [
  body('versionId').isMongoId().withMessage('Valid version ID required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Check edit permission
    if (!req.page.projectId.hasPermission(req.user._id, 'editor')) {
      return res.status(403).json({ message: 'Insufficient permissions to restore' });
    }

    const { versionId } = req.body;
    const version = await PageVersion.findById(versionId);
    
    if (!version || version.pageId.toString() !== req.params.pageId) {
      return res.status(404).json({ message: 'Version not found' });
    }

    // Update page with version data
    req.page.title = version.title;
    req.page.content = version.content;
    req.page.lastModifiedBy = req.user._id;
    await req.page.save();

    // Create restore version
    const restoreVersion = new PageVersion({
      pageId: req.page._id,
      title: req.page.title,
      content: req.page.content,
      createdBy: req.user._id,
      changeType: 'restore',
      changeDescription: `Restored from version ${version.version}`
    });
    await restoreVersion.save();

    await req.page.populate('lastModifiedBy', 'name email avatar');
    res.json(req.page);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create page link
router.post('/:pageId/links', auth, checkPagePermission, [
  body('targetPageId').isMongoId().withMessage('Valid target page ID required'),
  body('linkText').trim().isLength({ min: 1, max: 200 }).withMessage('Link text is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { targetPageId, linkText } = req.body;

    // Check if target page exists and user has access
    const targetPage = await Page.findById(targetPageId);
    if (!targetPage) {
      return res.status(404).json({ message: 'Target page not found' });
    }

    if (!targetPage.projectId.hasPermission(req.user._id, 'viewer')) {
      return res.status(403).json({ message: 'No access to target page' });
    }

    // Create link
    const link = new PageLink({
      sourcePageId: req.params.pageId,
      targetPageId,
      linkText,
      createdBy: req.user._id
    });

    await link.save();

    // Update page's linkedPages array
    req.page.linkedPages.push(targetPageId);
    await req.page.save();

    res.status(201).json(link);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
