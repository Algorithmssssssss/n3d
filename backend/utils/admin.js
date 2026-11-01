const User = require('../models/User');

// Create the very first admin so a fresh deployment is usable without a manual
// seed step. Does nothing once any user exists, so it never touches real accounts.
const bootstrapAdmin = async ({ email, password }) => {
  if (await User.countDocuments() > 0) return;

  if (!email || !password) {
    console.warn('⚠️  No users exist yet. Set ADMIN_EMAIL and ADMIN_PASSWORD to create the first admin.');
    return;
  }

  if (password.length < 6) {
    console.error('❌ ADMIN_PASSWORD must be at least 6 characters, so no admin account was created.');
    console.error('   Change it in .env, then run: docker compose up -d');
    return;
  }

  try {
    await User.create({ email: email.trim().toLowerCase(), password, name: 'Admin', role: 'admin' });
    console.log(`✅ Created initial admin user: ${email}`);
  } catch (error) {
    // Don't stop the API from starting; the message says what to fix.
    console.error(`❌ Could not create the initial admin: ${error.message}`);
  }
};

module.exports = { bootstrapAdmin };
