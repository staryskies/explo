// lib/prisma.js
// This file now uses direct PostgreSQL connection instead of Prisma
const { Pool } = require('pg');

// Create a direct connection to the database
let pool;

// Parse the connection string
if (process.env.DATABASE_URL) {
  const url = new URL(process.env.DATABASE_URL);
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
  pool = new Pool(connectionConfig);
  console.log(`Database connection configured for ${url.hostname}:${url.port}${url.pathname}`);
} else {
  console.error('DATABASE_URL environment variable is not set');
  pool = null;
}

// Create a Prisma-like interface for backward compatibility
const prismaCompatible = {
  // User model operations
  user: {
    findUnique: async ({ where }) => {
      if (!pool) return null;
      try {
        if (where.id) {
          const result = await pool.query('SELECT * FROM users WHERE id = $1 LIMIT 1', [where.id]);
          return result.rows[0] || null;
        } else if (where.username) {
          const result = await pool.query('SELECT * FROM users WHERE username = $1 LIMIT 1', [where.username]);
          return result.rows[0] || null;
        } else if (where.email) {
          const result = await pool.query('SELECT * FROM users WHERE email = $1 LIMIT 1', [where.email]);
          return result.rows[0] || null;
        }
        return null;
      } catch (error) {
        console.error('Error in findUnique:', error);
        return null;
      }
    },
    findFirst: async ({ where }) => {
      if (!pool) return null;
      try {
        let query = 'SELECT * FROM users WHERE 1=1';
        const params = [];
        let paramIndex = 1;

        if (where) {
          Object.entries(where).forEach(([key, value]) => {
            query += ` AND ${key} = $${paramIndex}`;
            params.push(value);
            paramIndex++;
          });
        }

        query += ' LIMIT 1';
        const result = await pool.query(query, params);
        return result.rows[0] || null;
      } catch (error) {
        console.error('Error in findFirst:', error);
        return null;
      }
    },
    create: async ({ data }) => {
      if (!pool) return null;
      try {
        const keys = Object.keys(data);
        const values = Object.values(data);
        const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
        const columns = keys.join(', ');

        const query = `INSERT INTO users (${columns}) VALUES (${placeholders}) RETURNING *`;
        const result = await pool.query(query, values);
        return result.rows[0];
      } catch (error) {
        console.error('Error in create:', error);
        throw error;
      }
    },
    update: async ({ where, data }) => {
      if (!pool) return null;
      try {
        const keys = Object.keys(data);
        const values = Object.values(data);
        const setClause = keys.map((key, i) => `${key} = $${i + 1}`).join(', ');

        let whereClause = '';
        let whereParams = [];

        if (where.id) {
          whereClause = 'id = $' + (keys.length + 1);
          whereParams = [where.id];
        } else if (where.username) {
          whereClause = 'username = $' + (keys.length + 1);
          whereParams = [where.username];
        } else if (where.email) {
          whereClause = 'email = $' + (keys.length + 1);
          whereParams = [where.email];
        }

        const query = `UPDATE users SET ${setClause} WHERE ${whereClause} RETURNING *`;
        const result = await pool.query(query, [...values, ...whereParams]);
        return result.rows[0];
      } catch (error) {
        console.error('Error in update:', error);
        throw error;
      }
    },
    delete: async ({ where }) => {
      if (!pool) return null;
      try {
        let whereClause = '';
        let whereParams = [];

        if (where.id) {
          whereClause = 'id = $1';
          whereParams = [where.id];
        } else if (where.username) {
          whereClause = 'username = $1';
          whereParams = [where.username];
        } else if (where.email) {
          whereClause = 'email = $1';
          whereParams = [where.email];
        }

        const query = `DELETE FROM users WHERE ${whereClause} RETURNING *`;
        const result = await pool.query(query, whereParams);
        return result.rows[0];
      } catch (error) {
        console.error('Error in delete:', error);
        throw error;
      }
    }
  },

  // Session model operations
  session: {
    findUnique: async ({ where }) => {
      if (!pool) return null;
      try {
        if (where.id) {
          const result = await pool.query('SELECT * FROM sessions WHERE id = $1 LIMIT 1', [where.id]);
          return result.rows[0] || null;
        } else if (where.token) {
          const result = await pool.query('SELECT * FROM sessions WHERE token = $1 LIMIT 1', [where.token]);
          return result.rows[0] || null;
        }
        return null;
      } catch (error) {
        console.error('Error in session findUnique:', error);
        return null;
      }
    },
    create: async ({ data }) => {
      if (!pool) return null;
      try {
        const keys = Object.keys(data);
        const values = Object.values(data);
        const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
        const columns = keys.join(', ');

        const query = `INSERT INTO sessions (${columns}) VALUES (${placeholders}) RETURNING *`;
        const result = await pool.query(query, values);
        return result.rows[0];
      } catch (error) {
        console.error('Error in session create:', error);
        throw error;
      }
    },
    deleteMany: async ({ where }) => {
      if (!pool) return { count: 0 };
      try {
        let whereClause = '';
        let whereParams = [];
        let paramIndex = 1;

        if (where) {
          whereClause = 'WHERE ';
          const conditions = [];

          Object.entries(where).forEach(([key, value]) => {
            conditions.push(`${key} = $${paramIndex}`);
            whereParams.push(value);
            paramIndex++;
          });

          whereClause += conditions.join(' AND ');
        }

        const query = `DELETE FROM sessions ${whereClause} RETURNING *`;
        const result = await pool.query(query, whereParams);
        return { count: result.rowCount };
      } catch (error) {
        console.error('Error in session deleteMany:', error);
        throw error;
      }
    }
  },

  // PlayerData model operations
  playerData: {
    findUnique: async ({ where }) => {
      if (!pool) return null;
      try {
        if (where.id) {
          const result = await pool.query('SELECT * FROM player_data WHERE id = $1 LIMIT 1', [where.id]);
          return result.rows[0] || null;
        } else if (where.userId) {
          const result = await pool.query('SELECT * FROM player_data WHERE user_id = $1 LIMIT 1', [where.userId]);
          return result.rows[0] || null;
        }
        return null;
      } catch (error) {
        console.error('Error in playerData findUnique:', error);
        return null;
      }
    },
    create: async ({ data }) => {
      if (!pool) return null;
      try {
        // Handle nested data structure
        const flatData = {};

        Object.entries(data).forEach(([key, value]) => {
          if (key === 'gameData') {
            flatData[key] = JSON.stringify(value);
          } else if (typeof value === 'object' && value !== null && 'create' in value) {
            // Skip nested create objects, they'll be handled separately
          } else {
            flatData[key] = value;
          }
        });

        const keys = Object.keys(flatData);
        const values = Object.values(flatData);
        const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
        const columns = keys.join(', ');

        const query = `INSERT INTO player_data (${columns}) VALUES (${placeholders}) RETURNING *`;
        const result = await pool.query(query, values);
        return result.rows[0];
      } catch (error) {
        console.error('Error in playerData create:', error);
        throw error;
      }
    },
    update: async ({ where, data }) => {
      if (!pool) return null;
      try {
        // Handle nested data structure
        const flatData = {};

        Object.entries(data).forEach(([key, value]) => {
          if (key === 'gameData') {
            flatData[key] = JSON.stringify(value);
          } else if (typeof value === 'object' && value !== null && 'create' in value) {
            // Skip nested create objects, they'll be handled separately
          } else {
            flatData[key] = value;
          }
        });

        const keys = Object.keys(flatData);
        const values = Object.values(flatData);
        const setClause = keys.map((key, i) => `${key} = $${i + 1}`).join(', ');

        let whereClause = '';
        let whereParams = [];

        if (where.id) {
          whereClause = 'id = $' + (keys.length + 1);
          whereParams = [where.id];
        } else if (where.userId) {
          whereClause = 'user_id = $' + (keys.length + 1);
          whereParams = [where.userId];
        }

        const query = `UPDATE player_data SET ${setClause} WHERE ${whereClause} RETURNING *`;
        const result = await pool.query(query, [...values, ...whereParams]);
        return result.rows[0];
      } catch (error) {
        console.error('Error in playerData update:', error);
        throw error;
      }
    }
  },

  // Squad model operations
  squad: {
    findUnique: async ({ where }) => {
      if (!pool) return null;
      try {
        if (where.id) {
          const result = await pool.query('SELECT * FROM squads WHERE id = $1 LIMIT 1', [where.id]);
          return result.rows[0] || null;
        } else if (where.code) {
          const result = await pool.query('SELECT * FROM squads WHERE code = $1 LIMIT 1', [where.code]);
          return result.rows[0] || null;
        }
        return null;
      } catch (error) {
        console.error('Error in squad findUnique:', error);
        return null;
      }
    },
    create: async ({ data }) => {
      if (!pool) return null;
      try {
        const keys = Object.keys(data);
        const values = Object.values(data);
        const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
        const columns = keys.join(', ');

        const query = `INSERT INTO squads (${columns}) VALUES (${placeholders}) RETURNING *`;
        const result = await pool.query(query, values);
        return result.rows[0];
      } catch (error) {
        console.error('Error in squad create:', error);
        throw error;
      }
    }
  },

  // SquadMember model operations
  squadMember: {
    findUnique: async ({ where }) => {
      if (!pool) return null;
      try {
        if (where.id) {
          const result = await pool.query('SELECT * FROM squad_members WHERE id = $1 LIMIT 1', [where.id]);
          return result.rows[0] || null;
        } else if (where.squadId_userId) {
          const result = await pool.query(
            'SELECT * FROM squad_members WHERE squad_id = $1 AND user_id = $2 LIMIT 1',
            [where.squadId_userId.squadId, where.squadId_userId.userId]
          );
          return result.rows[0] || null;
        }
        return null;
      } catch (error) {
        console.error('Error in squadMember findUnique:', error);
        return null;
      }
    },
    create: async ({ data }) => {
      if (!pool) return null;
      try {
        const keys = Object.keys(data);
        const values = Object.values(data);
        const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
        const columns = keys.join(', ');

        const query = `INSERT INTO squad_members (${columns}) VALUES (${placeholders}) RETURNING *`;
        const result = await pool.query(query, values);
        return result.rows[0];
      } catch (error) {
        console.error('Error in squadMember create:', error);
        throw error;
      }
    },
    findMany: async ({ where }) => {
      if (!pool) return [];
      try {
        let whereClause = '';
        let whereParams = [];
        let paramIndex = 1;

        if (where) {
          whereClause = 'WHERE ';
          const conditions = [];

          Object.entries(where).forEach(([key, value]) => {
            conditions.push(`${key} = $${paramIndex}`);
            whereParams.push(value);
            paramIndex++;
          });

          whereClause += conditions.join(' AND ');
        }

        const query = `SELECT * FROM squad_members ${whereClause}`;
        const result = await pool.query(query, whereParams);
        return result.rows;
      } catch (error) {
        console.error('Error in squadMember findMany:', error);
        return [];
      }
    },
    delete: async ({ where }) => {
      if (!pool) return null;
      try {
        let whereClause = '';
        let whereParams = [];

        if (where.id) {
          whereClause = 'id = $1';
          whereParams = [where.id];
        } else if (where.squadId_userId) {
          whereClause = 'squad_id = $1 AND user_id = $2';
          whereParams = [where.squadId_userId.squadId, where.squadId_userId.userId];
        }

        const query = `DELETE FROM squad_members WHERE ${whereClause} RETURNING *`;
        const result = await pool.query(query, whereParams);
        return result.rows[0];
      } catch (error) {
        console.error('Error in squadMember delete:', error);
        throw error;
      }
    }
  },

  // Utility functions
  $connect: async () => {
    // No-op for compatibility
    return Promise.resolve();
  },
  $disconnect: async () => {
    if (pool) {
      await pool.end();
    }
    return Promise.resolve();
  },
  $executeRaw: async (query, ...params) => {
    if (!pool) return null;
    try {
      const result = await pool.query(query, params);
      return result;
    } catch (error) {
      console.error('Error in $executeRaw:', error);
      throw error;
    }
  },
  $queryRaw: async (query, ...params) => {
    if (!pool) return null;
    try {
      const result = await pool.query(query, params);
      return result.rows;
    } catch (error) {
      console.error('Error in $queryRaw:', error);
      throw error;
    }
  }
};

module.exports = prismaCompatible;
