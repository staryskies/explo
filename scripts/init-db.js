// scripts/init-db.js
// Script to initialize the database with Prisma

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function initializeDatabase() {
  console.log('Starting database initialization...');

  try {
    // Run Prisma migrations
    console.log('Running database migrations...');
    // Note: This is normally done with the CLI command: npx prisma migrate deploy
    // But we're checking if tables exist first

    // Check if the database is already initialized
    console.log('Checking if database is already initialized...');
    const tables = await prisma.$queryRaw`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
    `;

    const tableNames = tables.map(t => t.table_name);
    console.log('Existing tables:', tableNames);

    if (tableNames.includes('user')) {
      console.log('Database already initialized. Skipping initialization.');
      return;
    }

    // Create tables using Prisma schema
    console.log('Creating database tables...');
    await prisma.$executeRaw`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`;

    // Create User table
    await prisma.$executeRaw`
      CREATE TABLE "User" (
        "id" TEXT NOT NULL,
        "username" TEXT NOT NULL,
        "email" TEXT,
        "passwordHash" TEXT,
        "isGuest" BOOLEAN NOT NULL DEFAULT false,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        CONSTRAINT "User_pkey" PRIMARY KEY ("id")
      )
    `;
    await prisma.$executeRaw`CREATE UNIQUE INDEX "User_username_key" ON "User"("username")`;
    await prisma.$executeRaw`CREATE UNIQUE INDEX "User_email_key" ON "User"("email") WHERE "email" IS NOT NULL`;

    // Create Session table
    await prisma.$executeRaw`
      CREATE TABLE "Session" (
        "id" TEXT NOT NULL,
        "userId" TEXT NOT NULL,
        "token" TEXT NOT NULL,
        "expiresAt" TIMESTAMP(3) NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
      )
    `;
    await prisma.$executeRaw`CREATE UNIQUE INDEX "Session_token_key" ON "Session"("token")`;
    await prisma.$executeRaw`
      ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
    `;

    // Create PlayerData table
    await prisma.$executeRaw`
      CREATE TABLE "PlayerData" (
        "id" TEXT NOT NULL,
        "userId" TEXT NOT NULL,
        "gameData" JSONB NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        CONSTRAINT "PlayerData_pkey" PRIMARY KEY ("id")
      )
    `;
    await prisma.$executeRaw`CREATE UNIQUE INDEX "PlayerData_userId_key" ON "PlayerData"("userId")`;
    await prisma.$executeRaw`
      ALTER TABLE "PlayerData" ADD CONSTRAINT "PlayerData_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
    `;

    // Create Squad table
    await prisma.$executeRaw`
      CREATE TABLE "Squad" (
        "id" TEXT NOT NULL,
        "code" TEXT NOT NULL,
        "leaderId" TEXT NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        CONSTRAINT "Squad_pkey" PRIMARY KEY ("id")
      )
    `;
    await prisma.$executeRaw`CREATE UNIQUE INDEX "Squad_code_key" ON "Squad"("code")`;
    await prisma.$executeRaw`
      ALTER TABLE "Squad" ADD CONSTRAINT "Squad_leaderId_fkey"
      FOREIGN KEY ("leaderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
    `;

    // Create SquadMember table
    await prisma.$executeRaw`
      CREATE TABLE "SquadMember" (
        "id" TEXT NOT NULL,
        "squadId" TEXT NOT NULL,
        "userId" TEXT NOT NULL,
        "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "SquadMember_pkey" PRIMARY KEY ("id")
      )
    `;
    await prisma.$executeRaw`CREATE UNIQUE INDEX "SquadMember_squadId_userId_key" ON "SquadMember"("squadId", "userId")`;
    await prisma.$executeRaw`
      ALTER TABLE "SquadMember" ADD CONSTRAINT "SquadMember_squadId_fkey"
      FOREIGN KEY ("squadId") REFERENCES "Squad"("id") ON DELETE CASCADE ON UPDATE CASCADE
    `;
    await prisma.$executeRaw`
      ALTER TABLE "SquadMember" ADD CONSTRAINT "SquadMember_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
    `;

    console.log('Database tables created successfully.');

    // Create admin user for testing
    console.log('Creating admin user...');
    const bcrypt = require('bcryptjs');
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('admin123', salt);

    await prisma.user.create({
      data: {
        id: '00000000-0000-0000-0000-000000000000',
        username: 'admin',
        email: 'admin@example.com',
        passwordHash,
        isGuest: false,
        playerData: {
          create: {
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
            }
          }
        }
      }
    });

    console.log('Admin user created successfully.');
    console.log('Database initialization completed successfully.');

  } catch (error) {
    console.error('Error initializing database:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// If this script is run directly, execute the initialization
if (require.main === module) {
  initializeDatabase()
    .then(() => {
      console.log('Database initialization script completed.');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Error in database initialization script:', error);
      process.exit(1);
    });
}

// Export the function for use in other files
module.exports = initializeDatabase;
