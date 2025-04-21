// routes/playerData.js
const express = require('express');
const { Pool } = require('pg');
const { requireAuth } = require('../middleware/auth');

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

const router = express.Router();

// Get player data
router.get('/', requireAuth, async (req, res) => {
  try {
    // Check if database is available
    if (!pool) {
      console.log('Database not available, returning default player data');
      return res.json(createDefaultPlayerData());
    }

    try {
      // Get player data
      const playerDataResult = await pool.query(
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

    // Check if database is available
    if (!pool) {
      console.log('Database not available, returning provided game data');
      return res.json(gameData);
    }

    try {
      // Check if player data exists
      const existingResult = await pool.query(
        'SELECT id FROM player_data WHERE user_id = $1 LIMIT 1',
        [req.user.id]
      );

      if (existingResult.rows.length === 0) {
        // Create new player data
        await pool.query(
          `INSERT INTO player_data (id, user_id, game_data, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5)`,
          [require('uuid').v4(), req.user.id, JSON.stringify(gameData), new Date(), new Date()]
        );
      } else {
        // Update existing player data
        await pool.query(
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
    }
  } catch (error) {
    console.error('Update player data error:', error);
    // Return default data on any error
    return res.json(createDefaultPlayerData());
  }
});

module.exports = router;
