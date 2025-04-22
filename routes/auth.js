// routes/auth.js
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { body, validationResult } = require('express-validator');
const { requireAuth } = require('../middleware/auth');

// Use the centralized database pool
const { getPool } = require('../lib/db-pool');

const router = express.Router();

// Helper function to create a session
const createSession = async (userId) => {
  // Create expiration date (30 days from now)
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30);

  // Generate token
  const token = jwt.sign({ userId }, process.env.JWT_SECRET || 'fallback-secret-key', { expiresIn: '30d' });

  // Try to create session in database with retry logic
  const pool = getPool();
  if (pool) {
    let retries = 3;
    let success = false;

    while (retries > 0 && !success) {
      let client = null;
      try {
        client = await pool.connect();
        await client.query(
          `INSERT INTO sessions (id, user_id, token, expires_at, created_at)
           VALUES ($1, $2, $3, $4, $5)`,
          [uuidv4(), userId, token, expiresAt, new Date()]
        );
        success = true;
      } catch (error) {
        console.error(`Error creating session (retries left: ${retries-1}):`, error);
        retries--;
        // Wait before retrying
        if (retries > 0) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      } finally {
        if (client) client.release();
      }
    }

    if (!success) {
      console.warn('Failed to create session in database after multiple retries');
    }
  } else {
    console.warn('Database pool not available, skipping session creation in database');
  }

  return { token, expiresAt };
};

// Register a new user
router.post('/signup', [
  body('username').trim().isLength({ min: 3, max: 20 }).withMessage('Username must be between 3 and 20 characters'),
  body('email').optional().isEmail().withMessage('Invalid email address'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], async (req, res) => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, email, password } = req.body;

    // Get database pool
    const pool = getPool();
    if (!pool) {
      return res.status(500).json({ error: 'Database connection not available' });
    }

    // Check if username already exists
    const existingUserResult = await pool.query(
      'SELECT * FROM users WHERE username = $1 LIMIT 1',
      [username]
    );

    if (existingUserResult.rows.length > 0) {
      return res.status(400).json({ error: 'Username already taken' });
    }

    // Check if email already exists (if provided)
    if (email) {
      const existingEmailResult = await pool.query(
        'SELECT * FROM users WHERE email = $1 LIMIT 1',
        [email]
      );

      if (existingEmailResult.rows.length > 0) {
        return res.status(400).json({ error: 'Email already registered' });
      }
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Generate IDs
    const userId = uuidv4();
    const playerDataId = uuidv4();

    // Default game data
    const gameData = {
      silver: 1000,
      highScore: 0,
      gamesPlayed: 0,
      wavesCompleted: 0,
      enemiesKilled: 0,
      highestWaveCompleted: 0,
      completedDifficulties: [],
      towerRolls: 0,
      variantRolls: 0,
      towerPity: {
        rare: 0,
        epic: 0,
        legendary: 0,
        mythic: 0,
        divine: 0
      },
      variantPity: {
        rare: 0,
        epic: 0,
        legendary: 0,
        divine: 0
      },
      unlockedTowers: ['basic'],
      towerVariants: {
        basic: ['normal'],
        archer: [],
        cannon: [],
        sniper: [],
        freeze: [],
        mortar: [],
        laser: [],
        tesla: [],
        flame: [],
        missile: [],
        poison: [],
        vortex: [],
        archangel: []
      }
    };

    // Create user in a transaction
    const client = await pool.connect();
    let user;
    try {
      await client.query('BEGIN');

      // Insert user
      await client.query(
        `INSERT INTO users (id, username, email, password_hash, is_guest, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [userId, username, email, passwordHash, false, new Date(), new Date()]
      );

      // Insert player data
      await client.query(
        `INSERT INTO player_data (id, user_id, game_data, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5)`,
        [playerDataId, userId, JSON.stringify(gameData), new Date(), new Date()]
      );

      await client.query('COMMIT');

      // Get the created user
      const userResult = await client.query(
        'SELECT * FROM users WHERE id = $1',
        [userId]
      );

      user = userResult.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

    // Create session
    const { token, expiresAt } = await createSession(user.id);

    // Set cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      expires: expiresAt
    });

    // Return user data (without password)
    res.status(201).json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        isGuest: user.isGuest
      },
      token
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Login user
router.post('/login', [
  body('username').trim().not().isEmpty().withMessage('Username is required'),
  body('password').not().isEmpty().withMessage('Password is required')
], async (req, res) => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, password } = req.body;

    // Get database pool
    const pool = getPool();
    if (!pool) {
      return res.status(500).json({ error: 'Database connection not available' });
    }

    // Find user
    const userResult = await pool.query(
      'SELECT * FROM users WHERE username = $1 LIMIT 1',
      [username]
    );

    if (userResult.rows.length === 0 || userResult.rows[0].is_guest) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = userResult.rows[0];

    // Check password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Create session
    const { token, expiresAt } = await createSession(user.id);

    // Set cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      expires: expiresAt
    });

    // Return user data
    res.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        isGuest: user.isGuest
      },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create guest user
router.post('/guest', async (req, res) => {
  try {
    // Generate random username with more entropy to avoid collisions
    const guestUsername = `Guest_${Math.random().toString(36).substring(2, 10)}_${Date.now()}`;

    // Create guest user with better error handling
    let user;
    try {
      // Generate user ID
      const userId = uuidv4();

      // Get database pool
      const pool = getPool();
      if (!pool) {
        console.warn('Database connection not available, creating guest user without database');
        // Create a fallback user object when database is unavailable
        user = {
          id: userId,
          username: guestUsername,
          is_guest: true,
          created_at: new Date(),
          updated_at: new Date(),
          isGuest: true // Add this for convenience
        };
        return; // Skip database operations
      }

      // Get a client from the pool
      const client = await pool.connect();

      try {
        // Begin transaction
        await client.query('BEGIN');

        // Insert user
        await client.query(
          `INSERT INTO users (id, username, is_guest, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5)`,
          [userId, guestUsername, true, new Date(), new Date()]
        );

        // Insert player data
        const gameData = {
                  // Default player data for guests
                  silver: 1000,
                  highScore: 0,
                  gamesPlayed: 0,
                  wavesCompleted: 0,
                  enemiesKilled: 0,
                  highestWaveCompleted: 0,
                  completedDifficulties: [],
                  towerRolls: 0,
                  variantRolls: 0,
                  towerPity: {
                    rare: 0,
                    epic: 0,
                    legendary: 0,
                    mythic: 0,
                    divine: 0
                  },
                  variantPity: {
                    rare: 0,
                    epic: 0,
                    legendary: 0,
                    divine: 0
                  },
                  unlockedTowers: ['basic'],
                  towerVariants: {
                    basic: ['normal'],
                    archer: [],
                    cannon: [],
                    sniper: [],
                    freeze: [],
                    mortar: [],
                    laser: [],
                    tesla: [],
                    flame: [],
                    missile: [],
                    poison: [],
                    vortex: [],
                    archangel: []
                  }
                };

        // Insert player data
        await client.query(
          `INSERT INTO player_data (id, user_id, game_data, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5)`,
          [uuidv4(), userId, JSON.stringify(gameData), new Date(), new Date()]
        );

        // Get the user for the response
        const userResult = await client.query(
          'SELECT * FROM users WHERE id = $1',
          [userId]
        );

        // Commit transaction
        await client.query('COMMIT');

        user = userResult.rows[0];
      } catch (error) {
        // Rollback transaction on error
        await client.query('ROLLBACK');
        throw error;
      } finally {
        // Always release the client back to the pool
        client.release();
      }
    } catch (dbError) {
      console.error('Database error creating guest user:', dbError);
      return res.status(500).json({
        error: 'Database error creating guest user',
        details: dbError.message,
        code: dbError.code || 'UNKNOWN'
      });
    }

    // Create session with better error handling
    let token, expiresAt;
    try {
      const sessionData = await createSession(user.id);
      token = sessionData.token;
      expiresAt = sessionData.expiresAt;
    } catch (sessionError) {
      console.error('Error creating session:', sessionError);
      // Continue anyway - the user is created, we can still generate a token
      // Generate a fallback token
      token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET || 'your-secret-key', {
        expiresIn: '7d'
      });
      expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    }

    // Set cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      expires: expiresAt
    });

    // Return user data
    return res.status(201).json({
      user: {
        id: user.id,
        username: user.username,
        isGuest: user.isGuest
      },
      token
    });
  } catch (error) {
    console.error('Guest creation error:', error);
    // Provide more detailed error message
    let errorMessage = 'Server error';
    if (error.code === 'P2002') {
      errorMessage = 'Username already exists. Please try again.';
    } else if (error.code === 'P1001') {
      errorMessage = 'Database connection error. Please try again later.';
    }
    return res.status(500).json({
      error: errorMessage,
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Logout user
router.post('/logout', async (req, res) => {
  try {
    // Get token from cookies or authorization header
    const token = req.cookies.token ||
                 (req.headers.authorization && req.headers.authorization.split(' ')[1]);

    // Get database pool
    const pool = getPool();
    if (token && pool) {
      // Delete session from database
      const client = await pool.connect();
      try {
        await client.query(
          'DELETE FROM sessions WHERE token = $1',
          [token]
        );
      } finally {
        client.release();
      }
    }

    // Clear cookie
    res.clearCookie('token');

    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Simple in-memory cache for user data
const userCache = new Map();
const USER_CACHE_TTL = 60000; // 1 minute

// Get current user
router.get('/me', requireAuth, async (req, res) => {
  // Performance monitoring
  const startTime = Date.now();
  try {
    // Check cache first
    const cacheKey = `user:${req.user.id}`;
    const cachedData = userCache.get(cacheKey);

    if (cachedData) {
      // Log cache hit and return cached data
      const duration = Date.now() - startTime;
      console.log(`/me endpoint cache hit (${duration}ms)`);
      return res.json(cachedData);
    }

    // Get database pool
    const pool = getPool();
    if (!pool) {
      return res.status(500).json({ error: 'Database connection not available' });
    }

    // Get player data
    const client = await pool.connect();
    let playerDataResult;
    try {
      playerDataResult = await client.query(
        'SELECT * FROM player_data WHERE user_id = $1 LIMIT 1',
        [req.user.id]
      );
    } finally {
      client.release();
    }

    const playerData = playerDataResult.rows[0];

    // Prepare response data
    const responseData = {
      user: {
        id: req.user.id,
        username: req.user.username,
        email: req.user.email,
        isGuest: req.user.isGuest
      },
      playerData: playerData ? playerData.game_data : null
    };

    // Cache the response
    userCache.set(cacheKey, responseData);

    // Set timeout to remove from cache after TTL
    setTimeout(() => {
      userCache.delete(cacheKey);
    }, USER_CACHE_TTL);

    // Log performance
    const duration = Date.now() - startTime;
    console.log(`/me endpoint database query (${duration}ms)`);

    // Send response
    res.json(responseData);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Convert guest to registered user
router.post('/convert-guest', requireAuth, [
  body('username').trim().isLength({ min: 3, max: 20 }).withMessage('Username must be between 3 and 20 characters'),
  body('email').optional().isEmail().withMessage('Invalid email address'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], async (req, res) => {
  try {
    // Check if user is a guest
    if (!req.user.isGuest) {
      return res.status(400).json({ error: 'Only guest accounts can be converted' });
    }

    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, email, password } = req.body;

    // Get database pool
    const pool = getPool();
    if (!pool) {
      return res.status(500).json({ error: 'Database connection not available' });
    }

    // Get a client from the pool
    const client = await pool.connect();
    let existingUserResult, existingEmailResult, updateResult;

    try {
      // Check if username already exists
      existingUserResult = await client.query(
        'SELECT * FROM users WHERE username = $1 LIMIT 1',
        [username]
      );

      if (existingUserResult.rows.length > 0 && existingUserResult.rows[0].id !== req.user.id) {
        client.release();
        return res.status(400).json({ error: 'Username already taken' });
      }

      // Check if email already exists (if provided)
      if (email) {
        existingEmailResult = await client.query(
          'SELECT * FROM users WHERE email = $1 LIMIT 1',
          [email]
        );

        if (existingEmailResult.rows.length > 0 && existingEmailResult.rows[0].id !== req.user.id) {
          client.release();
          return res.status(400).json({ error: 'Email already registered' });
        }
      }

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);

      // Update user
      updateResult = await client.query(
        `UPDATE users
         SET username = $1, email = $2, password_hash = $3, is_guest = $4, updated_at = $5
         WHERE id = $6
         RETURNING *`,
        [username, email, passwordHash, false, new Date(), req.user.id]
      );
    } finally {
      client.release();
    }

    const updatedUser = updateResult.rows[0];

    res.json({
      user: {
        id: updatedUser.id,
        username: updatedUser.username,
        email: updatedUser.email,
        isGuest: updatedUser.is_guest
      }
    });
  } catch (error) {
    console.error('Convert guest error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
