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
        rejectUnauthorized: true // Require valid certificates for Neon PostgreSQL
      }, // SSL configuration for Neon PostgreSQL

      // Critical settings for serverless environments - optimized for Neon PostgreSQL
      max: 5, // Maximum number of clients in the pool (increased for Neon's connection pooler)
      min: 0, // Minimum number of idle clients (no idle clients in serverless)
      idleTimeoutMillis: 10000, // How long a client is allowed to remain idle (increased for Neon)
      connectionTimeoutMillis: 5000, // How long to wait for a connection (increased for Neon)

      // Add connection rate limiting
      allowExitOnIdle: true, // Allow the process to exit if all clients are idle

      // Add retry logic
      retryDelay: 1000, // Delay between connection retries in ms (increased for Neon)
      maxRetryAttempts: 3, // Maximum number of retry attempts (increased for Neon)

      // Add statement timeout to prevent long-running queries
      statement_timeout: 10000, // 10 seconds (increased for Neon)

      // Add query timeout to prevent long-running queries
      query_timeout: 10000, // 10 seconds (increased for Neon)

      // Add connection timeout to prevent hanging connections
      connect_timeout: 10, // 10 seconds (increased for Neon)

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
    const maxPendingAcquires = 3; // Reduced from 5 to 3
    let totalConnections = 0;
    let totalReleases = 0;
    let activeConnections = 0;
    let connectionErrors = 0;
    let connectionRequests = 0;
    let lastConnectionTime = Date.now();
    let connectionRateLimit = 10; // Max 10 connections per second

    // Log connection stats every 30 seconds
    const statsInterval = setInterval(() => {
      console.log(`DB Connection Stats: Active=${activeConnections}, Total Created=${totalConnections}, Total Released=${totalReleases}, Errors=${connectionErrors}, Pending=${pendingAcquires}`);
    }, 30000);

    // Clean up interval on process exit
    process.on('exit', () => {
      clearInterval(statsInterval);
    });

    // Import the request queue
    const requestQueue = require('./request-queue');

    // Override the connect method to add connection limiting and monitoring
    const originalConnect = pool.connect.bind(pool);
    pool.connect = async function() {
      // Check connection rate limiting
      const now = Date.now();
      const timeSinceLastConnection = now - lastConnectionTime;
      connectionRequests++;

      // If we're getting too many requests in a short time, use the queue
      if (timeSinceLastConnection < 1000 && connectionRequests > connectionRateLimit) {
        console.log('Connection rate limit exceeded, using request queue');
        return requestQueue.enqueueRequest(async () => {
          // Reset rate limiting after a second
          if (Date.now() - lastConnectionTime > 1000) {
            connectionRequests = 0;
            lastConnectionTime = Date.now();
          }

          // If too many pending acquires, reject immediately instead of waiting
          if (pendingAcquires >= maxPendingAcquires) {
            console.warn(`Too many pending connection acquires (${pendingAcquires}), rejecting new connection`);
            throw new Error('Too many pending database connections');
          }

          pendingAcquires++;
          console.log('Client acquiring from pool (via queue)');

          try {
            const client = await originalConnect();
            totalConnections++;
            activeConnections++;
            console.log('New client connected to database (via queue)');

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
        }, 1); // Priority 1 (normal)
      }

      // If we're not rate limited, proceed with normal connection
      // If too many pending acquires, reject immediately instead of waiting
      if (pendingAcquires >= maxPendingAcquires) {
        console.warn(`Too many pending connection acquires (${pendingAcquires}), rejecting new connection`);
        throw new Error('Too many pending database connections');
      }

      pendingAcquires++;
      console.log('Client acquiring from pool');
      lastConnectionTime = Date.now();

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
