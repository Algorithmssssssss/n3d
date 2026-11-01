const OBJECT_ID_PATTERN = /^[0-9a-fA-F]{24}$/;

const isObjectId = (value) => typeof value === 'string' && OBJECT_ID_PATTERN.test(value);

// Query-string values can arrive as arrays/objects (?a[b]=c). Only accept plain strings.
const asString = (value) => (typeof value === 'string' ? value : undefined);

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Lower-case, hyphen-separated slug. Returns '' when nothing usable is left
// (e.g. a name written entirely in a non-Latin script), so callers must fall back.
const slugify = (value) =>
  String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

const pick = (source, keys) => {
  const result = {};
  for (const key of keys) {
    if (source[key] !== undefined) result[key] = source[key];
  }
  return result;
};

// Turn Mongoose/Mongo errors into a 4xx the admin UI can show, instead of a blanket 500.
// Returns true when the error was handled.
const sendKnownError = (res, error) => {
  if (error.name === 'ValidationError') {
    const message = Object.values(error.errors).map(e => e.message).join('. ');
    res.status(400).json({ message });
    return true;
  }

  if (error.name === 'CastError') {
    res.status(400).json({ message: `Invalid value for ${error.path}` });
    return true;
  }

  if (error.code === 11000) {
    const field = Object.keys(error.keyPattern || {})[0] || 'value';
    res.status(409).json({ message: `That ${field} is already in use` });
    return true;
  }

  return false;
};

module.exports = { isObjectId, asString, escapeRegex, slugify, pick, sendKnownError };
