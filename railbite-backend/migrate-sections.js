/**
 * One-time migration: adds `section` field to old menu items
 * that only have `category` (old schema).
 *
 * Run:  node migrate-sections.js
 */
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
dns.setDefaultResultOrder('ipv4first');

const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/railbite';

// Old category -> new section mapping
const sectionMap = {
    breakfast: 'breakfast',
    lunch: 'lunch',
    dinner: 'dinner',
    snacks: 'snacksanddrinks',
    other: 'snacksanddrinks',
};

// These old categories are food-types, not sections
const foodTypes = ['burger', 'pizza', 'shwarma', 'smoothie', 'beverage', 'biryani'];

async function migrate() {
    await mongoose.connect(URI);
    console.log('Connected to MongoDB');

    const col = mongoose.connection.collection('menus');
    const all = await col.find({}).toArray();
    let migrated = 0;

    for (const item of all) {
        // Skip items that already have a valid section
        if (
            item.section &&
            ['breakfast', 'lunch', 'dinner', 'snacksanddrinks'].includes(item.section)
        ) {
            continue;
        }

        const oldCat = (item.category || '').toLowerCase();
        let section, category;

        if (sectionMap[oldCat]) {
            // Old meal category -> section + general
            section = sectionMap[oldCat];
            category = 'general';
        } else if (foodTypes.includes(oldCat)) {
            // Old food-type category -> snacksanddrinks + keep as category
            section = 'snacksanddrinks';
            category = oldCat === 'biryani' ? 'general' : oldCat;
        } else {
            // Anything else -> snacksanddrinks/general
            section = 'snacksanddrinks';
            category = 'general';
        }

        await col.updateOne(
            { _id: item._id },
            { $set: { section, category } }
        );
        console.log(`  Migrated: "${item.name}" | ${oldCat} -> ${section}/${category}`);
        migrated++;
    }

    console.log(`\nDone. Migrated ${migrated} of ${all.length} item(s).`);
    process.exit(0);
}

migrate().catch((err) => {
    console.error('Migration failed:', err.message);
    process.exit(1);
});
