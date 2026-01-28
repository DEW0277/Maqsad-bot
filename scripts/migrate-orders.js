require('dotenv').config();
const mongoose = require('mongoose');
const Module = require('../src/infrastructure/db/models/Module.model');

async function migrate() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    const modules = await Module.find({});
    console.log(`Found ${modules.length} modules to migrate.`);

    // Sort by title potentially? Or just by creation time (natural)
    // Titles have "1-modul", "2-Modul". Let's try to extract number from title or just increment.
    
    // Group by course type
    const freeModules = modules.filter(m => m.courseType === 'free');
    const premiumModules = modules.filter(m => m.courseType === 'premium');

    // Helper to assign order
    const assignOrder = async (list) => {
        // Sort list by extracting number from title if possible
        list.sort((a, b) => {
            const numA = parseInt(a.title.match(/\d+/)?.[0] || '999');
            const numB = parseInt(b.title.match(/\d+/)?.[0] || '999');
            return numA - numB;
        });

        for (let i = 0; i < list.length; i++) {
            const mod = list[i];
            const newOrder = i + 1;
            // Update directly to bypass "unique" index issues if we did it one by one?
            // But we need unique orders.
            // Let's use updateOne
            await Module.updateOne({ _id: mod._id }, { $set: { order: newOrder } });
            console.log(`Updated "${mod.title}" -> Order: ${newOrder}`);
        }
    };

    console.log('Migrating Free Modules...');
    await assignOrder(freeModules);

    console.log('Migrating Premium Modules...');
    await assignOrder(premiumModules);

    console.log('✅ Migration complete');
    process.exit(0);
  } catch (err) {
    console.error('❌ Migration Error:', err);
    process.exit(1);
  }
}

migrate();
