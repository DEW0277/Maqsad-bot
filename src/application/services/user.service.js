const userRepo = require('../../infrastructure/repositories/user.repo');

exports.getByTelegramId = async (telegramId) => {
  return userRepo.findByTelegramId(telegramId);
};

exports.getAdminIds = () => {
  const adminIds = process.env.ADMIN_ID || '';
  return adminIds.split(',').map(id => Number(id.trim())).filter(id => !isNaN(id));
};

exports.isAdmin = (telegramId) => {
  const adminIds = this.getAdminIds();
  return adminIds.includes(telegramId);
};

exports.registerIfNotExists = async (tgUser) => {
  const telegramId = tgUser.id;

  let user = await userRepo.findByTelegramId(telegramId);

  if (!user) {
    user = await userRepo.create({
      telegramId,
      isPremium: false,
      isAdmin: false,
    });
  }

  return user;
};
