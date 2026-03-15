const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  quantity: {
    type: Number,
    default: 1,
    min: [1, 'Quantity must be at least 1']
  },
  selectedTenure: {
    months: {
      type: Number,
      required: true
    },
    monthlyPrice: Number,
    totalPrice: Number
  },
  rentalStartDate: {
    type: Date
  },
  rentalEndDate: {
    type: Date
  }
});

const cartSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  items: [cartItemSchema],
  subtotal: {
    type: Number,
    default: 0
  },
  securityDeposit: {
    type: Number,
    default: 0
  },
  deliveryCharge: {
    type: Number,
    default: 0
  },
  total: {
    type: Number,
    default: 0
  },
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

// Calculate totals before saving
cartSchema.pre('save', async function(next) {
  let subtotal = 0;
  let securityDeposit = 0;
  let deliveryCharge = 0;

  for (const item of this.items) {
    const Product = mongoose.model('Product');
    const product = await Product.findById(item.product);
    if (product) {
      const itemTotal = item.selectedTenure.totalPrice || (product.rentalPrice.monthly * item.selectedTenure.months);
      subtotal += itemTotal;
      securityDeposit += product.securityDeposit * item.quantity;
      deliveryCharge += product.deliveryCharge || 0;
    }
  }

  this.subtotal = subtotal;
  this.securityDeposit = securityDeposit;
  this.deliveryCharge = deliveryCharge;
  this.total = subtotal + securityDeposit + deliveryCharge;
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Cart', cartSchema);
