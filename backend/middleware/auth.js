const jwt = require('jsonwebtoken');
const config = require('../config');

const getToken = (req) => req.header('Authorization')?.replace(/^Bearer\s+/i, '');

// Require a valid token.
const auth = function(req, res, next) {
  const token = getToken(req);

  if (!token) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  try {
    req.user = jwt.verify(token, config.jwtSecret);
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};

// Attach req.user when a valid token is sent, but let anonymous requests through.
// Used by public endpoints that show extra data (e.g. inactive products) to admins.
auth.optional = function(req, res, next) {
  const token = getToken(req);

  if (token) {
    try {
      req.user = jwt.verify(token, config.jwtSecret);
    } catch (error) {
      // An invalid/expired token just means "anonymous" here.
    }
  }

  next();
};

// Use after `auth`: restrict a route to the given roles.
auth.requireRole = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({ message: 'Not authorized' });
  }
  next();
};

module.exports = auth;
