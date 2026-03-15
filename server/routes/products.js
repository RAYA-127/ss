const express = require('express');
const router = express.Router();
const { body, query, validationResult } = require('express-validator');
const Product = require('../models/Product');
const { protect, optionalAuth, authorize } = require('../middleware/auth');
const { sendProductClickNotification } = require('../utils/notifications');

// Validation middleware
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }
  next();
};

// @route   GET /api/products
// @desc    Get all products with filtering and pagination
// @access  Public
router.get('/', optionalAuth, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 12,
      category,
      subCategory,
      minPrice,
      maxPrice,
      brand,
      availability,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      serviceArea
    } = req.query;

    // Build query
    let queryObj = { isActive: true };

    if (category) {
      queryObj.category = category;
    }
    if (subCategory) {
      queryObj.subCategory = subCategory;
    }
    if (brand) {
      queryObj.brand = { $regex: brand, $options: 'i' };
    }
    if (availability) {
      queryObj.availability = availability;
    }
    if (minPrice || maxPrice) {
      queryObj['rentalPrice.monthly'] = {};
      if (minPrice) queryObj['rentalPrice.monthly'].$gte = Number(minPrice);
      if (maxPrice) queryObj['rentalPrice.monthly'].$lte = Number(maxPrice);
    }
    if (search) {
      queryObj.$text = { $search: search };
    }
    if (serviceArea) {
      queryObj.serviceArea = { $in: [serviceArea, ''] };
    }

    // Sort options
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Execute query
    const products = await Product.find(queryObj)
      .sort(sortOptions)
      .skip(skip)
      .limit(limitNum)
      .populate('vendor', 'name');

    const total = await Product.countDocuments(queryObj);

    res.status(200).json({
      success: true,
      count: products.length,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
      data: products
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   GET /api/products/featured
// @desc    Get featured products
// @access  Public
router.get('/featured', async (req, res) => {
  try {
    const products = await Product.find({ 
      isActive: true, 
      isFeatured: true,
      availability: 'available'
    })
    .sort({ 'rating.average': -1 })
    .limit(8);

    res.status(200).json({
      success: true,
      count: products.length,
      data: products
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   GET /api/products/categories
// @desc    Get all categories
// @access  Public
router.get('/categories', async (req, res) => {
  try {
    const categories = await Product.distinct('category', { isActive: true });
    
    // Get category with product count
    const categoryData = await Promise.all(
      categories.map(async (cat) => {
        const count = await Product.countDocuments({ category: cat, isActive: true });
        return { name: cat, count };
      })
    );

    res.status(200).json({
      success: true,
      data: categoryData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   POST /api/products/:id/click
// @desc    Track product click and send notification
// @access  Public
router.post('/:id/click', optionalAuth, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Increment view count
    product.views = (product.views || 0) + 1;
    await product.save();

    // Send email notification to admin (non-blocking)
    const user = req.user || null;
    sendProductClickNotification(product, user).catch(err => 
      console.error('Notification error:', err.message)
    );

    res.status(200).json({
      success: true,
      message: 'Product click tracked'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   GET /api/products/brands
// @desc    Get all brands
// @access  Public
router.get('/brands', async (req, res) => {
  try {
    const brands = await Product.distinct('brand', { isActive: true });
    res.status(200).json({
      success: true,
      data: brands
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   GET /api/products/:id
// @desc    Get single product
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('vendor', 'name email phone');

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.status(200).json({
      success: true,
      data: product
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   POST /api/products
// @desc    Create product
// @access  Private (Admin/Vendor)
router.post('/', protect, authorize('admin', 'vendor'), [
  body('name').trim().notEmpty().withMessage('Product name is required'),
  body('description').trim().notEmpty().withMessage('Description is required'),
  body('category').isIn(['furniture', 'appliances', 'electronics', 'kitchen', 'bedroom', 'living'])
    .withMessage('Invalid category'),
  body('brand').trim().notEmpty().withMessage('Brand is required'),
  body('rentalPrice.monthly').isNumeric().withMessage('Monthly rent is required'),
  body('securityDeposit').isNumeric().withMessage('Security deposit is required')
], validate, async (req, res) => {
  try {
    const productData = {
      ...req.body,
      vendor: req.user.id
    };

    const product = await Product.create(productData);

    res.status(201).json({
      success: true,
      data: product
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   PUT /api/products/:id
// @desc    Update product
// @access  Private (Admin/Vendor)
router.put('/:id', protect, authorize('admin', 'vendor'), async (req, res) => {
  try {
    let product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Check ownership for vendors
    if (req.user.role === 'vendor' && product.vendor.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this product'
      });
    }

    product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      data: product
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   DELETE /api/products/:id
// @desc    Delete product
// @access  Private (Admin)
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Soft delete
    product.isActive = false;
    await product.save();

    res.status(200).json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   PUT /api/products/:id/rate
// @desc    Rate a product
// @access  Private
router.put('/:id/rate', protect, [
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5')
], validate, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    const { rating } = req.body;

    // Update rating
    const totalRating = product.rating.average * product.rating.count + rating;
    product.rating.count += 1;
    product.rating.average = totalRating / product.rating.count;

    await product.save();

    res.status(200).json({
      success: true,
      data: product.rating
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;
