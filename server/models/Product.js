const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide product name'],
    trim: true,
    maxlength: [100, 'Product name cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Please provide product description'],
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  category: {
    type: String,
    required: [true, 'Please specify category'],
    enum: ['furniture', 'appliances', 'electronics', 'kitchen', 'bedroom', 'living']
  },
  subCategory: {
    type: String,
    trim: true
  },
  brand: {
    type: String,
    required: [true, 'Please provide brand name']
  },
  model: {
    type: String,
    trim: true
  },
  images: [{
    type: String
  }],
  rentalPrice: {
    monthly: {
      type: Number,
      required: [true, 'Please provide monthly rental price']
    },
    quarterly: Number,
    yearly: Number
  },
  securityDeposit: {
    type: Number,
    required: [true, 'Please provide security deposit'],
    default: 0
  },
  tenureOptions: [{
    months: {
      type: Number,
      required: true
    },
    price: {
      type: Number,
      required: true
    },
    discount: {
      type: Number,
      default: 0
    }
  }],
  availability: {
    type: String,
    enum: ['available', 'rented', 'maintenance', 'unavailable'],
    default: 'available'
  },
  quantity: {
    type: Number,
    default: 1,
    min: [0, 'Quantity cannot be negative']
  },
  availableQuantity: {
    type: Number,
    default: 1,
    min: [0, 'Available quantity cannot be negative']
  },
  specifications: {
    type: Map,
    of: String
  },
  dimensions: {
    length: Number,
    width: Number,
    height: Number,
    unit: {
      type: String,
      default: 'cm'
    }
  },
  weight: {
    type: Number,
    unit: {
      type: String,
      default: 'kg'
    }
  },
  color: {
    type: String
  },
  material: {
    type: String
  },
  features: [{
    type: String
  }],
  condition: {
    type: String,
    enum: ['new', 'like-new', 'good', 'fair'],
    default: 'new'
  },
  vendor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  serviceArea: {
    type: String,
    default: ''
  },
  deliveryAvailable: {
    type: Boolean,
    default: true
  },
  deliveryCharge: {
    type: Number,
    default: 0
  },
  rating: {
    average: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    count: {
      type: Number,
      default: 0
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isFeatured: {
    type: Boolean,
    default: false
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

// Index for searching
productSchema.index({ name: 'text', description: 'text', brand: 'text' });
productSchema.index({ category: 1, availability: 1 });
productSchema.index({ rentalPrice: 1 });

// Virtual for calculating discounted price
productSchema.virtual('discountedPrice').get(function() {
  if (this.tenureOptions && this.tenureOptions.length > 0) {
    const longestTenure = this.tenureOptions.reduce((prev, current) => {
      return (prev.months > current.months) ? prev : current;
    });
    if (longestTenure.discount > 0) {
      return this.rentalPrice.monthly * (1 - longestTenure.discount / 100);
    }
  }
  return this.rentalPrice.monthly;
});

// Update updatedAt on save
productSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Product', productSchema);
