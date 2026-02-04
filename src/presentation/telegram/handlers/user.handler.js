const userService = require('../../../application/services/user.service');
const courseService = require('../../../application/services/course.service');
const lessonService = require('../../../application/services/lesson.service');
const progressService = require('../../../application/services/progress.service'); // Added
const progressRepo = require('../../../infrastructure/repositories/progress.repo'); // Added for checking status
const COURSE_TYPE = require('../../../domain/enums/course-type');
const sessionRepo = require('../../../infrastructure/redis/session.repo');

const STEPS = {
  MAIN: 'MAIN',
  MODULES: 'MODULES',
  FEEDBACK: 'FEEDBACK', // New step
};

module.exports = (bot) => {
  // 1️⃣ /start
  bot.onText(/\/start/, async (msg) => {
    const chatId = msg.chat.id;
    await userService.registerIfNotExists(msg.from);

    // Reset session
    await sessionRepo.setSession(`user_menu:${chatId}`, { step: STEPS.MAIN, moduleMap: {} });

    // Admin check
    const isAdmin = userService.isAdmin(msg.from.id);
    const keyboard = [['🆓 Tekin kurs'], ['💎 Premium kurs'], ['📞 Yordam']];
    if (isAdmin) {
        keyboard.push(['/admin']);
    }

    bot.sendMessage(chatId, '📚 Kurs tanlang:', {
      reply_markup: {
        keyboard,
        resize_keyboard: true,
      },
    });
  });

  // 2️⃣ BARCHA MESSAGE'LAR SHU YERDAN O‘TADI
  bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;

    // /start ni qayta ushlamaslik uchun
    if (text === '/start') return;
    
    // /admin ni qayta ushlamaslik (admin.handler.js hal qiladi)
    if (text === '/admin') return;

    // user faqat o‘qiladi (yaratilmaydi!)
    const user = await userService.getByTelegramId(msg.from.id);
    if (!user) return;

    // Get or create session
    const sessionKey = `user_menu:${chatId}`;
    let session = await sessionRepo.getSession(sessionKey);
    console.log(`[DEBUG] Msg: ${text}, Session Step: ${session ? session.step : 'NONE'}`);

    if (!session) {
      session = { step: STEPS.MAIN, moduleMap: {} };
      await sessionRepo.setSession(sessionKey, session);
    }

    // 🔙 ORQAGA TUGMASI LOGIKASI
    if (text === '⬅️ Orqaga') {
      const isAdmin = userService.isAdmin(msg.from.id);
      const keyboard = [['🆓 Tekin kurs'], ['💎 Premium kurs'], ['📞 Yordam']];
      if (isAdmin) keyboard.push(['/admin']);

      if (session.step === STEPS.MODULES || session.step === STEPS.FEEDBACK) {
        session.step = STEPS.MAIN;
        session.moduleMap = {}; // Clear map
        session.currentModuleId = null; // Clear current module
        await sessionRepo.setSession(sessionKey, session);

        return bot.sendMessage(chatId, '📚 Asosiy menyu:', {
          reply_markup: {
            keyboard,
            resize_keyboard: true,
          },
        });
      }
      
      // Agar boshqa holatda bo'lsa ham default Bosh menyuga qaytarish
      session.step = STEPS.MAIN;
      await sessionRepo.setSession(sessionKey, session);

      return bot.sendMessage(chatId, '📚 Asosiy menyu:', {
        reply_markup: {
          keyboard,
          resize_keyboard: true,
        },
      });
    }

    // 🆓 Tekin kurs bosildi
    if (text === '🆓 Tekin kurs') {
      const modules = await courseService.getModulesForUser(
        user,
        COURSE_TYPE.FREE
      );

      if (!modules.length) {
        return bot.sendMessage(chatId, 'Hozircha modul yo‘q');
      }
      
      const keyboard = [];
      const newModuleMap = {};
      
      modules.forEach((mod, index) => {
        const key = index + 1;
        newModuleMap[key] = mod._id;
        keyboard.push([`${key}️⃣ ${mod.title}`]);
      });

      // Add Back button
      keyboard.push(['⬅️ Orqaga']);

      // Update session
      session.step = STEPS.MODULES;
      session.moduleMap = newModuleMap;
      await sessionRepo.setSession(sessionKey, session);

      bot.sendMessage(chatId, '📦 Modullar (Tekin):', {
        reply_markup: {
          keyboard,
          resize_keyboard: true,
        },
      });
      return;
    }

    // 💎 Premium kurs bosildi
    if (text === '💎 Premium kurs') {
      // ❌ Agar premium bo‘lmasa — to‘lov chiqaramiz (Admin bundan mustasno)
      const isAdmin = userService.isAdmin(chatId);
      if (!user.isPremium && !isAdmin) {
        const payUrl = `${process.env.BASE_URL}/click/pay?userId=${user.telegramId}`;

        // Ensure session stays contextually relevant
        return bot.sendMessage(
          chatId,
          `🚀 **Premium Kursning Afzalliklari:**

✅ <b>Shohruh Karimovdan shaxsiy feedback:</b> Sizning maqsadlaringizni to'g'irlash uchun maxsus tahlil.
✅ <b>Yopiq hamjamiyat:</b> Faqat o'z oldiga katta maqsad qo'ygan insonlar bilan birga bo'ling.
✅ <b>Qo'shimcha materiallar:</b> Chuqurlashtirilgan darslar va amaliy mashg'ulotlar.

💰 <b>Narxi:</b> 100,000 so'm (Bir martalik to'lov)

To'lov qilib, darhol qo'shiling! 👇`,
          {
            parse_mode: 'HTML',
            reply_markup: {
              inline_keyboard: [
                  [{ text: '💳 Sotib olish (Click/Payme)', url: payUrl }],
                  // [{ text: '⬅️ Orqaga', callback_data: 'back_to_main' }] // Inline back might be tricky with text menu, keep it simple
              ],
            },
          }
        );
      }

      // ✅ Agar premium bo‘lsa — modullarni chiqaramiz
      const modules = await courseService.getModulesForUser(
        user,
        COURSE_TYPE.PREMIUM
      );

      if (!modules.length) {
        return bot.sendMessage(chatId, 'Hozircha modul yo‘q');
      }

      const keyboard = [];
      const newModuleMap = {};

      modules.forEach((mod, index) => {
        const key = index + 1;
        newModuleMap[key] = mod._id;
        keyboard.push([`${key}️⃣ ${mod.title}`]);
      });

      // Add Back button
      keyboard.push(['⬅️ Orqaga']);

      // Update session
      session.step = STEPS.MODULES;
      session.moduleMap = newModuleMap;
      await sessionRepo.setSession(sessionKey, session);

      return bot.sendMessage(chatId, '💎 Premium modullar:', {
        reply_markup: {
          keyboard,
          resize_keyboard: true,
        },
      });
    }

    // 📘 MODUL BOSILDI
    if (/^\d️⃣/.test(text) && session.step === STEPS.MODULES) {
      const index = parseInt(text[0]);
      const moduleId = session.moduleMap[index];

      if (!moduleId) {
        // Agar eski tugma bosilgan bo'lsa yoki noto'g'ri bo'lsa
        return bot.sendMessage(chatId, '❌ Noto‘g‘ri buyruq yoki sessiya eskirgan. Iltimos, qaytadan tanlang.');
      }

      const lessons = await lessonService.getLessonsByModule(moduleId);

      // Check module progress
      const progress = await progressRepo.getByUserAndModule(user._id, moduleId);
      const isCompleted = progress && (progress.status === 'completed' || progress.status === 'approved');

      if (!lessons.length) {
        return bot.sendMessage(chatId, 'Hozircha dars yo‘q');
      }

      for (const lesson of lessons) {
        try {
          if (lesson.type === 'text') {
            await bot.sendMessage(chatId, lesson.content);
          }

          if (lesson.type === 'video') {
            await bot.sendVideo(chatId, lesson.content);
          }

          if (lesson.type === 'file') {
            await bot.sendDocument(chatId, lesson.content);
          }
        } catch (err) {
            console.error(`Error sending lesson: ${err.message}`);
            await bot.sendMessage(chatId, `⚠️ Xatolik darsni yuborishda: ${lesson.title}`);
        }
      }

      // AFTER LESSONS: Check if we need feedback
      if (!isCompleted && (!progress || progress.status !== 'pending_approval')) {
        session.step = STEPS.FEEDBACK;
        session.currentModuleId = moduleId;
        session.currentModuleTitle = text; // Just for context if needed
        await sessionRepo.setSession(sessionKey, session);

        return bot.sendMessage(
            chatId, 
            '🎉 Modulni tugatdingiz!\n\nKeyingi modulni ochish uchun bu modul haqida fikringizni yozib qoldiring. Bu juda muhim!'
        );
      } else if (progress && progress.status === 'pending_approval') {
          return bot.sendMessage(chatId, '⏳ Sizning fikringiz admin tomonidan ko‘rib chiqilmoqda. Iltimos, kuting.');
      }
      
      return;
    }

    // 📝 FEEDBACK step
    if (session.step === STEPS.FEEDBACK) {
        console.log('[DEBUG] Entering FEEDBACK Staring...');
        const moduleId = session.currentModuleId;
        console.log(`[DEBUG] Feedback Step - ModuleID: ${moduleId}`);
        
        if (!moduleId) {
             console.log('[DEBUG] Missing Module ID in session, resetting.');
             session.step = STEPS.MAIN; // Reset safety
             await sessionRepo.setSession(sessionKey, session);
             return bot.sendMessage(chatId, '❌ Xatolik yuz berdi. Iltimos, qaytadan boshlang.');
        }

        bot.sendMessage(chatId, '🤖 Fikringiz sun\'iy intellekt tomonidan tahlil qilinmoqda...');

        try {
            // Submit feedback
            // Need module Title separately or just fetch it inside service? Service handles it if we pass title or fetches it. 
            // processService.submitFeedback expects (userId, moduleId, feedback, moduleTitle)
            // Let's pass a placeholder title or fetch it. The service needs it for AI prompt.
            // Let's fetch module actually to be safe.
            const modules = session.moduleMap; // wait, moduleMap stores ID.
            // We can just pass text, and service can fetch module if needed. 
            // Or we assume `text` user sent previously was title? No, user sent digit.
            // Let's rely on progressService to fetch Module title if needed or we pass "Unknown Module".
            // Actually, let's update submitFeedback to fetch module title if not passed, or just pass empty string.
            // Wait, I implemented submitFeedback taking moduleTitle.
            // Let's fix loop: get module from DB? Or just trust it.
            // I'll update submitFeedback to Fetch module if I didn't pass title.
            // BUT, for now, I'll just pass 'Modul' as title in prompt if I don't have it handy without a DB call.
            // Actually, I can do a quick DB call? No, let's just pass "Bu modul" for now to save complexity, or better:
            // I stored `currentModuleTitle` in session above!
             
             const { aiResult, progress } = await progressService.submitFeedback(
                 user._id, 
                 moduleId, 
                 text, 
                 session.currentModuleTitle || 'Modul'
             );

             // Reply to user
             await bot.sendMessage(chatId, `🤖 AI Tahlili:\n${aiResult.analysis}\n\n${aiResult.reply}\n\n⏳ <b>Shohruh Karimovning javobini kuting...</b>`, { parse_mode: 'HTML' });
             await bot.sendMessage(chatId, '✅ Fikringiz qabul qilindi! Admin tasdiqlagandan so‘ng keyingi modul ochiladi.');

             // Notify Admin
             const adminIds = userService.getAdminIds();
             console.log(`[DEBUG] Attempting to notify admins: ${adminIds}`);
             
             for (const adminId of adminIds) {
                 const adminMsg = `
📩 <b>Yangi Fikr!</b>
👤 <b>Student:</b> ${user.firstName} ${user.lastName || ''} (@${user.username || 'no_username'})
📦 <b>Modul:</b> ${session.currentModuleTitle || 'Unknown'}
💬 <b>Fikr:</b> ${text}
🤖 <b>AI:</b> ${aiResult.analysis}
                 `;
                 
                 await bot.sendMessage(adminId, adminMsg, {
                     parse_mode: 'HTML',
                     reply_markup: {
                         inline_keyboard: [
                             [
                                 { text: '⭐️ Yuqori', callback_data: `rate_high_${progress._id}` },
                                 { text: '⭐️ O\'rta', callback_data: `rate_medium_${progress._id}` },
                                 { text: '⭐️ Quyi', callback_data: `rate_low_${progress._id}` }
                             ],
                             [
                                 { text: '❌ Rad etish', callback_data: `reject_${progress._id}` },
                                 { text: '↩️ Javob yozish', callback_data: `reply_${user.telegramId}` }
                             ]
                         ]
                     }
                 });
             }

             // Reset step
             session.step = STEPS.MODULES; // Go back to modules menu? Or Main?
             session.currentModuleId = null; 
             await sessionRepo.setSession(sessionKey, session);
             
             // Maybe show modules again?
             // For now just stop here.

        } catch (err) {
            console.error("Feedback Error:", err);
            bot.sendMessage(chatId, '⚠️ Xatolik yuz berdi. Iltimos keyinroq urinib ko‘ring.');
        }
    }

    // 📞 Yordam
    if (text === '📞 Yordam') {
        return bot.sendMessage(chatId, `📞 <b>Qo'llab-quvvatlash markazi:</b>

Savollaringiz yoki muammolaringiz bo'lsa, @AdminUser ga murojaat qiling.
Biz sizga yordam berishdan xursandmiz! 😊`, { parse_mode: 'HTML' });
    }
  });
};
