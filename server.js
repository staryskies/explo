// Load environment variables from .env file if present
require('dotenv').config();

const express = require('express');
const http = require('http');
const path = require('path');
const compression = require('compression');
const cors = require('cors');
const helmet = require('helmet');

// Initialize Express app
const app = express();
const server = http.createServer(app);

// Enable CORS
app.use(cors());

// Compress responses
app.use(compression());

// Parse JSON bodies
app.use(express.json());

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

// Route for the game
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// No Socket.IO - single player only

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
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

// Start the server
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';

server.listen(PORT, HOST, () => {
  console.log(`Server running on http://${HOST}:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

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
