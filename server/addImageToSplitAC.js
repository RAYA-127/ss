const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB Connected Successfully');
  } catch (error) {
    console.error('MongoDB Connection Error:', error.message);
    process.exit(1);
  }
};

// Define Product Schema inline (to avoid importing model)
const productSchema = new mongoose.Schema({
  name: String,
  images: [String]
});

const Product = mongoose.model('Product', productSchema);

// Function to add image to Split AC 1.5 Ton
const addImageToSplitAC = async () => {
  try {
    await connectDB();

    const newImageUrl = 'https://images.unsplash.com/photo-1584129235732-c286d9bfdf74?w=400';
    
    // Find the product and push the new image to the images array
    const updatedProduct = await Product.findOneAndUpdate(
      { name: { $regex: /Split AC 1.5 Ton/i } },
      { $push: { images: newImageUrl } },
      { new: true }
    );

    if (!updatedProduct) {
      console.log('Product "Split AC 1.5 Ton" not found!');
      process.exit(1);
    }

    console.log('\n========================================');
    console.log('UPDATE SUCCESSFUL');
    console.log('========================================');
    console.log('Product Name:', updatedProduct.name);
    console.log('All Image URLs:');
    updatedProduct.images.forEach((img, index) => {
      console.log(`  ${index + 1}. ${img}`);
    });
    console.log('========================================\n');

    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
};

addImageToSplitAC();
