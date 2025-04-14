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

  // Get selected map from session storage
  const selectedMapId = sessionStorage.getItem('selectedMap') || 'classic';
  console.log(`Selected map: ${selectedMapId}`);

  // Find the map template
  const selectedMapTemplate = mapTemplates.find(map => map.id === selectedMapId) || mapTemplates[0];

  // Create the game instance with the selected map
  const game = new Game(canvas, selectedMapTemplate);

  // Force canvas resize to ensure proper dimensions
  game.resizeCanvas();

  // Force map initialization
  if (game.map) {
    game.map.initializeGrid();
    game.map.generatePath();
    game.map.findBuildableTiles();
    console.log('Map forcefully initialized');
  }

  // Load player data to get unlocked towers
  if (typeof loadPlayerData === 'function') {
    loadPlayerData();
  }

  // Update available towers based on unlocked status
  updateAvailableTowers(game);

  // Add event listeners to tower buttons
  document.querySelectorAll('.tower-btn').forEach(button => {
    button.addEventListener('click', () => {
      const towerType = button.dataset.type;
      console.log(`Tower button clicked: ${towerType}`);
      game.selectTowerType(towerType);
    });
  });

  // Initialize infinite mode
  game.initializeInfiniteMode();

  // Force initial draw to show the map immediately
  game.draw();
  console.log('Initial map draw completed');

  // Start the game loop immediately
  game.lastUpdateTime = performance.now();
  window.requestAnimationFrame((time) => game.gameLoop(time));
  console.log('Game loop started with delta time');

  // Set an interval to ensure the map is always visible even before game starts
  const mapDrawInterval = setInterval(() => {
    if (!game.gameStarted) {
      game.draw();
    } else {
      // Once game has started, clear the interval as the game loop will handle drawing
      clearInterval(mapDrawInterval);
    }
  }, 100);

  // Handle mouse move for tower placement preview
  canvas.addEventListener('mousemove', (e) => {
    // Track mouse position
    game.trackMouseMovement(e);

    // Always redraw on mouse move if a tower is selected or game hasn't started
    // This ensures the tower placement preview is always visible
    if (game.selectedTowerType || !game.gameStarted) {
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

  // Add restart button event listener
  document.getElementById('restart').addEventListener('click', () => {
    location.reload();
  });

  // Add return to menu button event listener
  document.getElementById('return-to-menu').addEventListener('click', () => {
    window.location.href = 'index.html';
  });
});

// Update available towers based on player's unlocked towers
function updateAvailableTowers(game) {
  // Skip if playerData is not available
  if (typeof playerData === 'undefined') return;

  // Get all tower buttons
  const towerButtons = document.querySelectorAll('.tower-btn');

  // Hide buttons for towers that are not unlocked
  towerButtons.forEach(button => {
    const towerType = button.dataset.type;
    if (!playerData.unlockedTowers.includes(towerType)) {
      button.style.display = 'none'; // Hide the button completely
    } else {
      // If tower is unlocked, check if there's a selected variant
      const selectedVariant = playerData.selectedVariants?.[towerType];
      if (selectedVariant && selectedVariant !== towerType) {
        // Update button text to show variant
        const variantName = selectedVariant.charAt(0).toUpperCase() + selectedVariant.slice(1);
        button.innerHTML = `${variantName}<br>${button.textContent.split('<')[0]}<span class="tower-cost">${button.querySelector('.tower-cost').textContent}</span>`;
      }
    }
  });
}
