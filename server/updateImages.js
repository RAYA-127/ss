const mongoose = require('mongoose');
const dotenv = require('dotenv');

const path = require('path');
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Define image URLs based on product name patterns
const getImageForProduct = (name, category) => {
  const productName = name.toLowerCase();
  
  // Furniture images
  if (productName.includes('bed')) {
    return 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=400';
  }
  if (productName.includes('sofa') || productName.includes('couch')) {
    return 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400';
  }
  if (productName.includes('dining') || productName.includes('table')) {
    return 'https://images.unsplash.com/photo-1617806118233-18e1de247200?w=400';
  }
  if (productName.includes('desk') || productName.includes('office')) {
    return 'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=400';
  }
  if (productName.includes('chair') || productName.includes('seat')) {
    return 'https://images.unsplash.com/photo-1503602642458-232111445657?w=400';
  }
  
  // Appliance images
  if (productName.includes('tv') || productName.includes('television') || productName.includes('led')) {
    return 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=400';
  }
  if (productName.includes('refrigerator') || productName.includes('fridge') || productName.includes('freezer')) {
    return 'https://images.unsplash.com/photo-1584568694244-14fbdf83bd30?w=400';
  }
  if (productName.includes('washing') || productName.includes('washer')) {
    return 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400';
  }
  if (productName.includes('ac') || productName.includes('air condition') || productName.includes('cool')) {
    return 'https://images.unsplash.com/photo-1631545806609-e5e9b0c8b2b5?w=400';
  }
  if (productName.includes('microwave')) {
    return 'https://images.unsplash.com/photo-1574269909862-7e1d70bb8078?w=400';
  }
  if (productName.includes('oven') || productName.includes('cooker')) {
    return 'https://images.unsplash.com/photo-1585515320310-259814833e62?w=400';
  }
  if (productName.includes('fan')) {
    return 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=400';
  }
  if (productName.includes('geyser') || productName.includes('heater') || productName.includes('water heater')) {
    return 'https://images.unsplash.com/photo-1556909190-eccf4a8bf97a?w=400';
  }
  if (productName.includes('purifier') || productName.includes('filter')) {
    return 'https://images.unsplash.com/photo-1558317374-067fb5f30001?w=400';
  }
  
  // Electronics images
  if (productName.includes('laptop') || productName.includes('computer') || productName.includes('notebook')) {
    return 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=400';
  }
  if (productName.includes('phone') || productName.includes('mobile') || productName.includes('smartphone')) {
    return 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400';
  }
  if (productName.includes('tablet') || productName.includes('ipad')) {
    return 'https://images.unsplash.com/photo-1542751110-97427bbecf20?w=400';
  }
  if (productName.includes('watch') || productName.includes('wearable')) {
    return 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400';
  }
  if (productName.includes('headphone') || productName.includes('earphone') || productName.includes('earbud')) {
    return 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400';
  }
  if (productName.includes('speaker') || productName.includes('sound')) {
    return 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=400';
  }
  if (productName.includes('camera')) {
    return 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400';
  }
  if (productName.includes('router') || productName.includes('modem')) {
    return 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=400';
  }
  
  // Default images based on category
  if (category === 'furniture') {
    return 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400';
  }
  if (category === 'appliances') {
    return 'https://images.unsplash.com/photo-1584568694244-14fbdf83bd30?w=400';
  }
  if (category === 'electronics') {
    return 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=400';
  }
  if (category === 'kitchen') {
    return 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400';
  }
  if (category === 'bedroom') {
    return 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=400';
  }
  if (category === 'living') {
    return 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400';
  }
  
  // Ultimate fallback
  return 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400';
};

const updateProductImages = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const Product = require('./models/Product');
    
    // Get all products
    const products = await Product.find({});
    console.log(`\nTotal products in database: ${products.length}`);
    
    // Check which products have valid images
    const productsWithImages = products.filter(p => p.images && p.images.length > 0 && p.images[0]);
    const productsWithoutImages = products.filter(p => !p.images || p.images.length === 0 || !p.images[0]);
    
    console.log(`Products with valid images: ${productsWithImages.length}`);
    console.log(`Products missing images: ${productsWithoutImages.length}`);
    
    if (productsWithoutImages.length > 0) {
      console.log('\nProducts missing images:');
      productsWithoutImages.forEach(p => {
        console.log(`  - ${p.name} (${p.category})`);
      });
      
      // Update products without images
      console.log('\nUpdating products with appropriate images...');
      
      for (const product of productsWithoutImages) {
        const imageUrl = getImageForProduct(product.name, product.category);
        await Product.updateOne(
          { _id: product._id },
          { $set: { images: [imageUrl] } }
        );
        console.log(`  Updated: ${product.name} -> ${imageUrl}`);
      }
      
      console.log('\nAll products updated successfully!');
    } else {
      console.log('\nAll products already have images!');
    }
    
    // Verify all products now have images
    const updatedProducts = await Product.find({});
    const allHaveImages = updatedProducts.every(p => p.images && p.images.length > 0 && p.images[0]);
    
    console.log('\n--- Final Verification ---');
    console.log(`Total products: ${updatedProducts.length}`);
    console.log(`Products with images: ${updatedProducts.filter(p => p.images && p.images[0]).length}`);
    console.log(`All products have valid images: ${allHaveImages ? 'YES ✓' : 'NO ✗'}`);
    
    if (!allHaveImages) {
      console.log('\nProducts still missing images:');
      updatedProducts.filter(p => !p.images || !p.images[0]).forEach(p => {
        console.log(`  - ${p.name}`);
      });
    }
    
    // Display all products with their images
    console.log('\n--- All Products ---');
    updatedProducts.forEach(p => {
      console.log(`- ${p.name}: ${p.images && p.images[0] ? p.images[0].substring(0, 60) + '...' : 'NO IMAGE'}`);
    });
    
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('Error updating product images:', error);
    process.exit(1);
  }
};

updateProductImages();
