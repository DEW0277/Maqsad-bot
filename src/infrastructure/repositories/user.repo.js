const UserModel = require('../db/models/User.model');

exports.findByTelegramId = (telegramId) => {
  return UserModel.findOne({ telegramId });
};

exports.create = (data) => {
  return UserModel.create(data);
};
