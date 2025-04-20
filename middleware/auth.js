// middleware/auth.js
const jwt = require('jsonwebtoken');
const { db } = require('../lib/db');
const { users, sessions } = require('../db/schema');
const { eq, and, gt } = require('drizzle-orm');

// Middleware to authenticate users via JWT
const authenticate = async (req, res, next) => {
  try {
    // Get token from cookies or authorization header
    const token = req.cookies.token ||
                 (req.headers.authorization && req.headers.authorization.split(' ')[1]);

    if (!token) {
      req.user = null;
      return next();
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Find session in database
    const sessionResults = await db
      .select()
      .from(sessions)
      .where(eq(sessions.token, token));

    const session = sessionResults[0];

    // Check if session exists and is not expired
    if (!session || new Date() > session.expiresAt) {
      req.user = null;
      return next();
    }

    // Get user from database
    const userResults = await db
      .select()
      .from(users)
      .where(eq(users.id, session.userId));

    const user = userResults[0];

    if (!user) {
      req.user = null;
      return next();
    }

    // Set user in request
    req.user = user;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    req.user = null;
    next();
  }
};

// Middleware to require authentication
const requireAuth = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
};

module.exports = { authenticate, requireAuth };
