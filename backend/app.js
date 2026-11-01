const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const { connectDatabase } = require('./db');

// The Express app, without a listener. server.js runs it as a long-lived server (Docker,
// `npm run dev`); on Vercel this file is the entrypoint and each instance serves it as a
// function (see vercel.json).
const app = express();

// We always sit behind a proxy: Caddy (and Cloudflare Tunnel) with Docker, Vercel's edge on
// Vercel. Trust forwarded headers only from it, so req.ip is the real visitor and can't be
// spoofed. Vercel overwrites X-Forwarded-For with the client IP, so trust exactly one hop there.
app.set('trust proxy', process.env.VERCEL ? 1 : 'loopback, linklocal, uniquelocal');
app.disable('x-powered-by');

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files for uploads. File names are unique and never rewritten, so browsers
// and Cloudflare can cache them for a long time. (Vercel ignores express.static.)
const UPLOAD_DIR = path.join(__dirname, 'uploads');
app.use('/uploads', express.static(UPLOAD_DIR, {
  maxAge: '30d',
  immutable: true,
  dotfiles: 'deny',
  setHeaders: (res) => res.set('X-Content-Type-Options', 'nosniff')
}));

// Every API route needs the database. server.js connects before listening, so this returns
// at once there; on Vercel the first request to a fresh instance connects and the rest reuse it.
app.use('/api', async (req, res, next) => {
  try {
    await connectDatabase();
    next();
  } catch (err) {
    console.error('❌ MongoDB connection error:', err.message);
    res.status(503).json({ message: 'Database unavailable' });
  }
});

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
// (The storefront and admin panel are served by Caddy or Vercel, not by this process.)
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

module.exports = app;
