const progressRepo = require('../../infrastructure/repositories/progress.repo');
const moduleRepo = require('../../infrastructure/repositories/module.repo'); // Need to fetch module details
const aiService = require('./ai.service');

exports.submitFeedback = async (userId, moduleId, feedbackText, moduleTitle) => {
  console.log(`[DEBUG] Submitting feedback: User=${userId}, Module=${moduleId}, Text=${feedbackText}`);
  // 1. Analyze with AI
  const aiResult = await aiService.analyzeFeedback(moduleTitle, feedbackText);
  console.log(`[DEBUG] AI Result:`, aiResult);

  // 2. Save Progress
  const progressData = {
    status: 'pending_approval',
    userFeedback: feedbackText,
    aiFeedback: aiResult.analysis, // Save the analysis text
    // We could also save 'sentiment' if we added it to the model, but analysis is fine for now
  };

  const result = await progressRepo.createOrUpdateProgress(userId, moduleId, progressData);
  console.log(`[DEBUG] Progress Saved:`, result);
  return { aiResult, progress: result }; // Return both
};

exports.approveProgress = async (progressId, adminFeedback) => {
  const data = {
    status: 'approved',
    adminFeedback: adminFeedback
  };
  return progressRepo.getById(progressId).then(async (progress) => {
      if(!progress) throw new Error("Progress not found");
      return progressRepo.createOrUpdateProgress(progress.user._id, progress.module._id, data);
  })
};

exports.rejectProgress = async (progressId, adminFeedback) => {
    const data = {
      status: 'in_progress', // Reset to in_progress so they can try again? Or maybe keep it pending? 
      // Let's say we reject their feedback and make them do it again?
      // For now, let's just update status to 'rejected' or keep 'in_progress'
      // Plan said "Unlock next module", so approval is key. 
      // If rejected, maybe we just leave a comment.
      // Let's stick to simple approval for now.
      adminFeedback: adminFeedback, 
      status: 'in_progress' // User needs to submit again?
    };
    return progressRepo.getById(progressId).then(async (progress) => {
        if(!progress) throw new Error("Progress not found");
        return progressRepo.createOrUpdateProgress(progress.user._id, progress.module._id, data);
    })
  };

exports.getAvailableModules = async (userId, courseType) => {
  // 1. Get all modules of this type
  const allModules = await moduleRepo.findByCourseType(courseType);
  // Sort by order 
  allModules.sort((a, b) => a.order - b.order);

  // 2. Get last completed order
  const lastCompletedOrder = await progressRepo.getLastCompletedModuleOrder(userId);

  // 3. Filter: Show all completed/approved modules + the next one (lastCompletedOrder + 1)
  // Actually, usually we show all *previous* ones + the *current* unlocked one.
  
  const availableModules = allModules.filter(mod => {
    return mod.order <= (lastCompletedOrder + 1);
  });

  return availableModules;
};

exports.checkModuleAccess = async (userId, moduleId) => {
    // Check if user has access to this specific module
    // Retrieve module to get its order
    // This might be needed if user tries to click a button for a locked module
    // For now, relying on getAvailableModules filtering limits the buttons they see.
    return true; 
}
