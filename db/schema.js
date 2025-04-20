// db/schema.js
const { pgTable, text, timestamp, boolean, json, primaryKey, uuid } = require('drizzle-orm/pg-core');

// User table
const users = pgTable('users', {
  id: text('id').primaryKey().notNull(),
  username: text('username').notNull().unique(),
  email: text('email').unique(),
  passwordHash: text('password_hash'),
  isGuest: boolean('is_guest').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
});

// Session table
const sessions = pgTable('sessions', {
  id: text('id').primaryKey().notNull(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  token: text('token').notNull().unique(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow()
});

// PlayerData table
const playerData = pgTable('player_data', {
  id: text('id').primaryKey().notNull(),
  userId: text('user_id').notNull().unique().references(() => users.id, { onDelete: 'cascade' }),
  gameData: json('game_data').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
});

// Squad table
const squads = pgTable('squads', {
  id: text('id').primaryKey().notNull(),
  code: text('code').notNull().unique(),
  leaderId: text('leader_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
});

// SquadMember table
const squadMembers = pgTable('squad_members', {
  id: text('id').primaryKey().notNull(),
  squadId: text('squad_id').notNull().references(() => squads.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  joinedAt: timestamp('joined_at').notNull().defaultNow()
}, (table) => {
  return {
    squadUserUnique: primaryKey({ columns: [table.squadId, table.userId] })
  };
});

module.exports = {
  users,
  sessions,
  playerData,
  squads,
  squadMembers
};
