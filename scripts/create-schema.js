// scripts/create-schema.js
require('dotenv').config();
const { Pool } = require('pg');

// Create a direct connection to the database for schema creation
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

async function createSchema() {
  console.log('Creating database schema...');

  try {
    // Test database connection first
    console.log('Testing database connection...');
    try {
      await pool.query('SELECT NOW()');
      console.log('Database connection successful');
    } catch (connError) {
      console.error('Database connection failed:', connError);
      throw new Error(`Database connection failed: ${connError.message}`);
    }

    // Create tables using raw SQL since we don't have migrations
    console.log('Creating users table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE,
        password_hash TEXT,
        is_guest BOOLEAN NOT NULL DEFAULT false,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);

    console.log('Creating sessions table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        token TEXT UNIQUE NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);

    console.log('Creating player_data table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS player_data (
        id TEXT PRIMARY KEY,
        user_id TEXT UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        game_data JSONB NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);

    console.log('Creating squads table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS squads (
        id TEXT PRIMARY KEY,
        code TEXT UNIQUE NOT NULL,
        leader_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);

    console.log('Creating squad_members table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS squad_members (
        id TEXT PRIMARY KEY,
        squad_id TEXT NOT NULL REFERENCES squads(id) ON DELETE CASCADE,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        joined_at TIMESTAMP NOT NULL DEFAULT NOW(),
        UNIQUE(squad_id, user_id)
      );
    `);

    // Create messages table
    console.log('Creating messages table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id TEXT PRIMARY KEY,
        type VARCHAR(10) NOT NULL,
        content TEXT NOT NULL,
        user_id TEXT NOT NULL,
        username VARCHAR(255) NOT NULL,
        squad_id TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        CONSTRAINT fk_user FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
        CONSTRAINT fk_squad FOREIGN KEY(squad_id) REFERENCES squads(id) ON DELETE CASCADE
      );
    `);

    // Create index on messages
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_messages_type_created_at ON messages(type, created_at);
      CREATE INDEX IF NOT EXISTS idx_messages_squad_created_at ON messages(squad_id, created_at);
    `);

    // Create game_states table
    console.log('Creating game_states table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS game_states (
        id TEXT PRIMARY KEY,
        squad_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        state JSONB NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        CONSTRAINT fk_squad FOREIGN KEY(squad_id) REFERENCES squads(id) ON DELETE CASCADE,
        CONSTRAINT fk_user FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
      );
    `);

    // Create index on game_states
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_game_states_squad_created_at ON game_states(squad_id, created_at);
    `);

    console.log('Database schema created successfully');
  } catch (error) {
    console.error('Error creating database schema:', error);
    throw error;
  }
}

// If this script is run directly, execute the schema creation
if (require.main === module) {
  createSchema()
    .then(() => {
      console.log('Schema creation script completed');
      if (pool) pool.end();
      process.exit(0);
    })
    .catch((error) => {
      console.error('Error in schema creation script:', error);
      console.log('Continuing with build process despite schema creation failure');
      if (pool) pool.end();
      // Exit with success code to allow build to continue
      process.exit(0);
    });
}

// Export the function for use in other files
module.exports = createSchema;
