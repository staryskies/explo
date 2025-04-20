// lib/db.js
const { Pool } = require('pg');

// Parse the connection string to extract components
let pool;

if (process.env.DATABASE_URL) {
  // If we have a connection string, parse it
  const url = new URL(process.env.DATABASE_URL);
  const connectionConfig = {
    host: url.hostname,
    port: url.port,
    database: url.pathname.split('/')[1],
    user: url.username,
    password: url.password,
    ssl: true, // Force SSL to be true
    max: 3, // Reduced for serverless
    idleTimeoutMillis: 10000, // Reduced idle timeout
    connectionTimeoutMillis: 5000
  };

  // Create a connection pool
  pool = new Pool(connectionConfig);

  // Add error handler to the pool
  pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
  });

  console.log(`Database connection configured for ${url.hostname}:${url.port}${url.pathname}`);
} else {
  console.error('DATABASE_URL environment variable is not set');
  pool = null;
}

module.exports = { pool };
