# 📊 Maqsad-bot Loyihasi - To'liq Tahlil

## 🎯 Loyiha Maqsadi
**Maqsad-bot** - Telegram orqali kurslar va darslarni taqdim etuvchi bot. Foydalanuvchilar bepul va premium kurslarni ko'rishlari, Click orqali to'lov qilishlari mumkin.

---

## 🏗️ Arxitektura

### **Clean Architecture Pattern**
Loyiha 3 qatlamli arxitekturaga ega:

```
src/
├── domain/          # Business logic (enums, constants)
├── application/     # Use cases (services)
├── infrastructure/  # External concerns (DB, Redis, Repositories)
└── presentation/    # User interface (Telegram handlers, HTTP controllers)
```

### **Qatlamlar Tafsiloti:**

#### 1. **Domain Layer** (`domain/`)
- **Maqsad**: Business logic va domain modellari
- **Fayllar**:
  - `enums/course-type.js` - Kurs turlari (FREE, PREMIUM)

#### 2. **Application Layer** (`application/services/`)
- **Maqsad**: Business logic va use case'lar
- **Servislar**:
  - `user.service.js` - Foydalanuvchi operatsiyalari
  - `course.service.js` - Kurs operatsiyalari
  - `lesson.service.js` - Dars operatsiyalari

#### 3. **Infrastructure Layer** (`infrastructure/`)
- **Maqsad**: Tashqi resurslar bilan ishlash
- **Komponentlar**:
  - `db/models/` - MongoDB modellari (User, Module, Lesson)
  - `db/repositories/` - Data access layer
  - `redis/` - Session management

#### 4. **Presentation Layer** (`presentation/`)
- **Maqsad**: User interface
- **Komponentlar**:
  - `telegram/handlers/` - Bot handlerlari
  - `http/` - Click to'lov integratsiyasi

---

## 📦 Texnologiyalar

### **Asosiy Kutubxonalar:**
- **node-telegram-bot-api** (v0.67.0) - Telegram bot API
- **mongoose** (v9.1.2) - MongoDB ODM
- **redis** (v5.10.0) - Session storage
- **express** (v5.2.1) - HTTP server (Click webhook uchun)
- **dotenv** (v17.2.3) - Environment variables

### **Development Tools:**
- **nodemon** (v3.1.11) - Auto-reload

---

## 🗄️ Ma'lumotlar Bazasi Strukturasi

### **1. User Model**
```javascript
{
  telegramId: Number (unique, required),
  isPremium: Boolean (default: false),
  isAdmin: Boolean (default: false)
}
```

### **2. Module Model**
```javascript
{
  courseType: String (enum: ["free", "premium"], required),
  title: String (required)
}
```

### **3. Lesson Model**
```javascript
{
  moduleId: ObjectId (ref: Module, required),
  type: String (enum: ["text", "video", "file"], required),
  content: String (required) // file_id yoki text content
}
```

---

## 🔄 Asosiy Funksionallik

### **1. Foydalanuvchi Funksiyalari** (`user.handler.js`)

#### **/start** - Botni ishga tushirish
- Foydalanuvchini ro'yxatdan o'tkazadi (agar yo'q bo'lsa)
- Session'ni reset qiladi
- Asosiy menyuni ko'rsatadi:
  - 🆓 Tekin kurs
  - 💎 Premium kurs
  - /admin (faqat admin uchun)

#### **Kurs Tanlash**
- **Tekin kurs**: Barcha foydalanuvchilar uchun ochiq
- **Premium kurs**: 
  - Agar `isPremium = false` bo'lsa → Click to'lov linki
  - Agar `isPremium = true` bo'lsa → Premium modullar ro'yxati

#### **Modul Tanlash**
- Modullar raqamlar bilan ko'rsatiladi (1️⃣, 2️⃣, ...)
- Session'da `moduleMap` orqali mapping saqlanadi
- Modul tanlanganda → darslar ketma-ket yuboriladi

#### **Darslar**
- **Text** - Oddiy matn
- **Video** - Telegram video file_id
- **File** - Telegram document file_id

#### **⬅️ Orqaga** - Navigation
- Session step'larini boshqaradi
- Asosiy menyuga qaytish

### **2. Admin Funksiyalari** (`admin.handler.js`)

#### **/admin** - Admin panel
- Faqat `ADMIN_ID` ga teng bo'lgan foydalanuvchilar kirishi mumkin

#### **➕ Modul qo'shish**
1. Kurs turini tanlash (🆓 Tekin / 💎 Premium)
2. Modul nomini kiritish
3. MongoDB'ga saqlash

#### **➕ Dars qo'shish**
1. Modul tanlash (barcha modullar ro'yxati)
2. Dars turini tanlash (📄 Text / 🎥 Video / 📎 File)
3. Kontent yuborish:
   - Text → oddiy matn
   - Video → Telegram video
   - File → Telegram document
4. MongoDB'ga saqlash

### **3. To'lov Integratsiyasi** (`click.controller.js`)

#### **GET /click/pay**
- Click to'lov sahifasiga redirect qiladi
- Parametrlar:
  - `service_id` - Click service ID
  - `merchant_id` - Click merchant ID
  - `amount` - To'lov summasi
  - `merchant_trans_id` - Foydalanuvchi telegram ID

#### **POST /click/webhook**
- Click'dan to'lov natijasi
- **Security**: MD5 hash tekshiruvi (`sign_string`)
- Agar `status === 'success'` bo'lsa:
  - Foydalanuvchining `isPremium = true` qilinadi

---

## 💾 Session Management

### **Redis Session Storage**
- **Key format**: `user_menu:{chatId}` yoki `admin_menu:{chatId}`
- **Expiration**: 24 soat
- **Fallback**: Redis ulanmasa, in-memory Map ishlatiladi

### **Session Strukturasi:**

#### **User Session:**
```javascript
{
  step: 'MAIN' | 'MODULES',
  moduleMap: { '1': ObjectId, '2': ObjectId, ... }
}
```

#### **Admin Session:**
```javascript
{
  step: 'MAIN' | 'CHOOSE_COURSE' | 'ENTER_MODULE_TITLE' | 
        'CHOOSE_MODULE' | 'CHOOSE_LESSON_TYPE' | 'SEND_CONTENT',
  courseType: 'free' | 'premium',
  moduleId: ObjectId,
  lessonType: 'text' | 'video' | 'file',
  modulesMap: { '1': ObjectId, ... }
}
```

---

## 🔐 Xavfsizlik

### **1. Admin Tekshiruvi**
- `user.service.isAdmin()` - Telegram ID ni `ADMIN_ID` bilan solishtiradi
- Admin handler'lar faqat admin uchun ishlaydi

### **2. Click Webhook Xavfsizligi**
- MD5 hash tekshiruvi:
  ```javascript
  MD5(merchant_trans_id + sign_time + CLICK_SECRET_KEY)
  ```
- Hash mos kelmasa → 403 Forbidden

### **3. Premium Tekshiruvi**
- `course.service.getModulesForUser()` - Premium kurslar uchun `isPremium` tekshiradi
- Premium bo'lmagan foydalanuvchilar uchun to'lov linki

---

## ⚙️ Konfiguratsiya

### **Environment Variables (kerakli):**
```env
BOT_TOKEN=              # Telegram bot token
MONGO_URI=              # MongoDB connection string
REDIS_URL=              # Redis connection string (optional)
ADMIN_ID=               # Admin Telegram ID
BASE_URL=               # Server base URL (Click redirect uchun)
CLICK_SERVICE_ID=       # Click service ID
CLICK_MERCHANT_ID=      # Click merchant ID
CLICK_PRICE=            # To'lov summasi
CLICK_SECRET_KEY=       # Click webhook secret key
```

---

## 🚀 Ishga Tushirish

### **1. Dependencies o'rnatish:**
```bash
npm install
```

### **2. Environment variables sozlash:**
`.env` fayl yaratish va kerakli o'zgaruvchilarni to'ldirish

### **3. Botni ishga tushirish:**
```bash
# Production
npm start

# Development (nodemon bilan)
npm run dev
```

### **4. Bot tavsifini o'rnatish:**
```bash
node src/scripts/set-description.js
```

---

## 📊 Loyiha Statistikasi

### **Fayllar:**
- **Total files**: ~20+ fayl
- **Handlers**: 2 (user, admin)
- **Services**: 3 (user, course, lesson)
- **Repositories**: 3 (user, module, lesson)
- **Models**: 3 (User, Module, Lesson)
- **Controllers**: 1 (click)

### **Kod Sifati:**
- ✅ Clean Architecture pattern
- ✅ Separation of concerns
- ✅ Repository pattern
- ✅ Service layer
- ⚠️ Error handling - ba'zi joylarda yaxshilash kerak
- ⚠️ Validation - input validation yo'q
- ⚠️ Logging - minimal logging

---

## 🔍 Topilgan Muammolar va Takliflar

### **1. Xatoliklar:**
- ❌ **Error Handling**: Ba'zi joylarda try-catch yo'q
- ❌ **Input Validation**: Foydalanuvchi kiritgan ma'lumotlar tekshirilmaydi
- ❌ **Logging**: Tizimli logging yo'q
- ❌ **Testing**: Test fayllari yo'q

### **2. Xavfsizlik:**
- ⚠️ **Session Security**: Session key'lar oddiy formatda
- ⚠️ **Rate Limiting**: Yo'q (DDoS hujumiga ochiq)
- ⚠️ **Input Sanitization**: XSS hujumlari uchun tekshiruv yo'q

### **3. Funksionallik:**
- ⚠️ **Lesson Title**: Darslar uchun title yo'q (faqat content)
- ⚠️ **Module Ordering**: Modullar tartibda emas (MongoDB default order)
- ⚠️ **User Statistics**: Foydalanuvchi statistikasi yo'q
- ⚠️ **Payment History**: To'lov tarixi saqlanmaydi

### **4. Takliflar:**
- ✅ **Error Middleware**: Global error handler qo'shish
- ✅ **Winston/Pino**: Professional logging
- ✅ **Joi/Yup**: Input validation
- ✅ **Unit Tests**: Jest yoki Mocha
- ✅ **Lesson Title**: Darslar uchun title qo'shish
- ✅ **Module Ordering**: `order` field qo'shish
- ✅ **Payment Model**: To'lov tarixini saqlash
- ✅ **User Analytics**: Foydalanuvchi faollik statistikasi
- ✅ **Admin Dashboard**: Web dashboard qo'shish
- ✅ **Notifications**: To'lov muvaffaqiyatli bo'lganda xabar

---

## 📈 Rivojlanish Yo'nalishlari

### **Qisqa muddat (1-2 hafta):**
1. Error handling yaxshilash
2. Input validation qo'shish
3. Logging tizimini yaratish
4. Lesson title qo'shish

### **O'rta muddat (1-2 oy):**
1. Unit testlar yozish
2. Payment history model
3. Module ordering
4. Admin web dashboard

### **Uzoq muddat (3-6 oy):**
1. Analytics va reporting
2. Multi-language support
3. Advanced admin features
4. User progress tracking

---

## 🎓 Kod Namunalari

### **Service Pattern:**
```javascript
// application/services/user.service.js
exports.getByTelegramId = async (telegramId) => {
  return userRepo.findByTelegramId(telegramId);
};
```

### **Repository Pattern:**
```javascript
// infrastructure/repositories/user.repo.js
exports.findByTelegramId = (telegramId) => {
  return UserModel.findOne({ telegramId });
};
```

### **Handler Pattern:**
```javascript
// presentation/telegram/handlers/user.handler.js
module.exports = (bot) => {
  bot.onText(/\/start/, async (msg) => {
    // Handler logic
  });
};
```

---

## 📝 Xulosa

**Maqsad-bot** - yaxshi strukturalashtirilgan, Clean Architecture pattern'ga asoslangan Telegram bot loyihasi. Asosiy funksionallik ishlayapti, lekin production uchun error handling, validation, va testing qo'shish kerak.

### **Kuchli tomonlar:**
- ✅ Toza arxitektura
- ✅ Separation of concerns
- ✅ Modular kod
- ✅ Redis fallback mechanism

### **Zaif tomonlar:**
- ❌ Error handling yetarli emas
- ❌ Validation yo'q
- ❌ Testing yo'q
- ❌ Logging minimal

---

**Tahlil sanasi**: 2024
**Loyiha versiyasi**: 1.0.0
**Node.js versiyasi**: (package.json'da ko'rsatilmagan)

