const COURSE_TYPE = require('../../../domain/enums/course-type');
const userService = require('../../../application/services/user.service');
const progressRepo = require('../../../infrastructure/repositories/progress.repo');
const progressService = require('../../../application/services/progress.service');
const moduleRepo = require('../../../infrastructure/repositories/module.repo');
const lessonRepo = require('../../../infrastructure/repositories/lesson.repo');
const sessionRepo = require('../../../infrastructure/redis/session.repo');

const STEPS = {
  MAIN: 'MAIN',
  CHOOSE_COURSE: 'CHOOSE_COURSE',
  ENTER_MODULE_TITLE: 'ENTER_MODULE_TITLE',
  CHOOSE_MODULE: 'CHOOSE_MODULE',
  CHOOSE_LESSON_TYPE: 'CHOOSE_LESSON_TYPE',
  SEND_CONTENT: 'SEND_CONTENT',
  WAITING_FOR_REPLY: 'WAITING_FOR_REPLY',
  WAITING_FOR_REJECTION_REASON: 'WAITING_FOR_REJECTION_REASON',
  REVIEWS_MENU: 'REVIEWS_MENU',
};

module.exports = (bot) => {
  // Callback Query Handler (Approve / Reply)
  bot.on('callback_query', async (query) => {
      const chatId = query.message.chat.id;
      const data = query.data;

      // Validate Admin
      if (!userService.isAdmin(query.from.id)) {
          return bot.answerCallbackQuery(query.id, { text: '❌ Siz admin emassiz', show_alert: true });
      }

      // ⭐️ Rate & Approve
      if (data.startsWith('rate_')) {
          // Format: rate_high_ID, rate_medium_ID, rate_low_ID
          const parts = data.split('_'); 
          const rating = parts[1]; // high, medium, low
          const progressId = parts[2];

          try {
              // Approve with rating
              // We need to update progress repository or service to support rating update
              // For now assuming progressService.approveProgress can take options or we call repo directly.
              // Let's call repo to update rating first, then approve.
              
              await progressRepo.update(progressId, { rating });
              await progressService.approveProgress(progressId, "Admin rated: " + rating);
              
              // Notify User
              const progress = await progressRepo.getById(progressId);
              if (progress && progress.user) {
                  await bot.sendMessage(progress.user.telegramId, `🎉 TABRIKLAYMIZ! Fikringiz qabul qilindi.\n⭐️ Baho: ${rating.toUpperCase()}\n\nKeyingi modul ochildi!`);
              }

              // Update Admin Message
              await bot.editMessageText(`${query.message.text}\n\n✅ <b>TASDIQLANDI (${rating.toUpperCase()})</b>`, {
                  chat_id: chatId,
                  message_id: query.message.message_id,
                  parse_mode: 'HTML',
                  reply_markup: { inline_keyboard: [] }
              });

              await bot.answerCallbackQuery(query.id, { text: '✅ Baholandi va Tasdiqlandi' });
          } catch (e) {
              console.error(e);
              await bot.answerCallbackQuery(query.id, { text: '❌ Xatolik', show_alert: true });
          }
      }

      // ❌ Reject (Initiate)
      if (data.startsWith('reject_')) {
          const progressId = data.split('_')[1];
          
          await sessionRepo.setSession(`admin_menu:${chatId}`, { 
              step: STEPS.WAITING_FOR_REJECTION_REASON, 
              targetProgressId: progressId,
              messageIdToEdit: query.message.message_id
          });

          await bot.sendMessage(chatId, `✍️ Rad etish sababini yozing:`, {
              reply_markup: {
                  keyboard: [['⬅️ Orqaga']],
                  resize_keyboard: true
              }
          });
          
          await bot.answerCallbackQuery(query.id);
      }

      // ↩️ Reply
      if (data.startsWith('reply_')) {
          const userId = data.split('_')[1];
          
          await sessionRepo.setSession(`admin_menu:${chatId}`, { 
              step: STEPS.WAITING_FOR_REPLY, 
              targetUserId: userId 
          });

          await bot.sendMessage(chatId, `✍️ Foydalanuvchiga javob yozing:`, {
              reply_markup: {
                  keyboard: [['⬅️ Orqaga']],
                  resize_keyboard: true
              }
          });
          
          await bot.answerCallbackQuery(query.id);
      }
  });

  // Admin Main Menu Helper
  const showAdminMenu = async (chatId) => {
    await sessionRepo.setSession(`admin_menu:${chatId}`, { step: STEPS.MAIN });
    bot.sendMessage(chatId, '🧑‍💼 Admin Panel:', {
      reply_markup: {
        keyboard: [['📝 Fikrlar'], ['➕ Modul qo‘shish'], ['➕ Dars qo‘shish'], ['⬅️ Orqaga']],
        resize_keyboard: true,
      },
    });
  };

  bot.onText(/\/admin/, async (msg) => {
    if (!userService.isAdmin(msg.from.id)) {
      return bot.sendMessage(msg.chat.id, '❌ Siz admin emassiz');
    }
    await showAdminMenu(msg.chat.id);
  });

  // 📋 Pending Reviews
  // 📋 Pending Reviews (Legacy command, keeping it but logic moved to UI)
  bot.onText(/\/reviews/, async (msg) => {
      if (!userService.isAdmin(msg.from.id)) return;
      const pending = await progressRepo.getReviewsByStatus('pending_approval');
      
      if (!pending.length) {
          return bot.sendMessage(msg.chat.id, '✅ Tasdiqlash uchun yangi fikrlar yo‘q.');
      }

      for (const p of pending) {
          sendReviewMessage(bot, msg.chat.id, p);
      }
  });

  const sendReviewMessage = async (bot, chatId, p) => {
      const moduleTitle = p.module ? p.module.title : "Unknown Module";
      const userName = p.user ? (p.user.firstName || "User") : "User";
      
      let statusIcon = '⏳';
      if (p.status === 'approved') statusIcon = '✅';
      if (p.status === 'rejected') statusIcon = '❌';

      let extraInfo = '';
      if (p.status === 'approved') extraInfo = `\n⭐️ Baho: ${p.rating || 'Yo‘q'}`;
      if (p.status === 'rejected') extraInfo = `\n🚫 Sabab: ${p.rejectionReason || 'Yo‘q'}`;

      const message = `
${statusIcon} <b>Status: ${p.status.toUpperCase()}</b>
👤 <b>Student:</b> ${userName}
📦 <b>Modul:</b> ${moduleTitle}
💬 <b>Fikr:</b> ${p.userFeedback}
🤖 <b>AI:</b> ${p.aiFeedback}${extraInfo}

✅ Tasdiqlash: /approve_${p._id}
❌ Rad etish: /reject_${p._id}
      `;
      await bot.sendMessage(chatId, message, { parse_mode: 'HTML' });
  };

  // 🎁 Give Premium
  bot.onText(/\/give_premium (\d+)/, async (msg, match) => {
      if (!userService.isAdmin(msg.from.id)) return;
      const targetId = Number(match[1]);

      try {
          const user = await userService.getByTelegramId(targetId);
          if (!user) {
              return bot.sendMessage(msg.chat.id, '❌ Foydalanuvchi topilmadi');
          }

          // Direct DB update for simplicity as service might not have dedicated method yet
          // Or reuse existing service? Let's check user.repo update or similar.
          // user.service.js doesn't have update. Let's assume we can save user object or use repo.
          // We need to require userRepo at top if we want to use it directly, but let's try to add a method to userService or just use repo if available.
          // 'userService' is imported. Let's assume we need to add 'grantPremium' to service or use repo.
          // Let's modify valid code: import userRepo at top? No, dynamic require or assume it's there?
          // Easier: just update via mongoose model if possible or add method to service.
          // I'll assume valid 'user' object is Mongoose document and has .save()?
          // Yes user.service returns `userRepo.findByTelegramId` which usually returns Mongoose doc.
          
          user.isPremium = true;
          await user.save();
          
          await bot.sendMessage(msg.chat.id, `✅ Foydalanuvchi (${targetId}) Premium bo'ldi!`);
          await bot.sendMessage(targetId, `🎉 TABRIKLAYMIZ! Sizga Premium obuna sovg'a qilindi!`);
      } catch (e) {
          bot.sendMessage(msg.chat.id, '❌ Xatolik: ' + e.message);
      }
  });

  bot.on('message', async (msg) => {
    if (!userService.isAdmin(msg.from.id)) return;

    const chatId = msg.chat.id;
    const text = msg.text;
    const sessionKey = `admin_menu:${chatId}`;

    // Get or create session
    let session = await sessionRepo.getSession(sessionKey);
    if (!session) {
      session = { step: STEPS.MAIN };
      await sessionRepo.setSession(sessionKey, session);
    }

    // 🔙 GLOBAL BACK BUTTON HANDLER
    if (text === '⬅️ Orqaga') {
        const step = session.step;

        // If at top level admin commands or Main Menu -> Go to Bot Main Menu
        if (step === STEPS.MAIN) {
            // Clear admin session
            await sessionRepo.deleteSession(sessionKey);
            // Simulate /start for this user to return to user mode
            // Or just send the User Main Menu manually:
            return bot.sendMessage(chatId, '📚 Asosiy menyu:', {
                reply_markup: {
                    keyboard: [['🆓 Tekin kurs'], ['💎 Premium kurs'], ['/admin']], // Show /admin again since they are admin
                    resize_keyboard: true,
                },
            });
        }

        // If in Module Creation flow
        if (step === STEPS.CHOOSE_COURSE || step === STEPS.ENTER_MODULE_TITLE) {
            return showAdminMenu(chatId);
        }

        // If in Lesson Creation flow
        if (step === STEPS.CHOOSE_MODULE) {
            return showAdminMenu(chatId);
        }
        if (step === STEPS.CHOOSE_LESSON_TYPE) {
            // Go back to Module Selection
            // We need to re-fetch modules or just re-trigger "Dars qo'shish" logic
            // Easier: Go back to Admin Menu
            return showAdminMenu(chatId);
        }
        if (step === STEPS.SEND_CONTENT) {
             // Go back to Lesson Type
             session.step = STEPS.CHOOSE_LESSON_TYPE;
             await sessionRepo.setSession(sessionKey, session);

             return bot.sendMessage(chatId, 'Dars turini tanlang:', {
                reply_markup: {
                  keyboard: [['📄 Text'], ['🎥 Video'], ['📎 File'], ['⬅️ Orqaga']],
                  resize_keyboard: true,
                },
              });
        }
        
        // Fallback or Reviews Menu Back
        if (step === STEPS.REVIEWS_MENU) {
            return showAdminMenu(chatId);
        }

        return showAdminMenu(chatId);
    }

    // 📝 Reviews Menu Handler
    if (text === '📝 Fikrlar') {
        session.step = STEPS.REVIEWS_MENU;
        await sessionRepo.setSession(sessionKey, session);

        return bot.sendMessage(chatId, 'Fikrlar bo‘limi:', {
            reply_markup: {
                keyboard: [['⏳ Kutilmoqda'], ['✅ Tasdiqlangan'], ['❌ Rad etilgan'], ['⬅️ Orqaga']],
                resize_keyboard: true,
            },
        });
    }

    if (session.step === STEPS.REVIEWS_MENU) {
        let status = null;
        if (text === '⏳ Kutilmoqda') status = 'pending_approval';
        if (text === '✅ Tasdiqlangan') status = 'approved';
        if (text === '❌ Rad etilgan') status = 'rejected';

        if (status) {
            const reviews = await progressRepo.getReviewsByStatus(status);
            if (!reviews.length) {
                return bot.sendMessage(chatId, '📭 Bu bo‘limda fikrlar yo‘q.');
            }
            
             // Limit to last 10 for readability if there are many
            const limitedReviews = reviews.slice(-10); 

            for (const p of limitedReviews) {
                await sendReviewMessage(bot, chatId, p);
            }
            return;
        }
    }


    // ✍️ Handle Reply Input
    if (session.step === STEPS.WAITING_FOR_REPLY) {
        if (!session.targetUserId) {
            showAdminMenu(chatId);
            return;
        }

        try {
            await bot.sendMessage(session.targetUserId, `📩 <b>Admin javobi:</b>\n${text}`, { parse_mode: 'HTML' });
            await bot.sendMessage(chatId, '✅ Xabar yuborildi');
        } catch (e) {
            await bot.sendMessage(chatId, '❌ Xabar yuborilmadi (User botni bloklagan bo‘lishi mumkin)');
        }

        // Reset to Main
        session.step = STEPS.MAIN;
        session.targetUserId = null;
        await sessionRepo.setSession(sessionKey, session);
        showAdminMenu(chatId);
        return;
    }

    // ❌ Handle Rejection Reason
    if (session.step === STEPS.WAITING_FOR_REJECTION_REASON) {
        const progressId = session.targetProgressId;
        if (!progressId) {
            showAdminMenu(chatId);
            return;
        }

        try {
            // Update Progress to Rejected
            await progressRepo.update(progressId, { 
                status: 'rejected',
                rejectionReason: text 
            });

            // Notify User
            const progress = await progressRepo.getById(progressId);
            if (progress && progress.user) {
                await bot.sendMessage(progress.user.telegramId, `❌ **Fikringiz rad etildi.**\n\nSabab: ${text}\n\nIltimos, qaytadan urinib ko'ring.`);
            }

            // Update Admin Message (if we have messageId)
            if (session.messageIdToEdit) {
                 await bot.editMessageText(`❌ <b>RAD ETILDI</b>\nSabab: ${text}`, {
                  chat_id: chatId,
                  message_id: session.messageIdToEdit,
                  parse_mode: 'HTML',
                  reply_markup: { inline_keyboard: [] }
              });
            }

            await bot.sendMessage(chatId, '✅ Rad etildi va sabab yuborildi');

        } catch (e) {
            console.error(e);
            await bot.sendMessage(chatId, '❌ Xatolik yuz berdi');
        }

        // Reset
        session.step = STEPS.MAIN;
        session.targetProgressId = null;
        session.messageIdToEdit = null;
        await sessionRepo.setSession(sessionKey, session);
        showAdminMenu(chatId);
        return;
    }

    // ➕ Modul qo‘shish
    if (text === '➕ Modul qo‘shish') {
      session.step = STEPS.CHOOSE_COURSE;
      await sessionRepo.setSession(sessionKey, session);

      return bot.sendMessage(chatId, 'Qaysi kurs?', {
        reply_markup: {
          keyboard: [['🆓 Tekin'], ['💎 Premium'], ['⬅️ Orqaga']],
          resize_keyboard: true,
        },
      });
    }

    if (session.step === STEPS.CHOOSE_COURSE) {
      if (text !== '💎 Premium' && text !== '🆓 Tekin') return; // Ignore invalid inputs (except Back, handled above)
      
      session.courseType = text === '💎 Premium' ? 'premium' : 'free';
      session.step = STEPS.ENTER_MODULE_TITLE;
      await sessionRepo.setSession(sessionKey, session);

      return bot.sendMessage(chatId, 'Modul nomini kiriting:', {
          reply_markup: {
              keyboard: [['⬅️ Orqaga']], // Just Back button
              resize_keyboard: true
          }
      });
    }

    if (session.step === STEPS.ENTER_MODULE_TITLE) {
      await moduleRepo.create({
        courseType: session.courseType,
        title: text,
      });

      bot.sendMessage(chatId, '✅ Modul qo‘shildi');
      showAdminMenu(chatId);
      return;
    }

    // ➕ Dars qo‘shish
    if (text === '➕ Dars qo‘shish') {
      session.step = STEPS.CHOOSE_MODULE;

      const modules = await moduleRepo
        .findByCourseType('free')
        .then((free) =>
          moduleRepo
            .findByCourseType('premium')
            .then((premium) => [...free, ...premium])
        );

      if (!modules.length) {
        return bot.sendMessage(chatId, 'Modul yo‘q');
      }

      const keyboard = [];
      session.modulesMap = {};

      modules.forEach((mod, index) => {
        session.modulesMap[index + 1] = mod._id;
        keyboard.push([`${index + 1}️⃣ ${mod.title}`]);
      });
      
      keyboard.push(['⬅️ Orqaga']);

      await sessionRepo.setSession(sessionKey, session);

      return bot.sendMessage(chatId, 'Qaysi modulga dars qo‘shamiz?', {
        reply_markup: {
          keyboard,
          resize_keyboard: true,
        },
      });
    }

    if (session.step === STEPS.CHOOSE_MODULE && /^\d️⃣/.test(text)) {
      const index = parseInt(text[0]);
      session.moduleId = session.modulesMap[index];

      if (!session.moduleId) return;

      session.step = STEPS.CHOOSE_LESSON_TYPE;
      await sessionRepo.setSession(sessionKey, session);

      return bot.sendMessage(chatId, 'Dars turini tanlang:', {
        reply_markup: {
          keyboard: [['📄 Text'], ['🎥 Video'], ['📎 File'], ['⬅️ Orqaga']],
          resize_keyboard: true,
        },
      });
    }

    if (session.step === STEPS.CHOOSE_LESSON_TYPE) {
      if (text === '📄 Text') session.lessonType = 'text';
      if (text === '🎥 Video') session.lessonType = 'video';
      if (text === '📎 File') session.lessonType = 'file';

      if (!session.lessonType) return;

      session.step = STEPS.SEND_CONTENT;
      await sessionRepo.setSession(sessionKey, session);

      return bot.sendMessage(chatId, 'Dars kontentini yuboring (Text, Video yoki File):', {
          reply_markup: {
              keyboard: [['⬅️ Orqaga']],
              resize_keyboard: true
          }
      });
    }
    
    if (session.step === STEPS.SEND_CONTENT) {
      // Content handling...
      let content;

      if (session.lessonType === 'text') {
        content = text;
      }

      if (session.lessonType === 'video' && msg.video) {
        content = msg.video.file_id;
      }

      if (session.lessonType === 'file' && msg.document) {
        content = msg.document.file_id;
      }

      // If text message sent but video expected AND it wasn't a Cancel/Back (handled above), warn user
      // But we need to be careful not to catch '⬅️ Orqaga' here if it wasn't intercepted top-level. 
      // Top level check handles '⬅️ Orqaga'. So if we are here, it's content.

      if (!content) {
        return bot.sendMessage(chatId, '❌ Noto‘g‘ri format. Dars turiga mos kontent yuboring.');
      }

      await lessonRepo.create({
        moduleId: session.moduleId,
        type: session.lessonType,
        content,
      });

      // Clear volatile session data
      session.step = STEPS.MAIN;
      session.moduleId = null;
      session.lessonType = null;
      await sessionRepo.setSession(sessionKey, session);

      bot.sendMessage(chatId, '✅ Dars muvaffaqiyatli qo‘shildi');
      showAdminMenu(chatId);
      return;
    }
  });
};
