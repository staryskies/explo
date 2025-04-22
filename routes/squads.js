// routes/squads.js
const express = require('express');
const { body, validationResult } = require('express-validator');
const { v4: uuidv4 } = require('uuid');
const { requireAuth } = require('../middleware/auth');

// Use the centralized database pool
const { getPool } = require('../lib/db-pool');

const router = express.Router();

// Helper function to generate a unique squad code
const generateSquadCode = () => {
  // Generate a 6-character alphanumeric code
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return code;
};

// Create a new squad
router.post('/', requireAuth, async (req, res) => {
  try {
    // Set a timeout to prevent long-running requests
    const timeout = setTimeout(() => {
      console.log('Squad creation timed out');
      if (!res.headersSent) {
        return res.status(504).json({ error: 'Request timed out. Please try again.' });
      }
    }, 4000); // 4 second timeout

    const pool = getPool();
    if (!pool) {
      clearTimeout(timeout);
      return res.status(500).json({ error: 'Database connection not available' });
    }

    // Generate a unique squad code - limit attempts to prevent infinite loops
    let code = generateSquadCode();
    let isUnique = false;
    let attempts = 0;
    const maxAttempts = 3;

    while (!isUnique && attempts < maxAttempts) {
      attempts++;
      try {
        // Check if code already exists
        const client = await pool.connect();
        try {
          const existingSquadResult = await client.query(
            'SELECT * FROM squads WHERE code = $1 LIMIT 1',
            [code]
          );

          if (existingSquadResult.rows.length === 0) {
            isUnique = true;
          } else {
            code = generateSquadCode(); // Generate a new code
          }
        } finally {
          client.release();
        }
      } catch (error) {
        console.error(`Error checking squad code (attempt ${attempts}):`, error);
        // Generate a new code and try again
        code = generateSquadCode();
      }
    }

    // If we couldn't generate a unique code after max attempts, use the last one
    // The chance of collision is very low

    // Create squad and add member in a transaction with timeout handling
    let client;
    let squad;

    try {
      client = await pool.connect();

      // Set statement timeout to prevent long-running queries
      await client.query('SET statement_timeout = 3000'); // 3 seconds

      await client.query('BEGIN');

      // Generate IDs
      const squadId = uuidv4();
      const membershipId = uuidv4();
      const now = new Date();

      // Insert squad - simplified query
      await client.query(
        `INSERT INTO squads (id, code, leader_id, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $4)`, // Use same timestamp for both
        [squadId, code, req.user.id, now]
      );

      // Insert squad member - simplified query
      await client.query(
        `INSERT INTO squad_members (id, squad_id, user_id, joined_at)
         VALUES ($1, $2, $3, $4)`,
        [membershipId, squadId, req.user.id, now]
      );

      // Create a minimal squad object instead of querying again
      squad = {
        id: squadId,
        code: code,
        leaderId: req.user.id,
        createdAt: now,
        members: [{
          id: req.user.id,
          username: req.user.username,
          isGuest: req.user.isGuest,
          joinedAt: now
        }]
      };

      await client.query('COMMIT');

      // Clear the timeout since we're done
      clearTimeout(timeout);
    } catch (error) {
      if (client) {
        try {
          await client.query('ROLLBACK');
        } catch (rollbackError) {
          console.error('Error during rollback:', rollbackError);
        }
      }
      throw error;
    } finally {
      if (client) {
        client.release();
      }
    }

    // Squad object is already formatted correctly, just return it
    res.status(201).json(squad);
  } catch (error) {
    // Clear the timeout if it exists
    if (timeout) clearTimeout(timeout);

    console.error('Create squad error:', error);

    // Provide more specific error messages
    if (error.code === '57014') {
      return res.status(504).json({ error: 'Database query timed out. Please try again.' });
    } else if (error.code === '08006' || error.code === '08001' || error.code === '08004') {
      return res.status(503).json({ error: 'Database connection issue. Please try again later.' });
    } else if (error.code === '23505') {
      return res.status(409).json({ error: 'Squad code already exists. Please try again.' });
    }

    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

// Join a squad by code
router.post('/join', requireAuth, [
  body('code').trim().isLength({ min: 6, max: 6 }).withMessage('Invalid squad code')
], async (req, res) => {
  // Set a timeout to prevent long-running requests
  const timeout = setTimeout(() => {
    console.log('Join squad timed out');
    if (!res.headersSent) {
      return res.status(504).json({ error: 'Request timed out. Please try again.' });
    }
  }, 3000); // 3 second timeout

  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      clearTimeout(timeout);
      return res.status(400).json({ errors: errors.array() });
    }

    const { code } = req.body;

    const pool = getPool();
    if (!pool) {
      clearTimeout(timeout);
      return res.status(500).json({ error: 'Database connection not available' });
    }

    // Get a client from the pool
    let client;
    try {
      client = await pool.connect();
    } catch (connError) {
      clearTimeout(timeout);
      console.error('Database connection error in join squad:', connError);
      return res.status(503).json({ error: 'Database connection issue. Please try again later.' });
    }

    try {
      // Set statement timeout to prevent long-running queries
      await client.query('SET statement_timeout = 2000'); // 2 seconds

      // Begin transaction
      await client.query('BEGIN');

      // Find squad
      const squadResult = await client.query(
        'SELECT * FROM squads WHERE code = $1 LIMIT 1',
        [code]
      );

      if (squadResult.rows.length === 0) {
        await client.query('ROLLBACK');
        clearTimeout(timeout);
        return res.status(404).json({ error: 'Squad not found' });
      }

      const squad = squadResult.rows[0];

      // Get squad members
      const membersResult = await client.query(
        'SELECT * FROM squad_members WHERE squad_id = $1',
        [squad.id]
      );

      const members = membersResult.rows;

      // Check if squad is full (max 4 members)
      if (members.length >= 4) {
        await client.query('ROLLBACK');
        clearTimeout(timeout);
        return res.status(400).json({ error: 'Squad is full' });
      }

      // Check if user is already a member
      const existingMember = members.find(member => member.user_id === req.user.id);
      if (existingMember) {
        await client.query('ROLLBACK');
        clearTimeout(timeout);
        return res.status(400).json({ error: 'You are already a member of this squad' });
      }

      // Add user to squad
      const now = new Date();
      await client.query(
        `INSERT INTO squad_members (id, squad_id, user_id, joined_at)
         VALUES ($1, $2, $3, $4)`,
        [uuidv4(), squad.id, req.user.id, now]
      );

      // Create a minimal squad object instead of querying again
      const formattedSquad = {
        id: squad.id,
        code: squad.code,
        leaderId: squad.leader_id,
        createdAt: squad.created_at,
        members: [...members.map(member => ({
          id: member.user_id,
          // We don't have username and isGuest here, but the client will refresh
          username: 'Member',
          isGuest: false,
          joinedAt: member.joined_at
        })), {
          id: req.user.id,
          username: req.user.username,
          isGuest: req.user.isGuest,
          joinedAt: now
        }]
      };

      await client.query('COMMIT');
      clearTimeout(timeout);
      res.json(formattedSquad);
    } catch (error) {
      // Rollback transaction on error
      if (client) {
        try {
          await client.query('ROLLBACK');
        } catch (rollbackError) {
          console.error('Error during rollback:', rollbackError);
        }
      }
      throw error;
    } finally {
      // Always release the client back to the pool
      if (client) client.release();
    }
  } catch (error) {
    // Clear the timeout if it exists
    if (timeout) clearTimeout(timeout);

    console.error('Join squad error:', error);

    // Provide more specific error messages
    if (error.code === '57014') {
      return res.status(504).json({ error: 'Database query timed out. Please try again.' });
    } else if (error.code === '08006' || error.code === '08001' || error.code === '08004') {
      return res.status(503).json({ error: 'Database connection issue. Please try again later.' });
    } else if (error.code === '23505') {
      return res.status(409).json({ error: 'You are already a member of this squad.' });
    }

    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

// Leave a squad
router.post('/:id/leave', requireAuth, async (req, res) => {
  // Set a timeout to prevent long-running requests
  const timeout = setTimeout(() => {
    console.log('Leave squad timed out');
    if (!res.headersSent) {
      return res.status(504).json({ error: 'Request timed out. Please try again.' });
    }
  }, 3000); // 3 second timeout

  try {
    const { id } = req.params;

    const pool = getPool();
    if (!pool) {
      clearTimeout(timeout);
      return res.status(500).json({ error: 'Database connection not available' });
    }

    // Get a client from the pool
    let client;
    try {
      client = await pool.connect();
    } catch (connError) {
      clearTimeout(timeout);
      console.error('Database connection error in leave squad:', connError);
      return res.status(503).json({ error: 'Database connection issue. Please try again later.' });
    }

    try {
      // Set statement timeout to prevent long-running queries
      await client.query('SET statement_timeout = 2000'); // 2 seconds

      // Begin transaction
      await client.query('BEGIN');

      // Find squad
      const squadResult = await client.query(
        'SELECT * FROM squads WHERE id = $1 LIMIT 1',
        [id]
      );

      if (squadResult.rows.length === 0) {
        await client.query('ROLLBACK');
        clearTimeout(timeout);
        return res.status(404).json({ error: 'Squad not found' });
      }

      const squad = squadResult.rows[0];

      // Get squad members
      const membersResult = await client.query(
        'SELECT * FROM squad_members WHERE squad_id = $1',
        [id]
      );

      const members = membersResult.rows;

      // Check if user is a member
      const member = members.find(member => member.user_id === req.user.id);
      if (!member) {
        await client.query('ROLLBACK');
        clearTimeout(timeout);
        return res.status(400).json({ error: 'You are not a member of this squad' });
      }

      // If user is the leader and there are other members, transfer leadership
      if (squad.leader_id === req.user.id && members.length > 1) {
        // Find another member to be the leader
        const newLeader = members.find(member => member.user_id !== req.user.id);

        // Update squad with new leader
        await client.query(
          'UPDATE squads SET leader_id = $1, updated_at = $2 WHERE id = $3',
          [newLeader.user_id, new Date(), id]
        );
      }

      // Remove user from squad
      await client.query(
        'DELETE FROM squad_members WHERE squad_id = $1 AND user_id = $2',
        [id, req.user.id]
      );

      // Check if there are any members left after the user leaves
      const remainingMembersResult = await client.query(
        'SELECT COUNT(*) as count FROM squad_members WHERE squad_id = $1',
        [id]
      );

      const remainingCount = parseInt(remainingMembersResult.rows[0].count, 10);

      // If no members left, delete the squad
      if (remainingCount === 0) {
        console.log(`No members left in squad ${id}, deleting squad`);

        // Delete any game states for this squad
        await client.query(
          'DELETE FROM game_states WHERE squad_id = $1',
          [id]
        );

        // Delete any messages for this squad
        await client.query(
          'DELETE FROM messages WHERE squad_id = $1',
          [id]
        );

        // Delete the squad
        await client.query(
          'DELETE FROM squads WHERE id = $1',
          [id]
        );

        await client.query('COMMIT');
        clearTimeout(timeout);
        return res.json({ message: 'Squad deleted' });
      }

      await client.query('COMMIT');
      clearTimeout(timeout);
      res.json({ message: 'Left squad successfully' });
    } catch (error) {
      // Rollback transaction on error
      if (client) {
        try {
          await client.query('ROLLBACK');
        } catch (rollbackError) {
          console.error('Error during rollback:', rollbackError);
        }
      }
      throw error;
    } finally {
      // Always release the client back to the pool
      if (client) client.release();
    }
  } catch (error) {
    // Clear the timeout if it exists
    if (timeout) clearTimeout(timeout);

    console.error('Leave squad error:', error);

    // Provide more specific error messages
    if (error.code === '57014') {
      return res.status(504).json({ error: 'Database query timed out. Please try again.' });
    } else if (error.code === '08006' || error.code === '08001' || error.code === '08004') {
      return res.status(503).json({ error: 'Database connection issue. Please try again later.' });
    }

    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

// Get public squads list
router.get('/public', requireAuth, async (req, res) => {
  // Set a timeout to prevent long-running requests
  const timeout = setTimeout(() => {
    console.log('Get public squads timed out');
    if (!res.headersSent) {
      return res.status(504).json({ error: 'Request timed out. Please try again.' });
    }
  }, 3000); // 3 second timeout

  try {
    const pool = getPool();
    if (!pool) {
      clearTimeout(timeout);
      return res.status(500).json({ error: 'Database connection not available' });
    }

    // Get a client from the pool
    const client = await pool.connect();

    try {
      // Set statement timeout to prevent long-running queries
      await client.query('SET statement_timeout = 2000'); // 2 seconds

      // Simplified query with fewer columns and smaller result set
      const squadsResult = await client.query(
        `SELECT s.id, s.code, s.leader_id as "leaderId", s.created_at as "createdAt",
                COUNT(sm.id) as "memberCount"
         FROM squads s
         JOIN squad_members sm ON s.id = sm.squad_id
         GROUP BY s.id
         HAVING COUNT(sm.id) < 4
         ORDER BY s.created_at DESC
         LIMIT 5`
      );

      const squads = squadsResult.rows;

      // Clear the timeout since we're done
      clearTimeout(timeout);

      return res.json({ squads });
    } finally {
      // Always release the client back to the pool
      client.release();
    }
  } catch (error) {
    // Clear the timeout if it exists
    if (timeout) clearTimeout(timeout);

    console.error('Get public squads error:', error);

    // Provide more specific error messages
    if (error.code === '57014') {
      return res.status(504).json({ error: 'Database query timed out. Please try again.' });
    } else if (error.code === '08006' || error.code === '08001' || error.code === '08004') {
      return res.status(503).json({ error: 'Database connection issue. Please try again later.' });
    }

    return res.status(500).json({ error: 'Failed to get squads', details: error.message });
  }
});

// Import the request queue and cache
const requestQueue = require('../lib/request-queue');
const cache = require('../lib/cache');

// Get squad state
router.get('/:id/state', requireAuth, async (req, res) => {
  // Flag to track if response has been sent
  let responseSent = false;

  // Helper function to send response only if not already sent
  const sendResponse = (status, data) => {
    if (!responseSent) {
      responseSent = true;
      if (timeout) clearTimeout(timeout);
      res.status(status).json(data);
    }
  };

  // Set a timeout to prevent long-running requests
  const timeout = setTimeout(() => {
    console.log('Get squad state timed out');
    sendResponse(504, { error: 'Request timed out. Please try again.' });
  }, 12000); // Increased to 12 seconds for Neon

  try {
    const { id } = req.params;
    const { t: timestamp } = req.query; // Get timestamp from query for cache busting

    // Validate user ID from token
    if (!req.user || !req.user.id) {
      return sendResponse(401, { error: 'Authentication required' });
    }

    // Generate cache key
    const cacheKey = `squad_state:${id}`;

    // Check if we have a cached version
    const cachedSquad = cache.get(cacheKey);
    if (cachedSquad) {
      console.log(`Using cached squad state for ${id}`);
      return sendResponse(200, cachedSquad);
    }

    const pool = getPool();
    if (!pool) {
      return sendResponse(500, { error: 'Database connection not available' });
    }

    // Use the request queue for database operations
    try {
      // Enqueue the database operation with priority 2 (higher than normal)
      const squad = await requestQueue.enqueueRequest(async () => {
        let client;
        try {
          // Get a client from the pool with a timeout appropriate for Neon
          client = await Promise.race([
            pool.connect(),
            new Promise((_, reject) =>
              setTimeout(() => reject(new Error('Database connection timeout')), 5000)
            )
          ]);

          // Set a query timeout appropriate for Neon
          await client.query('SET statement_timeout = 8000');

          // Begin transaction for consistent reads
          await client.query('BEGIN');

          // Check if user is a member of the squad
          const membershipResult = await client.query(
            'SELECT * FROM squad_members WHERE squad_id = $1 AND user_id = $2 LIMIT 1',
            [id, req.user.id]
          );

          if (membershipResult.rows.length === 0) {
            await client.query('ROLLBACK');
            throw new Error('You are not a member of this squad');
          }

          // Get squad data
          const squadResult = await client.query(
            `SELECT s.id, s.code, s.leader_id as "leaderId", s.created_at as "createdAt"
             FROM squads s
             WHERE s.id = $1`,
            [id]
          );

          if (squadResult.rows.length === 0) {
            await client.query('ROLLBACK');
            throw new Error('Squad not found');
          }

          const squad = squadResult.rows[0];

          // Get squad members
          const membersResult = await client.query(
            `SELECT sm.joined_at as "joinedAt", u.id, u.username, u.is_guest as "isGuest"
             FROM squad_members sm
             JOIN users u ON sm.user_id = u.id
             WHERE sm.squad_id = $1`,
            [id]
          );

          // Add members to squad
          squad.members = membersResult.rows;

          // Get latest game state
          const gameStateResult = await client.query(
            `SELECT state FROM game_states
             WHERE squad_id = $1
             ORDER BY created_at DESC
             LIMIT 1`,
            [id]
          );

          if (gameStateResult.rows.length > 0) {
            squad.gameState = gameStateResult.rows[0].state;
          }

          // Commit transaction
          await client.query('COMMIT');

          return squad;
        } catch (error) {
          // Rollback transaction on error
          if (client) {
            try {
              await client.query('ROLLBACK');
            } catch (rollbackError) {
              console.error('Error during rollback:', rollbackError);
            }
          }
          throw error;
        } finally {
          // Always release the client back to the pool
          if (client) client.release();
        }
      }, 2); // Priority 2 (higher)

      // Cache the result for 5 seconds
      cache.set(cacheKey, squad, 5000);

      return sendResponse(200, squad);
    } catch (queueError) {
      console.error('Queue error in get squad state:', queueError);

      if (queueError.message === 'You are not a member of this squad') {
        return sendResponse(403, { error: 'You are not a member of this squad' });
      }

      if (queueError.message === 'Squad not found') {
        return sendResponse(404, { error: 'Squad not found' });
      }

      return sendResponse(503, { error: 'Database connection issue. Please try again later.' });
    }
  } catch (error) {
    console.error('Get squad state error:', error);

    // Provide more specific error messages
    if (error.code === '57014') {
      return sendResponse(504, { error: 'Database query timed out. Please try again.' });
    } else if (error.code === '08006' || error.code === '08001' || error.code === '08004') {
      return sendResponse(503, { error: 'Database connection issue. Please try again later.' });
    }

    return sendResponse(500, { error: 'Failed to get squad state', details: error.message });
  }
});

// Update game state
router.post('/:id/game-state', requireAuth, async (req, res) => {
  // Flag to track if response has been sent
  let responseSent = false;

  // Helper function to send response only if not already sent
  const sendResponse = (status, data) => {
    if (!responseSent) {
      responseSent = true;
      if (timeout) clearTimeout(timeout);
      res.status(status).json(data);
    }
  };

  // Set a timeout to prevent long-running requests
  const timeout = setTimeout(() => {
    console.log('Update game state timed out');
    sendResponse(504, { error: 'Request timed out. Please try again.' });
  }, 12000); // Increased to 12 seconds for Neon

  try {
    const { id } = req.params;
    const { gameState } = req.body;

    if (!gameState) {
      return sendResponse(400, { error: 'Game state is required' });
    }

    // Generate cache key for invalidation
    const cacheKey = `squad_state:${id}`;

    const pool = getPool();
    if (!pool) {
      return sendResponse(500, { error: 'Database connection not available' });
    }

    // Use the request queue for database operations
    try {
      // Enqueue the database operation with priority 1 (normal)
      await requestQueue.enqueueRequest(async () => {
        let client;
        try {
          // Get a client from the pool with a timeout appropriate for Neon
          client = await Promise.race([
            pool.connect(),
            new Promise((_, reject) =>
              setTimeout(() => reject(new Error('Database connection timeout')), 5000)
            )
          ]);

          // Set a query timeout appropriate for Neon
          await client.query('SET statement_timeout = 8000');

          // Begin transaction
          await client.query('BEGIN');

          // Check if user is a member of the squad
          const membershipResult = await client.query(
            'SELECT * FROM squad_members WHERE squad_id = $1 AND user_id = $2 LIMIT 1',
            [id, req.user.id]
          );

          if (membershipResult.rows.length === 0) {
            await client.query('ROLLBACK');
            throw new Error('You are not a member of this squad');
          }

          // Save game state
          await client.query(
            `INSERT INTO game_states (id, squad_id, user_id, state, created_at)
             VALUES ($1, $2, $3, $4, $5)`,
            [require('uuid').v4(), id, req.user.id, gameState, new Date()]
          );

          // Commit transaction
          await client.query('COMMIT');
        } catch (error) {
          // Rollback transaction on error
          if (client) {
            try {
              await client.query('ROLLBACK');
            } catch (rollbackError) {
              console.error('Error during rollback:', rollbackError);
            }
          }
          throw error;
        } finally {
          // Always release the client back to the pool
          if (client) client.release();
        }
      }, 1); // Priority 1 (normal)

      // Invalidate cache
      cache.delete(cacheKey);

      return sendResponse(200, { success: true });
    } catch (queueError) {
      console.error('Queue error in update game state:', queueError);

      if (queueError.message === 'You are not a member of this squad') {
        return sendResponse(403, { error: 'You are not a member of this squad' });
      }

      return sendResponse(503, { error: 'Database connection issue. Please try again later.' });
    }
  } catch (error) {
    console.error('Update game state error:', error);
    return sendResponse(500, { error: 'Failed to update game state' });
  }
});

// Get user's current squad
router.get('/my-squad', requireAuth, async (req, res) => {
  // Set a timeout to prevent long-running requests
  const timeout = setTimeout(() => {
    console.log('Get my squad timed out');
    if (!res.headersSent) {
      return res.status(504).json({ error: 'Request timed out. Please try again.' });
    }
  }, 2000); // 2 second timeout

  try {
    // Validate user ID from token
    if (!req.user || !req.user.id) {
      clearTimeout(timeout);
      return res.status(401).json({ error: 'Authentication required' });
    }

    const pool = getPool();
    if (!pool) {
      clearTimeout(timeout);
      return res.status(500).json({ error: 'Database connection not available' });
    }

    // Get a client from the pool with a short timeout
    let client;
    try {
      client = await Promise.race([
        pool.connect(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Database connection timeout')), 500)
        )
      ]);
    } catch (connError) {
      clearTimeout(timeout);
      console.error('Database connection error in get my squad:', connError);
      return res.status(503).json({ error: 'Database connection issue. Please try again later.' });
    }

    try {
      // Set a short query timeout
      await client.query('SET statement_timeout = 1000');

      // Find user's squad membership
      const membershipResult = await client.query(
        'SELECT squad_id FROM squad_members WHERE user_id = $1 LIMIT 1',
        [req.user.id]
      );

      if (membershipResult.rows.length === 0) {
        clearTimeout(timeout);
        return res.json({ squad: null });
      }

      const squadId = membershipResult.rows[0].squad_id;

      // Get squad with a simplified query
      const squadResult = await client.query(
        `SELECT id, code, leader_id as "leaderId", created_at as "createdAt"
         FROM squads
         WHERE id = $1`,
        [squadId]
      );

      if (squadResult.rows.length === 0) {
        clearTimeout(timeout);
        return res.json({ squad: null });
      }

      const squad = squadResult.rows[0];

      // Get members with a simplified query
      const membersResult = await client.query(
        `SELECT sm.joined_at as "joinedAt", u.id, u.username, u.is_guest as "isGuest"
         FROM squad_members sm
         JOIN users u ON sm.user_id = u.id
         WHERE sm.squad_id = $1
         LIMIT 4`, // Limit to 4 members max
        [squad.id]
      );

      // Add members to squad
      squad.members = membersResult.rows;

      clearTimeout(timeout);
      res.json({ squad });
    } catch (error) {
      throw error;
    } finally {
      // Always release the client back to the pool
      if (client) client.release();
    }
  } catch (error) {
    // Clear the timeout if it exists
    if (timeout) clearTimeout(timeout);

    console.error('Get my squad error:', error);

    // Provide more specific error messages
    if (error.code === '57014') {
      return res.status(504).json({ error: 'Database query timed out. Please try again.' });
    } else if (error.code === '08006' || error.code === '08001' || error.code === '08004') {
      return res.status(503).json({ error: 'Database connection issue. Please try again later.' });
    }

    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

module.exports = router;
