const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  companyName: {
    type: String,
    default: 'TextilePro',
    trim: true
  },
  logo: {
    url: String,
    alt: String
  },
  tagline: {
    type: String,
    default: 'Premium Textile Accessories for Garment Factories'
  },
  contact: {
    email: { type: String, default: 'sales@textilepro.com' },
    phone: { type: String, default: '+86 123 456 7890' },
    address: { type: String, default: '123 Industrial Zone, Textile City, China' }
  },
  social: {
    facebook: String,
    twitter: String,
    instagram: String,
    linkedin: String
  },
  workingHours: {
    type: String,
    default: 'Monday - Saturday: 9AM - 6PM'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Settings', settingsSchema);
