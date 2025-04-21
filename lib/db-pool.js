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

      // Critical settings for serverless environments - optimized for reliability and performance
      max: 1, // Maximum number of clients in the pool (absolute minimum for serverless)
      min: 0, // Minimum number of idle clients (no idle clients in serverless)
      idleTimeoutMillis: 500, // How long a client is allowed to remain idle before being closed (very short)
      connectionTimeoutMillis: 3000, // How long to wait for a connection (shorter timeout)

      // Add connection rate limiting
      allowExitOnIdle: true, // Allow the process to exit if all clients are idle

      // Add retry logic
      retryDelay: 500, // Delay between connection retries in ms (shorter delay)
      maxRetryAttempts: 2, // Maximum number of retry attempts (fewer retries)

      // Add statement timeout to prevent long-running queries
      statement_timeout: 3000, // 3 seconds (shorter timeout)

      // Add query timeout to prevent long-running queries
      query_timeout: 3000, // 3 seconds (shorter timeout)

      // Add connection timeout to prevent hanging connections
      connect_timeout: 3, // 3 seconds (shorter timeout)

      // Add application name for better monitoring
      application_name: 'explo-app'
    };

    // Create the pool
    pool = new Pool(connectionConfig);

    // Add error handler
    pool.on('error', (err) => {
      console.error('Unexpected error on idle client', err);
    });

    // Add connection limiter and monitor
    let pendingAcquires = 0;
    const maxPendingAcquires = 5; // Reduced from 10 to 5
    let totalConnections = 0;
    let totalReleases = 0;
    let activeConnections = 0;
    let connectionErrors = 0;

    // Log connection stats every 30 seconds
    const statsInterval = setInterval(() => {
      console.log(`DB Connection Stats: Active=${activeConnections}, Total Created=${totalConnections}, Total Released=${totalReleases}, Errors=${connectionErrors}, Pending=${pendingAcquires}`);
    }, 30000);

    // Clean up interval on process exit
    process.on('exit', () => {
      clearInterval(statsInterval);
    });

    // Override the connect method to add connection limiting and monitoring
    const originalConnect = pool.connect.bind(pool);
    pool.connect = async function() {
      // If too many pending acquires, reject immediately instead of waiting
      if (pendingAcquires >= maxPendingAcquires) {
        console.warn(`Too many pending connection acquires (${pendingAcquires}), rejecting new connection`);
        throw new Error('Too many pending database connections');
      }

      pendingAcquires++;
      console.log('Client acquiring from pool');

      try {
        const client = await originalConnect();
        totalConnections++;
        activeConnections++;
        console.log('New client connected to database');

        const originalRelease = client.release.bind(client);

        // Override the release method to track connections
        client.release = function(err) {
          pendingAcquires = Math.max(0, pendingAcquires - 1);
          activeConnections = Math.max(0, activeConnections - 1);
          totalReleases++;
          console.log('Client removed from pool');
          return originalRelease(err);
        };

        // Add query method that logs slow queries
        const originalQuery = client.query.bind(client);
        client.query = async function(text, params) {
          const start = Date.now();
          try {
            const result = await originalQuery(text, params);
            const duration = Date.now() - start;
            if (duration > 1000) { // Log queries that take more than 1 second
              console.warn(`Slow query (${duration}ms): ${text}`);
            }
            return result;
          } catch (error) {
            console.error(`Query error: ${error.message}`, { text, params });
            throw error;
          }
        };

        return client;
      } catch (err) {
        pendingAcquires = Math.max(0, pendingAcquires - 1);
        connectionErrors++;
        console.error('Client connection error:', err.message);
        throw err;
      }
    };

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
