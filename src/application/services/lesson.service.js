const lessonRepo = require('../../infrastructure/repositories/lesson.repo');

exports.getLessonsByModule = async (moduleId) => {
  return lessonRepo.findByModuleId(moduleId);
};
