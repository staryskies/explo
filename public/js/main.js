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

  // Handle mouse move for tower placement preview
  canvas.addEventListener('mousemove', (e) => {
    // Track mouse position
    game.trackMouseMovement(e);

    // The preview is drawn in the game's draw method
    // We just need to trigger a redraw
    if (game.selectedTowerType) {
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
    // Resize is handled in the Game class
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
