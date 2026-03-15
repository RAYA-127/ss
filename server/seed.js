const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Product = require('./models/Product');
const User = require('./models/User');

dotenv.config();

const products = [
  // Furniture
  {
    name: 'Queen Size Bed',
    description: 'Comfortable queen size bed with wooden frame and mattress included. Perfect for couples.',
    category: 'furniture',
    brand: 'SleepWell',
    images: ['https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=400'],
    rentalPrice: { monthly: 899, quarterly: 2499, yearly: 8999 },
    securityDeposit: 5000,
    tenureOptions: [
      { months: 3, price: 2499, discount: 7 },
      { months: 6, price: 4599, discount: 15 },
      { months: 12, price: 8999, discount: 17 }
    ],
    availability: 'available',
    quantity: 10,
    availableQuantity: 8,
    features: ['Queen size', 'Wooden frame', 'Comfortable mattress', 'Easy assembly'],
    isFeatured: true,
    serviceArea: 'Delhi'
  },
  {
    name: '3-Seater Sofa',
    description: 'Modern 3-seater sofa with premium fabric. Comfortable and stylish for your living room.',
    category: 'furniture',
    brand: 'HomeStyle',
    images: ['https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400'],
    rentalPrice: { monthly: 1299, quarterly: 3599, yearly: 12999 },
    securityDeposit: 8000,
    tenureOptions: [
      { months: 3, price: 3599, discount: 8 },
      { months: 6, price: 6599, discount: 15 },
      { months: 12, price: 12999, discount: 17 }
    ],
    availability: 'available',
    quantity: 5,
    availableQuantity: 4,
    features: ['3-seater', 'Premium fabric', 'Modern design', 'Comfortable cushions'],
    isFeatured: true,
    serviceArea: 'Delhi'
  },
  {
    name: 'Dining Table Set',
    description: '6-seater dining table with chairs. Perfect for family meals.',
    category: 'furniture',
    brand: 'UrbanLiving',
    images: ['https://images.unsplash.com/photo-1617806118233-18e1de247200?w=400'],
    rentalPrice: { monthly: 999, quarterly: 2799, yearly: 9999 },
    securityDeposit: 6000,
    tenureOptions: [
      { months: 3, price: 2799, discount: 7 },
      { months: 6, price: 5199, discount: 13 },
      { months: 12, price: 9999, discount: 17 }
    ],
    availability: 'available',
    quantity: 8,
    availableQuantity: 6,
    features: ['6-seater', '6 chairs', 'Wooden top', 'Modern design'],
    isFeatured: false,
    serviceArea: 'Delhi'
  },
  {
    name: 'Office Desk',
    description: 'Ergonomic office desk with drawer storage. Ideal for home office.',
    category: 'furniture',
    brand: 'WorkPro',
    images: ['https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=400'],
    rentalPrice: { monthly: 599, quarterly: 1599, yearly: 5999 },
    securityDeposit: 3500,
    tenureOptions: [
      { months: 3, price: 1599, discount: 11 },
      { months: 6, price: 2899, discount: 19 },
      { months: 12, price: 5999, discount: 17 }
    ],
    availability: 'available',
    quantity: 15,
    availableQuantity: 12,
    features: ['Ergonomic design', 'Drawer storage', 'Cable management', 'Spacious top'],
    isFeatured: false,
    serviceArea: 'Delhi'
  },
  // Appliances
  {
    name: 'LED TV 43 Inch',
    description: 'Full HD LED TV with smart features. Perfect for entertainment.',
    category: 'appliances',
    brand: 'Samsung',
    images: ['https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=400'],
    rentalPrice: { monthly: 1499, quarterly: 4199, yearly: 14999 },
    securityDeposit: 10000,
    tenureOptions: [
      { months: 3, price: 4199, discount: 7 },
      { months: 6, price: 7799, discount: 13 },
      { months: 12, price: 14999, discount: 17 }
    ],
    availability: 'available',
    quantity: 10,
    availableQuantity: 7,
    features: ['43 inch', 'Full HD', 'Smart TV', 'Multiple ports'],
    isFeatured: true,
    serviceArea: 'Delhi'
  },
  {
    name: 'Refrigerator 180L',
    description: 'Single door refrigerator with direct cool technology. Energy efficient.',
    category: 'appliances',
    brand: 'LG',
    images: ['https://images.unsplash.com/photo-1584568694244-14fbdf83bd30?w=400'],
    rentalPrice: { monthly: 799, quarterly: 2199, yearly: 7999 },
    securityDeposit: 6000,
    tenureOptions: [
      { months: 3, price: 2199, discount: 8 },
      { months: 6, price: 4099, discount: 14 },
      { months: 12, price: 7999, discount: 17 }
    ],
    availability: 'available',
    quantity: 12,
    availableQuantity: 9,
    features: ['180L capacity', 'Single door', 'Energy efficient', 'Direct cool'],
    isFeatured: true,
    serviceArea: 'Delhi'
  },
  {
    name: 'Washing Machine 6.5KG',
    description: 'Semi-automatic washing machine with multiple wash programs.',
    category: 'appliances',
    brand: 'Whirlpool',
    images: ['https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400'],
    rentalPrice: { monthly: 699, quarterly: 1899, yearly: 6999 },
    securityDeposit: 5000,
    tenureOptions: [
      { months: 3, price: 1899, discount: 10 },
      { months: 6, price: 3499, discount: 17 },
      { months: 12, price: 6999, discount: 17 }
    ],
    availability: 'available',
    quantity: 8,
    availableQuantity: 6,
    features: ['6.5KG capacity', 'Semi-automatic', 'Multiple programs', 'Gentle wash'],
    isFeatured: false,
    serviceArea: 'Delhi'
  },
  {
    name: 'Split AC 1.5 Ton',
    description: 'Inverter split AC with cool & heat function. Perfect for all seasons.',
    category: 'appliances',
    brand: 'Daikin',
    images: ['https://images.unsplash.com/photo-1631545806609-e5e9b0c8b2b5?w=400'],
    rentalPrice: { monthly: 2499, quarterly: 6999, yearly: 24999 },
    securityDeposit: 15000,
    tenureOptions: [
      { months: 3, price: 6999, discount: 7 },
      { months: 6, price: 12999, discount: 13 },
      { months: 12, price: 24999, discount: 17 }
    ],
    availability: 'available',
    quantity: 6,
    availableQuantity: 4,
    features: ['1.5 Ton', 'Inverter', 'Cool & Heat', 'Energy efficient'],
    isFeatured: true,
    serviceArea: 'Delhi'
  },
  // Electronics
  {
    name: 'Laptop Stand & Dock',
    description: 'Ergonomic laptop stand with USB hub. Enhance your productivity.',
    category: 'electronics',
    brand: 'TechGear',
    images: ['https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=400'],
    rentalPrice: { monthly: 299, quarterly: 799, yearly: 2999 },
    securityDeposit: 2000,
    tenureOptions: [
      { months: 3, price: 799, discount: 11 },
      { months: 6, price: 1499, discount: 17 },
      { months: 12, price: 2999, discount: 17 }
    ],
    availability: 'available',
    quantity: 20,
    availableQuantity: 18,
    features: ['Adjustable height', 'USB hub', 'Ergonomic design', 'Portable'],
    isFeatured: false,
    serviceArea: 'Delhi'
  },
  {
    name: 'Microwave Oven 20L',
    description: 'Compact microwave oven with multiple cooking modes.',
    category: 'appliances',
    brand: 'Panasonic',
    images: ['https://images.unsplash.com/photo-1574269909862-7e1d70bb8078?w=400'],
    rentalPrice: { monthly: 399, quarterly: 1099, yearly: 3999 },
    securityDeposit: 3000,
    tenureOptions: [
      { months: 3, price: 1099, discount: 8 },
      { months: 6, price: 1999, discount: 17 },
      { months: 12, price: 3999, discount: 17 }
    ],
    availability: 'available',
    quantity: 10,
    availableQuantity: 8,
    features: ['20L capacity', 'Multiple modes', 'Easy to use', 'Compact'],
    isFeatured: false,
    serviceArea: 'Delhi'
  }
];

const adminUser = {
  name: 'Admin User',
  email: 'admin@rentease.com',
  phone: '9999999999',
  password: 'admin123',
  role: 'admin',
  address: {
    street: '123 Admin Street',
    city: 'Delhi',
    state: 'Delhi',
    pincode: '110001'
  }
};

const seedDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing data
    await Product.deleteMany({});
    await User.deleteMany({});
    console.log('Cleared existing data');

    // Create admin user
    const admin = await User.create(adminUser);
    console.log('Admin user created:', admin.email);

    // Create products
    const createdProducts = await Product.insertMany(products);
    console.log(`Created ${createdProducts.length} products`);

    console.log('Database seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();
