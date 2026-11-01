const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { rateLimit } = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const auth = require('../middleware/auth');
const config = require('../config');
const { sendKnownError } = require('../utils/helpers');

const signToken = (user) =>
  jwt.sign({ userId: user._id, role: user.role }, config.jwtSecret, { expiresIn: config.jwtExpiresIn });

const publicUser = (user) => ({
  id: user._id,
  email: user.email,
  name: user.name,
  role: user.role
});

// Slow down password guessing. Only failed attempts count, so normal use is unaffected.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: { message: 'Too many failed login attempts. Please try again in 15 minutes.' }
});

// @route   POST /api/auth/register
// @desc    Create a user account
// @access  Private (Admin only) - there is no public sign-up
router.post('/register', auth, auth.requireRole('admin'), [
  body('email').isEmail().withMessage('Please enter a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('name').notEmpty().withMessage('Name is required'),
  body('role').optional().isIn(['admin', 'manager', 'editor']).withMessage('Invalid role')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { password, name, role } = req.body;
    const email = req.body.email.trim().toLowerCase();

    if (await User.findOne({ email })) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const user = await User.create({ email, password, name, role: role || 'editor' });

    res.status(201).json({ token: signToken(user), user: publicUser(user) });
  } catch (error) {
    if (sendKnownError(res, error)) return;
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', loginLimiter, [
  body('email').isEmail().withMessage('Please enter a valid email'),
  body('password').exists().withMessage('Password is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { password } = req.body;
    const email = req.body.email.trim().toLowerCase();

    // Same message for unknown user / wrong password / disabled account, so the
    // response doesn't reveal which accounts exist.
    const user = await User.findOne({ email });
    if (!user || user.isActive === false || !(await user.comparePassword(password))) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    user.lastLogin = new Date();
    await user.save();

    res.json({ token: signToken(user), user: publicUser(user) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    if (!user || user.isActive === false) {
      // The token is valid but its account is gone/disabled: treat the session as invalid.
      return res.status(401).json({ message: 'Account no longer available' });
    }
    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
