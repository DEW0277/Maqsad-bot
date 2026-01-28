const mongoose = require('mongoose');

const LessonSchema = new mongoose.Schema({
  moduleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Module',
    required: true,
  },
  type: {
    type: String,
    enum: ['text', 'video', 'file'],
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
});

module.exports = mongoose.model('Lesson', LessonSchema);
