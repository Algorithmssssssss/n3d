const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const config = require('./config');
const { bootstrapAdmin } = require('./utils/admin');

const app = express();

// We normally sit behind Caddy (and Cloudflare Tunnel). Trust forwarded headers only
// from private addresses, so req.ip is the real visitor and can't be spoofed by them.
app.set('trust proxy', 'loopback, linklocal, uniquelocal');
app.disable('x-powered-by');

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files for uploads. File names are unique and never rewritten, so browsers
// and Cloudflare can cache them for a long time.
const UPLOAD_DIR = path.join(__dirname, 'uploads');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });
app.use('/uploads', express.static(UPLOAD_DIR, {
  maxAge: '30d',
  immutable: true,
  dotfiles: 'deny',
  setHeaders: (res) => res.set('X-Content-Type-Options', 'nosniff')
}));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/upload', require('./routes/upload'));
app.use('/api/settings', require('./routes/settings'));

// Health check endpoint (used by the Docker healthcheck): unhealthy when the DB is down
app.get('/api/health', (req, res) => {
  const dbConnected = mongoose.connection.readyState === 1;
  res.status(dbConnected ? 200 : 503).json({
    status: dbConnected ? 'ok' : 'degraded',
    database: dbConnected ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString()
  });
});

// Unknown API routes get JSON, not an HTML error page.
// (The storefront and admin panel are served by Caddy, not by this process.)
app.use('/api', (req, res) => {
  res.status(404).json({ message: 'Not found' });
});

// Last-resort error handler: JSON out, no stack traces.
app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ message: 'Invalid JSON body' });
  }
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ message: 'Request body too large' });
  }

  console.error(err);
  res.status(500).json({ message: 'Server error' });
});

const start = async () => {
  try {
    await mongoose.connect(config.mongodbUri, { serverSelectionTimeoutMS: 10000 });
    console.log('✅ Connected to MongoDB');
  } catch (err) {
    // Exit so the container restarts, instead of running with no database.
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  }

  await bootstrapAdmin({ email: config.adminEmail, password: config.adminPassword });

  const server = app.listen(config.port, () => {
    console.log(`🚀 Server running on port ${config.port}`);
    console.log(`📦 API: http://localhost:${config.port}/api`);
    console.log(`📁 Uploads: http://localhost:${config.port}/uploads`);
  });

  // Let `docker stop` finish in-flight requests instead of waiting to be killed.
  const shutdown = (signal) => {
    console.log(`${signal} received, shutting down`);
    server.close(() => {
      mongoose.connection.close().finally(() => process.exit(0));
    });
    setTimeout(() => process.exit(1), 10000).unref();
  };
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
};

start();
