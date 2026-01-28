const ProgressModel = require('../db/models/Progress.model');

exports.createOrUpdateProgress = async (userId, moduleId, data) => {
  return ProgressModel.findOneAndUpdate(
    { user: userId, module: moduleId },
    { $set: data },
    { new: true, upsert: true } // Create if not exists
  );
};

exports.getByUserAndModule = async (userId, moduleId) => {
  return ProgressModel.findOne({ user: userId, module: moduleId });
};

exports.getPendingApprovals = async () => {
  return ProgressModel.find({ status: 'pending_approval' })
    .populate('user', 'firstName lastName telegramId username') // Assuming User model has these fields
    .populate('module', 'title order');
};

exports.getLastCompletedModuleOrder = async (userId) => {
  const completedProgress = await ProgressModel.find({ 
    user: userId, 
    status: { $in: ['completed', 'approved'] } 
  })
  .populate('module', 'order')
  .sort({ 'module.order': -1 })
  .limit(1);

  if (!completedProgress.length || !completedProgress[0].module) {
    return 0; // No modules completed
  }
  return completedProgress[0].module.order;
};

exports.getById = async (id) => {
    return ProgressModel.findById(id).populate('user').populate('module');
}
