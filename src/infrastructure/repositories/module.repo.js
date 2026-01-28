const ModuleModel = require('../db/models/Module.model');

exports.findByCourseType = (courseType) => {
  return ModuleModel.find({ courseType });
};

exports.create = async (data) => {
  // Auto-assign order
  if (!data.order) {
    const lastModule = await ModuleModel.findOne({ courseType: data.courseType })
                                      .sort({ order: -1 });
    data.order = lastModule && lastModule.order ? lastModule.order + 1 : 1;
  }
  return ModuleModel.create(data);
};
