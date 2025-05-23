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

// Create a global game variable to be accessible throughout the file
window.game = null;

document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM loaded, initializing game...');
  try {
    // Get the canvas element
    const canvas = document.getElementById('gameCanvas');
    if (!canvas) {
      console.error('Canvas element not found');
      return;
    }

    // Set initial canvas size to ensure it's not zero
    canvas.width = window.innerWidth - 250; // Subtract sidebar width
    canvas.height = window.innerHeight;
    console.log(`Initial canvas size set to ${canvas.width}x${canvas.height}`);

    // Get selected map from session storage
    const selectedMapId = sessionStorage.getItem('selectedMap') || 'classic';
    console.log(`Selected map: ${selectedMapId}`);

    // Find the map template - use window.mapTemplates to avoid undefined errors
    const mapTemplates = window.mapTemplates || [];
    const selectedMapTemplate = mapTemplates.find(map => map.id === selectedMapId) || mapTemplates[0];

    // Create the game instance with the selected map and assign to window.game
    window.game = new Game(canvas, selectedMapTemplate);

    // Create a local reference for convenience
    const game = window.game;

    // Force a redraw after a short delay to ensure everything is initialized
    setTimeout(() => {
      if (game && game.map) {
        console.log('Forcing map redraw after delay');
        game.draw();
      }
    }, 100);
  } catch (error) {
    console.error('Error initializing game:', error);
  }

  // Load player data to get unlocked towers
  if (typeof loadPlayerData === 'function') {
    loadPlayerData();
  }

  // Make sure game is initialized before proceeding
  if (!window.game) {
    console.error('Game not initialized properly');
    return;
  }

  // Create a local reference for convenience
  const game = window.game;

  // Update available towers based on unlocked status
  updateAvailableTowers(game);

  // Tower buttons are already handled in game.initEventListeners()



  // Force initial draw to show the map immediately
  game.draw();
  console.log('Initial map draw completed');

  // Start the game loop immediately
  game.lastUpdateTime = performance.now();
  window.requestAnimationFrame((time) => game.gameLoop(time));
  console.log('Game loop started with delta time');

  // Set an interval to ensure the map is always visible even before game starts
  const mapDrawInterval = setInterval(() => {
    if (game && !game.gameStarted) {
      game.draw();
    } else {
      // Once game has started, clear the interval as the game loop will handle drawing
      clearInterval(mapDrawInterval);
    }
  }, 100);

  // Ensure tower placement preview is always visible
  const canvas = document.getElementById('gameCanvas');
  if (canvas) {
    canvas.addEventListener('mousemove', () => {
      // Always redraw on mouse move if a tower is selected or game hasn't started
      // This ensures the tower placement preview is always visible
      if (game && (game.selectedTowerType || !game.gameStarted)) {
        game.draw();
      }
    });
  }

  // Handle keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    // Make sure game is initialized
    if (!window.game) return;

    // Use the global game reference
    const game = window.game;

    switch (e.key) {
      case 'q':
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

  // Static app - no server dependencies
  console.log('Running in static mode');

  // Handle window resize with debounce to prevent excessive resizing
  let resizeTimeout;
  window.addEventListener('resize', () => {
    // Clear the previous timeout
    clearTimeout(resizeTimeout);

    // Set a new timeout to resize after 100ms of no resize events
    resizeTimeout = setTimeout(() => {
      // Make sure game is initialized
      if (!window.game) return;

      // Resize the canvas and redraw
      window.game.resizeCanvas();
      // No need to call draw() as it's already called in resizeCanvas()
      console.log('Window resized, canvas updated');
    }, 100);
  });

  // Canvas click for tower placement is already handled in game.initEventListeners()

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

  // Add show tutorial button event listener
  document.getElementById('showTutorial').addEventListener('click', () => {
    if (window.tutorialSystem) {
      window.tutorialSystem.showTutorialAgain();
    }
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

        // Store the variant in the button's dataset for use when placing towers
        button.dataset.variant = selectedVariant;
      }
    }
  });

  // We don't need to override placeTower anymore since it's handled in the click event
  // Just mark as handled to avoid future attempts
  if (game && !game.skinHandlerAdded) {
    game.skinHandlerAdded = true;
  }
}
