// Load environment variables from .env file if present
require('dotenv').config();

const express = require('express');
const http = require('http');
const path = require('path');
const compression = require('compression');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const { Server } = require('socket.io');
const { authenticate } = require('./middleware/auth');

// Import routes
const authRoutes = require('./routes/auth');
const squadRoutes = require('./routes/squads');
const playerDataRoutes = require('./routes/playerData');
const messagesRoutes = require('./routes/messages');

// Initialize Express app
const app = express();
const server = http.createServer(app);

// Enable CORS with more permissive configuration
app.use(cors({
  origin: '*', // Allow all origins
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Compress responses
app.use(compression());

// Parse JSON bodies
app.use(express.json());

// Parse cookies
app.use(cookieParser());

// Authentication middleware
app.use(authenticate);

// Rate limiting middleware - apply to all routes
const rateLimiter = require('./middleware/rateLimiter');
app.use(rateLimiter({
  windowMs: 60000, // 1 minute
  maxRequests: 30   // 30 requests per minute
}));

// Add delay to API responses to reduce server load
const delayResponse = require('./middleware/delayResponse');
app.use(delayResponse({
  minDelay: 200,  // 200ms minimum delay
  maxDelay: 800   // 800ms maximum delay
}));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Serve static files from the public directory with proper MIME types and caching
app.use(express.static(path.join(__dirname, 'public'), {
  maxAge: '1d',
  etag: true,
  setHeaders: (res, path) => {
    // Set proper MIME types for JavaScript files
    if (path.endsWith('.js')) {
      res.setHeader('Content-Type', 'application/javascript');
    }
  }
}));

// Security middleware with relaxed CSP for development
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", 'https://explo-98bi.onrender.com'],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      imgSrc: ["'self'", 'data:'],
      connectSrc: ["'self'", 'wss:', 'ws:', 'https://explo-98bi.onrender.com', 'wss://explo-98bi.onrender.com', 'https://explo-rho.vercel.app', 'wss://explo-rho.vercel.app', 'https://*.vercel.app', 'wss://*.vercel.app']
    }
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

// Health check endpoint for monitoring
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/squads', squadRoutes);
app.use('/api/player-data', playerDataRoutes);
app.use('/api/messages', messagesRoutes);

// Global error handler
app.use((err, req, res, next) => {
  console.error('API Error:', err);

  // Send JSON response for API requests
  if (req.path.startsWith('/api/')) {
    res.status(500).json({ error: 'A server error occurred. Please try again later.' });
  } else {
    res.status(500).send('A server error occurred. Please try again later.');
  }
});

// Route for the game
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Initialize Socket.IO with configuration for serverless environments
const io = new Server(server, {
  cors: {
    origin: '*', // Allow all origins
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
  },
  // Add configuration for serverless environments
  transports: ['polling', 'websocket'],
  allowUpgrades: true,
  pingTimeout: 30000,
  pingInterval: 25000,
  cookie: {
    name: 'io',
    path: '/',
    httpOnly: true,
    sameSite: 'lax'
  }
});

// Socket.IO middleware for authentication - simplified for reliability
io.use(async (socket, next) => {
  try {
    // Always create a user object to avoid undefined errors
    let userId = `guest-${Date.now()}`;
    let username = 'Guest';
    let isGuest = true;

    // Try to get token from various sources
    const token = socket.handshake.auth?.token ||
                 socket.handshake.query?.token ||
                 socket.handshake.headers?.authorization?.split(' ')[1];

    if (token) {
      try {
        // Try to verify the token
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default_secret_for_dev');

        // Use decoded data even if database is unavailable
        userId = decoded.userId || userId;
        username = 'User';
        isGuest = false;

        // Try to get user data from database if available
        if (pool) {
          try {
            const userResult = await pool.query(
              'SELECT id, username, email, is_guest as "isGuest" FROM users WHERE id = $1 LIMIT 1',
              [decoded.userId]
            );

            if (userResult.rows.length > 0) {
              const user = userResult.rows[0];
              userId = user.id;
              username = user.username;
              isGuest = user.isGuest;
            }
          } catch (dbError) {
            console.log('Database query failed, using token data:', dbError.message);
          }
        }
      } catch (tokenError) {
        console.log('Token verification failed, using guest account:', tokenError.message);
      }
    } else {
      console.log('No authentication token provided, using guest account');
    }

    // Set user in socket - always have a valid user object
    socket.user = {
      id: userId,
      username: username,
      isGuest: isGuest
    };

    // Always allow connection
    next();
  } catch (error) {
    console.error('Socket authentication error:', error);
    // Even on error, create a guest user and allow connection
    socket.user = { id: `guest-${Date.now()}`, username: 'Guest', isGuest: true };
    next();
  }
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}, User: ${socket.user?.username || 'Unknown'}`);

  // Send connection acknowledgement
  socket.emit('connection-established', {
    socketId: socket.id,
    userId: socket.user?.id || 'guest',
    timestamp: new Date().toISOString()
  });

  // Join user to their own room for private messages
  if (socket.user && socket.user.id) {
    socket.join(`user:${socket.user.id}`);
  }

  // Handle squad room joining
  socket.on('join-squad', async (squadId) => {
    try {
      // Validate input
      if (!squadId) {
        socket.emit('error', { message: 'Invalid squad ID' });
        return;
      }

      // Check if user is authenticated
      if (!socket.user || !socket.user.id) {
        socket.emit('error', { message: 'Authentication required' });
        return;
      }

      // Check if database is available
      if (!pool) {
        console.log('Database not available, allowing squad join without verification');
        // Join squad room without verification
        socket.join(`squad:${squadId}`);
        socket.emit('squad-joined', {
          id: squadId,
          members: [{
            id: socket.user.id,
            username: socket.user.username,
            isGuest: socket.user.isGuest,
            joinedAt: new Date().toISOString()
          }]
        });
        return;
      }

      // Check if user is a member of the squad
      const membershipResult = await pool.query(
        `SELECT * FROM squad_members WHERE squad_id = $1 AND user_id = $2 LIMIT 1`,
        [squadId, socket.user.id]
      );

      const membership = membershipResult.rows[0];

      if (!membership) {
        socket.emit('error', { message: 'You are not a member of this squad' });
        return;
      }

      // Leave any previous squad rooms
      const rooms = [...socket.rooms];
      rooms.forEach(room => {
        if (room.startsWith('squad:')) {
          socket.leave(room);
        }
      });

      // Join squad room
      socket.join(`squad:${squadId}`);
      console.log(`User ${socket.user.username} joined squad room: ${squadId}`);

      // Notify other squad members
      socket.to(`squad:${squadId}`).emit('member-joined', {
        id: socket.user.id,
        username: socket.user.username,
        isGuest: socket.user.isGuest
      });

      // Get squad members
      const squadResult = await pool.query(
        `SELECT s.id, s.code, s.leader_id as "leaderId"
         FROM squads s
         WHERE s.id = $1`,
        [squadId]
      );

      const squad = squadResult.rows[0];

      // Get squad members
      const membersResult = await pool.query(
        `SELECT sm.joined_at as "joinedAt", u.id, u.username, u.is_guest as "isGuest"
         FROM squad_members sm
         JOIN users u ON sm.user_id = u.id
         WHERE sm.squad_id = $1`,
        [squadId]
      );

      // Add members to squad object
      squad.members = membersResult.rows;

      // Send squad data to user
      socket.emit('squad-joined', {
        id: squad.id,
        code: squad.code,
        leaderId: squad.leaderId,
        members: squad.members.map(member => ({
          id: member.user.id,
          username: member.user.username,
          isGuest: member.user.isGuest,
          joinedAt: member.joinedAt
        }))
      });
    } catch (error) {
      console.error('Join squad error:', error);
      socket.emit('error', { message: 'Failed to join squad' });
    }
  });

  // Handle squad chat messages
  socket.on('squad-message', async (data) => {
    try {
      const { squadId, message } = data;

      // Validate input
      if (!squadId || !message) {
        socket.emit('error', { message: 'Invalid message data' });
        return;
      }

      // Check if user is authenticated
      if (!socket.user || !socket.user.id) {
        socket.emit('error', { message: 'Authentication required' });
        return;
      }

      // Check if database is available
      if (!pool) {
        console.log('Database not available, allowing squad message without verification');
        // Broadcast message without verification
        io.to(`squad:${squadId}`).emit('squad-message', {
          id: Date.now().toString(),
          userId: socket.user.id,
          username: socket.user.username,
          message,
          timestamp: new Date().toISOString()
        });
        return;
      }

      // Check if user is a member of the squad
      const membershipResult = await pool.query(
        `SELECT * FROM squad_members WHERE squad_id = $1 AND user_id = $2 LIMIT 1`,
        [squadId, socket.user.id]
      );

      const membership = membershipResult.rows[0];

      if (!membership) {
        socket.emit('error', { message: 'You are not a member of this squad' });
        return;
      }

      // Broadcast message to squad
      io.to(`squad:${squadId}`).emit('squad-message', {
        id: Date.now().toString(),
        userId: socket.user.id,
        username: socket.user.username,
        message,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Squad message error:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });

  // Handle game state updates
  socket.on('game-state', async (data) => {
    try {
      const { squadId, gameState } = data;

      // Validate input
      if (!squadId || !gameState) {
        socket.emit('error', { message: 'Invalid game state data' });
        return;
      }

      // Check if user is authenticated
      if (!socket.user || !socket.user.id) {
        socket.emit('error', { message: 'Authentication required' });
        return;
      }

      // Check if database is available
      if (!pool) {
        console.log('Database not available, allowing game state update without verification');
        // Broadcast game state without verification
        socket.to(`squad:${squadId}`).emit('game-state-update', {
          userId: socket.user.id,
          username: socket.user.username,
          gameState
        });
        return;
      }

      // Check if user is a member of the squad
      const membershipResult = await pool.query(
        `SELECT * FROM squad_members WHERE squad_id = $1 AND user_id = $2 LIMIT 1`,
        [squadId, socket.user.id]
      );

      const membership = membershipResult.rows[0];

      if (!membership) {
        socket.emit('error', { message: 'You are not a member of this squad' });
        return;
      }

      // Broadcast game state to squad (except sender)
      socket.to(`squad:${squadId}`).emit('game-state-update', {
        userId: socket.user.id,
        username: socket.user.username,
        gameState
      });
    } catch (error) {
      console.error('Game state update error:', error);
      socket.emit('error', { message: 'Failed to update game state' });
    }
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    try {
      console.log(`User disconnected: ${socket.id}, User: ${socket.user?.username || 'Unknown'}`);

      // Notify squad members if user was in a squad and user is authenticated
      if (socket.user && socket.user.id) {
        const rooms = [...socket.rooms];
        rooms.forEach(room => {
          if (room.startsWith('squad:')) {
            const squadId = room.split(':')[1];
            socket.to(`squad:${squadId}`).emit('member-left', {
              id: socket.user.id,
              username: socket.user.username
            });
          }
        });
      }
    } catch (error) {
      console.error('Error handling disconnect:', error);
    }
  });

  // Handle global chat messages
  socket.on('global-message', (data) => {
    try {
      const { message } = data;

      // Validate input
      if (!message) {
        socket.emit('error', { message: 'Invalid message data' });
        return;
      }

      // Check if user is authenticated
      if (!socket.user || !socket.user.id) {
        socket.emit('error', { message: 'Authentication required' });
        return;
      }

      // Broadcast message to all connected clients
      io.emit('global-message', {
        id: Date.now().toString(),
        userId: socket.user.id,
        username: socket.user.username,
        message,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Global message error:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });

  // Handle money sharing between squad members
  socket.on('share-money', async (data) => {
    try {
      const { squadId, targetUserId, amount } = data;

      // Validate input
      if (!squadId || !targetUserId || !amount || amount <= 0) {
        socket.emit('error', { message: 'Invalid money sharing data' });
        return;
      }

      // Check if user is authenticated
      if (!socket.user || !socket.user.id) {
        socket.emit('error', { message: 'Authentication required' });
        return;
      }

      // Check if database is available
      if (!pool) {
        console.log('Database not available, allowing money sharing without verification');
        // Send money without verification
        io.to(`user:${targetUserId}`).emit('money-shared', {
          amount,
          fromUserId: socket.user.id,
          fromUsername: socket.user.username,
          timestamp: new Date().toISOString()
        });
        return;
      }

      // Check if both users are members of the squad
      const membershipResult = await pool.query(
        `SELECT * FROM squad_members WHERE squad_id = $1 AND user_id IN ($2, $3)`,
        [squadId, socket.user.id, targetUserId]
      );

      // Ensure both users are in the squad
      const senderMembership = membershipResult.rows.find(row => row.user_id === socket.user.id);
      const receiverMembership = membershipResult.rows.find(row => row.user_id === targetUserId);

      if (!senderMembership || !receiverMembership) {
        socket.emit('error', { message: 'Both users must be members of the squad' });
        return;
      }

      // Send money to target user
      io.to(`user:${targetUserId}`).emit('money-shared', {
        amount,
        fromUserId: socket.user.id,
        fromUsername: socket.user.username,
        timestamp: new Date().toISOString()
      });

      // Notify sender of success
      socket.emit('money-shared-success', {
        amount,
        toUserId: targetUserId,
        timestamp: new Date().toISOString()
      });

      console.log(`User ${socket.user.username} shared ${amount} silver with user ${targetUserId}`);
    } catch (error) {
      console.error('Money sharing error:', error);
      socket.emit('error', { message: 'Failed to share money' });
    }
  });

  // Handle errors
  socket.on('error', (error) => {
    console.error('Socket error:', error);
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

// Handle favicon.ico requests
app.get('/favicon.ico', (req, res) => {
  res.status(204).end(); // No content response for favicon
});

// Handle 404 errors
app.use((req, res) => {
  // Check if the request is for a JavaScript file
  if (req.path.endsWith('.js')) {
    res.status(404).type('application/javascript').send('console.error("File not found: ' + req.path + '");');
  } else if (req.accepts('html')) {
    res.status(404).sendFile(path.join(__dirname, 'public', 'index.html'));
  } else {
    res.status(404).send('Not found');
  }
});

// Initialize database and start the server
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';

// Initialize database connection using the centralized pool
const { initPool, getPool, closePool } = require('./lib/db-pool');

// Initialize the pool
const pool = initPool();

// Make the pool globally available
global.dbPool = pool;

// Handle database connection cleanup
process.on('beforeExit', async () => {
  await closePool();
});

// Handle SIGTERM for graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, closing database connections');
  await closePool();
});

// Handle SIGINT for graceful shutdown
process.on('SIGINT', async () => {
  console.log('SIGINT received, closing database connections');
  await closePool();
});

async function startServer() {
  try {
    // Check database connection
    console.log('Checking database connection...');
    const pool = getPool();
    if (!pool) {
      console.error('Database connection not configured');
      console.log('Starting server without database connection...');
    } else {
      // Add retry logic for database connection
      let connected = false;
      let retries = 3;
      let client = null;

      while (!connected && retries > 0) {
        try {
          console.log(`Attempting database connection (${4-retries}/3)...`);
          // Test the database connection with a simple query
          client = await pool.connect();
          const result = await client.query('SELECT NOW()');
          console.log('Database connection successful, current time:', result.rows[0].now);
          connected = true;

          // Initialize database if connected successfully
          try {
            console.log('Running database initialization...');
            // Create schema
            const createSchema = require('./scripts/create-schema');
            await createSchema();
            console.log('Schema creation completed');

            // Initialize database
            const initDb = require('./scripts/init-db');
            await initDb();
            console.log('Database initialization completed successfully');
          } catch (initError) {
            console.error('Database initialization failed:', initError);
            console.log('Continuing server startup with existing database state...');
          }
        } catch (dbError) {
          retries--;
          console.error(`Database connection attempt failed (${retries} retries left):`, dbError.message);

          if (retries > 0) {
            // Wait before retrying
            console.log(`Waiting 2 seconds before retry...`);
            await new Promise(resolve => setTimeout(resolve, 2000));
          } else {
            console.error('All database connection attempts failed');
            console.log('Starting server without database connection...');
            // Continue starting the server even if database connection fails
            // This allows the static files to be served even if the database is down
          }
        } finally {
          // Release the client back to the pool if it was acquired
          if (client) {
            client.release();
            console.log('Database client released back to pool');
          }
        }
      }
    }

    // Database initialization is now handled in the connection check above

    // Start the server
    server.listen(PORT, HOST, () => {
      console.log(`Server running on http://${HOST}:${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

// Export the Express app for Vercel serverless functions
module.exports = app;
