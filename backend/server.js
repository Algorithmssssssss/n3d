const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const app = require('./app');
const config = require('./config');
const { connectDatabase } = require('./db');

// Long-running server for Docker (`node server.js`) and `npm run dev`.
// Vercel doesn't use this file: it serves app.js directly.

const start = async () => {
  try {
    await connectDatabase();
  } catch (err) {
    // Exit so the container restarts, instead of running with no database.
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  }

  fs.mkdirSync(path.join(__dirname, 'uploads'), { recursive: true });

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
