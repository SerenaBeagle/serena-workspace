const mongoose = require('mongoose');

const pageVersionSchema = new mongoose.Schema({
  pageId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Page',
    required: true
  },
  version: {
    type: Number,
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  content: {
    type: String,
    default: ''
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  changeType: {
    type: String,
    enum: ['create', 'edit', 'rename', 'delete', 'restore'],
    required: true
  },
  changeDescription: {
    type: String,
    trim: true,
    maxlength: 500
  },
  diff: {
    type: String, // Store diff data for better version comparison
    default: null
  }
}, {
  timestamps: true
});

// Auto-increment version number
pageVersionSchema.pre('save', async function(next) {
  if (this.isNew) {
    const lastVersion = await this.constructor
      .findOne({ pageId: this.pageId })
      .sort({ version: -1 });
    
    this.version = lastVersion ? lastVersion.version + 1 : 1;
  }
  next();
});

// Index for efficient queries
pageVersionSchema.index({ pageId: 1, version: -1 });
pageVersionSchema.index({ createdBy: 1, createdAt: -1 });

module.exports = mongoose.model('PageVersion', pageVersionSchema);
