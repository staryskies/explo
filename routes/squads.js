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
    const pool = getPool();
    if (!pool) {
      return res.status(500).json({ error: 'Database connection not available' });
    }

    // Generate a unique squad code
    let code;
    let isUnique = false;

    while (!isUnique) {
      code = generateSquadCode();

      // Check if code already exists
      const existingSquadResult = await pool.query(
        'SELECT * FROM squads WHERE code = $1 LIMIT 1',
        [code]
      );

      if (existingSquadResult.rows.length === 0) {
        isUnique = true;
      }
    }

    // Create squad and add member in a transaction
    const client = await pool.connect();
    let squad;

    try {
      await client.query('BEGIN');

      // Generate IDs
      const squadId = uuidv4();
      const membershipId = uuidv4();
      const now = new Date();

      // Insert squad
      await client.query(
        `INSERT INTO squads (id, code, leader_id, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5)`,
        [squadId, code, req.user.id, now, now]
      );

      // Insert squad member
      await client.query(
        `INSERT INTO squad_members (id, squad_id, user_id, joined_at)
         VALUES ($1, $2, $3, $4)`,
        [membershipId, squadId, req.user.id, now]
      );

      // Get squad with members
      const squadResult = await client.query(
        `SELECT s.id, s.code, s.leader_id as "leaderId", s.created_at as "createdAt"
         FROM squads s
         WHERE s.id = $1`,
        [squadId]
      );

      squad = squadResult.rows[0];

      // Get members
      const membersResult = await client.query(
        `SELECT sm.joined_at as "joinedAt", u.id, u.username, u.is_guest as "isGuest"
         FROM squad_members sm
         JOIN users u ON sm.user_id = u.id
         WHERE sm.squad_id = $1`,
        [squadId]
      );

      // Add members to squad
      squad.members = membersResult.rows;

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

    // Format response
    const formattedSquad = {
      id: squad.id,
      code: squad.code,
      leaderId: squad.leaderId,
      createdAt: squad.createdAt,
      members: squad.members.map(member => ({
        id: member.id,
        username: member.username,
        isGuest: member.isguest,
        joinedAt: member.joinedat
      }))
    };

    res.status(201).json(formattedSquad);
  } catch (error) {
    console.error('Create squad error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Join a squad by code
router.post('/join', requireAuth, [
  body('code').trim().isLength({ min: 6, max: 6 }).withMessage('Invalid squad code')
], async (req, res) => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { code } = req.body;

    const pool = getPool();
    if (!pool) {
      return res.status(500).json({ error: 'Database connection not available' });
    }

    // Find squad
    const squadResult = await pool.query(
      'SELECT * FROM squads WHERE code = $1 LIMIT 1',
      [code]
    );

    if (squadResult.rows.length === 0) {
      return res.status(404).json({ error: 'Squad not found' });
    }

    const squad = squadResult.rows[0];

    // Get squad members
    const membersResult = await pool.query(
      'SELECT * FROM squad_members WHERE squad_id = $1',
      [squad.id]
    );

    const members = membersResult.rows;

    // Check if squad is full (max 4 members)
    if (members.length >= 4) {
      return res.status(400).json({ error: 'Squad is full' });
    }

    // Check if user is already a member
    const existingMember = members.find(member => member.user_id === req.user.id);
    if (existingMember) {
      return res.status(400).json({ error: 'You are already a member of this squad' });
    }

    // Add user to squad
    await pool.query(
      `INSERT INTO squad_members (id, squad_id, user_id, joined_at)
       VALUES ($1, $2, $3, $4)`,
      [uuidv4(), squad.id, req.user.id, new Date()]
    );

    // Get updated squad with members
    const updatedSquadResult = await pool.query(
      `SELECT s.id, s.code, s.leader_id as "leaderId", s.created_at as "createdAt"
       FROM squads s
       WHERE s.id = $1`,
      [squad.id]
    );

    const updatedSquad = updatedSquadResult.rows[0];

    // Get members
    const updatedMembersResult = await pool.query(
      `SELECT sm.joined_at as "joinedAt", u.id, u.username, u.is_guest as "isGuest"
       FROM squad_members sm
       JOIN users u ON sm.user_id = u.id
       WHERE sm.squad_id = $1`,
      [squad.id]
    );

    // Add members to squad
    updatedSquad.members = updatedMembersResult.rows;

    // Format response
    const formattedSquad = {
      id: updatedSquad.id,
      code: updatedSquad.code,
      leaderId: updatedSquad.leaderId,
      createdAt: updatedSquad.createdAt,
      members: updatedSquad.members.map(member => ({
        id: member.id,
        username: member.username,
        isGuest: member.isguest,
        joinedAt: member.joinedat
      }))
    };

    res.json(formattedSquad);
  } catch (error) {
    console.error('Join squad error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Leave a squad
router.post('/:id/leave', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const pool = getPool();
    if (!pool) {
      return res.status(500).json({ error: 'Database connection not available' });
    }

    // Find squad
    const squadResult = await pool.query(
      'SELECT * FROM squads WHERE id = $1 LIMIT 1',
      [id]
    );

    if (squadResult.rows.length === 0) {
      return res.status(404).json({ error: 'Squad not found' });
    }

    const squad = squadResult.rows[0];

    // Get squad members
    const membersResult = await pool.query(
      'SELECT * FROM squad_members WHERE squad_id = $1',
      [id]
    );

    const members = membersResult.rows;

    // Check if user is a member
    const member = members.find(member => member.user_id === req.user.id);
    if (!member) {
      return res.status(400).json({ error: 'You are not a member of this squad' });
    }

    // If user is the leader and there are other members, transfer leadership
    if (squad.leader_id === req.user.id && members.length > 1) {
      // Find another member to be the leader
      const newLeader = members.find(member => member.user_id !== req.user.id);

      // Update squad with new leader
      await pool.query(
        'UPDATE squads SET leader_id = $1, updated_at = $2 WHERE id = $3',
        [newLeader.user_id, new Date(), id]
      );
    }

    // Remove user from squad
    await pool.query(
      'DELETE FROM squad_members WHERE squad_id = $1 AND user_id = $2',
      [id, req.user.id]
    );

    // Check if there are any members left after the user leaves
    const remainingMembersResult = await pool.query(
      'SELECT COUNT(*) as count FROM squad_members WHERE squad_id = $1',
      [id]
    );

    const remainingCount = parseInt(remainingMembersResult.rows[0].count, 10);

    // If no members left, delete the squad
    if (remainingCount === 0) {
      console.log(`No members left in squad ${id}, deleting squad`);

      // Delete any game states for this squad
      await pool.query(
        'DELETE FROM game_states WHERE squad_id = $1',
        [id]
      );

      // Delete any messages for this squad
      await pool.query(
        'DELETE FROM messages WHERE squad_id = $1',
        [id]
      );

      // Delete the squad
      await pool.query(
        'DELETE FROM squads WHERE id = $1',
        [id]
      );

      return res.json({ message: 'Squad deleted' });
    }

    res.json({ message: 'Left squad successfully' });
  } catch (error) {
    console.error('Leave squad error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get public squads list
router.get('/public', requireAuth, async (req, res) => {
  try {
    const pool = getPool();
    if (!pool) {
      return res.status(500).json({ error: 'Database connection not available' });
    }

    // Get squads with member count
    const squadsResult = await pool.query(
      `SELECT s.id, s.code, s.leader_id as "leaderId", s.created_at as "createdAt",
              COUNT(sm.id) as "memberCount"
       FROM squads s
       JOIN squad_members sm ON s.id = sm.squad_id
       GROUP BY s.id
       HAVING COUNT(sm.id) < 4
       ORDER BY s.created_at DESC
       LIMIT 10`
    );

    const squads = squadsResult.rows;

    return res.json({ squads });
  } catch (error) {
    console.error('Get public squads error:', error);
    return res.status(500).json({ error: 'Failed to get squads' });
  }
});

// Get squad state
router.get('/:id/state', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const pool = getPool();
    if (!pool) {
      return res.status(500).json({ error: 'Database connection not available' });
    }

    // Check if user is a member of the squad
    const membershipResult = await pool.query(
      'SELECT * FROM squad_members WHERE squad_id = $1 AND user_id = $2 LIMIT 1',
      [id, req.user.id]
    );

    if (membershipResult.rows.length === 0) {
      return res.status(403).json({ error: 'You are not a member of this squad' });
    }

    // Get squad data
    const squadResult = await pool.query(
      `SELECT s.id, s.code, s.leader_id as "leaderId", s.created_at as "createdAt"
       FROM squads s
       WHERE s.id = $1`,
      [id]
    );

    if (squadResult.rows.length === 0) {
      return res.status(404).json({ error: 'Squad not found' });
    }

    const squad = squadResult.rows[0];

    // Get squad members
    const membersResult = await pool.query(
      `SELECT sm.joined_at as "joinedAt", u.id, u.username, u.is_guest as "isGuest"
       FROM squad_members sm
       JOIN users u ON sm.user_id = u.id
       WHERE sm.squad_id = $1`,
      [id]
    );

    // Add members to squad
    squad.members = membersResult.rows;

    // Get latest game state
    const gameStateResult = await pool.query(
      `SELECT * FROM game_states
       WHERE squad_id = $1
       ORDER BY created_at DESC
       LIMIT 1`,
      [id]
    );

    if (gameStateResult.rows.length > 0) {
      squad.gameState = gameStateResult.rows[0].state;
    }

    res.json(squad);
  } catch (error) {
    console.error('Get squad state error:', error);
    res.status(500).json({ error: 'Failed to get squad state' });
  }
});

// Update game state
router.post('/:id/game-state', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { gameState } = req.body;

    if (!gameState) {
      return res.status(400).json({ error: 'Game state is required' });
    }

    const pool = getPool();
    if (!pool) {
      return res.status(500).json({ error: 'Database connection not available' });
    }

    // Check if user is a member of the squad
    const membershipResult = await pool.query(
      'SELECT * FROM squad_members WHERE squad_id = $1 AND user_id = $2 LIMIT 1',
      [id, req.user.id]
    );

    if (membershipResult.rows.length === 0) {
      return res.status(403).json({ error: 'You are not a member of this squad' });
    }

    // Save game state
    await pool.query(
      `INSERT INTO game_states (id, squad_id, user_id, state, created_at)
       VALUES ($1, $2, $3, $4, $5)`,
      [require('uuid').v4(), id, req.user.id, gameState, new Date()]
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Update game state error:', error);
    res.status(500).json({ error: 'Failed to update game state' });
  }
});

// Get user's current squad
router.get('/my-squad', requireAuth, async (req, res) => {
  try {
    const pool = getPool();
    if (!pool) {
      return res.status(500).json({ error: 'Database connection not available' });
    }

    // Find user's squad membership
    const membershipResult = await pool.query(
      'SELECT * FROM squad_members WHERE user_id = $1 LIMIT 1',
      [req.user.id]
    );

    if (membershipResult.rows.length === 0) {
      return res.json({ squad: null });
    }

    const membership = membershipResult.rows[0];

    // Get squad
    const squadResult = await pool.query(
      `SELECT s.id, s.code, s.leader_id as "leaderId", s.created_at as "createdAt"
       FROM squads s
       WHERE s.id = $1`,
      [membership.squad_id]
    );

    if (squadResult.rows.length === 0) {
      return res.json({ squad: null });
    }

    const squad = squadResult.rows[0];

    // Get members
    const membersResult = await pool.query(
      `SELECT sm.joined_at as "joinedAt", u.id, u.username, u.is_guest as "isGuest"
       FROM squad_members sm
       JOIN users u ON sm.user_id = u.id
       WHERE sm.squad_id = $1`,
      [squad.id]
    );

    // Add members to squad
    squad.members = membersResult.rows;

    // Format response
    const formattedSquad = {
      id: squad.id,
      code: squad.code,
      leaderId: squad.leaderId,
      createdAt: squad.createdAt,
      members: squad.members
    };

    res.json({ squad: formattedSquad });
  } catch (error) {
    console.error('Get my squad error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
