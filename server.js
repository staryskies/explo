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

// Initialize Express app
const app = express();
const server = http.createServer(app);

// Enable CORS
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? ['https://tower-defense-game.vercel.app']
    : ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true
}));

// Compress responses
app.use(compression());

// Parse JSON bodies
app.use(express.json());

// Parse cookies
app.use(cookieParser());

// Authentication middleware
app.use(authenticate);

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
      connectSrc: ["'self'", 'wss:', 'ws:', 'https://explo-98bi.onrender.com', 'wss://explo-98bi.onrender.com']
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

// Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production'
      ? ['https://tower-defense-game.vercel.app']
      : ['http://localhost:3000', 'http://localhost:5173'],
    credentials: true
  }
});

// Socket.IO middleware for authentication
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication error'));
    }

    // Verify token using JWT
    const jwt = require('jsonwebtoken');
    const prisma = require('./lib/prisma');

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Find session in database
      const session = await prisma.session.findUnique({
        where: { token },
        include: { user: true }
      });

      // Check if session exists and is not expired
      if (!session || new Date() > session.expiresAt) {
        return next(new Error('Invalid session'));
      }

      // Set user in socket
      socket.user = session.user;
      next();
    } catch (error) {
      return next(new Error('Invalid token'));
    }
  } catch (error) {
    console.error('Socket authentication error:', error);
    next(new Error('Authentication error'));
  }
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}, User: ${socket.user.username}`);

  // Join user to their own room for private messages
  socket.join(`user:${socket.user.id}`);

  // Handle squad room joining
  socket.on('join-squad', async (squadId) => {
    try {
      // Check if user is a member of the squad
      const prisma = require('./lib/prisma');
      const membership = await prisma.squadMember.findFirst({
        where: {
          squadId,
          userId: socket.user.id
        }
      });

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
      const squad = await prisma.squad.findUnique({
        where: { id: squadId },
        include: {
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                  isGuest: true
                }
              }
            }
          }
        }
      });

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

      // Check if user is a member of the squad
      const prisma = require('./lib/prisma');
      const membership = await prisma.squadMember.findFirst({
        where: {
          squadId,
          userId: socket.user.id
        }
      });

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

      // Check if user is a member of the squad
      const prisma = require('./lib/prisma');
      const membership = await prisma.squadMember.findFirst({
        where: {
          squadId,
          userId: socket.user.id
        }
      });

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
    console.log(`User disconnected: ${socket.id}, User: ${socket.user.username}`);

    // Notify squad members if user was in a squad
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

// Initialize database connection
const { db, pool } = require('./db');

// Handle database connection cleanup
process.on('beforeExit', async () => {
  await pool.end();
});

async function startServer() {
  try {
    // Check database connection
    console.log('Checking database connection...');
    try {
      // Test the database connection with a simple query
      await pool.query('SELECT NOW()');
      console.log('Database connection successful');
    } catch (dbError) {
      console.error('Database connection failed:', dbError);
      console.log('Starting server without database connection...');
      // Continue starting the server even if database connection fails
      // This allows the static files to be served even if the database is down
    }

    // Check if database needs initialization
    console.log('Checking if database needs initialization...');
    try {
      // Try to query the users table to see if it exists
      const { users } = require('./db/schema');
      const result = await db.select().from(users).limit(1);
      console.log('Database already initialized');
    } catch (error) {
      // If the table doesn't exist, initialize the database
      console.log('Database needs initialization, running init script...');
      try {
        const initDb = require('./scripts/init-db');
        await initDb();
        console.log('Database initialization completed successfully');
      } catch (initError) {
        console.error('Database initialization failed:', initError);
        console.log('Starting server without database initialization...');
        // Continue starting the server even if database initialization fails
      }
    }

    // Start the server
    server.listen(PORT, HOST, () => {
      console.log(`Server running on http://${HOST}:${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
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
