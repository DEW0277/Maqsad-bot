require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');

// Tokenni tekshirish
if (!process.env.BOT_TOKEN) {
  console.error('❌ BOT_TOKEN topilmadi. .env faylini tekshiring.');
  process.exit(1);
}

const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: false });

const description = `🌟 Maqsad Xaritasi — Shohruh Karimov konsepti.
/start bilan boshlang.`;

const shortDescription = '🌟 Maqsad Xaritasi — Shohruh Karimov konsepti.';

async function setDescriptions() {
  try {
    // 1. "What can this bot do?" matni (Start bosishdan oldingi katta matn)
    await bot.setMyDescription({ description });
    console.log('✅ Bot tavsifi (Description) o‘rnatildi.');

    // 2. Chat ro‘yxatidagi kichik tavsif (Short Description)
    await bot.setMyShortDescription({ short_description: shortDescription });
    console.log('✅ Bot qisqa tavsifi (Short Description) o‘rnatildi.');

    console.log('🎉 Muvaffaqiyatli yakunlandi!');
  } catch (error) {
    console.error('❌ Xatolik yuz berdi:', error.response ? error.response.body : error.message);
  }
}

setDescriptions();
