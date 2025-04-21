// routes/playerData.js
const express = require('express');
const { requireAuth } = require('../middleware/auth');

// Use the centralized database pool
const { getPool } = require('../lib/db-pool');

const router = express.Router();

// Get player data
router.get('/', requireAuth, async (req, res) => {
  try {
    // Get database pool
    const pool = getPool();
    if (!pool) {
      console.log('Database not available, returning default player data');
      return res.json(createDefaultPlayerData());
    }

    // Get a client from the pool
    let client;
    try {
      client = await pool.connect();

      // Get player data
      const playerDataResult = await client.query(
        'SELECT game_data FROM player_data WHERE user_id = $1 LIMIT 1',
        [req.user.id]
      );

      if (playerDataResult.rows.length === 0) {
        console.log('Player data not found, returning default');
        return res.json(createDefaultPlayerData());
      }

      res.json(playerDataResult.rows[0].game_data);
    } catch (dbError) {
      console.error('Database error:', dbError);
      // Return default data on database error
      return res.json(createDefaultPlayerData());
    } finally {
      // Always release the client back to the pool
      if (client) {
        client.release();
      }
    }
  } catch (error) {
    console.error('Get player data error:', error);
    // Return default data on any error
    return res.json(createDefaultPlayerData());
  }
});

// Create default player data
function createDefaultPlayerData() {
  return {
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
}

// Update player data
router.put('/', requireAuth, async (req, res) => {
  try {
    const { gameData } = req.body;

    if (!gameData) {
      return res.status(400).json({ error: 'Game data is required' });
    }

    // Get database pool
    const pool = getPool();
    if (!pool) {
      console.log('Database not available, returning provided game data');
      return res.json(gameData);
    }

    // Get a client from the pool
    let client;
    try {
      client = await pool.connect();

      // Check if player data exists
      const existingResult = await client.query(
        'SELECT id FROM player_data WHERE user_id = $1 LIMIT 1',
        [req.user.id]
      );

      if (existingResult.rows.length === 0) {
        // Create new player data
        await client.query(
          `INSERT INTO player_data (id, user_id, game_data, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5)`,
          [require('uuid').v4(), req.user.id, JSON.stringify(gameData), new Date(), new Date()]
        );
      } else {
        // Update existing player data
        await client.query(
          `UPDATE player_data
           SET game_data = $1, updated_at = $2
           WHERE user_id = $3`,
          [JSON.stringify(gameData), new Date(), req.user.id]
        );
      }

      res.json(gameData);
    } catch (dbError) {
      console.error('Database error:', dbError);
      // Return the provided data even on database error
      return res.json(gameData);
    } finally {
      // Always release the client back to the pool
      if (client) {
        client.release();
      }
    }
  } catch (error) {
    console.error('Update player data error:', error);
    // Return default data on any error
    return res.json(createDefaultPlayerData());
  }
});

module.exports = router;
