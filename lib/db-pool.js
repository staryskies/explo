// lib/db-pool.js
// Centralized database connection pool for the entire application
const { Pool } = require('pg');

// Create a singleton pool instance
let pool = null;

// Initialize the pool with proper configuration for serverless environments
function initPool() {
  if (pool) {
    return pool; // Return existing pool if already initialized
  }

  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL environment variable is not set');
    return null;
  }

  try {
    // Parse the connection string
    const url = new URL(process.env.DATABASE_URL);

    // Configure the pool with settings optimized for serverless
    const connectionConfig = {
      host: url.hostname,
      port: url.port,
      database: url.pathname.split('/')[1],
      user: url.username,
      password: url.password,
      ssl: {
        rejectUnauthorized: false // Allow self-signed certificates
      }, // SSL configuration for Render PostgreSQL

      // Critical settings for serverless environments
      max: 5, // Maximum number of clients in the pool
      min: 0, // Minimum number of idle clients
      idleTimeoutMillis: 10000, // How long a client is allowed to remain idle before being closed
      connectionTimeoutMillis: 30000, // How long to wait for a connection (30 seconds)

      // Add application name for better monitoring
      application_name: 'explo-app'
    };

    // Create the pool
    pool = new Pool(connectionConfig);

    // Add error handler
    pool.on('error', (err) => {
      console.error('Unexpected error on idle client', err);
    });

    // Add connect handler for debugging
    pool.on('connect', (client) => {
      console.log('New client connected to database');
    });

    // Add acquire handler for debugging
    pool.on('acquire', (client) => {
      console.log('Client acquired from pool');
    });

    // Add remove handler for debugging
    pool.on('remove', (client) => {
      console.log('Client removed from pool');
    });

    console.log(`Database connection pool configured for ${url.hostname}:${url.port}${url.pathname}`);
    return pool;
  } catch (error) {
    console.error('Error initializing database pool:', error);
    return null;
  }
}

// Get the pool instance (initializing if needed)
function getPool() {
  return pool || initPool();
}

// Close the pool (useful for cleanup)
async function closePool() {
  if (pool) {
    console.log('Closing database connection pool');
    await pool.end();
    pool = null;
  }
}

// Export the functions
module.exports = {
  initPool,
  getPool,
  closePool
};
