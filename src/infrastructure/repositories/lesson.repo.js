const LessonModel = require('../db/models/Lesson.model');

exports.findByModuleId = (moduleId) => {
  return LessonModel.find({ moduleId });
};

exports.create = (data) => {
  return LessonModel.create(data);
};
