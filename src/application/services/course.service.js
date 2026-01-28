const moduleRepo = require('../../infrastructure/repositories/module.repo');
const progressService = require('./progress.service');

exports.getModulesForUser = async (user, courseType) => {
  // Use progress service to filter unlocked modules
  return progressService.getAvailableModules(user._id, courseType);
};
