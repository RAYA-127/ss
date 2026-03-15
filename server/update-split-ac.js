const mongoose = require('mongoose');

// MongoDB connection URI
const MONGODB_URI = 'mongodb://localhost:27017/rentease';

// Image URL to add
const IMAGE_URL = 'https://images.unsplash.com/photo-1584129235732-c286d9bfdf74?w=400';

async function updateSplitACImage() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Import Product model
    const Product = require('./models/Product');

    // Find the product with name containing "Split AC"
    const product = await Product.findOne({ name: { $regex: /Split AC/i } });

    if (!product) {
      console.log('Product not found with name containing "Split AC"');
      await mongoose.disconnect();
      return;
    }

    console.log('Found product:', product.name);
    console.log('Current images:', product.images);

    // Use $push to add the image URL to the images array
    await Product.updateOne(
      { name: { $regex: /Split AC/i } },
      { $push: { images: IMAGE_URL } }
    );

    console.log('Image URL added successfully');

    // Fetch the updated product to confirm
    const updatedProduct = await Product.findOne({ name: { $regex: /Split AC/i } });

    console.log('\n=== Update Confirmed ===');
    console.log('Product Name:', updatedProduct.name);
    console.log('All Image URLs:');
    updatedProduct.images.forEach((img, index) => {
      console.log(`  ${index + 1}. ${img}`);
    });

    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

// Run the function
updateSplitACImage();
