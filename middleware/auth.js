// middleware/auth.js
const jwt = require('jsonwebtoken');

// Use the centralized database pool
const { getPool } = require('../lib/db-pool');

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
    const pool = getPool();
    if (!pool) {
      req.user = null;
      return next();
    }

    // Get a client from the pool
    const client = await pool.connect();
    let sessionResult;

    try {
      sessionResult = await client.query(
        `SELECT s.*, u.id as user_id, u.username, u.email, u.is_guest as "isGuest"
         FROM sessions s
         JOIN users u ON s.user_id = u.id
         WHERE s.token = $1`,
        [token]
      );
    } catch (dbError) {
      console.error('Database query error in authenticate middleware:', dbError);
      req.user = null;
      return next();
    } finally {
      // Always release the client back to the pool
      client.release();
    }

    const session = sessionResult.rows[0];

    // Check if session exists and is not expired
    if (!session || new Date() > new Date(session.expires_at)) {
      req.user = null;
      return next();
    }

    // Create user object from session result
    const user = {
      id: session.user_id,
      username: session.username,
      email: session.email,
      isGuest: session.isGuest
    };

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
