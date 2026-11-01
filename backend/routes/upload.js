const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const auth = require('../middleware/auth');

const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');

// The file extension comes from the MIME type we accept, never from the
// client-supplied filename.
const ALLOWED_TYPES = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/gif': '.gif',
  'image/webp': '.webp'
};

// Names this API generates. Anything else (including "..", separators, dotfiles)
// is refused by the delete endpoint.
const SAFE_FILENAME = /^[A-Za-z0-9][A-Za-z0-9._-]*$/;

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    cb(null, UPLOAD_DIR);
  },
  filename: function(req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + ALLOWED_TYPES[file.mimetype]);
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  if (ALLOWED_TYPES[file.mimetype]) {
    return cb(null, true);
  }
  cb(new Error('Only image files (jpeg, png, gif, webp) are allowed'));
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: fileFilter
});

// Same permissions as managing products: editors can't upload.
const canUpload = [auth, auth.requireRole('admin', 'manager')];

// @route   POST /api/upload
// @desc    Upload a single image
// @access  Private (Admin/Manager)
router.post('/', canUpload, upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const imageUrl = `/uploads/${req.file.filename}`;

    res.json({
      url: imageUrl,
      filename: req.file.filename,
      originalname: req.file.originalname,
      size: req.file.size
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/upload/multiple
// @desc    Upload multiple images
// @access  Private (Admin/Manager)
router.post('/multiple', canUpload, upload.array('images', 10), (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded' });
    }

    const uploadedFiles = req.files.map(file => ({
      url: `/uploads/${file.filename}`,
      filename: file.filename,
      originalname: file.originalname,
      size: file.size
    }));

    res.json(uploadedFiles);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/upload/:filename
// @desc    Delete an uploaded image
// @access  Private (Admin/Manager)
router.delete('/:filename', canUpload, async (req, res) => {
  try {
    const { filename } = req.params;

    // Express URL-decodes params, so "..%2F..%2Fapp%2Fserver.js" arrives here as a
    // real path. Only plain file names inside UPLOAD_DIR are allowed.
    if (!SAFE_FILENAME.test(filename)) {
      return res.status(400).json({ message: 'Invalid filename' });
    }

    const filePath = path.join(UPLOAD_DIR, filename);
    if (path.dirname(filePath) !== UPLOAD_DIR) {
      return res.status(400).json({ message: 'Invalid filename' });
    }

    try {
      await fs.promises.unlink(filePath);
    } catch (error) {
      if (error.code === 'ENOENT') {
        return res.status(404).json({ message: 'File not found' });
      }
      throw error;
    }

    res.json({ message: 'File deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Error handling middleware for multer
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'File size too large. Maximum size is 5MB' });
    }
    return res.status(400).json({ message: error.message });
  }

  if (error.message) {
    return res.status(400).json({ message: error.message });
  }

  res.status(500).json({ message: 'Server error' });
});

module.exports = router;
