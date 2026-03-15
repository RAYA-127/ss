const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Rental = require('../models/Rental');
const Order = require('../models/Order');
const Product = require('../models/Product');
const Cart = require('../models/Cart');
const { protect } = require('../middleware/auth');
const { sendPurchaseNotification } = require('../utils/notifications');

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

// @route   GET /api/rentals
// @desc    Get user's rentals
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    
    let query = { user: req.user.id };
    if (status) {
      query.status = status;
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const rentals = await Rental.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .populate('items.product', 'name images category');

    const total = await Rental.countDocuments(query);

    res.status(200).json({
      success: true,
      count: rentals.length,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
      data: rentals
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   GET /api/rentals/active
// @desc    Get user's active rentals
// @access  Private
router.get('/active', protect, async (req, res) => {
  try {
    const rentals = await Rental.find({
      user: req.user.id,
      status: { $in: ['active', 'extended'] }
    })
    .sort({ rentalEndDate: 1 })
    .populate('items.product', 'name images category brand');

    res.status(200).json({
      success: true,
      count: rentals.length,
      data: rentals
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   GET /api/rentals/history
// @desc    Get user's rental history
// @access  Private
router.get('/history', protect, async (req, res) => {
  try {
    const rentals = await Rental.find({
      user: req.user.id,
      status: { $in: ['returned', 'cancelled', 'expired'] }
    })
    .sort({ createdAt: -1 })
    .populate('items.product', 'name images category');

    res.status(200).json({
      success: true,
      count: rentals.length,
      data: rentals
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   GET /api/rentals/:id
// @desc    Get single rental
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const rental = await Rental.findOne({
      _id: req.params.id,
      user: req.user.id
    })
    .populate('items.product', 'name images rentalPrice specifications')
    .populate('order', 'orderNumber');

    if (!rental) {
      return res.status(404).json({
        success: false,
        message: 'Rental not found'
      });
    }

    res.status(200).json({
      success: true,
      data: rental
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   POST /api/rentals/create
// @desc    Create rental from cart
// @access  Private
router.post('/create', protect, [
  body('deliveryAddress').notEmpty().withMessage('Delivery address is required'),
  body('scheduledDeliveryDate').isISO8601().withMessage('Valid delivery date is required'),
  body('paymentMethod').isIn(['cash', 'card', 'upi', 'netbanking', 'wallet'])
    .withMessage('Invalid payment method'),
  body('deliveryType').isIn(['door', 'pickup']).withMessage('Invalid delivery type')
], validate, async (req, res) => {
  try {
    const { deliveryAddress, scheduledDeliveryDate, deliverySlot = 'anytime', deliveryType = 'door', paymentMethod, notes } = req.body;

    // Get user's cart
    const cart = await Cart.findOne({ user: req.user.id })
      .populate('items.product');

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Cart is empty'
      });
    }

    // Verify product availability
    for (const item of cart.items) {
      if (item.product.availability !== 'available') {
        return res.status(400).json({
          success: false,
          message: `${item.product.name} is not available for rent`
        });
      }
    }

    // Create order first
    const orderItems = cart.items.map(item => ({
      product: item.product._id,
      productName: item.product.name,
      productImage: item.product.images[0] || '',
      quantity: item.quantity,
      monthlyRent: item.selectedTenure.monthlyPrice,
      tenureMonths: item.selectedTenure.months,
      totalRent: item.selectedTenure.totalPrice,
      securityDeposit: item.product.securityDeposit * item.quantity
    }));

    const order = await Order.create({
      orderNumber: await Order.generateOrderNumber(),
      user: req.user.id,
      items: orderItems,
      deliveryAddress,
      scheduledDeliveryDate,
      deliverySlot,
      deliveryType,
      subtotal: cart.subtotal,
      securityDeposit: cart.securityDeposit,
      deliveryCharge: deliveryType === 'pickup' ? 0 : cart.deliveryCharge,
      total: deliveryType === 'pickup' ? cart.subtotal + cart.securityDeposit : cart.total,
      paymentMethod,
      paymentStatus: 'pending',
      rentalStartDate: cart.items[0].rentalStartDate,
      rentalEndDate: cart.items[0].rentalEndDate,
      serviceArea: cart.serviceArea,
      notes
    });

    // Create rental
    const rentalItems = cart.items.map(item => ({
      product: item.product._id,
      productName: item.product.name,
      productImage: item.product.images[0] || '',
      quantity: item.quantity,
      monthlyRent: item.selectedTenure.monthlyPrice,
      tenureMonths: item.selectedTenure.months,
      totalRent: item.selectedTenure.totalPrice,
      securityDeposit: item.product.securityDeposit * item.quantity
    }));

    const rental = await Rental.create({
      user: req.user.id,
      order: order._id,
      items: rentalItems,
      rentalStartDate: cart.items[0].rentalStartDate,
      rentalEndDate: cart.items[0].rentalEndDate,
      deliveryAddress,
      deliveryDate: scheduledDeliveryDate,
      deliveryType,
      subtotal: cart.subtotal,
      securityDeposit: cart.securityDeposit,
      deliveryCharge: deliveryType === 'pickup' ? 0 : cart.deliveryCharge,
      totalPaid: deliveryType === 'pickup' ? cart.subtotal + cart.securityDeposit : cart.total,
      paymentMethod,
      serviceArea: cart.serviceArea,
      status: 'pending'
    });

    // Update product availability
    for (const item of cart.items) {
      await Product.findByIdAndUpdate(item.product._id, {
        $inc: { availableQuantity: -item.quantity },
        availability: 'rented'
      });
    }

    // Clear cart
    await Cart.findByIdAndUpdate(cart._id, {
      items: [],
      subtotal: 0,
      securityDeposit: 0,
      deliveryCharge: 0,
      total: 0
    });

    // Update order status
    order.status = 'confirmed';
    await order.save();

    // Send notification to admin
    try {
      await sendPurchaseNotification(order, cart.items[0].product, req.user);
    } catch (err) {
      console.error('Failed to send notification:', err.message);
    }

    res.status(201).json({
      success: true,
      data: {
        rental,
        order
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   POST /api/rentals/:id/extend
// @desc    Extend rental period
// @access  Private
router.post('/:id/extend', protect, [
  body('additionalMonths').isInt({ min: 1, max: 12 }).withMessage('Additional months must be between 1 and 12')
], validate, async (req, res) => {
  try {
    const rental = await Rental.findOne({
      _id: req.params.id,
      user: req.user.id,
      status: { $in: ['active', 'extended'] }
    });

    if (!rental) {
      return res.status(404).json({
        success: false,
        message: 'Active rental not found'
      });
    }

    const { additionalMonths } = req.body;

    // Calculate additional cost (with 10% discount for extension)
    const additionalCost = rental.items.reduce((sum, item) => {
      return sum + (item.monthlyRent * additionalMonths * 0.9);
    }, 0);

    // Extend rental end date
    const newEndDate = new Date(rental.rentalEndDate);
    newEndDate.setMonth(newEndDate.getMonth() + additionalMonths);

    rental.rentalEndDate = newEndDate;
    rental.extensionCount += 1;
    rental.lastExtensionDate = new Date();
    rental.totalPaid += additionalCost;
    rental.status = 'extended';
    await rental.save();

    // Update order rental end date
    await Order.findByIdAndUpdate(rental.order, {
      rentalEndDate: newEndDate
    });

    res.status(200).json({
      success: true,
      data: rental,
      message: `Rental extended by ${additionalMonths} months`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   POST /api/rentals/:id/schedule-pickup
// @desc    Schedule pickup for rental return
// @access  Private
router.post('/:id/schedule-pickup', protect, [
  body('pickupDate').isISO8601().withMessage('Valid pickup date is required')
], validate, async (req, res) => {
  try {
    const rental = await Rental.findOne({
      _id: req.params.id,
      user: req.user.id,
      status: { $in: ['active', 'extended', 'returning'] }
    });

    if (!rental) {
      return res.status(404).json({
        success: false,
        message: 'Active rental not found'
      });
    }

    const { pickupDate } = req.body;

    rental.pickupScheduled = true;
    rental.pickupDateTime = pickupDate;
    rental.status = 'returning';
    await rental.save();

    res.status(200).json({
      success: true,
      data: rental,
      message: 'Pickup scheduled successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   POST /api/rentals/:id/cancel
// @desc    Cancel rental
// @access  Private
router.post('/:id/cancel', protect, async (req, res) => {
  try {
    const rental = await Rental.findOne({
      _id: req.params.id,
      user: req.user.id,
      status: { $in: ['pending', 'active'] }
    });

    if (!rental) {
      return res.status(404).json({
        success: false,
        message: 'Rental not found'
      });
    }

    rental.status = 'cancelled';
    await rental.save();

    // Restore product availability
    for (const item of rental.items) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { availableQuantity: item.quantity },
        availability: 'available'
      });
    }

    // Update order status
    await Order.findByIdAndUpdate(rental.order, {
      status: 'cancelled'
    });

    res.status(200).json({
      success: true,
      data: rental,
      message: 'Rental cancelled successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;
