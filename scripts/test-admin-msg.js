require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');

const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: false });
const adminId = process.env.ADMIN_ID;

console.log('Bot Token:', process.env.BOT_TOKEN ? 'Present' : 'Missing');
console.log('Admin ID:', adminId);

if (!adminId) {
  console.error('❌ ADMIN_ID is missing in .env');
  process.exit(1);
}

bot.sendMessage(adminId, '🔔 Test notification from Debug Script')
  .then(() => {
    console.log('✅ Message sent to Admin successfully');
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ Failed to send message:', err.message);
    if (err.message.includes('chat not found')) {
        console.error('👉 Suggestion: Admin needs to start the bot first (click /start).');
    }
    process.exit(1);
  });
