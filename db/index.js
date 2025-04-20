// db/index.js
const { drizzle } = require('drizzle-orm/node-postgres');
const { Pool } = require('pg');
const schema = require('./schema');

// Parse the connection string to extract components
let connectionConfig = {};

if (process.env.DATABASE_URL) {
  // If we have a connection string, parse it
  const url = new URL(process.env.DATABASE_URL);
  connectionConfig = {
    host: url.hostname,
    port: url.port,
    database: url.pathname.split('/')[1],
    user: url.username,
    password: url.password,
    ssl: true, // Force SSL to be true
  };
  console.log(`Connecting to database at ${url.hostname}:${url.port}${url.pathname}`);
} else {
  console.error('DATABASE_URL environment variable is not set');
}

// Create a connection pool with explicit SSL configuration
const pool = new Pool({
  ...connectionConfig,
  ssl: {
    rejectUnauthorized: false, // This is required for Render PostgreSQL
    sslmode: 'require' // Explicitly require SSL
  },
  max: 3, // Further reduced for serverless
  idleTimeoutMillis: 10000, // Reduced idle timeout
  connectionTimeoutMillis: 5000
});

// Add error handler to the pool
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

// Create a Drizzle ORM instance
const db = drizzle(pool, { schema });

// Export the db instance
module.exports = { db, pool };
