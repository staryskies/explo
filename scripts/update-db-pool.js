// scripts/update-db-pool.js
// This script updates all route files to use the centralized database pool

const fs = require('fs');
const path = require('path');

// List of files to update
const filesToUpdate = [
  'routes/playerData.js',
  'routes/messages.js',
  'routes/squads.js'
];

// The old code to replace
const oldPoolCode = `// Create a connection pool
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
}`;

// The new code to insert
const newPoolCode = `// Use the centralized database pool
const { getPool } = require('../lib/db-pool');`;

// Function to update a file
function updateFile(filePath) {
  try {
    // Read the file
    const fullPath = path.join(__dirname, '..', filePath);
    let content = fs.readFileSync(fullPath, 'utf8');
    
    // Replace the Pool import
    content = content.replace(/const { Pool } = require\('pg'\);/, '');
    
    // Replace the pool initialization code
    content = content.replace(oldPoolCode, newPoolCode);
    
    // Replace all pool.query calls with client.query
    content = content.replace(/await pool\.query\(/g, 'const pool = getPool();\n  const client = await pool.connect();\n  try {\n    const result = await client.query(');
    content = content.replace(/\);(\s+)(return|res|const|let|var|if|for|while)/g, ');\n    $1$2');
    content = content.replace(/\);(\s+)(\/\/|\/\*)/g, ');\n    $1$2');
    content = content.replace(/\);(\s+)}/g, ');\n  } finally {\n    client.release();\n  }\n}');
    
    // Write the updated content back to the file
    fs.writeFileSync(fullPath, content, 'utf8');
    
    console.log(`Updated ${filePath}`);
  } catch (error) {
    console.error(`Error updating ${filePath}:`, error);
  }
}

// Update all files
filesToUpdate.forEach(updateFile);

console.log('All files updated successfully!');
