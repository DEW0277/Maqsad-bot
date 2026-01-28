require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/infrastructure/db/models/User.model');

async function testDB() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    console.log('Attempting to find users...');
    const users = await User.find().limit(5);
    console.log(`Found ${users.length} users:`, users);

    const Module = require('../src/infrastructure/db/models/Module.model');
    console.log('Attempting to find modules...');
    const modules = await Module.find({});
    console.log(`Found ${modules.length} modules:`, modules);


    console.log('Attempting to create a test user...');
    const testUser = await User.create({
      telegramId: 123456789,
      firstName: 'Test',
      username: 'testuser'
    });
    console.log('✅ Created user:', testUser);
    
    console.log('Clean up test user...');
    await User.deleteOne({ _id: testUser._id });
    console.log('✅ Cleaned up');

    process.exit(0);
  } catch (err) {
    console.error('❌ DB Error:', err);
    process.exit(1);
  }
}

testDB();
