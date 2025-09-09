const mongoose = require('mongoose');

const actionLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  userName: {
    type: String,
    required: true
  },
  action: {
    type: String,
    required: true,
    enum: [
      'user_registered',
      'user_logged_in',
      'user_logged_out',
      'project_created',
      'project_updated',
      'project_deleted',
      'page_created',
      'page_updated',
      'page_deleted',
      'page_content_updated',
      'page_title_updated',
      'page_link_created',
      'page_link_deleted',
      'version_restored',
      'collaborator_added',
      'collaborator_removed'
    ]
  },
  description: {
    type: String,
    required: true
  },
  targetType: {
    type: String,
    enum: ['project', 'page', 'user', 'workspace', 'system'],
    required: true
  },
  targetId: {
    type: String,
    required: false
  },
  targetName: {
    type: String,
    required: false
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  ipAddress: {
    type: String,
    required: false
  },
  userAgent: {
    type: String,
    required: false
  }
}, {
  timestamps: true
});

// Index for efficient querying
actionLogSchema.index({ createdAt: -1 });
actionLogSchema.index({ userId: 1, createdAt: -1 });
actionLogSchema.index({ action: 1, createdAt: -1 });

// Static method to log actions
actionLogSchema.statics.logAction = async function(data) {
  const {
    userId,
    userName,
    action,
    description,
    targetType,
    targetId,
    targetName,
    metadata = {},
    ipAddress,
    userAgent
  } = data;

  return await this.create({
    userId,
    userName,
    action,
    description,
    targetType,
    targetId,
    targetName,
    metadata,
    ipAddress,
    userAgent
  });
};

module.exports = mongoose.model('ActionLog', actionLogSchema);
