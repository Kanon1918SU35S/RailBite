const Menu = require('../models/Menu');

// GET /api/menu - public
// Supports query params: ?section=breakfast&category=burger&available=true
exports.getAllMenu = async (req, res) => {
  try {
    const { section, category, available, dietaryType, allergenFree, isSpicy, isPopular } = req.query;
    const filter = {};
    if (section) filter.section = section;
    if (category) filter.category = category;
    // Public callers pass available=true; admin calls without it get all items
    if (available !== undefined) filter.available = available === 'true';
    // Dietary type filter: veg, non-veg, vegan, egg
    if (dietaryType) filter.dietaryType = dietaryType;
    // Allergen-free filter: exclude items with specific allergens
    if (allergenFree) {
      const allergensToExclude = allergenFree.split(',').map(a => a.trim());
      filter.allergens = { $nin: allergensToExclude };
    }
    // Spicy filter
    if (isSpicy !== undefined) filter.isSpicy = isSpicy === 'true';
    // Popular items filter
    if (isPopular !== undefined) filter.isPopular = isPopular === 'true';

    const items = await Menu.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, data: items });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/menu/section/:section - public (available items only)
exports.getMenuBySection = async (req, res) => {
  try {
    const items = await Menu.find({
      section: req.params.section,
      available: true
    }).sort({ createdAt: -1 });
    res.json({ success: true, data: items });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/menu/category/:category - public (available items only)
exports.getMenuByCategory = async (req, res) => {
  try {
    const filter = { category: req.params.category, available: true };
    // Optionally filter by section too: /api/menu/category/burger?section=breakfast
    if (req.query.section) filter.section = req.query.section;
    const items = await Menu.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, data: items });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/menu/:id - public
exports.getMenuItem = async (req, res) => {
  try {
    const item = await Menu.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Menu item not found' });
    }
    res.json({ success: true, data: item });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/menu - admin only
exports.createMenuItem = async (req, res) => {
  try {
    const data = { ...req.body };
    if (req.file) {
      data.image = `/uploads/menu/${req.file.filename}`;
    }
    // Ensure price is a number
    if (data.price) data.price = parseFloat(data.price);
    // Ensure available is a boolean
    if (typeof data.available === 'string') {
      data.available = data.available === 'true';
    }
    console.log('[createMenuItem] data:', JSON.stringify(data));
    const item = await Menu.create(data);
    res.status(201).json({ success: true, data: item });
  } catch (error) {
    console.error('[createMenuItem] ERROR:', error.message, error.errors ? JSON.stringify(error.errors) : '');
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/menu/:id - admin only
exports.updateMenuItem = async (req, res) => {
  try {
    const data = { ...req.body };
    if (req.file) {
      data.image = `/uploads/menu/${req.file.filename}`;
    }
    if (data.price) data.price = parseFloat(data.price);
    if (typeof data.available === 'string') {
      data.available = data.available === 'true';
    }
    const item = await Menu.findByIdAndUpdate(req.params.id, data, {
      new: true,
      runValidators: true
    });
    if (!item) {
      return res.status(404).json({ success: false, message: 'Menu item not found' });
    }
    res.json({ success: true, data: item });
  } catch (error) {
    console.error('[updateMenuItem] ERROR:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/menu/:id - admin only
exports.deleteMenuItem = async (req, res) => {
  try {
    const item = await Menu.findByIdAndDelete(req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Menu item not found' });
    }
    res.json({ success: true, message: 'Menu item deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/menu/bulk-delete - admin only
exports.bulkDeleteMenuItems = async (req, res) => {
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, message: 'Provide an array of item ids' });
    }
    const result = await Menu.deleteMany({ _id: { $in: ids } });
    res.json({ success: true, deleted: result.deletedCount, message: `${result.deletedCount} item(s) deleted` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/menu/migrate - one-time migration for old items lacking 'section'
exports.migrateMenuItems = async (req, res) => {
  try {
    // Map old category values → proper section
    const sectionMap = {
      breakfast: 'breakfast',
      lunch: 'lunch',
      dinner: 'dinner',
      snacks: 'snacksanddrinks',
      other: 'snacksanddrinks',
    };
    // These old categories were actually food-types, not sections
    const foodTypeCategories = ['burger', 'pizza', 'shwarma', 'smoothie', 'beverage', 'biryani'];

    const all = await Menu.find({});
    let migrated = 0;

    for (const item of all) {
      let needsSave = false;
      const oldCat = (item.category || '').toLowerCase();

      // If item already has a valid section, skip
      if (['breakfast', 'lunch', 'dinner', 'snacksanddrinks'].includes(item.section)) {
        continue;
      }

      // Old meal categories → section + category='general'
      if (sectionMap[oldCat]) {
        item.section = sectionMap[oldCat];
        item.category = 'general';
        needsSave = true;
      }
      // Old food-type categories → snacksanddrinks + keep category
      else if (foodTypeCategories.includes(oldCat)) {
        item.section = 'snacksanddrinks';
        item.category = oldCat === 'biryani' ? 'general' : oldCat;
        needsSave = true;
      }
      // Anything else → snacksanddrinks/general
      else {
        item.section = 'snacksanddrinks';
        item.category = 'general';
        needsSave = true;
      }

      if (needsSave) {
        await Menu.collection.updateOne(
          { _id: item._id },
          { $set: { section: item.section, category: item.category } }
        );
        migrated++;
      }
    }

    res.json({ success: true, migrated, total: all.length, message: `Migrated ${migrated} of ${all.length} item(s)` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/menu/bulk-availability - admin only
exports.bulkToggleAvailability = async (req, res) => {
  try {
    const { ids, available } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, message: 'Provide an array of item ids' });
    }
    const result = await Menu.updateMany(
      { _id: { $in: ids } },
      { $set: { available: !!available } }
    );
    const items = await Menu.find({ _id: { $in: ids } });
    res.json({ success: true, modified: result.modifiedCount, data: items, message: `${result.modifiedCount} item(s) updated` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
