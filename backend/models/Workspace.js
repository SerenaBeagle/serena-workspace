const mongoose = require('mongoose');

const workspaceSchema = new mongoose.Schema({
  name: {
    type: String,
    default: 'Global Workspace',
    required: true
  },
  description: {
    type: String,
    default: 'Shared workspace for all users'
  },
  isGlobal: {
    type: Boolean,
    default: true
  },
  settings: {
    allowPublicAccess: {
      type: Boolean,
      default: true
    },
    requireAuthentication: {
      type: Boolean,
      default: true
    }
  }
}, {
  timestamps: true
});

// Ensure only one global workspace exists
workspaceSchema.statics.getGlobalWorkspace = async function() {
  let workspace = await this.findOne({ isGlobal: true });
  if (!workspace) {
    workspace = await this.create({
      name: 'Global Workspace',
      description: 'Shared workspace for all users',
      isGlobal: true
    });
  }
  return workspace;
};

module.exports = mongoose.model('Workspace', workspaceSchema);
