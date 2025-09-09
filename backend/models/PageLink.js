const mongoose = require('mongoose');

const pageLinkSchema = new mongoose.Schema({
  sourcePageId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Page',
    required: true
  },
  targetPageId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Page',
    required: true
  },
  linkText: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Ensure source and target are different
pageLinkSchema.pre('save', function(next) {
  if (this.sourcePageId.toString() === this.targetPageId.toString()) {
    return next(new Error('Source and target pages cannot be the same'));
  }
  next();
});

// Index for efficient queries
pageLinkSchema.index({ sourcePageId: 1 });
pageLinkSchema.index({ targetPageId: 1 });
pageLinkSchema.index({ createdBy: 1 });

module.exports = mongoose.model('PageLink', pageLinkSchema);
