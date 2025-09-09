const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Project = require('../models/Project');
const Page = require('../models/Page');

// Store active users and their socket connections - limited for memory
const activeUsers = new Map();
const userSockets = new Map();

// Clean up old connections periodically
setInterval(() => {
  if (activeUsers.size > 100) { // Limit to 100 concurrent users
    console.log('Too many active users, cleaning up...');
    // Remove oldest entries
    const entries = Array.from(activeUsers.entries());
    const toRemove = entries.slice(0, 20); // Remove 20 oldest
    toRemove.forEach(([userId, data]) => {
      activeUsers.delete(userId);
      userSockets.delete(userId);
    });
  }
}, 60000); // Clean up every minute

const socketHandlers = (socket, io) => {
  // Set connection timeout using Socket.IO method
  socket.setMaxListeners(20); // Limit event listeners
  
  // Set connection timeout
  const connectionTimeout = setTimeout(() => {
    if (!socket.userId) {
      console.log('Connection timeout, disconnecting socket:', socket.id);
      socket.disconnect(true);
    }
  }, 30000); // 30 seconds
  
  // Clear timeout when authenticated
  socket.on('authenticated', () => {
    clearTimeout(connectionTimeout);
  });
  
  // Authenticate socket connection
  socket.on('authenticate', async (token) => {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId).select('-password');
      
      if (!user) {
        socket.emit('auth_error', { message: 'Invalid token' });
        return;
      }

      // Store user info
      socket.userId = user._id.toString();
      socket.user = user;
      
      // Update user online status
      user.isOnline = true;
      await user.save();

      // Store socket connection
      userSockets.set(user._id.toString(), socket);
      activeUsers.set(socket.id, user);

      socket.emit('authenticated', { user });
      console.log(`User ${user.name} authenticated with socket ${socket.id}`);
    } catch (error) {
      socket.emit('auth_error', { message: 'Authentication failed' });
    }
  });

  // Join project room
  socket.on('join_project', async (projectId) => {
    try {
      if (!socket.userId) {
        socket.emit('error', { message: 'Not authenticated' });
        return;
      }

      // Check if user has access to project
      const project = await Project.findById(projectId);
      if (!project || !project.hasPermission(socket.userId, 'viewer')) {
        socket.emit('error', { message: 'No access to project' });
        return;
      }

      socket.join(`project_${projectId}`);
      socket.emit('joined_project', { projectId });

      // Notify other users in the project
      socket.to(`project_${projectId}`).emit('user_joined', {
        user: socket.user,
        projectId
      });

      console.log(`User ${socket.user.name} joined project ${projectId}`);
    } catch (error) {
      socket.emit('error', { message: 'Failed to join project' });
    }
  });

  // Leave project room
  socket.on('leave_project', (projectId) => {
    socket.leave(`project_${projectId}`);
    socket.emit('left_project', { projectId });

    // Notify other users
    socket.to(`project_${projectId}`).emit('user_left', {
      user: socket.user,
      projectId
    });
  });

  // Handle page editing
  socket.on('start_editing', async (pageId) => {
    try {
      if (!socket.userId) {
        socket.emit('error', { message: 'Not authenticated' });
        return;
      }

      const page = await Page.findById(pageId).populate('projectId');
      if (!page || !page.projectId.hasPermission(socket.userId, 'viewer')) {
        socket.emit('error', { message: 'No access to page' });
        return;
      }

      // Join page room
      socket.join(`page_${pageId}`);
      
      // Notify others that user is editing
      socket.to(`page_${pageId}`).emit('user_editing', {
        userId: socket.userId,
        userName: socket.user.name,
        pageId
      });

      console.log(`User ${socket.user.name} started editing page ${pageId}`);
    } catch (error) {
      socket.emit('error', { message: 'Failed to start editing' });
    }
  });

  // Handle page content changes
  socket.on('page_content_change', (data) => {
    const { pageId, content, cursorPosition } = data;
    
    // Broadcast to other users in the same page
    socket.to(`page_${pageId}`).emit('page_content_updated', {
      userId: socket.userId,
      userName: socket.user.name,
      content,
      cursorPosition,
      timestamp: new Date()
    });
  });

  // Handle cursor position changes
  socket.on('cursor_position_change', (data) => {
    const { pageId, cursorPosition } = data;
    
    socket.to(`page_${pageId}`).emit('cursor_position_updated', {
      userId: socket.userId,
      userName: socket.user.name,
      cursorPosition,
      timestamp: new Date()
    });
  });

  // Handle page title changes
  socket.on('page_title_change', (data) => {
    const { pageId, title } = data;
    
    socket.to(`page_${pageId}`).emit('page_title_updated', {
      userId: socket.userId,
      userName: socket.user.name,
      title,
      timestamp: new Date()
    });
  });

  // Stop editing page
  socket.on('stop_editing', (pageId) => {
    socket.leave(`page_${pageId}`);
    
    socket.to(`page_${pageId}`).emit('user_stopped_editing', {
      userId: socket.userId,
      userName: socket.user.name,
      pageId
    });
  });

  // Handle typing indicators
  socket.on('typing_start', (data) => {
    const { pageId } = data;
    socket.to(`page_${pageId}`).emit('user_typing', {
      userId: socket.userId,
      userName: socket.user.name,
      pageId
    });
  });

  socket.on('typing_stop', (data) => {
    const { pageId } = data;
    socket.to(`page_${pageId}`).emit('user_stopped_typing', {
      userId: socket.userId,
      userName: socket.user.name,
      pageId
    });
  });

  // Handle comments
  socket.on('add_comment', (data) => {
    const { pageId, comment, position } = data;
    
    socket.to(`page_${pageId}`).emit('comment_added', {
      userId: socket.userId,
      userName: socket.user.name,
      comment,
      position,
      timestamp: new Date()
    });
  });

  // Handle real-time presence
  socket.on('update_presence', (data) => {
    const { projectId, status } = data;
    
    socket.to(`project_${projectId}`).emit('presence_updated', {
      userId: socket.userId,
      userName: socket.user.name,
      status,
      timestamp: new Date()
    });
  });

  // Handle disconnect
  socket.on('disconnect', async () => {
    try {
      if (socket.userId) {
        // Update user offline status
        const user = await User.findById(socket.userId);
        if (user) {
          user.isOnline = false;
          await user.save();
        }

        // Remove from active users
        activeUsers.delete(socket.userId);
        userSockets.delete(socket.userId);
        
        // Clean up socket references
        socket.userId = null;
        socket.user = null;

        // Notify all project rooms that user went offline
        const projects = await Project.find({
          'collaborators.userId': socket.userId
        });

        projects.forEach(project => {
          socket.to(`project_${project._id}`).emit('user_offline', {
            userId: socket.userId,
            userName: socket.user?.name,
            projectId: project._id
          });
        });

        console.log(`User ${socket.user?.name} disconnected`);
      }
    } catch (error) {
      console.error('Error handling disconnect:', error);
    }
  });
};

module.exports = socketHandlers;
