// routes/auth.js
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { body, validationResult } = require('express-validator');
const prisma = require('../lib/prisma');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// Helper function to create a session
const createSession = async (userId) => {
  // Create expiration date (30 days from now)
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30);

  // Generate token
  const token = jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '30d' });

  // Create session in database
  const session = await prisma.session.create({
    data: {
      userId,
      token,
      expiresAt
    }
  });

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

    // Check if username already exists
    const existingUser = await prisma.user.findUnique({
      where: { username }
    });

    if (existingUser) {
      return res.status(400).json({ error: 'Username already taken' });
    }

    // Check if email already exists (if provided)
    if (email) {
      const existingEmail = await prisma.user.findUnique({
        where: { email }
      });

      if (existingEmail) {
        return res.status(400).json({ error: 'Email already registered' });
      }
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create user
    const user = await prisma.user.create({
      data: {
        username,
        email,
        passwordHash,
        playerData: {
          create: {
            gameData: {
              // Default player data
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
            }
          }
        }
      }
    });

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

    // Find user
    const user = await prisma.user.findUnique({
      where: { username }
    });

    if (!user || user.isGuest) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.passwordHash);
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
    // Generate random username
    const guestUsername = `Guest_${Math.floor(Math.random() * 10000)}`;

    // Create guest user
    const user = await prisma.user.create({
      data: {
        username: guestUsername,
        isGuest: true,
        playerData: {
          create: {
            gameData: {
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
            }
          }
        }
      }
    });

    // Create session
    const { token, expiresAt } = await createSession(user.id);

    // Set cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      expires: expiresAt
    });

    // Return user data
    res.status(201).json({
      user: {
        id: user.id,
        username: user.username,
        isGuest: user.isGuest
      },
      token
    });
  } catch (error) {
    console.error('Guest creation error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Logout user
router.post('/logout', async (req, res) => {
  try {
    // Get token from cookies or authorization header
    const token = req.cookies.token || 
                 (req.headers.authorization && req.headers.authorization.split(' ')[1]);
    
    if (token) {
      // Delete session from database
      await prisma.session.deleteMany({
        where: { token }
      });
    }

    // Clear cookie
    res.clearCookie('token');
    
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get current user
router.get('/me', requireAuth, async (req, res) => {
  try {
    // Get player data
    const playerData = await prisma.playerData.findUnique({
      where: { userId: req.user.id }
    });

    res.json({
      user: {
        id: req.user.id,
        username: req.user.username,
        email: req.user.email,
        isGuest: req.user.isGuest
      },
      playerData: playerData ? playerData.gameData : null
    });
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

    // Check if username already exists
    const existingUser = await prisma.user.findUnique({
      where: { username }
    });

    if (existingUser && existingUser.id !== req.user.id) {
      return res.status(400).json({ error: 'Username already taken' });
    }

    // Check if email already exists (if provided)
    if (email) {
      const existingEmail = await prisma.user.findUnique({
        where: { email }
      });

      if (existingEmail && existingEmail.id !== req.user.id) {
        return res.status(400).json({ error: 'Email already registered' });
      }
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        username,
        email,
        passwordHash,
        isGuest: false
      }
    });

    res.json({
      user: {
        id: updatedUser.id,
        username: updatedUser.username,
        email: updatedUser.email,
        isGuest: updatedUser.isGuest
      }
    });
  } catch (error) {
    console.error('Convert guest error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
