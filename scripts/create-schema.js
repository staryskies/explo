// scripts/create-schema.js
require('dotenv').config();
const { db, pool } = require('../db');
const { users, sessions, playerData, squads, squadMembers } = require('../db/schema');
const { sql } = require('drizzle-orm');

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
      pool.end();
      process.exit(0);
    })
    .catch((error) => {
      console.error('Error in schema creation script:', error);
      pool.end();
      process.exit(1);
    });
}

// Export the function for use in other files
module.exports = createSchema;
