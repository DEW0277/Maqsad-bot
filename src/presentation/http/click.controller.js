const crypto = require('crypto');
const UserModel = require('../../infrastructure/db/models/User.model');

exports.pay = async (req, res) => {
  const { userId } = req.query;

  const clickUrl =
    `https://my.click.uz/services/pay?` +
    `service_id=${process.env.CLICK_SERVICE_ID}` +
    `&merchant_id=${process.env.CLICK_MERCHANT_ID}` +
    `&amount=${process.env.CLICK_PRICE}` +
    `&merchant_trans_id=${userId}`;

  res.redirect(clickUrl);
  
};

exports.webhook = async (req, res) => {
  const { merchant_trans_id, sign_time, sign_string, status } = req.body;

  const expectedSign = crypto
    .createHash('md5')
    .update(merchant_trans_id + sign_time + process.env.CLICK_SECRET_KEY)
    .digest('hex');

  if (expectedSign !== sign_string) {
    return res.status(403).send('SIGN ERROR');
  }

  if (status === 'success') {
    await UserModel.updateOne(
      { telegramId: merchant_trans_id },
      { isPremium: true }
    );
  }

  res.send('OK');
};
