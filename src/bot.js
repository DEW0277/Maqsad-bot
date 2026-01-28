const TelegramBot = require('node-telegram-bot-api');



const bot = new TelegramBot(process.env.BOT_TOKEN, {
  polling: true,
});

require('./presentation/telegram/handlers/user.handler')(bot);

require("./presentation/telegram/handlers/admin.handler")(bot);


module.exports = bot;
