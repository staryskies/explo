/**
 * Game class for the tower defense game
 */
class Game {
  constructor(canvas, mapTemplate = null) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');

    // Game state
    this.gameStarted = false;
    this.gameOver = false;
    this.paused = false;
    this.speedMultiplier = 1;
    this.maxSpeedMultiplier = 2.3; // Changed from 5 to 2.3 as requested

    // Difficulty settings
    this.difficulty = sessionStorage.getItem('selectedDifficulty') || 'easy';
    this.waveLimit = getWaveLimit(this.difficulty); // Get wave limit based on difficulty
    this.silverMultiplier = getSilverMultiplier(this.difficulty); // Get silver multiplier
    this.bossWaves = this.generateBossWaves(); // Initialize boss waves based on difficulty
    console.log(`Game difficulty: ${this.difficulty}, Wave limit: ${this.waveLimit}, Silver multiplier: ${this.silverMultiplier}x, Boss waves: ${this.bossWaves}`);

    // Make the game instance globally accessible
    window.game = this;

    // Initialize empty arrays for game objects
    this.towers = [];
    this.enemies = [];
    this.projectiles = [];
    this.effects = [];

    // Silver earned in this game (permanent currency)
    this.silverEarned = 0;

    // Player stats - adjusted based on difficulty
    this.lives = this.getDifficultyLives();
    this.gold = this.getDifficultyGold();
    this.score = 0;
    this.wave = 1;

    // Wave management
    this.waveInProgress = false;
    this.enemiesSpawned = 0;
    this.enemiesKilled = 0;
    this.enemiesLeaked = 0;
    this.totalEnemiesInWave = 0;
    this.spawnInterval = 105.0; // seconds - increased to make enemies spawn slower
    this.timeSinceLastSpawn = 0;

    // Tower placement
    this.selectedTowerType = null;
    this.showTowerRanges = false;

    // Mouse position tracking
    this.mouseX = 0;
    this.mouseY = 0;

    // Time tracking
    this.lastUpdateTime = 0;

    // Set canvas size before creating the map
    this.resizeCanvas(false); // Pass false to avoid calling draw() before map is created

    // Create the map after canvas is sized
    this.map = new GameMap(canvas, this.ctx, mapTemplate);
    console.log('Map created with dimensions:', this.map.gridWidth, 'x', this.map.gridHeight);

    // Initialize event listeners
    this.initEventListeners();

    // Initialize upgrade system
    this.initializeUpgradeSystem();

    // Update UI
    this.updateUI();

    // Draw the initial map
    this.draw();

    console.log('Game initialized, map should be visible');
  }

  // Initialize event listeners
  initEventListeners() {
    // Canvas click for tower placement or upgrade
    this.canvas.addEventListener('click', (e) => {
      if (this.gameOver) return; // Only check for game over, not for selected tower type

      const rect = this.canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // Make sure the map is fully loaded
      if (!this.map || !this.map.grid || this.map.grid.length === 0) {
        console.log('Cannot interact with map - not fully loaded yet');
        return;
      }

      // Check if we're clicking on an existing tower for upgrade
      const clickedTower = this.getTowerAtPosition(x, y);
      if (clickedTower) {
        // Open the upgrade menu for the clicked tower
        console.log(`Clicked on tower: ${clickedTower.type} at (${clickedTower.gridX}, ${clickedTower.gridY})`);
        this.selectTowerForUpgrade(clickedTower);
        return;
      }

      // If no tower was clicked and a tower type is selected, try to place a new tower
      if (this.selectedTowerType) {
        // Convert pixel coordinates to grid coordinates
        const gridPos = this.map.pixelToGrid(x, y);

        // Check if tower can be placed here
        if (this.map.canPlaceTower(gridPos.x, gridPos.y)) {
          // Get tower cost
          const towerCost = this.getTowerCost(this.selectedTowerType);

          // Check if player has enough gold
          if (this.gold < towerCost) {
            console.log(`Not enough gold to place tower. Need ${towerCost}, have ${this.gold}`);
            return;
          }

          try {
            // Convert grid coordinates to pixel coordinates (center of tile)
            const pixelPos = this.map.gridToPixel(gridPos.x, gridPos.y);

            // Get the selected tower button to check for variant
            const towerButton = document.querySelector(`.tower-btn[data-type="${this.selectedTowerType}"]`);
            const variant = towerButton?.dataset.variant;

            // Create the tower with grid coordinates and variant if available
            try {
              const tower = new Tower(pixelPos.x, pixelPos.y, this.selectedTowerType, gridPos.x, gridPos.y, variant);
              this.towers.push(tower);

              // Mark the tile as occupied
              this.map.placeTower(gridPos.x, gridPos.y);

              // Deduct gold
              this.gold -= towerCost;

              // Update UI
              this.updateUI();

              console.log(`Placed ${this.selectedTowerType} tower at (${gridPos.x}, ${gridPos.y})`);
            } catch (error) {
              console.error('Error creating tower:', error);
            }
          } catch (error) {
            console.error('Error placing tower:', error);
          }
        } else {
          console.log('Cannot place tower here');
        }
      }
    });

    // Track mouse movement for tower placement preview
    this.canvas.addEventListener('mousemove', (e) => {
      this.trackMouseMovement(e);
    });

    // Tower selection buttons
    document.querySelectorAll('.tower-btn').forEach(button => {
      button.addEventListener('click', (e) => {
        // Get the tower type from the button's data attribute
        // Use the button itself rather than the event target (which could be a child element)
        const towerType = button.dataset.type;
        if (towerType) {
          this.selectTowerType(towerType);
        }
      });
    });

    // Start wave button
    document.getElementById('startWave').addEventListener('click', () => {
      if (!this.waveInProgress && !this.gameOver) {
        this.startWave();
      }
    });

    // Speed up button
    document.getElementById('speedUp').addEventListener('click', () => {
      this.toggleSpeed();
    });

    // Show range checkbox
    document.getElementById('showRange').addEventListener('change', (e) => {
      this.showTowerRanges = e.target.checked;
    });

    // Restart button
    document.getElementById('restart').addEventListener('click', () => {
      this.restart();
    });

    // Back to menu button
    document.getElementById('backToMenu').addEventListener('click', () => {
      window.location.href = 'index.html';
    });

    // Return to menu button (on game over screen)
    document.getElementById('return-to-menu').addEventListener('click', () => {
      window.location.href = 'index.html';
    });

    // Show tutorial button
    document.getElementById('showTutorial').addEventListener('click', () => {
      if (window.tutorialSystem) {
        this.paused = true;
        window.tutorialSystem.showTutorialAgain();
      }
    });

    // Window resize
    window.addEventListener('resize', () => {
      this.resizeCanvas();
      this.map.resize();
    });
  }

  // Resize canvas to fit window
  resizeCanvas() {
    console.log('Resizing canvas...');
    // Set canvas dimensions
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;

    // Log the new dimensions
    console.log(`Canvas resized to ${this.canvas.width}x${this.canvas.height}`);

    // If map exists, resize it too
    if (this.map) {
      this.map.resize();
      console.log('Map resized');
    }
  }

  // Select tower type for placement
  selectTowerType(type) {
    // Deselect all tower buttons
    document.querySelectorAll('.tower-btn').forEach(btn => {
      btn.classList.remove('selected');
    });

    // If clicking the same tower type, deselect it
    if (this.selectedTowerType === type) {
      this.selectedTowerType = null;
      return;
    }

    // Check if player has enough gold
    const towerCost = this.getTowerCost(type);
    if (this.gold < towerCost) {
      // Not enough gold, show feedback
      console.log(`Not enough gold for ${type} tower. Need ${towerCost}, have ${this.gold}`);
      return;
    }

    // Select the tower
    this.selectedTowerType = type;

    // Find the button and add the selected class
    const towerButton = document.querySelector(`.tower-btn[data-type="${type}"]`);
    if (towerButton) {
      towerButton.classList.add('selected');
    } else {
      console.error(`Tower button for type ${type} not found`);
    }
  }

  // Get tower cost based on type
  getTowerCost(type) {
    // Get cost from towerStats
    return towerStats[type]?.persistentCost || 50;
  }

  // This method has been moved to the canvas click event handler

  // Get a tower at the given position
  getTowerAtPosition(x, y) {
    // Check if the click is on a tower
    for (const tower of this.towers) {
      const distance = Math.sqrt(Math.pow(tower.x - x, 2) + Math.pow(tower.y - y, 2));
      if (distance <= 25) { // Tower radius for clicking
        return tower;
      }
    }
    return null;
  }

  // Toggle game speed
  toggleSpeed() {
    if (this.speedMultiplier === 1) {
      this.speedMultiplier = this.maxSpeedMultiplier;
      document.getElementById('speedUp').textContent = 'Normal Speed';
    } else {
      this.speedMultiplier = 1;
      document.getElementById('speedUp').textContent = 'Speed Up';
    }
  }

  // Start a new wave
  startWave() {
    // Make sure the map is fully loaded before starting a wave
    if (!this.map || !this.map.grid || this.map.grid.length === 0) {
      console.log('Cannot start wave - map not fully loaded yet');
      return;
    }

    if (this.waveInProgress) return;

    this.waveInProgress = true;
    this.enemiesSpawned = 0;
    this.enemiesKilled = 0;
    this.enemiesLeaked = 0;

    // Calculate number of enemies based on wave and difficulty
    this.totalEnemiesInWave = this.getEnemiesForWave();

    // Update UI
    document.getElementById('startWave').textContent = 'Wave in Progress...';

    // Start the game if not already started
    if (!this.gameStarted) {
      this.gameStarted = true;
      this.lastUpdateTime = performance.now();
      // Start the game loop with the current time
      window.requestAnimationFrame((time) => this.gameLoop(time));
    }

    // Force spawn the first enemy immediately
    this.timeSinceLastSpawn = this.spawnInterval;
    this.spawnEnemy();

    console.log(`Started wave ${this.wave} with ${this.totalEnemiesInWave} enemies`);
  }

  // Generate boss waves based on difficulty
  generateBossWaves() {
    // Define boss waves for each difficulty
    const bossWaves = {
      easy: [10, 20], // Wave 10: Regular boss, Wave 20: Easy boss (final)
      medium: [10, 20, 30], // Wave 30: Medium boss (final)
      hard: [10, 20, 30, 40], // Wave 40: Hard boss (final)
      nightmare: [10, 20, 30, 40, 50], // Wave 50: Nightmare boss (final)
      void: [10, 20, 30, 40, 50] // Wave 50: Void boss (final)
    };

    return bossWaves[this.difficulty] || [10, 20];
  }

  // Determine if current wave is a boss wave
  isBossWave(wave) {
    return this.bossWaves.includes(wave);
  }

  // Get boss type based on wave and difficulty
  getBossType(wave) {
    // For void difficulty, use corrupted versions of bosses
    if (this.difficulty === 'void') {
      if (wave === 10) return 'voidEasyBoss';
      if (wave === 20) return 'voidMediumBoss';
      if (wave === 30) return 'voidHardBoss';
      if (wave === 40) return 'voidNightmareBoss';
      if (wave === 50) return 'voidBoss';
      return 'boss';
    }

    // For other difficulties
    if (wave === this.waveLimit) {
      // Final boss for this difficulty
      switch (this.difficulty) {
        case 'easy': return 'easyBoss';
        case 'medium': return 'mediumBoss';
        case 'hard': return 'hardBoss';
        case 'nightmare': return 'nightmareBoss';
        default: return 'boss';
      }
    }

    // Regular boss for intermediate boss waves
    return 'boss';
  }

  // Spawn an enemy
  spawnEnemy() {
    if (this.enemiesSpawned >= this.totalEnemiesInWave) return;

    // Determine enemy type based on wave, difficulty, and randomness
    let enemyType = 'normal';
    const rand = Math.random();
    const isFinalEnemy = this.enemiesSpawned === this.totalEnemiesInWave - 1;

    // Check if this is a boss wave and the final enemy of the wave
    if (this.isBossWave(this.wave) && isFinalEnemy) {
      // Get appropriate boss type based on wave and difficulty
      enemyType = this.getBossType(this.wave);
      console.log(`Spawning ${enemyType} for wave ${this.wave} on ${this.difficulty} difficulty`);
    }
    // Different enemy types based on difficulty
    else {
      // Base probabilities for each enemy type by difficulty
      const enemyProbabilities = this.getEnemyProbabilities();

      // Determine enemy type based on random roll and probabilities
      let roll = Math.random();
      let cumulativeProbability = 0;

      for (const [type, probability] of Object.entries(enemyProbabilities)) {
        cumulativeProbability += probability;
        if (roll <= cumulativeProbability) {
          enemyType = type;
          break;
        }
      }
    }

    // Create the enemy
    const enemy = new Enemy(this.map.pathCoordinates, enemyType);
    this.enemies.push(enemy);

    this.enemiesSpawned++;
  }

  // Update game state with variable delta time (original method, kept for compatibility)
  update(currentTime) {
    if (this.paused || this.gameOver) return;

    // Calculate delta time (in seconds)
    // Ensure we have a valid time difference and it's not too large (can happen on first frame or tab switch)
    let deltaTime = 0;
    if (this.lastUpdateTime > 0) {
      // Convert to seconds but don't apply speed multiplier here anymore
      // Speed is controlled by running multiple update cycles instead
      deltaTime = Math.min(currentTime - this.lastUpdateTime, 100) / 1000;
    }
    this.lastUpdateTime = currentTime;

    // Use the fixed delta time update method
    this.updateWithFixedDeltaTime(currentTime, deltaTime);
  }

  // Update game state with fixed delta time
  updateWithFixedDeltaTime(currentTime, deltaTime) {
    if (this.paused || this.gameOver) return;

    // Track time since last spawn in seconds
    this.timeSinceLastSpawn = (this.timeSinceLastSpawn || 0) + deltaTime;

    // Spawn enemies based on delta time
    if (this.waveInProgress && this.timeSinceLastSpawn > this.spawnInterval / 1000) {
      this.spawnEnemy();
      this.timeSinceLastSpawn = 0;
    }

    // Update enemies
    this.enemies.forEach(enemy => {
      enemy.update(deltaTime);

      // Check if enemy reached the end
      if (enemy.reachedEnd) {
        // Reduce lives based on enemy damage (default to 1 if not specified)
        const damageTaken = enemy.damage || 1;
        this.lives -= damageTaken;
        this.enemiesLeaked++;

        console.log(`Enemy reached the end! -${damageTaken} lives. Remaining: ${this.lives}`);

        // Check if game over
        if (this.lives <= 0) {
          this.gameOver = true;

          // Calculate silver earned (10% of score + 5 per wave completed) with difficulty multiplier
          this.silverEarned = Math.floor((this.score * 0.1) + (this.wave * 5)) * this.silverMultiplier;

          // Update player data if available
          if (typeof addSilver === 'function') {
            addSilver(this.silverEarned);
            updateHighScore(this.score);
            updateHighestWave(this.wave);
          }

          // Show game over screen
          document.getElementById('game-over').classList.add('active');
          document.getElementById('game-over-title').textContent = 'Game Over';
          document.getElementById('final-score').textContent = formatNumber(this.score);
          document.getElementById('final-difficulty').textContent = this.difficulty.charAt(0).toUpperCase() + this.difficulty.slice(1);
          document.getElementById('waves-completed').textContent = this.wave - 1;

          // Add silver earned to game over screen
          const silverElement = document.getElementById('silver-earned');
          if (silverElement) {
            silverElement.textContent = this.silverEarned;
          }

          console.log(`Game over! Final score: ${this.score}, Silver earned: ${this.silverEarned}`);
        }
      }
    });

    // Remove dead or leaked enemies
    this.enemies = this.enemies.filter(enemy => {
      const shouldRemove = !enemy.alive || enemy.reachedEnd;

      // Handle enemy death
      if (!enemy.alive && !enemy.reachedEnd && !enemy.deathHandled) {
        enemy.deathHandled = true;
        // Add any special death effects here if needed
        // For now, just mark as handled
      }

      return !shouldRemove;
    });

    // Update towers and find targets
    this.towers.forEach(tower => {
      const target = tower.findTarget(this.enemies, currentTime);
      if (target) {
        tower.shoot(currentTime, this.projectiles);
      }
    });

    // Update projectiles
    this.projectiles.forEach(projectile => {
      projectile.update();

      // Apply damage if projectile hit
      if (!projectile.active && projectile.hit) {
        const affectedEnemies = projectile.applyDamage(this.enemies);

        // Process affected enemies
        affectedEnemies.forEach(({enemy, killed, damage}) => {
          // Add score for damage
          this.score += damage;

          if (killed) {
            // Add gold and score for kill
            this.gold += enemy.reward;
            this.score += enemy.reward * 10;
            this.enemiesKilled++;
          }
        });
      }
    });

    // Remove inactive projectiles
    this.projectiles = this.projectiles.filter(projectile => projectile.active);

    // Check if wave is complete
    if (this.waveInProgress &&
        this.enemiesSpawned >= this.totalEnemiesInWave &&
        this.enemies.length === 0) {
      this.waveInProgress = false;

      // Check if we've reached the wave limit for this difficulty
      if (this.wave >= this.waveLimit) {
        // Victory! Player has completed all waves for this difficulty
        this.gameOver = true;
        this.victory = true;

        // Calculate silver earned with difficulty multiplier
        this.silverEarned = Math.floor((this.score * 0.1) + (this.wave * 5)) * this.silverMultiplier;

        // Update player data
        if (typeof addSilver === 'function') {
          addSilver(this.silverEarned);
          updateHighScore(this.score);
          updateHighestWave(this.wave);

          // Mark this difficulty as completed
          completeDifficulty(this.difficulty);
        }

        // Show victory screen
        document.getElementById('game-over').classList.add('active');
        document.getElementById('game-over-title').textContent = 'Victory!';
        document.getElementById('final-score').textContent = formatNumber(this.score);
        document.getElementById('final-difficulty').textContent = this.difficulty.charAt(0).toUpperCase() + this.difficulty.slice(1);
        document.getElementById('waves-completed').textContent = this.wave;

        // Add silver earned to victory screen
        const silverElement = document.getElementById('silver-earned');
        if (silverElement) {
          silverElement.textContent = this.silverEarned;
        }

        console.log(`Victory! Completed ${this.difficulty} difficulty. Final score: ${this.score}, Silver earned: ${this.silverEarned}`);
        return;
      }

      // Continue to next wave
      this.wave++;

      // Bonus gold for completing wave
      const waveBonus = 50 + this.wave * 10;
      this.gold += waveBonus;

      // Award silver for completing waves with difficulty multiplier
      const silverReward = Math.floor(this.wave * 5 * this.silverMultiplier);
      if (typeof addSilver === 'function') {
        addSilver(silverReward);
        console.log(`Earned ${silverReward} silver for completing wave ${this.wave-1}`);

        // Show silver reward notification
        this.showSilverReward(silverReward);

        // Update highest wave
        updateHighestWave(this.wave - 1);
      }

      // Update UI
      document.getElementById('startWave').textContent = 'Next Wave in 3s...';

      // Update UI
      this.updateUI();

      // Auto-start next wave after 3 seconds (but not for the first wave)
      if (this.wave > 1) {
        console.log(`Wave ${this.wave-1} complete. Next wave starting in 3 seconds...`);
        setTimeout(() => {
          if (!this.gameOver && !this.waveInProgress) {
            this.startWave();
          }
        }, 3000);
      } else {
        document.getElementById('startWave').textContent = 'Start Wave';
      }
    }

    // Update UI
    this.updateUI();
  }

  // Draw game state
  draw(currentTime = performance.now()) {
    // Clear canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw map - always draw the map regardless of game state
    if (this.map) {
      this.map.draw(currentTime);
    } else {
      console.error('Map is not initialized in draw()');
      // Draw a placeholder background
      this.ctx.fillStyle = '#4CAF50';
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    // Always draw towers regardless of game state
    if (this.towers && this.towers.length > 0) {
      this.towers.forEach(tower => {
        tower.draw(this.ctx, this.showTowerRanges, currentTime);
      });
    }

    // Draw enemies
    this.enemies.forEach(enemy => {
      enemy.draw(this.ctx);
    });

    // Towers are already drawn above

    // Draw projectiles
    this.projectiles.forEach(projectile => {
      projectile.draw(this.ctx);
    });

    // Draw projectile explosions
    this.projectiles.forEach(projectile => {
      if (!projectile.active && projectile.hit) {
        projectile.drawExplosion(this.ctx);
      }
    });

    // Draw tower placement preview
    if (this.selectedTowerType) {
      this.drawTowerPlacementPreview();
    }
  }

  // Track mouse movement method

  // Track mouse movement
  trackMouseMovement(event) {
    if (!event) return;
    const rect = this.canvas.getBoundingClientRect();
    this.mouseX = event.clientX - rect.left;
    this.mouseY = event.clientY - rect.top;
  }

  // Draw tower placement preview
  drawTowerPlacementPreview() {
    if (!this.selectedTowerType || !towerStats[this.selectedTowerType]) return; // Don't draw if no tower is selected or if tower type is invalid

    // Use stored mouse position
    const mouseX = this.mouseX;
    const mouseY = this.mouseY;

    // Make sure we have valid mouse coordinates
    if (isNaN(mouseX) || isNaN(mouseY) || mouseX === 0 && mouseY === 0) return;

    // Convert to grid coordinates
    const gridPos = this.map.pixelToGrid(mouseX, mouseY);

    // Make sure grid position is valid
    if (!gridPos || gridPos.x < 0 || gridPos.y < 0) return;

    // Check if tower can be placed here
    const canPlace = this.map.canPlaceTower(gridPos.x, gridPos.y);

    // Convert back to pixel coordinates (center of tile)
    const pixelPos = this.map.gridToPixel(gridPos.x, gridPos.y);

    // Draw tower preview
    this.ctx.globalAlpha = 0.6;

    // Draw range indicator
    let range;
    let color;

    // Check if there's a variant selected
    const towerButton = document.querySelector(`.tower-btn[data-type="${this.selectedTowerType}"]`);
    const variant = towerButton?.dataset.variant;

    // Define variant colors
    const variantColors = {
      gold: '#FFD700',
      crystal: '#88CCEE',
      shadow: '#444444',
      ice: '#29B6F6',
      fire: '#F44336',
      poison: '#4CAF50',
      dragon: '#FF5722',
      double: '#795548',
      heavy: '#5D4037',
      explosive: '#D84315',
      rapid: '#2196F3',
      stealth: '#37474F',
      railgun: '#0D47A1'
    };

    // Get tower stats based on type
    switch (this.selectedTowerType) {
      case 'sniper':
        range = 300;
        color = '#2196F3';
        break;
      case 'cannon':
        range = 180;
        color = '#795548';
        break;
      case 'archer':
        range = 220;
        color = '#8BC34A';
        break;
      case 'freeze':
        range = 180;
        color = '#00BCD4';
        break;
      case 'mortar':
        range = 250;
        color = '#607D8B';
        break;
      case 'laser':
        range = 200;
        color = '#F44336';
        break;
      case 'tesla':
        range = 180;
        color = '#FFC107';
        break;
      case 'flame':
        range = 150;
        color = '#FF9800';
        break;
      case 'missile':
        range = 250;
        color = '#9E9E9E';
        break;
      case 'poison':
        range = 170;
        color = '#9C27B0';
        break;
      case 'vortex':
        range = 190;
        color = '#009688';
        break;
      case 'basic':
      default:
        range = 200;
        color = '#4CAF50';
        break;
    }

    // Apply variant color if available
    if (variant && variantColors[variant]) {
      color = variantColors[variant];
    }

    this.ctx.fillStyle = `${color}33`; // 20% opacity
    this.ctx.beginPath();
    this.ctx.arc(pixelPos.x, pixelPos.y, range, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.strokeStyle = canPlace ? `${color}88` : '#F44336';
    this.ctx.lineWidth = 2;
    this.ctx.stroke();

    // Draw tower base
    this.ctx.fillStyle = canPlace ? '#555' : '#F44336';
    this.ctx.beginPath();
    this.ctx.arc(pixelPos.x, pixelPos.y, 20, 0, Math.PI * 2);
    this.ctx.fill();

    // Draw tower body
    this.ctx.fillStyle = canPlace ? color : '#F44336';
    this.ctx.fillRect(pixelPos.x - 8, pixelPos.y - 25, 16, 25);

    // Draw tower head
    this.ctx.beginPath();
    this.ctx.arc(pixelPos.x, pixelPos.y - 25, 8, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.globalAlpha = 1;
  }

  // Update UI elements
  updateUI() {
    document.getElementById('lives').textContent = this.lives;
    document.getElementById('gold').textContent = formatNumber(this.gold);
    document.getElementById('wave').textContent = this.wave;
    document.getElementById('score').textContent = formatNumber(this.score);

    // Update wave counter
    document.getElementById('wave-counter').innerHTML = 'Wave: <span id="wave">' + this.wave + '</span>';
  }

  // Resize canvas to fit the screen
  resizeCanvas(shouldDraw = true) {
    const container = this.canvas.parentElement;
    const sidebarWidth = 250; // Match the sidebar width

    // Set canvas size to fit the container minus the sidebar width
    this.canvas.width = container.clientWidth - sidebarWidth;
    this.canvas.height = container.clientHeight;

    // Ensure the map is updated with the new canvas size
    if (this.map) {
      // Pass the gameStarted flag to prevent regenerating the map after game has started
      this.map.resize(this.gameStarted);
    }

    // Force a redraw only if requested
    if (shouldDraw && this.map) {
      this.draw();
    }

    console.log(`Canvas resized to ${this.canvas.width}x${this.canvas.height}`);
  }

  // Frame rate control variables
  lastFrameTime = 0;
  targetFPS = 30; // Lower FPS for slower gameplay
  frameInterval = 1000 / this.targetFPS;

  // Game loop
  gameLoop(currentTime) {
    // Request the next frame first to ensure smooth animation
    if (!this.gameOver) {
      window.requestAnimationFrame((time) => this.gameLoop(time));
    }

    // Limit frame rate
    const elapsed = currentTime - this.lastFrameTime;

    if (elapsed > this.frameInterval) {
      // Update last frame time with adjustment to maintain consistent frame rate
      this.lastFrameTime = currentTime - (elapsed % this.frameInterval);

      // Run multiple update cycles based on speed multiplier
      // This increases the effective game speed without changing the frame rate
      const updateCycles = this.speedMultiplier;

      // Run update multiple times based on speed multiplier
      for (let i = 0; i < updateCycles; i++) {
        // Use a fixed delta time for each update to ensure consistent behavior
        // We're using 1/30 second (matching our target FPS) for each update
        const fixedDeltaTime = 1 / 30;

        // Update game state with fixed time step
        this.updateWithFixedDeltaTime(currentTime, fixedDeltaTime);
      }

      // Draw game state only once per frame
      this.draw(currentTime);
    }
  }

  // Show silver reward notification
  showSilverReward(amount) {
    // Create notification element if it doesn't exist
    let notification = document.getElementById('silver-notification');
    if (!notification) {
      notification = document.createElement('div');
      notification.id = 'silver-notification';
      notification.style.position = 'absolute';
      notification.style.top = '100px';
      notification.style.left = '50%';
      notification.style.transform = 'translateX(-50%)';
      notification.style.backgroundColor = '#FFC107';
      notification.style.color = '#333';
      notification.style.padding = '10px 20px';
      notification.style.borderRadius = '5px';
      notification.style.fontWeight = 'bold';
      notification.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
      notification.style.zIndex = '1000';
      notification.style.opacity = '0';
      notification.style.transition = 'opacity 0.5s';
      document.body.appendChild(notification);
    }

    // Set notification content
    notification.textContent = `+ ${amount} Silver!`;

    // Show notification
    notification.style.opacity = '1';

    // Hide notification after 3 seconds
    setTimeout(() => {
      notification.style.opacity = '0';
    }, 3000);
  }

  // Initialize infinite mode
  initializeInfiniteMode() {
    // This is a placeholder for future infinite mode implementation
    console.log('Infinite mode initialized');
  }

  // Restart the game
  restart() {
    // Reset game state
    this.gameStarted = false;
    this.gameOver = false;
    this.paused = false;
    this.speedMultiplier = 1;

    // Reset game objects
    this.map = new GameMap(this.canvas, this.ctx);
    this.towers = [];
    this.enemies = [];
    this.projectiles = [];
    this.effects = [];

    // Reset player stats
    this.lives = 10;
    this.gold = 100;
    this.score = 0;
    this.wave = 1;

    // Reset wave management
    this.waveInProgress = false;
    this.enemiesSpawned = 0;
    this.enemiesKilled = 0;
    this.enemiesLeaked = 0;
    this.totalEnemiesInWave = 0;
    this.timeSinceLastSpawn = 0;

    // Reset tower placement
    this.selectedTowerType = null;
    document.querySelectorAll('.tower-btn').forEach(btn => {
      btn.classList.remove('selected');
    });

    // Reset UI
    document.getElementById('game-over').classList.remove('active');
    document.getElementById('startWave').textContent = 'Start Wave';
    document.getElementById('speedUp').textContent = 'Speed Up';
    document.getElementById('showRange').checked = false;
    this.showTowerRanges = false;

    // Update UI
    this.updateUI();

    // Start game loop
    this.lastUpdateTime = performance.now();
    window.requestAnimationFrame((time) => this.gameLoop(time));
  }

  // Get starting lives based on difficulty
  getDifficultyLives() {
    switch(this.difficulty) {
      case 'easy': return 8; // Reduced from 10
      case 'medium': return 6; // Harder
      case 'hard': return 4; // Much harder
      case 'nightmare': return 3;
      case 'void': return 2;
      default: return 10;
    }
  }

  // Get starting gold based on difficulty
  getDifficultyGold() {
    switch(this.difficulty) {
      case 'easy': return 100; // Reduced from 100
      case 'medium': return 280; // Harder
      case 'hard': return 370; // Much harder
      case 'nightmare': return 560;
      case 'void': return 800;
      default: return 100;
    }
  }

  // Get number of enemies for current wave based on difficulty
  getEnemiesForWave() {
    const baseEnemies = 5 + Math.floor(this.wave * 1.0);

    // Apply difficulty multiplier
    switch(this.difficulty) {
      case 'easy': return Math.floor(baseEnemies * 1.1); // 10% more enemies
      case 'medium': return Math.floor(baseEnemies * 1.2); // 20% more enemies
      case 'hard': return Math.floor(baseEnemies * 1.3); // 30% more enemies
      case 'nightmare': return Math.floor(baseEnemies * 1.4);
      case 'void': return Math.floor(baseEnemies * 1.5);
      default: return baseEnemies;
    }
  }

  // Get enemy type probabilities based on difficulty and wave
  getEnemyProbabilities() {
    // Base probabilities that increase with wave number
    const waveProgress = Math.min(this.wave / 20, 1); // 0-1 scale of wave progression

    // Different enemy distributions based on difficulty
    switch(this.difficulty) {
      case 'easy':
        return {
          'normal': Math.max(0.6 - (waveProgress * 0.3), 0.3),
          'fast': Math.min(0.1 + (waveProgress * 0.1), 0.2),
          'tank': Math.min(0.1 + (waveProgress * 0.1), 0.2),
          'flying': this.wave >= 5 ? Math.min(0.05 + (waveProgress * 0.1), 0.15) : 0,
          'armored': this.wave >= 8 ? Math.min(0.05 + (waveProgress * 0.05), 0.1) : 0,
          'healing': this.wave >= 12 ? 0.05 : 0
        };

      case 'medium':
        return {
          'normal': Math.max(0.5 - (waveProgress * 0.3), 0.2),
          'fast': Math.min(0.15 + (waveProgress * 0.05), 0.2),
          'tank': Math.min(0.15 + (waveProgress * 0.05), 0.2),
          'flying': Math.min(0.1 + (waveProgress * 0.05), 0.15),
          'armored': Math.min(0.05 + (waveProgress * 0.1), 0.15),
          'healing': this.wave >= 8 ? 0.05 : 0,
          'spawner': this.wave >= 15 ? 0.05 : 0
        };

      case 'hard':
        return {
          'normal': Math.max(0.4 - (waveProgress * 0.3), 0.1),
          'fast': Math.min(0.15 + (waveProgress * 0.05), 0.2),
          'tank': Math.min(0.15 + (waveProgress * 0.05), 0.2),
          'flying': Math.min(0.1 + (waveProgress * 0.05), 0.15),
          'armored': Math.min(0.1 + (waveProgress * 0.05), 0.15),
          'healing': Math.min(0.05 + (waveProgress * 0.05), 0.1),
          'spawner': this.wave >= 10 ? 0.05 : 0,
          'invisible': this.wave >= 15 ? 0.05 : 0
        };

      case 'nightmare':
        return {
          'normal': Math.max(0.3 - (waveProgress * 0.2), 0.1),
          'fast': Math.min(0.15 + (waveProgress * 0.05), 0.2),
          'tank': Math.min(0.15 + (waveProgress * 0.05), 0.2),
          'flying': Math.min(0.1 + (waveProgress * 0.05), 0.15),
          'armored': Math.min(0.1 + (waveProgress * 0.05), 0.15),
          'healing': Math.min(0.05 + (waveProgress * 0.05), 0.1),
          'spawner': Math.min(0.05 + (waveProgress * 0.05), 0.1),
          'invisible': Math.min(0.05 + (waveProgress * 0.05), 0.1),
          'explosive': this.wave >= 10 ? 0.05 : 0
        };

      case 'void':
        return {
          'normal': Math.max(0.2 - (waveProgress * 0.1), 0.1),
          'fast': Math.min(0.15 + (waveProgress * 0.05), 0.2),
          'tank': Math.min(0.15 + (waveProgress * 0.05), 0.2),
          'flying': Math.min(0.1 + (waveProgress * 0.05), 0.15),
          'armored': Math.min(0.1 + (waveProgress * 0.05), 0.15),
          'healing': Math.min(0.1 + (waveProgress * 0.05), 0.15),
          'spawner': Math.min(0.05 + (waveProgress * 0.05), 0.1),
          'invisible': Math.min(0.05 + (waveProgress * 0.05), 0.1),
          'explosive': Math.min(0.05 + (waveProgress * 0.05), 0.1)
        };

      default:
        return {
          'normal': 0.7,
          'fast': 0.2,
          'tank': 0.1
        };
    }
  }
}
