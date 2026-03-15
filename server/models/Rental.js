const mongoose = require('mongoose');

const rentalItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  productName: String,
  productImage: String,
  quantity: {
    type: Number,
    default: 1
  },
  monthlyRent: Number,
  tenureMonths: Number,
  totalRent: Number,
  securityDeposit: Number
});

const rentalSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order'
  },
  items: [rentalItemSchema],
  rentalStartDate: {
    type: Date,
    required: true
  },
  rentalEndDate: {
    type: Date,
    required: true
  },
  currentPeriodStart: {
    type: Date
  },
  currentPeriodEnd: {
    type: Date
  },
  status: {
    type: String,
    enum: ['pending', 'active', 'extended', 'returning', 'returned', 'cancelled', 'expired'],
    default: 'pending'
  },
  deliveryAddress: {
    street: String,
    city: String,
    state: String,
    pincode: String,
    landmark: String
  },
  deliveryDate: {
    type: Date
  },
  pickupDate: {
    type: Date
  },
  pickupScheduled: {
    type: Boolean,
    default: false
  },
  pickupDateTime: {
    type: Date
  },
  deliveryType: {
    type: String,
    enum: ['door', 'pickup'],
    default: 'door'
  },
  subtotal: {
    type: Number,
    required: true
  },
  securityDeposit: {
    type: Number,
    default: 0
  },
  deliveryCharge: {
    type: Number,
    default: 0
  },
  totalPaid: {
    type: Number,
    required: true
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'partial', 'refunded'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'card', 'upi', 'netbanking', 'wallet'],
    default: 'cash'
  },
  transactionId: String,
  extensionCount: {
    type: Number,
    default: 0
  },
  lastExtensionDate: Date,
  notes: String,
  serviceArea: {
    type: String,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Calculate current period for rental
rentalSchema.methods.getCurrentPeriod = function() {
  const now = new Date();
  if (now < this.rentalStartDate) {
    return { period: 'upcoming', daysRemaining: 0 };
  }
  if (now > this.rentalEndDate) {
    return { period: 'expired', daysRemaining: 0 };
  }
  
  const daysRemaining = Math.ceil((this.rentalEndDate - now) / (1000 * 60 * 60 * 24));
  return { period: 'active', daysRemaining };
};

// Index for queries
rentalSchema.index({ user: 1, status: 1 });
rentalSchema.index({ rentalStartDate: 1, rentalEndDate: 1 });
rentalSchema.index({ status: 1 });

// Update updatedAt on save
rentalSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Rental', rentalSchema);
