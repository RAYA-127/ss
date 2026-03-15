const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const { sendCartNotification } = require('../utils/notifications');

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

// @route   GET /api/cart
// @desc    Get user's cart
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    let cart = await Cart.findOne({ user: req.user.id })
      .populate('items.product', 'name images rentalPrice securityDeposit availability brand category');

    if (!cart) {
      // Create empty cart
      cart = await Cart.create({ user: req.user.id, items: [] });
    }

    res.status(200).json({
      success: true,
      data: cart
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   POST /api/cart/add
// @desc    Add item to cart
// @access  Private
router.post('/add', protect, [
  body('productId').notEmpty().withMessage('Product ID is required'),
  body('quantity').optional().isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
  body('tenureMonths').isInt({ min: 1 }).withMessage('Tenure must be at least 1 month'),
  body('rentalStartDate').isISO8601().withMessage('Valid rental start date is required')
], validate, async (req, res) => {
  try {
    const { productId, quantity = 1, tenureMonths, rentalStartDate } = req.body;

    // Get product details
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    if (product.availability !== 'available') {
      return res.status(400).json({
        success: false,
        message: 'Product is not available for rent'
      });
    }

    // Calculate price based on tenure
    let monthlyPrice = product.rentalPrice.monthly;
    let totalPrice = monthlyPrice * tenureMonths;

    // Check for tenure-based pricing
    if (product.tenureOptions && product.tenureOptions.length > 0) {
      const tenureOption = product.tenureOptions.find(t => t.months === tenureMonths);
      if (tenureOption) {
        totalPrice = tenureOption.price;
        if (tenureOption.discount > 0) {
          monthlyPrice = totalPrice / tenureMonths;
        }
      }
    }

    // Calculate rental end date
    const startDate = new Date(rentalStartDate);
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + tenureMonths);

    // Find or create cart
    let cart = await Cart.findOne({ user: req.user.id });
    if (!cart) {
      cart = await Cart.create({ user: req.user.id, items: [] });
    }

    // Check if product already in cart
    const existingItemIndex = cart.items.findIndex(
      item => item.product.toString() === productId && 
              item.selectedTenure.months === tenureMonths
    );

    if (existingItemIndex > -1) {
      // Update quantity
      cart.items[existingItemIndex].quantity += quantity;
      cart.items[existingItemIndex].selectedTenure.monthlyPrice = monthlyPrice;
      cart.items[existingItemIndex].selectedTenure.totalPrice = totalPrice * cart.items[existingItemIndex].quantity;
      cart.items[existingItemIndex].rentalStartDate = startDate;
      cart.items[existingItemIndex].rentalEndDate = endDate;
    } else {
      // Add new item
      cart.items.push({
        product: productId,
        quantity,
        selectedTenure: {
          months: tenureMonths,
          monthlyPrice,
          totalPrice: totalPrice * quantity
        },
        rentalStartDate: startDate,
        rentalEndDate: endDate
      });
    }

    await cart.save();

    // Populate product details
    cart = await Cart.findById(cart._id)
      .populate('items.product', 'name images rentalPrice securityDeposit deliveryCharge brand category');

    // Send notification to admin (non-blocking)
    const user = await User.findById(req.user.id);
    sendCartNotification(product, user).catch(err => 
      console.error('Cart notification error:', err.message)
    );

    res.status(200).json({
      success: true,
      data: cart
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   PUT /api/cart/update/:itemId
// @desc    Update cart item
// @access  Private
router.put('/update/:itemId', protect, [
  body('quantity').optional().isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
  body('tenureMonths').optional().isInt({ min: 1 }).withMessage('Tenure must be at least 1 month')
], validate, async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user.id });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found'
      });
    }

    const itemIndex = cart.items.findIndex(
      item => item._id.toString() === req.params.itemId
    );

    if (itemIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Item not found in cart'
      });
    }

    // Update quantity
    if (req.body.quantity) {
      cart.items[itemIndex].quantity = req.body.quantity;
    }

    // Update tenure if provided
    if (req.body.tenureMonths) {
      const product = await Product.findById(cart.items[itemIndex].product);
      if (product) {
        let totalPrice = product.rentalPrice.monthly * req.body.tenureMonths;
        
        if (product.tenureOptions && product.tenureOptions.length > 0) {
          const tenureOption = product.tenureOptions.find(t => t.months === req.body.tenureMonths);
          if (tenureOption) {
            totalPrice = tenureOption.price;
          }
        }

        cart.items[itemIndex].selectedTenure.months = req.body.tenureMonths;
        cart.items[itemIndex].selectedTenure.monthlyPrice = totalPrice / req.body.tenureMonths;
        cart.items[itemIndex].selectedTenure.totalPrice = totalPrice * cart.items[itemIndex].quantity;
      }
    }

    await cart.save();

    const updatedCart = await Cart.findById(cart._id)
      .populate('items.product', 'name images rentalPrice securityDeposit deliveryCharge brand category');

    res.status(200).json({
      success: true,
      data: updatedCart
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   DELETE /api/cart/remove/:itemId
// @desc    Remove item from cart
// @access  Private
router.delete('/remove/:itemId', protect, async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user.id });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found'
      });
    }

    cart.items = cart.items.filter(
      item => item._id.toString() !== req.params.itemId
    );

    await cart.save();

    const updatedCart = await Cart.findById(cart._id)
      .populate('items.product', 'name images rentalPrice securityDeposit deliveryCharge brand category');

    res.status(200).json({
      success: true,
      data: updatedCart
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   DELETE /api/cart/clear
// @desc    Clear cart
// @access  Private
router.delete('/clear', protect, async (req, res) => {
  try {
    const cart = await Cart.findOneAndUpdate(
      { user: req.user.id },
      { items: [], subtotal: 0, securityDeposit: 0, deliveryCharge: 0, total: 0 },
      { new: true }
    );

    res.status(200).json({
      success: true,
      data: cart
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   PUT /api/cart/service-area
// @desc    Update service area for cart
// @access  Private
router.put('/service-area', protect, [
  body('serviceArea').trim().notEmpty().withMessage('Service area is required')
], validate, async (req, res) => {
  try {
    const cart = await Cart.findOneAndUpdate(
      { user: req.user.id },
      { serviceArea: req.body.serviceArea },
      { new: true }
    ).populate('items.product', 'name images rentalPrice securityDeposit deliveryCharge brand category');

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found'
      });
    }

    res.status(200).json({
      success: true,
      data: cart
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;
