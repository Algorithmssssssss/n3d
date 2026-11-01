const mongoose = require('mongoose');
const { slugify } = require('../utils/helpers');

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Category name is required'],
    trim: true,
    unique: true,
    maxlength: [100, 'Category name cannot exceed 100 characters']
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true
  },
  description: {
    type: String,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  image: {
    url: String,
    alt: String
  },
  icon: {
    type: String,
    default: 'fas fa-tag'
  },
  parentCategory: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  },
  sortOrder: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Generate a unique slug from the name whenever the name changes.
// (Product counts are computed on demand by the categories route, not stored.)
categorySchema.pre('save', async function(next) {
  if (!this.isModified('name')) {
    return next();
  }

  try {
    const base = slugify(this.name) || 'category';
    let slug = base;
    let suffix = 1;

    while (await this.constructor.exists({ slug, _id: { $ne: this._id } })) {
      suffix += 1;
      slug = `${base}-${suffix}`;
    }

    this.slug = slug;
    next();
  } catch (error) {
    next(error);
  }
});

module.exports = mongoose.model('Category', categorySchema);
