const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
dns.setDefaultResultOrder('ipv4first');

const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const User = require('./models/User');
const Order = require('./models/Order');
const Menu = require('./models/Menu');
const DeliveryStaff = require('./models/DeliveryStaff');

const MONGODB_URI =
  process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/railbite';

const connectDB = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('MongoDB connected for seeding');
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  }
};

const seed = async () => {
  try {
    await connectDB();

    // Drop problematic indexes if they exist
    try {
      await mongoose.connection.collection('orders').dropIndex('orderId_1');
      console.log('Dropped orderId_1 index');
    } catch (err) {
      // Index doesn't exist, ignore
    }

    try {
      await mongoose.connection.collection('deliverystaffs').dropIndex('staffId_1');
      console.log('Dropped staffId_1 index');
    } catch (err) {
      // Index doesn't exist, ignore
    }

    // 1) Admin user
    let admin = await User.findOne({ email: 'admin@railbite.com' });

    if (!admin) {
      admin = await User.create({
        name: 'RailBite Admin',
        email: 'admin@railbite.com',
        password: 'admin123',
        role: 'admin'
      });
      console.log('Admin user created:', admin.email);
    } else {
      console.log('Admin user already exists:', admin.email);
    }

    // 2) Clear existing orders
    await Order.deleteMany({});
    console.log('Existing orders cleared');

    // 3) Sample orders
    const now = new Date();
    const today = new Date(now);
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);

    const sampleOrders = [
      {
        orderNumber: 'RB-1001',
        user: admin._id,
        items: [
          { name: 'Chicken Biryani', price: 250, quantity: 2 },
          { name: 'Coke', price: 40, quantity: 2 }
        ],
        contactInfo: {
          fullName: 'RailBite Admin',
          email: 'admin@railbite.com',
          phone: '01712345678'
        },
        orderType: 'train',
        bookingDetails: {
          trainNumber: '711',
          coachNumber: 'B',
          seatNumber: '12',
          pickupStation: 'Dhaka'
        },
        paymentMethod: 'cash',
        subtotal: 580,
        vat: 29,
        deliveryFee: 50,
        totalAmount: 659,
        status: 'delivered',
        createdAt: today,
        updatedAt: today
      },
      {
        orderNumber: 'RB-1002',
        user: admin._id,
        items: [
          { name: 'Beef Burger', price: 200, quantity: 1 },
          { name: 'Fries', price: 80, quantity: 1 }
        ],
        contactInfo: {
          fullName: 'RailBite Admin',
          email: 'admin@railbite.com',
          phone: '01712345678'
        },
        orderType: 'train',
        bookingDetails: {
          trainNumber: '712',
          coachNumber: 'A',
          seatNumber: '5',
          pickupStation: 'Chittagong'
        },
        paymentMethod: 'mobile',
        subtotal: 280,
        vat: 14,
        deliveryFee: 50,
        totalAmount: 344,
        status: 'pending',
        createdAt: today,
        updatedAt: today
      },
      {
        orderNumber: 'RB-1003',
        user: admin._id,
        items: [
          { name: 'Chicken Pizza', price: 400, quantity: 1 }
        ],
        contactInfo: {
          fullName: 'RailBite Admin',
          email: 'admin@railbite.com',
          phone: '01712345678'
        },
        orderType: 'station',
        bookingDetails: {
          trainNumber: '713',
          coachNumber: 'C',
          seatNumber: '20',
          pickupStation: 'Sylhet'
        },
        paymentMethod: 'card',
        subtotal: 400,
        vat: 20,
        deliveryFee: 50,
        totalAmount: 470,
        status: 'delivered',
        createdAt: yesterday,
        updatedAt: yesterday
      }
    ];

    await Order.insertMany(sampleOrders);
    console.log('Sample orders inserted');

    // 4) Clear and seed menu items
    await Menu.deleteMany({});
    console.log('Existing menu items cleared');

    const menuItems = [
      // ── Breakfast section ──
      { name: 'Paratha with Dim Bhuna', section: 'breakfast', category: 'general', price: 120, description: 'Flaky paratha with spiced scrambled eggs', image: '/images/paratha-dim.png', available: true },
      { name: 'Khichuri with Beef', section: 'breakfast', category: 'general', price: 180, description: 'Comfort rice and lentils with spiced beef', image: '/images/beef-khichuri.png', available: true },
      { name: 'Roti with Niramish', section: 'breakfast', category: 'general', price: 100, description: 'Whole wheat bread with mixed vegetable curry', image: '/images/roti-niramish.png', available: true },
      // Shwarma in breakfast
      { name: 'Chicken Shwarma', section: 'breakfast', category: 'shwarma', price: 80, description: 'Classic chicken wrap with garlic sauce', image: '/images/chicken-shwarma.png', available: true },
      { name: 'Beef Shwarma', section: 'breakfast', category: 'shwarma', price: 120, description: 'Spiced beef with tahini sauce', image: '/images/beef-shwarma.png', available: true },
      { name: 'Turkey Shwarma', section: 'breakfast', category: 'shwarma', price: 100, description: 'Tender turkey with fresh vegetables', image: '/images/turkey-shwarma.png', available: true },

      // ── Lunch section ──
      { name: 'Bhuna Khichuri with Chicken', section: 'lunch', category: 'general', price: 200, description: 'Rich and flavorful rice dish', image: '/images/bhuna-khichuri.png', available: true },
      { name: 'Morog Polao', section: 'lunch', category: 'general', price: 220, description: 'Chicken pulao with ghee', image: '/images/morog-polao.png', available: true },
      { name: 'Beef Kala Bhuna', section: 'lunch', category: 'general', price: 280, description: 'Slow-cooked spicy beef curry', image: '/images/beef-kalabhuna.png', available: true },
      { name: 'Fish Curry with Rice', section: 'lunch', category: 'general', price: 180, description: 'Traditional Bengali fish curry', image: '/images/fishcurry.jpg', available: true },
      // Pizza in lunch
      { name: 'Peri Peri Chicken Pizza', section: 'lunch', category: 'pizza', price: 999, description: 'Spicy chicken with peri peri sauce', image: '/images/peri-peri-pizza.png', available: true },
      { name: 'Beef Pepperoni Pizza', section: 'lunch', category: 'pizza', price: 899, description: 'Classic pepperoni with mozzarella', image: '/images/beef-pepperoni.jpg', available: true },
      { name: 'Mozzarella Cheese Mushroom Pizza', section: 'lunch', category: 'pizza', price: 799, description: 'Cheesy mushroom delight', image: '/images/mozarella-cheese.jpg', available: true },
      { name: 'Vegetable Pizza', section: 'lunch', category: 'pizza', price: 699, description: 'Fresh vegetables with herbs', image: '/images/vegetable-pizza.jpg', available: true },

      // ── Dinner section ──
      { name: 'Chicken Rezala', section: 'dinner', category: 'general', price: 250, description: 'Creamy yogurt-based chicken curry', image: '/images/chicken-rezala.png', available: true },
      { name: 'Beef Tehari', section: 'dinner', category: 'general', price: 200, description: 'Spiced beef with yellow rice', image: '/images/beef-tehari.jpg', available: true },
      // Beverage in dinner
      { name: 'Sprite', section: 'dinner', category: 'beverage', price: 50, description: 'Lemon-lime flavored soda', image: '/images/sprite.jpg', available: true },
      { name: '7Up', section: 'dinner', category: 'beverage', price: 50, description: 'Crisp lemon-lime drink', image: '/images/7up.jpg', available: true },
      { name: 'Coca Cola', section: 'dinner', category: 'beverage', price: 50, description: 'Classic cola drink', image: '/images/coca-cola.jpg', available: true },

      // ── Snacks & Drinks section ──
      // Burgers
      { name: 'Firecracker Chicken', section: 'snacksanddrinks', category: 'burger', price: 200, description: 'Spicy chicken with jalapeños', image: '/images/firecracker-chicken.png', available: true },
      { name: 'BBQ Beef Blast', section: 'snacksanddrinks', category: 'burger', price: 350, description: 'Smoky BBQ beef with crispy bacon', image: '/images/bbq-beef-blast.png', available: true },
      { name: 'The Classic King', section: 'snacksanddrinks', category: 'burger', price: 250, description: 'Double beef patty with cheese', image: '/images/classic-king.png', available: true },
      { name: 'Sunrise Burger', section: 'snacksanddrinks', category: 'burger', price: 300, description: 'Beef patty with fried egg', image: '/images/sunrise.png', available: true },
      // Pizza
      { name: 'Margherita Pizza', section: 'snacksanddrinks', category: 'pizza', price: 599, description: 'Classic tomato and mozzarella', image: '/images/vegetable-pizza.jpg', available: true },
      // Shwarma
      { name: 'Chicken Shwarma Platter', section: 'snacksanddrinks', category: 'shwarma', price: 150, description: 'Chicken shwarma with fries and drink', image: '/images/chicken-shwarma.png', available: true },
      // Smoothies
      { name: 'Mango Smoothie', section: 'snacksanddrinks', category: 'smoothie', price: 199, description: 'Fresh mango blended with yogurt', image: '/images/mango-smoothie.jpg', available: true },
      { name: 'Strawberry Smoothie', section: 'snacksanddrinks', category: 'smoothie', price: 219, description: 'Sweet strawberries with cream', image: '/images/strawberry-smoothie.jpg', available: true },
      { name: 'Mixed Fruits Smoothie', section: 'snacksanddrinks', category: 'smoothie', price: 249, description: 'Blend of tropical fruits', image: '/images/mixfruit-smoothie.jpg', available: true },
      // Beverages
      { name: 'Mirinda', section: 'snacksanddrinks', category: 'beverage', price: 50, description: 'Orange flavored soda', image: '/images/mirinda.jpg', available: true },
      { name: 'Fanta', section: 'snacksanddrinks', category: 'beverage', price: 50, description: 'Orange flavored soda', image: '/images/fanta.jpg', available: true },
      { name: 'Pepsi', section: 'snacksanddrinks', category: 'beverage', price: 50, description: 'Cola soft drink', image: '/images/pepsi.jpg', available: true },
      // General snack items
      { name: 'Jhal Muri', section: 'snacksanddrinks', category: 'general', price: 30, description: 'Spicy puffed rice mix', image: '/images/jhalmuri.png', available: true },
    ];

    await Menu.insertMany(menuItems);
    console.log('Menu items inserted');

    // 5) Clear and seed delivery staff
    await DeliveryStaff.deleteMany({});
    console.log('Existing delivery staff cleared');

    // Create delivery user accounts (for login)
    await User.deleteMany({ role: 'delivery' });
    console.log('Existing delivery users cleared');

    const deliveryUser1 = await User.create({
      name: 'Karim Ahmed',
      email: 'karim@railbite.com',
      password: 'delivery123',
      phone: '01712345678',
      role: 'delivery',
      status: 'active'
    });

    const deliveryUser2 = await User.create({
      name: 'Rahim Mia',
      email: 'rahim@railbite.com',
      password: 'delivery123',
      phone: '01812345678',
      role: 'delivery',
      status: 'active'
    });

    const deliveryUser3 = await User.create({
      name: 'Salman Khan',
      email: 'salman@railbite.com',
      password: 'delivery123',
      phone: '01912345678',
      role: 'delivery',
      status: 'active'
    });

    console.log('Delivery user accounts created');

    const deliveryStaffData = [
      { userId: deliveryUser1._id, name: 'Karim Ahmed', phone: '01712345678', status: 'available', assignedOrders: 0, completedToday: 5 },
      { userId: deliveryUser2._id, name: 'Rahim Mia', phone: '01812345678', status: 'busy', assignedOrders: 1, completedToday: 3 },
      { userId: deliveryUser3._id, name: 'Salman Khan', phone: '01912345678', status: 'available', assignedOrders: 0, completedToday: 7 }
    ];

    await DeliveryStaff.insertMany(deliveryStaffData);
    console.log('Delivery staff inserted');

    console.log('Seeding finished');
    process.exit(0);

  } catch (err) {
    console.error('Seeding error:', err);
    process.exit(1);
  }
};

seed();
