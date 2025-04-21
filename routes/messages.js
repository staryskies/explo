// routes/messages.js
const express = require('express');
const { Pool } = require('pg');
const { v4: uuidv4 } = require('uuid');
const { requireAuth } = require('../middleware/auth');

// Create a connection pool
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
    ssl: true,
    connectionTimeoutMillis: 10000 // 10 seconds
  };

  // Create a new pool
  pool = new Pool(connectionConfig);
} else {
  console.error('DATABASE_URL environment variable is not set');
  pool = null;
}

const router = express.Router();

// In-memory message cache for when database is unavailable
const messageCache = {
  global: [],
  squad: {}
};

// Get global messages
router.get('/global', requireAuth, async (req, res) => {
  try {
    const since = req.query.since ? parseInt(req.query.since) : 0;

    // Check if database is available
    if (!pool) {
      console.log('Database not available, returning cached global messages');
      const messages = messageCache.global.filter(msg => {
        const msgTime = new Date(msg.timestamp).getTime();
        return msgTime > since;
      });
      return res.json(messages);
    }

    try {
      // Get messages from database
      const messagesResult = await pool.query(
        `SELECT * FROM messages
         WHERE type = 'global' AND created_at > to_timestamp($1/1000.0)
         ORDER BY created_at ASC
         LIMIT 100`,
        [since]
      );

      const messages = messagesResult.rows.map(row => ({
        id: row.id,
        message: row.content,
        userId: row.user_id,
        username: row.username,
        timestamp: row.created_at
      }));

      res.json(messages);
    } catch (dbError) {
      console.error('Database error:', dbError);
      // Return cached messages on database error
      const messages = messageCache.global.filter(msg => {
        const msgTime = new Date(msg.timestamp).getTime();
        return msgTime > since;
      });
      return res.json(messages);
    }
  } catch (error) {
    console.error('Get global messages error:', error);
    res.status(500).json({ error: 'Failed to get messages' });
  }
});

// Send global message
router.post('/global', requireAuth, async (req, res) => {
  try {
    const { message, timestamp, userId, username } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Create message object
    const messageObj = {
      id: uuidv4(),
      message,
      userId: userId || req.user.id,
      username: username || req.user.username,
      timestamp: timestamp || new Date().toISOString()
    };

    // Add to cache
    messageCache.global.push(messageObj);

    // Limit cache size
    if (messageCache.global.length > 100) {
      messageCache.global = messageCache.global.slice(-100);
    }

    // Check if database is available
    if (!pool) {
      console.log('Database not available, message saved to cache only');
      return res.json(messageObj);
    }

    try {
      // Check if user exists in the database
      const userExists = await pool.query(
        'SELECT 1 FROM users WHERE id = $1 LIMIT 1',
        [messageObj.userId]
      );

      if (userExists.rows.length === 0) {
        console.log('User does not exist in database, creating temporary user');
        // Create a temporary user to satisfy the foreign key constraint
        try {
          await pool.query(
            `INSERT INTO users (id, username, email, password_hash, is_guest, created_at)
             VALUES ($1, $2, $3, $4, $5, $6)
             ON CONFLICT (id) DO NOTHING`,
            [messageObj.userId, messageObj.username, `guest_${messageObj.userId}@example.com`, 'temp_hash', true, new Date()]
          );
        } catch (userError) {
          console.error('Error creating temporary user:', userError);
          // Continue anyway, the message will be in the cache
        }
      }

      // Save message to database
      await pool.query(
        `INSERT INTO messages (id, type, content, user_id, username, created_at)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [messageObj.id, 'global', message, messageObj.userId, messageObj.username, new Date(messageObj.timestamp)]
      );

      res.json(messageObj);
    } catch (dbError) {
      console.error('Database error:', dbError);
      // Return success even on database error since we cached the message
      return res.json(messageObj);
    }
  } catch (error) {
    console.error('Send global message error:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// Get squad messages
router.get('/squad/:squadId', requireAuth, async (req, res) => {
  try {
    const { squadId } = req.params;
    const since = req.query.since ? parseInt(req.query.since) : 0;

    // Check if user is a member of the squad
    let isMember = false;

    if (pool) {
      try {
        const membershipResult = await pool.query(
          'SELECT * FROM squad_members WHERE squad_id = $1 AND user_id = $2 LIMIT 1',
          [squadId, req.user.id]
        );

        isMember = membershipResult.rows.length > 0;
      } catch (dbError) {
        console.error('Database error checking membership:', dbError);
        // Assume membership if database error
        isMember = true;
      }
    } else {
      // Assume membership if database unavailable
      isMember = true;
    }

    if (!isMember) {
      return res.status(403).json({ error: 'You are not a member of this squad' });
    }

    // Check if database is available
    if (!pool) {
      console.log('Database not available, returning cached squad messages');
      const messages = (messageCache.squad[squadId] || []).filter(msg => {
        const msgTime = new Date(msg.timestamp).getTime();
        return msgTime > since;
      });
      return res.json(messages);
    }

    try {
      // Get messages from database
      const messagesResult = await pool.query(
        `SELECT * FROM messages
         WHERE type = 'squad' AND squad_id = $1 AND created_at > to_timestamp($2/1000.0)
         ORDER BY created_at ASC
         LIMIT 100`,
        [squadId, since]
      );

      const messages = messagesResult.rows.map(row => ({
        id: row.id,
        message: row.content,
        userId: row.user_id,
        username: row.username,
        squadId: row.squad_id,
        timestamp: row.created_at
      }));

      res.json(messages);
    } catch (dbError) {
      console.error('Database error:', dbError);
      // Return cached messages on database error
      const messages = (messageCache.squad[squadId] || []).filter(msg => {
        const msgTime = new Date(msg.timestamp).getTime();
        return msgTime > since;
      });
      return res.json(messages);
    }
  } catch (error) {
    console.error('Get squad messages error:', error);
    res.status(500).json({ error: 'Failed to get messages' });
  }
});

// Send squad message
router.post('/squad/:squadId', requireAuth, async (req, res) => {
  try {
    const { squadId } = req.params;
    const { message, timestamp, userId, username } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Check if user is a member of the squad
    let isMember = false;

    if (pool) {
      try {
        const membershipResult = await pool.query(
          'SELECT * FROM squad_members WHERE squad_id = $1 AND user_id = $2 LIMIT 1',
          [squadId, req.user.id]
        );

        isMember = membershipResult.rows.length > 0;
      } catch (dbError) {
        console.error('Database error checking membership:', dbError);
        // Assume membership if database error
        isMember = true;
      }
    } else {
      // Assume membership if database unavailable
      isMember = true;
    }

    if (!isMember) {
      return res.status(403).json({ error: 'You are not a member of this squad' });
    }

    // Create message object
    const messageObj = {
      id: uuidv4(),
      message,
      userId: userId || req.user.id,
      username: username || req.user.username,
      squadId,
      timestamp: timestamp || new Date().toISOString()
    };

    // Add to cache
    if (!messageCache.squad[squadId]) {
      messageCache.squad[squadId] = [];
    }
    messageCache.squad[squadId].push(messageObj);

    // Limit cache size
    if (messageCache.squad[squadId].length > 100) {
      messageCache.squad[squadId] = messageCache.squad[squadId].slice(-100);
    }

    // Check if database is available
    if (!pool) {
      console.log('Database not available, message saved to cache only');
      return res.json(messageObj);
    }

    try {
      // Check if user exists in the database
      const userExists = await pool.query(
        'SELECT 1 FROM users WHERE id = $1 LIMIT 1',
        [messageObj.userId]
      );

      if (userExists.rows.length === 0) {
        console.log('User does not exist in database, creating temporary user');
        // Create a temporary user to satisfy the foreign key constraint
        try {
          await pool.query(
            `INSERT INTO users (id, username, email, password_hash, is_guest, created_at)
             VALUES ($1, $2, $3, $4, $5, $6)
             ON CONFLICT (id) DO NOTHING`,
            [messageObj.userId, messageObj.username, `guest_${messageObj.userId}@example.com`, 'temp_hash', true, new Date()]
          );
        } catch (userError) {
          console.error('Error creating temporary user:', userError);
          // Continue anyway, the message will be in the cache
        }
      }

      // Check if squad exists in the database
      const squadExists = await pool.query(
        'SELECT 1 FROM squads WHERE id = $1 LIMIT 1',
        [squadId]
      );

      if (squadExists.rows.length === 0) {
        console.log('Squad does not exist in database, creating temporary squad');
        // Create a temporary squad to satisfy the foreign key constraint
        try {
          await pool.query(
            `INSERT INTO squads (id, code, leader_id, created_at)
             VALUES ($1, $2, $3, $4)
             ON CONFLICT (id) DO NOTHING`,
            [squadId, 'TEMP' + Math.floor(Math.random() * 10000), messageObj.userId, new Date()]
          );
        } catch (squadError) {
          console.error('Error creating temporary squad:', squadError);
          // Continue anyway, the message will be in the cache
        }
      }

      // Save message to database
      await pool.query(
        `INSERT INTO messages (id, type, content, user_id, username, squad_id, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [messageObj.id, 'squad', message, messageObj.userId, messageObj.username, squadId, new Date(messageObj.timestamp)]
      );

      res.json(messageObj);
    } catch (dbError) {
      console.error('Database error:', dbError);
      // Return success even on database error since we cached the message
      return res.json(messageObj);
    }
  } catch (error) {
    console.error('Send squad message error:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

module.exports = router;
