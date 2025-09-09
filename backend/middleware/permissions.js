const Project = require('../models/Project');

const checkProjectPermission = (requiredRole = 'viewer') => {
  return async (req, res, next) => {
    try {
      const { projectId } = req.params;
      const userId = req.user._id;

      const project = await Project.findById(projectId);
      if (!project) {
        return res.status(404).json({ message: 'Project not found' });
      }

      if (!project.hasPermission(userId, requiredRole)) {
        return res.status(403).json({ 
          message: `Insufficient permissions. Required: ${requiredRole}` 
        });
      }

      req.project = project;
      next();
    } catch (error) {
      res.status(500).json({ message: 'Error checking permissions' });
    }
  };
};

const checkPagePermission = async (req, res, next) => {
  try {
    const { pageId } = req.params;
    const userId = req.user._id;

    const Page = require('../models/Page');
    const page = await Page.findById(pageId).populate('projectId');
    
    if (!page) {
      return res.status(404).json({ message: 'Page not found' });
    }

    if (!page.projectId.hasPermission(userId, 'viewer')) {
      return res.status(403).json({ 
        message: 'Insufficient permissions to access this page' 
      });
    }

    req.page = page;
    next();
  } catch (error) {
    res.status(500).json({ message: 'Error checking page permissions' });
  }
};

module.exports = {
  checkProjectPermission,
  checkPagePermission
};
