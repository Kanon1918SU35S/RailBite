const mongoose = require('mongoose');

const menuSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String, default: '' },
    price: { type: Number, required: true },
    section: {
      type: String,
      required: true,
      enum: ['breakfast', 'lunch', 'dinner', 'snacksanddrinks']
    },
    category: {
      type: String,
      default: 'general',
      enum: ['burger', 'pizza', 'shwarma', 'smoothie', 'beverage', 'general']
    },
    image: { type: String, default: '' },
    available: { type: Boolean, default: true },
    // Dietary & Nutrition Info
    dietaryType: {
      type: String,
      enum: ['veg', 'non-veg', 'vegan', 'egg'],
      default: 'non-veg'
    },
    allergens: {
      type: [String],
      enum: ['nuts', 'gluten', 'dairy', 'eggs', 'soy', 'shellfish', 'fish', 'wheat', 'none'],
      default: []
    },
    calories: { type: Number, default: 0 },
    preparationTime: { type: Number, default: 15 }, // minutes
    isSpicy: { type: Boolean, default: false },
    isPopular: { type: Boolean, default: false },
    ingredients: { type: [String], default: [] }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Menu', menuSchema);
