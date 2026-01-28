const mongoose = require('mongoose');

const ProgressSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  module: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Module',
    required: true,
  },
  status: {
    type: String,
    enum: ['in_progress', 'completed', 'pending_approval', 'approved', 'rejected'],
    default: 'in_progress',
  },
  userFeedback: {
    type: String,
    default: '',
  },
  aiFeedback: {
    type: String,
    default: '',
  },
  adminFeedback: {
    type: String,
    default: '',
  },
  rating: {
    type: String,
    enum: ['high', 'medium', 'low', 'none'],
    default: 'none',
  },
  rejectionReason: {
    type: String,
    default: '',
  },
}, { timestamps: true });

// Ensure unique progress per user per module
ProgressSchema.index({ user: 1, module: 1 }, { unique: true });

module.exports = mongoose.model('Progress', ProgressSchema);
