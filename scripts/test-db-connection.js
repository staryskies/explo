// scripts/test-db-connection.js
require('dotenv').config();
const { Pool } = require('pg');

async function testDatabaseConnection() {
  console.log('Testing database connection...');
  
  // Parse the connection string
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL environment variable is not set');
    process.exit(1);
  }
  
  const url = new URL(process.env.DATABASE_URL);
  console.log(`Attempting to connect to database at ${url.hostname}:${url.port}${url.pathname}`);
  
  // Create connection config
  const connectionConfig = {
    host: url.hostname,
    port: url.port,
    database: url.pathname.split('/')[1],
    user: url.username,
    password: url.password,
    ssl: {
      rejectUnauthorized: false,
      sslmode: 'require'
    },
    connectionTimeoutMillis: 10000 // 10 seconds
  };
  
  // Create a new pool
  const pool = new Pool(connectionConfig);
  
  try {
    // Test the connection
    console.log('Executing query...');
    const result = await pool.query('SELECT NOW()');
    console.log('Connection successful!');
    console.log('Current database time:', result.rows[0].now);
    
    // Try to create a simple table as a test
    console.log('Testing table creation...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS connection_test (
        id SERIAL PRIMARY KEY,
        test_time TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('Table creation successful!');
    
    // Insert a test row
    await pool.query(`INSERT INTO connection_test (test_time) VALUES (NOW())`);
    console.log('Data insertion successful!');
    
    // Query the test table
    const testResult = await pool.query('SELECT * FROM connection_test ORDER BY id DESC LIMIT 1');
    console.log('Test query result:', testResult.rows[0]);
    
    console.log('All database tests passed successfully!');
  } catch (error) {
    console.error('Database connection test failed:', error);
    throw error;
  } finally {
    // Close the pool
    await pool.end();
    console.log('Connection pool closed');
  }
}

// Run the test
testDatabaseConnection()
  .then(() => {
    console.log('Database connection test completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Database connection test failed with error:', error);
    process.exit(1);
  });
