// scripts/init-db.js
// Script to initialize the database with direct PostgreSQL connection
require('dotenv').config();
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');

// Create a direct connection to the database for initialization
let pool;

// Parse the connection string
if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL environment variable is not set');
  process.exit(1);
}

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

// Import the schema creation function
const createSchema = require('./create-schema');

async function initializeDatabase() {
  console.log('Starting database initialization...');

  try {
    // Create database schema first
    console.log('Creating database schema...');
    try {
      await createSchema();
      console.log('Schema creation completed');
    } catch (schemaError) {
      console.error('Schema creation failed:', schemaError);
      throw new Error(`Schema creation failed: ${schemaError.message}`);
    }

    // Check if admin user exists
    console.log('Checking if database is already initialized...');
    const adminCheckResult = await pool.query(
      "SELECT * FROM users WHERE username = 'admin' LIMIT 1"
    );

    if (adminCheckResult.rows.length > 0) {
      console.log('Admin user already exists, skipping initialization');
      return;
    }

    // Create admin user
    console.log('Creating admin user...');
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('admin123', salt);
    const adminId = uuidv4();

    // Insert admin user with direct SQL
    await pool.query(
      `INSERT INTO users (id, username, email, password_hash, is_guest, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [adminId, 'admin', 'admin@example.com', passwordHash, false, new Date(), new Date()]
    );

    // Game data for admin
    const gameData = {
      silver: 10000,
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
      unlockedTowers: ['basic', 'archer', 'cannon', 'sniper', 'freeze', 'mortar', 'laser', 'tesla', 'flame', 'missile', 'poison', 'vortex', 'archangel'],
      towerVariants: {
        basic: ['normal', 'gold', 'crystal', 'shadow'],
        archer: ['normal', 'ice', 'fire', 'poison', 'dragon'],
        cannon: ['normal'],
        sniper: ['normal'],
        freeze: ['normal'],
        mortar: ['normal'],
        laser: ['normal'],
        tesla: ['normal'],
        flame: ['normal'],
        missile: ['normal'],
        poison: ['normal'],
        vortex: ['normal'],
        archangel: ['normal']
      }
    };

    // Insert admin player data with direct SQL
    await pool.query(
      `INSERT INTO player_data (id, user_id, game_data, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5)`,
      [uuidv4(), adminId, JSON.stringify(gameData), new Date(), new Date()]
    );

    console.log('Admin user created successfully');
    console.log('Database initialization completed successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}

// If this script is run directly, execute the initialization
if (require.main === module) {
  initializeDatabase()
    .then(() => {
      console.log('Database initialization script completed.');
      if (pool) pool.end();
      process.exit(0);
    })
    .catch((error) => {
      console.error('Error in database initialization script:', error);
      console.log('Continuing with build process despite initialization failure');
      if (pool) pool.end();
      // Exit with success code to allow build to continue
      process.exit(0);
    });
}

// Export the function for use in other files
module.exports = initializeDatabase;
