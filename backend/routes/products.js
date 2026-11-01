const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Product = require('../models/Product');
const Category = require('../models/Category');
const auth = require('../middleware/auth');
const { isObjectId, asString, pick, sendKnownError } = require('../utils/helpers');

const SORTS = new Set([
  '-createdAt', 'createdAt', 'price', '-price', 'name', '-name', '-salesCount', '-rating.average'
]);

// Fields a client may set. Anything else (slug, salesCount, rating, _id...) is ignored.
const EDITABLE_FIELDS = [
  'name', 'description', 'shortDescription', 'price', 'priceRange', 'originalPrice',
  'category', 'images', 'specifications', 'minimumOrder', 'stock', 'sku', 'tags',
  'isActive', 'isFeatured', 'ecoFriendly'
];

// Optional fields an admin can clear. Clearing removes the field instead of storing
// ''/null, which would collide on the unique SKU index.
const CLEARABLE_FIELDS = ['sku', 'originalPrice'];

const splitWrite = (source) => {
  const set = pick(source, EDITABLE_FIELDS);
  const unset = {};

  for (const field of CLEARABLE_FIELDS) {
    if (field in set && (set[field] === '' || set[field] === null)) {
      delete set[field];
      unset[field] = '';
    }
  }

  return { set, unset };
};

const handleError = (res, error) => {
  if (sendKnownError(res, error)) return;
  console.error(error);
  res.status(500).json({ message: 'Server error' });
};

// Accept either a category _id or its slug (?category=buttons).
const resolveCategoryId = async (value) => {
  if (isObjectId(value)) return value;
  const category = await Category.findOne({ slug: value }).select('_id').lean();
  return category ? category._id : null;
};

// @route   GET /api/products
// @desc    Get products with filtering and pagination
// @access  Public (signed-in users may add ?includeInactive=true)
router.get('/', auth.optional, async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 12, 1), 100);
    const sortParam = asString(req.query.sort);
    const sort = SORTS.has(sortParam) ? sortParam : '-createdAt';

    const query = {};

    if (!(req.user && req.query.includeInactive === 'true')) {
      query.isActive = true;
    }

    const category = asString(req.query.category);
    if (category) {
      const categoryId = await resolveCategoryId(category);
      if (!categoryId) {
        return res.json({ products: [], pagination: { current: page, pages: 0, total: 0 } });
      }
      query.category = categoryId;
    }

    const search = asString(req.query.search)?.trim();
    if (search) {
      query.$text = { $search: search };
    }

    const minPrice = parseFloat(req.query.minPrice);
    const maxPrice = parseFloat(req.query.maxPrice);
    if (!Number.isNaN(minPrice) || !Number.isNaN(maxPrice)) {
      query.price = {};
      if (!Number.isNaN(minPrice)) query.price.$gte = minPrice;
      if (!Number.isNaN(maxPrice)) query.price.$lte = maxPrice;
    }

    if (req.query.featured === 'true') {
      query.isFeatured = true;
    }

    if (req.query.ecoFriendly === 'true') {
      query.ecoFriendly = true;
    }

    const [products, total] = await Promise.all([
      Product.find(query)
        .populate('category', 'name slug')
        .sort(sort)
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Product.countDocuments(query)
    ]);

    res.json({
      products,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    handleError(res, error);
  }
});

// @route   GET /api/products/stats
// @desc    Counts for the admin dashboard
// @access  Private
// (Declared before /:id so "stats" isn't treated as a product id.)
router.get('/stats', auth, async (req, res) => {
  try {
    const [total, active, featured, ecoFriendly, categories] = await Promise.all([
      Product.countDocuments(),
      Product.countDocuments({ isActive: true }),
      Product.countDocuments({ isFeatured: true }),
      Product.countDocuments({ ecoFriendly: true }),
      Category.countDocuments()
    ]);

    res.json({ total, active, inactive: total - active, featured, ecoFriendly, categories });
  } catch (error) {
    handleError(res, error);
  }
});

// @route   GET /api/products/:id
// @desc    Get single product by id or slug
// @access  Public (inactive products are only visible to signed-in users)
router.get('/:id', auth.optional, async (req, res) => {
  try {
    const { id } = req.params;
    const filter = isObjectId(id) ? { _id: id } : { slug: id };

    if (!req.user) {
      filter.isActive = true;
    }

    const product = await Product.findOne(filter).populate('category', 'name slug');

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json(product);
  } catch (error) {
    handleError(res, error);
  }
});

// @route   POST /api/products
// @desc    Create a new product
// @access  Private (Admin/Manager)
router.post('/', auth, auth.requireRole('admin', 'manager'), [
  body('name').trim().notEmpty().withMessage('Product name is required'),
  body('description').notEmpty().withMessage('Description is required'),
  body('price').isFloat({ min: 0 }).withMessage('Price must be a non-negative number'),
  body('category').isMongoId().withMessage('A valid category is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg, errors: errors.array() });
    }

    const { set } = splitWrite(req.body);
    // Nothing to clear on a new document: just drop empty optional values.
    for (const field of CLEARABLE_FIELDS) {
      if (set[field] === '' || set[field] === null) delete set[field];
    }

    if (!(await Category.exists({ _id: set.category }))) {
      return res.status(400).json({ message: 'Category not found' });
    }

    const product = await Product.create(set);

    res.status(201).json(product);
  } catch (error) {
    handleError(res, error);
  }
});

// @route   PUT /api/products/:id
// @desc    Update a product
// @access  Private (Admin/Manager)
router.put('/:id', auth, auth.requireRole('admin', 'manager'), [
  body('name').optional().trim().notEmpty().withMessage('Product name cannot be empty'),
  body('price').optional().isFloat({ min: 0 }).withMessage('Price must be a non-negative number'),
  body('category').optional().isMongoId().withMessage('A valid category is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg, errors: errors.array() });
    }

    if (!isObjectId(req.params.id)) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const { set, unset } = splitWrite(req.body);

    if (set.category && !(await Category.exists({ _id: set.category }))) {
      return res.status(400).json({ message: 'Category not found' });
    }

    const update = {};
    if (Object.keys(set).length) update.$set = set;
    if (Object.keys(unset).length) update.$unset = unset;

    if (!Object.keys(update).length) {
      return res.status(400).json({ message: 'Nothing to update' });
    }

    const product = await Product.findByIdAndUpdate(req.params.id, update, {
      new: true,
      runValidators: true
    });

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json(product);
  } catch (error) {
    handleError(res, error);
  }
});

// @route   DELETE /api/products/:id
// @desc    Delete a product
// @access  Private (Admin only)
router.delete('/:id', auth, auth.requireRole('admin'), async (req, res) => {
  try {
    if (!isObjectId(req.params.id)) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const product = await Product.findByIdAndDelete(req.params.id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    handleError(res, error);
  }
});

// @route   PATCH /api/products/:id/toggle-featured
// @desc    Toggle product featured status
// @access  Private (Admin/Manager)
router.patch('/:id/toggle-featured', auth, auth.requireRole('admin', 'manager'), async (req, res) => {
  try {
    if (!isObjectId(req.params.id)) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    product.isFeatured = !product.isFeatured;
    await product.save();
    // Return the same shape as the list endpoint (the admin table swaps this row in place).
    await product.populate('category', 'name slug');

    res.json(product);
  } catch (error) {
    handleError(res, error);
  }
});

module.exports = router;
