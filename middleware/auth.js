// middleware/auth.js
const jwt = require('jsonwebtoken');

// Use the centralized database pool
const { getPool } = require('../lib/db-pool');

// Middleware to authenticate users via JWT
const authenticate = async (req, res, next) => {
  // Use a faster timeout and Promise.race for the entire authentication process
  try {
    await Promise.race([
      authenticateWithTimeout(req),
      new Promise((_, reject) => setTimeout(() => {
        console.log('Authentication timed out at top level');
        // Don't actually reject, just log
      }, 1500)) // 1.5 second timeout for the entire process
    ]);
  } catch (error) {
    console.error('Authentication error (caught at top level):', error);
    // If we don't have a user yet, set to null
    if (!req.user) req.user = null;
  }

  // Always continue to the next middleware
  return next();
};

// Helper function to handle authentication with timeout
async function authenticateWithTimeout(req) {
  // Get token from cookies or authorization header
  const token = req.cookies.token ||
               (req.headers.authorization && req.headers.authorization.split(' ')[1]);

  if (!token) {
    req.user = null;
    return; // Exit early
  }

  // Verify token without database lookup if possible
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret-key');

    // Extract user ID from token
    const userId = decoded.userId;

    // If we have a userId from the token, we can use it as a fallback
    // This allows basic authentication to work even if the database is unavailable
    req.user = {
      id: userId,
      // These fields will be populated from the database if available
      username: 'User',
      isGuest: false
    };
  } catch (jwtError) {
    console.error('JWT verification error:', jwtError);
    req.user = null;
    return; // Exit early if token is invalid
  }

  // Find session in database with a short timeout
  const pool = getPool();
  if (!pool) {
    console.warn('Database pool not available for authentication, using token data only');
    return; // Exit early, keeping the user from the token
  }

  // Get a client from the pool with a very short timeout
  let client;
  try {
    client = await Promise.race([
      pool.connect(),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Database connection timeout')), 500)
      )
    ]);
  } catch (connError) {
    console.error('Database connection error in authenticate middleware:', connError);
    return; // Exit early, keeping the user from the token
  }

  try {
    // Set a very short query timeout
    await client.query('SET statement_timeout = 500');

    // Use a simpler query that doesn't join tables for better performance
    const sessionResult = await client.query(
      'SELECT user_id FROM sessions WHERE token = $1 LIMIT 1',
      [token]
    );

    // If we found a session, get the user details
    if (sessionResult.rows.length > 0) {
      const userId = sessionResult.rows[0].user_id;

      // Get user details with a separate query
      const userResult = await client.query(
        'SELECT id, username, email, is_guest as "isGuest" FROM users WHERE id = $1 LIMIT 1',
        [userId]
      );

      if (userResult.rows.length > 0) {
        const user = userResult.rows[0];
        req.user = {
          id: user.id,
          username: user.username,
          email: user.email,
          isGuest: user.isGuest
        };
      }
    }
  } catch (dbError) {
    console.error('Database query error in authenticate middleware:', dbError);
    // We already set req.user from the token above, so we can continue
  } finally {
    // Always release the client back to the pool
    if (client) client.release();
  }

}

// Middleware to require authentication
const requireAuth = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
};

module.exports = { authenticate, requireAuth };
