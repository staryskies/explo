// scripts/db-push.js
require('dotenv').config();
const { migrate } = require('drizzle-orm/node-postgres/migrator');
const { db, pool } = require('../db');

// Run migrations
async function main() {
  console.log('Running database migrations...');
  
  try {
    // Run migrations
    await migrate(db, { migrationsFolder: './drizzle' });
    console.log('Migrations completed successfully');
  } catch (error) {
    console.error('Migration error:', error);
    process.exit(1);
  } finally {
    // Close the pool
    await pool.end();
  }
}

// Run the migration
main();
