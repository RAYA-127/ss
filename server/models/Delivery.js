const mongoose = require('mongoose');

const deliverySchema = new mongoose.Schema({
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true
  },
  rental: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Rental'
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  deliveryPerson: {
    name: String,
    phone: String,
    vehicle: String
  },
  address: {
    street: String,
    city: String,
    state: String,
    pincode: String,
    landmark: String
  },
  scheduledDate: {
    type: Date,
    required: true
  },
  scheduledSlot: {
    type: String,
    enum: ['morning', 'afternoon', 'evening', 'anytime'],
    default: 'anytime'
  },
  type: {
    type: String,
    enum: ['delivery', 'pickup', 'exchange'],
    default: 'delivery'
  },
  status: {
    type: String,
    enum: ['scheduled', 'out_for_delivery', 'in_transit', 'arrived', 'delivered', 'cancelled', 'failed'],
    default: 'scheduled'
  },
  actualDeliveryTime: {
    type: Date
  },
  deliveryProof: {
    image: String,
    signature: String,
    recipientName: String
  },
  pickupProof: {
    image: String,
    condition: String,
    notes: String
  },
  items: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product'
    },
    productName: String,
    quantity: Number,
    condition: {
      type: String,
      enum: ['new', 'good', 'damaged', 'missing'],
      default: 'good'
    }
  }],
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
deliverySchema.index({ order: 1 });
deliverySchema.index({ rental: 1 });
deliverySchema.index({ user: 1, status: 1 });
deliverySchema.index({ scheduledDate: 1 });

// Update updatedAt on save
deliverySchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Delivery', deliverySchema);
