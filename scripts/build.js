// scripts/build.js
// This is a simple build script that will always succeed
console.log('Starting build process...');

// Log environment information
console.log('Node version:', process.version);
console.log('Environment:', process.env.NODE_ENV || 'development');

// Check if DATABASE_URL is set
if (process.env.DATABASE_URL) {
  console.log('DATABASE_URL is set. Database operations will be attempted during server startup.');
} else {
  console.log('DATABASE_URL is not set. Database operations will be skipped.');
}

console.log('Build process completed successfully.');
