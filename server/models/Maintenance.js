const mongoose = require('mongoose');

const maintenanceSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  rental: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Rental',
    required: true
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  issueType: {
    type: String,
    enum: ['repair', 'replacement', 'maintenance', 'damaged', 'technical_issue', 'other'],
    required: true
  },
  description: {
    type: String,
    required: [true, 'Please describe the issue'],
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  images: [{
    type: String
  }],
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['pending', 'assigned', 'in_progress', 'resolved', 'cancelled', 'rejected'],
    default: 'pending'
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  assignedDate: {
    type: Date
  },
  scheduledDate: {
    type: Date
  },
  completedDate: {
    type: Date
  },
  resolution: {
    type: String,
    maxlength: [500, 'Resolution cannot exceed 500 characters']
  },
  resolutionImages: [{
    type: String
  }],
  feedback: {
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    comment: String
  },
  estimatedCost: {
    type: Number,
    default: 0
  },
  actualCost: {
    type: Number,
    default: 0
  },
  costApproved: {
    type: Boolean,
    default: false
  },
  notes: String,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Index for queries
maintenanceSchema.index({ user: 1, status: 1 });
maintenanceSchema.index({ rental: 1, status: 1 });
maintenanceSchema.index({ createdAt: -1 });

// Update updatedAt on save
maintenanceSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Maintenance', maintenanceSchema);
