// server.js
const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Serve all files in the 'explo' folder as static assets
app.use(express.static(path.join(__dirname, 'explo')));

// Serve index.html at root
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'explo', 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
