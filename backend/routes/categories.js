const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Category = require('../models/Category');
const Product = require('../models/Product');
const auth = require('../middleware/auth');
const { isObjectId, escapeRegex, pick, sendKnownError } = require('../utils/helpers');

const EDITABLE_FIELDS = ['name', 'description', 'icon', 'image', 'sortOrder', 'isActive', 'parentCategory'];

const handleError = (res, error) => {
  if (sendKnownError(res, error)) return;
  console.error(error);
  res.status(500).json({ message: 'Server error' });
};

// Case-insensitive "same name" lookup. The name is escaped: it is user input, and
// unescaped characters like "+" or "(" made the old lookup throw a 500.
const findByName = (name, excludeId) => {
  const query = { name: new RegExp(`^${escapeRegex(name)}$`, 'i') };
  if (excludeId) query._id = { $ne: excludeId };
  return Category.findOne(query);
};

// @route   GET /api/categories
// @desc    Get all categories with their product counts
// @access  Public (signed-in users may add ?includeInactive=true to include
//          inactive categories and count inactive products too)
router.get('/', auth.optional, async (req, res) => {
  try {
    const includeInactive = Boolean(req.user) && req.query.includeInactive === 'true';

    const [categories, counts] = await Promise.all([
      Category.find(includeInactive ? {} : { isActive: true }).sort('sortOrder name').lean(),
      Product.aggregate([
        { $match: includeInactive ? {} : { isActive: true } },
        { $group: { _id: '$category', count: { $sum: 1 } } }
      ])
    ]);

    // Counted on demand: a stored counter drifted out of sync (seeding, moving a
    // product between categories, deactivating products) and showed "0 Products".
    const countByCategory = new Map(counts.map(c => [String(c._id), c.count]));

    res.json(categories.map(category => ({
      ...category,
      productCount: countByCategory.get(String(category._id)) || 0
    })));
  } catch (error) {
    handleError(res, error);
  }
});

// @route   GET /api/categories/:id
// @desc    Get single category by id or slug
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const filter = isObjectId(req.params.id) ? { _id: req.params.id } : { slug: req.params.id };
    const category = await Category.findOne(filter);

    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    res.json(category);
  } catch (error) {
    handleError(res, error);
  }
});

// @route   POST /api/categories
// @desc    Create a new category
// @access  Private (Admin/Manager)
router.post('/', auth, auth.requireRole('admin', 'manager'), [
  body('name').trim().notEmpty().withMessage('Category name is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg, errors: errors.array() });
    }

    const data = pick(req.body, EDITABLE_FIELDS);

    if (await findByName(data.name)) {
      return res.status(400).json({ message: 'Category already exists' });
    }

    const category = await Category.create(data);

    res.status(201).json(category);
  } catch (error) {
    handleError(res, error);
  }
});

// @route   PUT /api/categories/:id
// @desc    Update a category
// @access  Private (Admin/Manager)
router.put('/:id', auth, auth.requireRole('admin', 'manager'), [
  body('name').optional().trim().notEmpty().withMessage('Category name cannot be empty')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg, errors: errors.array() });
    }

    if (!isObjectId(req.params.id)) {
      return res.status(404).json({ message: 'Category not found' });
    }

    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    const data = pick(req.body, EDITABLE_FIELDS);

    if (data.name !== undefined && await findByName(data.name, category._id)) {
      return res.status(400).json({ message: 'Category already exists' });
    }

    // save() (rather than findByIdAndUpdate) so the slug is regenerated on rename.
    category.set(data);
    await category.save();

    res.json(category);
  } catch (error) {
    handleError(res, error);
  }
});

// @route   DELETE /api/categories/:id
// @desc    Delete a category
// @access  Private (Admin only)
router.delete('/:id', auth, auth.requireRole('admin'), async (req, res) => {
  try {
    if (!isObjectId(req.params.id)) {
      return res.status(404).json({ message: 'Category not found' });
    }

    const productsCount = await Product.countDocuments({ category: req.params.id });

    if (productsCount > 0) {
      return res.status(400).json({
        message: `Cannot delete category with ${productsCount} products. Remove or reassign products first.`
      });
    }

    const category = await Category.findByIdAndDelete(req.params.id);

    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    handleError(res, error);
  }
});

module.exports = router;
