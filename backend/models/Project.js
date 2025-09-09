const mongoose = require('mongoose');

const collaboratorSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  role: {
    type: String,
    enum: ['owner', 'editor', 'viewer'],
    default: 'editor'
  },
  addedAt: {
    type: Date,
    default: Date.now
  },
  addedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
});

const projectSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  workspaceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Workspace',
    required: true
  },
  collaborators: [collaboratorSchema],
  isPublic: {
    type: Boolean,
    default: true  // 默认公开，所有用户都可以访问
  },
  isGlobal: {
    type: Boolean,
    default: true  // 标记为全局项目
  },
  settings: {
    allowComments: {
      type: Boolean,
      default: true
    },
    allowVersionHistory: {
      type: Boolean,
      default: true
    }
  }
}, {
  timestamps: true
});

// Add owner as collaborator when project is created
projectSchema.pre('save', function(next) {
  if (this.isNew) {
    this.collaborators.push({
      userId: this.createdBy,
      role: 'owner',
      addedAt: new Date(),
      addedBy: this.createdBy
    });
  }
  next();
});

// Check if user has permission
projectSchema.methods.hasPermission = function(userId, requiredRole = 'viewer') {
  const collaborator = this.collaborators.find(c => c.userId.toString() === userId.toString());
  if (!collaborator) return false;
  
  const roleHierarchy = { viewer: 1, editor: 2, owner: 3 };
  return roleHierarchy[collaborator.role] >= roleHierarchy[requiredRole];
};

module.exports = mongoose.model('Project', projectSchema);
