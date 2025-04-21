// This file is used as an entry point for Vercel serverless functions
// It simply re-exports the Express app from server.js

// Import the Express app from server.js
const app = require('../server');

// Export the app for Vercel
module.exports = app;
