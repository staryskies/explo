// middleware/auth.js
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');

// Create a connection pool
let pool;

// Parse the connection string
if (process.env.DATABASE_URL) {
  const url = new URL(process.env.DATABASE_URL);
  const connectionConfig = {
    host: url.hostname,
    port: url.port,
    database: url.pathname.split('/')[1],
    user: url.username,
    password: url.password,
    ssl: true,
    connectionTimeoutMillis: 10000 // 10 seconds
  };

  // Create a new pool
  pool = new Pool(connectionConfig);
} else {
  console.error('DATABASE_URL environment variable is not set');
  pool = null;
}

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
    if (!pool) {
      req.user = null;
      return next();
    }

    const sessionResult = await pool.query(
      `SELECT s.*, u.id as user_id, u.username, u.email, u.is_guest as "isGuest"
       FROM sessions s
       JOIN users u ON s.user_id = u.id
       WHERE s.token = $1`,
      [token]
    );

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
