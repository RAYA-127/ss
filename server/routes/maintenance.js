const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Maintenance = require('../models/Maintenance');
const Rental = require('../models/Rental');
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

// @route   GET /api/maintenance
// @desc    Get user's maintenance requests
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const { status } = req.query;
    
    let query = { user: req.user.id };
    if (status) query.status = status;

    const requests = await Maintenance.find(query)
      .sort({ createdAt: -1 })
      .populate('rental', 'rentalStartDate rentalEndDate status')
      .populate('product', 'name images category');

    res.status(200).json({
      success: true,
      count: requests.length,
      data: requests
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   GET /api/maintenance/:id
// @desc    Get single maintenance request
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const request = await Maintenance.findById(req.params.id)
      .populate('rental')
      .populate('product', 'name images category specifications')
      .populate('assignedTo', 'name email phone');

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Maintenance request not found'
      });
    }

    // Check ownership
    if (request.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this request'
      });
    }

    res.status(200).json({
      success: true,
      data: request
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   POST /api/maintenance
// @desc    Create maintenance request
// @access  Private
router.post('/', protect, [
  body('rentalId').notEmpty().withMessage('Rental ID is required'),
  body('issueType').isIn(['repair', 'replacement', 'maintenance', 'damaged', 'technical_issue', 'other'])
    .withMessage('Invalid issue type'),
  body('description').trim().notEmpty().withMessage('Description is required')
], validate, async (req, res) => {
  try {
    const { rentalId, issueType, description, images, priority } = req.body;

    // Verify rental belongs to user
    const rental = await Rental.findOne({
      _id: rentalId,
      user: req.user.id,
      status: { $in: ['active', 'extended'] }
    });

    if (!rental) {
      return res.status(404).json({
        success: false,
        message: 'Active rental not found'
      });
    }

    // Get the product from the rental
    const product = rental.items[0]?.product;

    const request = await Maintenance.create({
      user: req.user.id,
      rental: rentalId,
      product,
      issueType,
      description,
      images,
      priority: priority || 'medium'
    });

    res.status(201).json({
      success: true,
      data: request
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   POST /api/maintenance/:id/feedback
// @desc    Submit feedback for maintenance request
// @access  Private
router.post('/:id/feedback', protect, [
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('comment').optional().trim()
], validate, async (req, res) => {
  try {
    const request = await Maintenance.findOne({
      _id: req.params.id,
      user: req.user.id,
      status: 'resolved'
    });

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Resolved maintenance request not found'
      });
    }

    request.feedback = {
      rating: req.body.rating,
      comment: req.body.comment
    };
    await request.save();

    res.status(200).json({
      success: true,
      data: request
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

// @route   GET /api/maintenance/admin/all
// @desc    Get all maintenance requests (admin)
// @access  Admin
router.get('/admin/all', async (req, res) => {
  try {
    const { status, priority, page = 1, limit = 20 } = req.query;
    
    let query = {};
    if (status) query.status = status;
    if (priority) query.priority = priority;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const requests = await Maintenance.find(query)
      .sort({ priority: -1, createdAt: 1 })
      .skip(skip)
      .limit(limitNum)
      .populate('user', 'name email phone')
      .populate('rental', 'rentalStartDate rentalEndDate')
      .populate('product', 'name category images');

    const total = await Maintenance.countDocuments(query);

    res.status(200).json({
      success: true,
      count: requests.length,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
      data: requests
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   PUT /api/maintenance/admin/:id
// @desc    Update maintenance request (admin)
// @access  Admin
router.put('/admin/:id', [
  body('status').optional().isIn(['assigned', 'in_progress', 'resolved', 'cancelled', 'rejected']),
  body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']),
  body('assignedTo').optional(),
  body('scheduledDate').optional().isISO8601(),
  body('estimatedCost').optional().isNumeric(),
  body('actualCost').optional().isNumeric(),
  body('resolution').optional().trim()
], validate, async (req, res) => {
  try {
    const updateData = { ...req.body };
    
    if (req.body.status === 'resolved') {
      updateData.completedDate = new Date();
    }
    if (req.body.status === 'assigned' && req.body.assignedTo) {
      updateData.assignedDate = new Date();
    }

    const request = await Maintenance.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    )
    .populate('user', 'name email phone')
    .populate('product', 'name category')
    .populate('assignedTo', 'name email');

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Maintenance request not found'
      });
    }

    res.status(200).json({
      success: true,
      data: request
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;
