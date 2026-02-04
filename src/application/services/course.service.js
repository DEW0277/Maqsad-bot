const moduleRepo = require('../../infrastructure/repositories/module.repo');
const progressService = require('./progress.service');
const userService = require('./user.service');

exports.getModulesForUser = async (user, courseType) => {
  // Adminlarga barcha modullar ochiq
  if (userService.isAdmin(user.telegramId)) {
    const allModules = await moduleRepo.findByCourseType(courseType);
    return allModules.sort((a, b) => a.order - b.order);
  }

  // Use progress service to filter unlocked modules
  return progressService.getAvailableModules(user._id, courseType);
};
