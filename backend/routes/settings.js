const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Settings = require('../models/Settings');
const auth = require('../middleware/auth');
const { sendKnownError } = require('../utils/helpers');

// Social links are rendered as <a href> on the public site, so only allow web URLs
// (a "javascript:" link would be stored XSS).
const optionalWebUrl = (field) =>
  body(field)
    .optional({ values: 'falsy' })
    .isURL({ protocols: ['http', 'https'], require_protocol: true })
    .withMessage('Social links must be full http(s) URLs');

// @route   GET /api/settings
// @desc    Get company settings
// @access  Public
router.get('/', async (req, res) => {
  try {
    let settings = await Settings.findOne();

    // Create default settings if none exist
    if (!settings) {
      settings = await Settings.create({});
    }

    res.json(settings);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/settings
// @desc    Update company settings
// @access  Private (Admin only)
router.put('/', auth, auth.requireRole('admin'), [
  optionalWebUrl('social.facebook'),
  optionalWebUrl('social.twitter'),
  optionalWebUrl('social.instagram'),
  optionalWebUrl('social.linkedin')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg, errors: errors.array() });
    }

    const settings = (await Settings.findOne()) || new Settings();

    // Update only the known fields
    for (const field of ['companyName', 'tagline', 'logo', 'contact', 'social', 'workingHours']) {
      if (req.body[field] !== undefined) settings[field] = req.body[field];
    }

    await settings.save();
    res.json(settings);
  } catch (error) {
    if (sendKnownError(res, error)) return;
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
