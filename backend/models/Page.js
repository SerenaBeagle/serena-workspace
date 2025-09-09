const mongoose = require('mongoose');

const pageSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  content: {
    type: String,
    default: ''
  },
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  parentPageId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Page',
    default: null
  },
  childPages: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Page'
  }],
  linkedPages: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Page'
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  lastModifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isArchived: {
    type: Boolean,
    default: false
  },
  tags: [{
    type: String,
    trim: true
  }]
}, {
  timestamps: true
});

// Update parent page's childPages when page is created
pageSchema.pre('save', async function(next) {
  if (this.isNew && this.parentPageId) {
    await this.constructor.findByIdAndUpdate(
      this.parentPageId,
      { $addToSet: { childPages: this._id } }
    );
  }
  next();
});

// Remove from parent's childPages when page is deleted
pageSchema.pre('deleteOne', { document: true, query: false }, async function(next) {
  if (this.parentPageId) {
    await this.constructor.findByIdAndUpdate(
      this.parentPageId,
      { $pull: { childPages: this._id } }
    );
  }
  next();
});

module.exports = mongoose.model('Page', pageSchema);
