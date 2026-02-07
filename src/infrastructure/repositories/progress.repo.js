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
  .populate('module', 'order');

  if (!completedProgress.length) {
    return 0;
  }

  // Filter out any progress where module might be null (deleted modules)
  const validProgress = completedProgress.filter(p => p.module);

  if (!validProgress.length) {
    return 0;
  }

  // Find max order in JS
  const maxOrder = Math.max(...validProgress.map(p => p.module.order));
  return maxOrder;
};

exports.update = async (id, data) => {
  return ProgressModel.findByIdAndUpdate(id, { $set: data }, { new: true });
};

exports.getReviewsByStatus = async (status) => {
  return ProgressModel.find({ status })
    .populate('user', 'firstName lastName telegramId username')
    .populate('module', 'title order');
};

exports.getById = async (id) => {
    return ProgressModel.findById(id).populate('user').populate('module');
}
