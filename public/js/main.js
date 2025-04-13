/**
 * Main entry point for the tower defense game
 */
// Add global debugging
window.DEBUG = true;

// Add a global error handler
window.onerror = function(message, source, lineno, colno, error) {
  console.error('Global error:', message, 'at', source, lineno, colno, error);
  return false;
};

document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM loaded, initializing game...');
  // Get the canvas element
  const canvas = document.getElementById('gameCanvas');

  // Create the game instance
  const game = new Game(canvas);

  // Force canvas resize to ensure proper dimensions
  game.resizeCanvas();

  // Force map initialization
  if (game.map) {
    game.map.initializeGrid();
    game.map.generatePath();
    game.map.findBuildableTiles();
    console.log('Map forcefully initialized');
  }

  // Force initial draw to show the map immediately
  game.draw();

  // Start the game loop immediately with a low-priority timeout
  setTimeout(() => {
    // Initialize the last update time to the current time
    game.lastUpdateTime = performance.now();

    // Start the animation loop with the current time
    window.requestAnimationFrame((time) => game.gameLoop(time));
    console.log('Game loop started with delta time');
  }, 100);

  // Handle mouse move for tower placement preview
  canvas.addEventListener('mousemove', (e) => {
    // Track mouse position
    game.trackMouseMovement(e);

    // Always redraw on mouse move to ensure the map is visible
    // This is especially important before the game loop starts
    if (!game.gameStarted) {
      game.draw();
    }
  });

  // Handle keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    switch (e.key) {
      case '1':
        // Select basic tower
        game.selectTowerType('basic');
        break;
      case '2':
        // Select sniper tower
        game.selectTowerType('sniper');
        break;
      case '3':
        // Select AOE tower
        game.selectTowerType('aoe');
        break;
      case '4':
        // Select slow tower
        game.selectTowerType('slow');
        break;
      case 'Escape':
        // Deselect tower
        game.selectedTowerType = null;
        document.querySelectorAll('.tower-btn').forEach(btn => {
          btn.classList.remove('selected');
        });
        break;
      case ' ':
        // Start wave
        if (!game.waveInProgress && !game.gameOver) {
          game.startWave();
        }
        break;
      case 'r':
        // Toggle tower ranges
        game.showTowerRanges = !game.showTowerRanges;
        document.getElementById('showRange').checked = game.showTowerRanges;
        break;
      case 's':
        // Toggle speed
        game.toggleSpeed();
        break;
    }
  });

  // No Socket.IO - single player only
  console.log('Running in single-player mode');

  // Handle window resize
  window.addEventListener('resize', () => {
    // Resize the canvas and redraw
    game.resizeCanvas();
    game.draw();
    console.log('Window resized, canvas updated');
  });

  // Handle canvas click for tower placement
  canvas.addEventListener('click', (e) => {
    // Track mouse position first to ensure coordinates are up to date
    game.trackMouseMovement(e);

    // Then place tower at current mouse position
    if (game.selectedTowerType) {
      game.placeTower(game.mouseX, game.mouseY);
    }
  });

  // Log that initialization is complete
  console.log('Game initialized successfully');
});
