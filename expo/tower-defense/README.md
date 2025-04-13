# Tower Defense Game

A simple tower defense game built with Node.js, Express, and Canvas.

## Features

- Different types of towers with unique abilities
- Multiple enemy types with different properties
- Wave-based gameplay with increasing difficulty
- Interactive UI with tower placement and upgrades
- Responsive design for different screen sizes

## How to Play

1. **Start the Game**: Click the "Start Wave" button to begin
2. **Place Towers**: Select a tower type and click on the map to place it
3. **Defend Your Base**: Prevent enemies from reaching the end of the path
4. **Earn Gold**: Defeat enemies to earn gold for more towers
5. **Survive Waves**: Complete waves to progress and face stronger enemies

## Tower Types

- **Basic Tower** ($50): Balanced damage and range
- **Sniper Tower** ($100): High damage, long range, slow fire rate
- **AoE Tower** ($150): Area damage, medium range
- **Slow Tower** ($75): Slows enemies, low damage

## Keyboard Shortcuts

- **1-4**: Select tower types
- **ESC**: Deselect tower
- **Space**: Start wave
- **R**: Toggle tower ranges
- **S**: Toggle game speed

## Installation

1. Make sure you have [Node.js](https://nodejs.org/) installed
2. Clone this repository
3. Navigate to the project directory
4. Install dependencies:

```bash
npm install
```

5. Start the server:

```bash
npm start
```

6. Open your browser and go to `http://localhost:3000`

## Development

To run the game in development mode with auto-restart:

```bash
npm run dev
```

## Deployment

### Environment Setup

Copy the example environment file and adjust as needed:

```bash
cp .env.example .env
```

### Deploying to Render

1. Create a new Web Service on Render
2. Connect your repository
3. Use the following settings:
   - **Environment**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
   - **Environment Variables**: Set `NODE_ENV=production`

### Deploying to Heroku

1. Create a new Heroku app
2. Connect your repository
3. Deploy the app
4. Heroku will automatically use the Procfile

```bash
# Or deploy manually with Heroku CLI
heroku create
git push heroku main
```

### Deploying to Other Platforms

The application is designed to work with most Node.js hosting platforms:

- Set `NODE_ENV=production`
- The application will use the `PORT` environment variable provided by the platform
- For platforms that need a specific start command, use `start.sh`

## Technologies Used

- Node.js
- Express
- Socket.IO
- HTML5 Canvas
- JavaScript (ES6+)
- CSS3
- Compression (for performance)
- Helmet (for security)
- CORS (for cross-origin support)
- dotenv (for environment variables)

## License

MIT
