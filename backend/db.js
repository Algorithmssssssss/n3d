const mongoose = require('mongoose');
const config = require('./config');
const { bootstrapAdmin } = require('./utils/admin');

let connecting = null;

// Connect once per process, then create the first admin if the database has no users yet.
// Safe to call on every request: later calls share the same promise. A failed attempt is
// forgotten, so the next call retries instead of failing forever.
const connectDatabase = () => {
  if (!connecting) {
    connecting = mongoose
      .connect(config.mongodbUri, { serverSelectionTimeoutMS: 10000 })
      .then(() => {
        console.log('✅ Connected to MongoDB');
        return bootstrapAdmin({ email: config.adminEmail, password: config.adminPassword });
      })
      .catch((err) => {
        connecting = null;
        throw err;
      });
  }
  return connecting;
};

module.exports = { connectDatabase };
