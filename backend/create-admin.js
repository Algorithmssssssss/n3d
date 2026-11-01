// Create an admin account, or reset the password of an existing one.
//
//   docker compose exec backend node create-admin.js you@example.com 'new-password' ["Full Name"]
//
// Handy for recovering access, since the admin panel has no "forgot password" flow.
const mongoose = require('mongoose');
const config = require('./config');
const User = require('./models/User');

const [emailArg, passwordArg, nameArg] = process.argv.slice(2);
const email = (emailArg || config.adminEmail || '').trim().toLowerCase();
const password = passwordArg || config.adminPassword;

const run = async () => {
  if (!email || !password) {
    console.error('Usage: node create-admin.js <email> <password> [name]');
    process.exit(1);
  }

  try {
    await mongoose.connect(config.mongodbUri);

    let user = await User.findOne({ email });

    if (user) {
      user.password = password; // hashed by the model's pre-save hook
      user.role = 'admin';
      user.isActive = true;
      if (nameArg) user.name = nameArg;
      await user.save();
      console.log(`✅ Updated ${email}: password reset, role set to admin`);
    } else {
      user = await User.create({ email, password, name: nameArg || 'Admin', role: 'admin' });
      console.log(`✅ Created admin ${email}`);
    }

    process.exit(0);
  } catch (error) {
    console.error(`❌ ${error.message}`);
    process.exit(1);
  }
};

run();
