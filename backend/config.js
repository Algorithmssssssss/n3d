require('dotenv').config();

const isProduction = process.env.NODE_ENV === 'production';

// Values that have shipped in this repo's examples. Anyone can read them, so a
// production server must never accept them as its signing secret.
const KNOWN_PLACEHOLDER_SECRETS = [
  'your-secret-key',
  'your-super-secret-jwt-key-change-this-in-production'
];

// An explicit MONGODB_URI wins (local dev, Atlas...). Otherwise build it from the separate
// parts docker-compose provides, URL-encoding the credentials: a password containing
// "@", ":", "/" or "#" would otherwise corrupt the URL and the driver would try to
// resolve part of the password as a hostname.
const resolveMongoUri = () => {
  if (process.env.MONGODB_URI) return process.env.MONGODB_URI;

  const { MONGO_HOST, MONGO_USER, MONGO_PASSWORD, MONGO_DB = 'textilepro' } = process.env;
  if (MONGO_HOST && MONGO_USER && MONGO_PASSWORD) {
    const auth = `${encodeURIComponent(MONGO_USER)}:${encodeURIComponent(MONGO_PASSWORD)}`;
    return `mongodb://${auth}@${MONGO_HOST}:27017/${MONGO_DB}?authSource=admin`;
  }

  return 'mongodb://localhost:27017/textilepro';
};

const resolveJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  const isWeak = !secret || secret.length < 32 || KNOWN_PLACEHOLDER_SECRETS.includes(secret);

  if (!isWeak) return secret;

  if (isProduction) {
    console.error('❌ JWT_SECRET is missing, too short (<32 chars) or a known placeholder.');
    console.error('   Anyone could forge admin tokens. Generate one with: openssl rand -hex 32');
    process.exit(1);
  }

  console.warn('⚠️  Using an insecure development JWT secret. Set JWT_SECRET before deploying.');
  return secret || 'dev-only-insecure-secret';
};

module.exports = {
  isProduction,
  port: Number(process.env.PORT) || 5000,
  mongodbUri: resolveMongoUri(),
  jwtSecret: resolveJwtSecret(),
  jwtExpiresIn: '7d',
  // Only used to create the very first admin when the users collection is empty.
  adminEmail: process.env.ADMIN_EMAIL,
  adminPassword: process.env.ADMIN_PASSWORD
};
