// db/index.js
const { drizzle } = require('drizzle-orm/node-postgres');
const { Pool } = require('pg');
const schema = require('./schema');

// Create a connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }, // Always enable SSL with rejectUnauthorized: false for Render
  max: 5, // Reduced maximum number of clients for serverless environment
  idleTimeoutMillis: 30000, // How long a client is allowed to remain idle before being closed
  connectionTimeoutMillis: 5000, // Increased timeout for connection
});

// Create a Drizzle ORM instance
const db = drizzle(pool, { schema });

// Export the db instance
module.exports = { db, pool };
