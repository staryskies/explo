// scripts/init-db.js
// Script to initialize the database with Drizzle ORM
require('dotenv').config();
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const { db, pool } = require('../db');
const { users, playerData } = require('../db/schema');
const { eq } = require('drizzle-orm');

async function initializeDatabase() {
  console.log('Starting database initialization...');

  try {
    // Check if admin user exists
    console.log('Checking if database is already initialized...');
    const adminUser = await db.select().from(users).where(eq(users.username, 'admin')).limit(1);

    if (adminUser.length > 0) {
      console.log('Admin user already exists, skipping initialization');
      return;
    }

    // Create admin user
    console.log('Creating admin user...');
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('admin123', salt);
    const adminId = uuidv4();

    // Insert admin user
    await db.insert(users).values({
      id: adminId,
      username: 'admin',
      email: 'admin@example.com',
      passwordHash: passwordHash,
      isGuest: false,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Insert admin player data
    await db.insert(playerData).values({
      id: uuidv4(),
      userId: adminId,
      gameData: {
        silver: 10000,
        highScore: 0,
        gamesPlayed: 0,
        wavesCompleted: 0,
        enemiesKilled: 0,
        highestWaveCompleted: 0,
        completedDifficulties: [],
        towerRolls: 0,
        variantRolls: 0,
        towerPity: {
          rare: 0,
          epic: 0,
          legendary: 0,
          mythic: 0,
          divine: 0
        },
        variantPity: {
          rare: 0,
          epic: 0,
          legendary: 0,
          divine: 0
        },
        unlockedTowers: ['basic', 'archer', 'cannon', 'sniper', 'freeze', 'mortar', 'laser', 'tesla', 'flame', 'missile', 'poison', 'vortex', 'archangel'],
        towerVariants: {
          basic: ['normal', 'gold', 'crystal', 'shadow'],
          archer: ['normal', 'ice', 'fire', 'poison', 'dragon'],
          cannon: ['normal'],
          sniper: ['normal'],
          freeze: ['normal'],
          mortar: ['normal'],
          laser: ['normal'],
          tesla: ['normal'],
          flame: ['normal'],
          missile: ['normal'],
          poison: ['normal'],
          vortex: ['normal'],
          archangel: ['normal']
        }
      },
      createdAt: new Date(),
      updatedAt: new Date()
    });

    console.log('Admin user created successfully');
    console.log('Database initialization completed successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}

// If this script is run directly, execute the initialization
if (require.main === module) {
  initializeDatabase()
    .then(() => {
      console.log('Database initialization script completed.');
      pool.end();
      process.exit(0);
    })
    .catch((error) => {
      console.error('Error in database initialization script:', error);
      pool.end();
      process.exit(1);
    });
}

// Export the function for use in other files
module.exports = initializeDatabase;
