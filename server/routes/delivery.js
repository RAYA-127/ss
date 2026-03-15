const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Delivery = require('../models/Delivery');
const Rental = require('../models/Rental');
const Order = require('../models/Order');
const { protect, authorize } = require('../middleware/auth');

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

// @route   GET /api/delivery
// @desc    Get user's deliveries
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const { type, status } = req.query;
    
    let query = { user: req.user.id };
    if (type) query.type = type;
    if (status) query.status = status;

    const deliveries = await Delivery.find(query)
      .sort({ scheduledDate: -1 })
      .populate('order', 'orderNumber')
      .populate('items.product', 'name images');

    res.status(200).json({
      success: true,
      count: deliveries.length,
      data: deliveries
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   GET /api/delivery/:id
// @desc    Get single delivery
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const delivery = await Delivery.findById(req.params.id)
      .populate('order')
      .populate('items.product', 'name images category');

    if (!delivery) {
      return res.status(404).json({
        success: false,
        message: 'Delivery not found'
      });
    }

    // Check ownership
    if (delivery.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this delivery'
      });
    }

    res.status(200).json({
      success: true,
      data: delivery
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Admin routes
router.use(protect, authorize('admin'));

// @route   GET /api/delivery/admin/all
// @desc    Get all deliveries (admin)
// @access  Admin
router.get('/admin/all', async (req, res) => {
  try {
    const { status, type, date, page = 1, limit = 20 } = req.query;
    
    let query = {};
    if (status) query.status = status;
    if (type) query.type = type;
    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      query.scheduledDate = { $gte: startOfDay, $lte: endOfDay };
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const deliveries = await Delivery.find(query)
      .sort({ scheduledDate: 1 })
      .skip(skip)
      .limit(limitNum)
      .populate('user', 'name email phone')
      .populate('order', 'orderNumber');

    const total = await Delivery.countDocuments(query);

    res.status(200).json({
      success: true,
      count: deliveries.length,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
      data: deliveries
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   POST /api/delivery
// @desc    Create delivery schedule
// @access  Admin
router.post('/', protect, [
  body('orderId').notEmpty().withMessage('Order ID is required'),
  body('scheduledDate').isISO8601().withMessage('Valid scheduled date is required'),
  body('type').isIn(['delivery', 'pickup', 'exchange']).withMessage('Invalid delivery type')
], validate, async (req, res) => {
  try {
    const { orderId, scheduledDate, scheduledSlot, type, deliveryPerson, notes } = req.body;

    const order = await Order.findById(orderId).populate('user', 'name email phone');
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    const delivery = await Delivery.create({
      order: orderId,
      user: order.user._id,
      address: order.deliveryAddress,
      scheduledDate,
      scheduledSlot,
      type,
      deliveryPerson,
      notes,
      items: order.items.map(item => ({
        product: item.product,
        productName: item.productName,
        quantity: item.quantity,
        condition: 'new'
      }))
    });

    // Update order status
    if (type === 'delivery') {
      order.status = 'out_for_delivery';
      await order.save();
    }

    res.status(201).json({
      success: true,
      data: delivery
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   PUT /api/delivery/:id/status
// @desc    Update delivery status
// @access  Admin
router.put('/:id/status', [
  body('status').isIn(['out_for_delivery', 'in_transit', 'arrived', 'delivered', 'cancelled', 'failed'])
    .withMessage('Invalid status')
], validate, async (req, res) => {
  try {
    const { status, deliveryProof, pickupProof } = req.body;
    
    const updateData = { status };
    
    if (status === 'delivered' && deliveryProof) {
      updateData.deliveryProof = deliveryProof;
      updateData.actualDeliveryTime = new Date();
    }
    
    if (status === 'delivered' && pickupProof) {
      updateData.pickupProof = pickupProof;
    }

    const delivery = await Delivery.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).populate('user', 'name email phone');

    if (!delivery) {
      return res.status(404).json({
        success: false,
        message: 'Delivery not found'
      });
    }

    // Update order and rental status
    if (status === 'delivered') {
      await Order.findByIdAndUpdate(delivery.order, {
        status: 'delivered'
      });
      
      await Rental.findOneAndUpdate(
        { order: delivery.order },
        { status: 'active' }
      );
    }

    res.status(200).json({
      success: true,
      data: delivery
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;
