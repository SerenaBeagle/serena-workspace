import { io } from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.listeners = new Map();
  }

  connect(token) {
    if (this.socket) {
      this.disconnect();
    }

    const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'https://serena-workspace-production.up.railway.app';
    
    this.socket = io(SOCKET_URL, {
      auth: {
        token
      }
    });

    this.socket.on('connect', () => {
      console.log('Socket connected');
      this.isConnected = true;
      this.emit('connected');
    });

    this.socket.on('disconnect', () => {
      console.log('Socket disconnected');
      this.isConnected = false;
      this.emit('disconnected');
    });

    this.socket.on('authenticated', (data) => {
      console.log('Socket authenticated:', data);
      this.emit('authenticated', data);
    });

    this.socket.on('auth_error', (error) => {
      console.error('Socket auth error:', error);
      this.emit('auth_error', error);
    });

    this.socket.on('error', (error) => {
      console.error('Socket error:', error);
      this.emit('error', error);
    });

    // Project events
    this.socket.on('joined_project', (data) => {
      this.emit('joined_project', data);
    });

    this.socket.on('left_project', (data) => {
      this.emit('left_project', data);
    });

    this.socket.on('user_joined', (data) => {
      this.emit('user_joined', data);
    });

    this.socket.on('user_left', (data) => {
      this.emit('user_left', data);
    });

    this.socket.on('user_offline', (data) => {
      this.emit('user_offline', data);
    });

    // Page editing events
    this.socket.on('user_editing', (data) => {
      this.emit('user_editing', data);
    });

    this.socket.on('user_stopped_editing', (data) => {
      this.emit('user_stopped_editing', data);
    });

    this.socket.on('page_content_updated', (data) => {
      this.emit('page_content_updated', data);
    });

    this.socket.on('page_title_updated', (data) => {
      this.emit('page_title_updated', data);
    });

    this.socket.on('cursor_position_updated', (data) => {
      this.emit('cursor_position_updated', data);
    });

    // Typing indicators
    this.socket.on('user_typing', (data) => {
      this.emit('user_typing', data);
    });

    this.socket.on('user_stopped_typing', (data) => {
      this.emit('user_stopped_typing', data);
    });

    // Comments
    this.socket.on('comment_added', (data) => {
      this.emit('comment_added', data);
    });

    // Presence
    this.socket.on('presence_updated', (data) => {
      this.emit('presence_updated', data);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  // Authentication
  authenticate(token) {
    if (this.socket) {
      this.socket.emit('authenticate', token);
    }
  }

  // Project methods
  joinProject(projectId) {
    if (this.socket) {
      this.socket.emit('join_project', projectId);
    }
  }

  leaveProject(projectId) {
    if (this.socket) {
      this.socket.emit('leave_project', projectId);
    }
  }

  // Page editing methods
  startEditing(pageId) {
    if (this.socket) {
      this.socket.emit('start_editing', pageId);
    }
  }

  stopEditing(pageId) {
    if (this.socket) {
      this.socket.emit('stop_editing', pageId);
    }
  }

  updatePageContent(pageId, content, cursorPosition) {
    if (this.socket) {
      this.socket.emit('page_content_change', {
        pageId,
        content,
        cursorPosition
      });
    }
  }

  updatePageTitle(pageId, title) {
    if (this.socket) {
      this.socket.emit('page_title_change', {
        pageId,
        title
      });
    }
  }

  updateCursorPosition(pageId, cursorPosition) {
    if (this.socket) {
      this.socket.emit('cursor_position_change', {
        pageId,
        cursorPosition
      });
    }
  }

  // Typing indicators
  startTyping(pageId) {
    if (this.socket) {
      this.socket.emit('typing_start', { pageId });
    }
  }

  stopTyping(pageId) {
    if (this.socket) {
      this.socket.emit('typing_stop', { pageId });
    }
  }

  // Comments
  addComment(pageId, comment, position) {
    if (this.socket) {
      this.socket.emit('add_comment', {
        pageId,
        comment,
        position
      });
    }
  }

  // Presence
  updatePresence(projectId, status) {
    if (this.socket) {
      this.socket.emit('update_presence', {
        projectId,
        status
      });
    }
  }

  // Event listener management
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  off(event, callback) {
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => {
        callback(data);
      });
    }
  }
}

export default new SocketService();
