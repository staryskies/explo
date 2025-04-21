# Deployment Guide

This guide explains how to deploy the Tower Defense game to Vercel with a Render PostgreSQL database.

## Prerequisites

- A GitHub account
- A Vercel account (https://vercel.com)
- A Render account (https://render.com)

## Database Setup on Render

1. Log in to your Render account
2. Create a new PostgreSQL database:
   - Go to "Dashboard" > "New" > "PostgreSQL"
   - Name: `towers`
   - Database: `towers`
   - User: `towers_user`
   - Region: Choose the closest to your users
   - Plan: Free or paid depending on your needs
   - Click "Create Database"

3. Once created, note the following information:
   - External Database URL: `postgresql://towers_user:makdqw1e5ABKJKjdxC4Ztz3e0levadWE@dpg-d02l6s3e5dus73bttd5g-a.oregon-postgres.render.com/towers`

## Deploying to Vercel

1. Push your code to a GitHub repository

2. Log in to your Vercel account

3. Create a new project:
   - Click "Add New" > "Project"
   - Import your GitHub repository
   - Configure the project:
     - Framework Preset: "Other"
     - Root Directory: `./`
     - Build Command: `npm install`
     - Output Directory: `public`

4. Add environment variables:
   - Click "Environment Variables"
   - Add the following variables:
     - `DATABASE_URL`: `postgresql://towers_user:makdqw1e5ABKJKjdxC4Ztz3e0levadWE@dpg-d02l6s3e5dus73bttd5g-a.oregon-postgres.render.com/towers`
     - `JWT_SECRET`: bobyiscrazy
     - `COOKIE_SECRET`: bobyiscrazy
     - `NODE_ENV`: `production`

5. Deploy the project:
   - Click "Deploy"
   - Wait for the deployment to complete

6. Once deployed, your application will be available at the provided Vercel URL

## Important Configuration Files

### server.js

The `server.js` file must export the Express app for Vercel to work correctly:

```javascript
// At the end of server.js
module.exports = app;
```

### api/index.js

The `api/index.js` file serves as the entry point for Vercel serverless functions:

```javascript
// This file is used as an entry point for Vercel serverless functions
// It simply re-exports the Express app from server.js

// Import the Express app from server.js
const app = require('../server');

// Export the app for Vercel
module.exports = app;
```

### vercel.json

The `vercel.json` file configures how Vercel builds and routes requests:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "api/index.js",
      "use": "@vercel/node",
      "config": {
        "includeFiles": [
          "scripts/**",
          "server.js",
          "routes/**",
          "middleware/**"
        ]
      }
    },
    {
      "src": "public/**",
      "use": "@vercel/static"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/api/index.js"
    },
    {
      "src": "/socket.io/(.*)",
      "dest": "/api/index.js"
    },
    {
      "src": "/(.*)",
      "dest": "/public/$1"
    },
    {
      "src": "/",
      "dest": "/public/index.html"
    }
  ]
}
```

## Troubleshooting

### Database Connection Issues

If you encounter database connection issues:

1. Check that the `DATABASE_URL` environment variable is correct
2. Ensure that the database is running on Render
3. Check if the database allows connections from Vercel's IP addresses
   - Go to your database settings on Render
   - Under "Access Control", add Vercel's IP ranges or set to allow all IPs

### Deployment Failures

If deployment fails:

1. Check the build logs on Vercel
2. Ensure that all required environment variables are set
3. Try redeploying after fixing any issues

## Monitoring and Maintenance

- Monitor your application using Vercel's dashboard
- Check database performance and usage on Render's dashboard
- Set up alerts for any issues
- Regularly backup your database

## Updating the Application

To update your application:

1. Push changes to your GitHub repository
2. Vercel will automatically redeploy the application
3. If you make changes to the database schema, you'll need to manually update the database

## Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Render PostgreSQL Documentation](https://render.com/docs/databases)
- [Node.js on Vercel Documentation](https://vercel.com/docs/functions/serverless-functions/runtimes/node-js)
