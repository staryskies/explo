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

    // Get the selected towers from session storage
    const selectedTowers = sessionStorage.getItem('selectedTowers');
    if (selectedTowers) {
      this.availableTowers = JSON.parse(selectedTowers);
      console.log('Loadout towers:', this.availableTowers);
    } else {
      // Default towers if none selected
      this.availableTowers = ['basic', 'cannon', 'archer', 'freeze'];
    }

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
    this.lives = Math.floor(this.getDifficultyLives()); // Ensure lives is an integer
    this.gold = Math.floor(this.getDifficultyGold()); // Ensure gold is an integer
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

    // Apply difficulty-specific map settings
    this.applyDifficultyMap();
    console.log('Difficulty map applied');

    // Initialize event listeners
    this.initEventListeners();

    // Initialize upgrade system
    this.initializeUpgradeSystem();

    // Create the tower selection bar at the bottom
    this.createTowerSelectionBar();

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
            this.showNotification(`Not enough gold! Need ${towerCost}, have ${this.gold}`);
            console.log(`Not enough gold to place tower. Need ${towerCost}, have ${this.gold}`);
            return;
          }

          try {
            // Convert grid coordinates to pixel coordinates (center of tile)
            const pixelPos = this.map.gridToPixel(gridPos.x, gridPos.y);

            // Get the selected tower option to check for variant
            const towerOption = document.querySelector(`.tower-option[data-type="${this.selectedTowerType}"]`);
            const variant = towerOption?.dataset.variant;

            // Create the tower with grid coordinates and variant if available
            try {
              const tower = new Tower(pixelPos.x, pixelPos.y, this.selectedTowerType, gridPos.x, gridPos.y, variant);
              this.towers.push(tower);

              // Mark the tile as occupied
              this.map.placeTower(gridPos.x, gridPos.y);

              // Deduct gold
              this.gold -= towerCost;

              // Update towers-built count immediately
              const towersBuiltElement = document.getElementById('towers-built');
              if (towersBuiltElement) {
                towersBuiltElement.textContent = this.towers.length;
              }

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

    // Tower selection buttons (if any exist)
    document.querySelectorAll('.tower-btn').forEach(button => {
      button.addEventListener('click', () => {
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

    // Tower ranges are now always shown
    this.showTowerRanges = true;

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
    // Deselect all tower options
    document.querySelectorAll('.tower-option').forEach(option => {
      option.classList.remove('selected');
    });

    // If clicking the same tower type, deselect it
    if (this.selectedTowerType === type) {
      this.selectedTowerType = null;
      return;
    }

    // Check if player has enough gold
    const towerCost = this.getTowerCost(type);
    if (this.gold < towerCost) {
      // Not enough gold, show notification
      this.showNotification(`Not enough gold! Need ${towerCost}, have ${this.gold}`);
      console.log(`Not enough gold for ${type} tower. Need ${towerCost}, have ${this.gold}`);
      return;
    }

    // Select the tower
    this.selectedTowerType = type;

    // Find the option and add the selected class
    const towerOption = document.querySelector(`.tower-option[data-type="${type}"]`);
    if (towerOption) {
      towerOption.classList.add('selected');
    } else {
      console.error(`Tower option for type ${type} not found`);
    }
  }

  // Get tower cost based on type
  getTowerCost(type) {
    // Get cost from towerStats
    return towerStats[type]?.persistentCost || 50;
  }

  // Show notification
  showNotification(message, duration = 3000) {
    const notificationBox = document.getElementById('notification-box');
    if (!notificationBox) return;

    // Set the message
    notificationBox.textContent = message;

    // Show the notification
    notificationBox.classList.add('show');

    // Hide after duration
    setTimeout(() => {
      notificationBox.classList.remove('show');
    }, duration);
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
      void: [10, 20, 30, 40, 50], // Wave 50: Void boss (final)
      trial: [10, 20, 30, 40, 50, 60] // Wave 60: Dual boss (final)
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
        this.lives = Math.floor(this.lives - damageTaken); // Ensure lives is always an integer
        this.enemiesLeaked++;

        console.log(`Enemy reached the end! -${damageTaken} lives. Remaining: ${this.lives}`);

        // Check if game over
        if (this.lives <= 0) {
          this.gameOver = true;

          // Calculate silver earned (10% of score + 5 per wave completed) with difficulty multiplier
          this.silverEarned = Math.floor((this.score * 0.1) + (this.wave * 5)) * this.silverMultiplier;

          // Calculate gems earned based on wave progress (half of what you'd get for victory)
          let gemsEarned = 0;
          const waveProgress = this.wave / this.waveLimit;
          switch(this.difficulty) {
            case 'easy': gemsEarned = Math.ceil(5 * waveProgress); break;
            case 'medium': gemsEarned = Math.ceil(10 * waveProgress); break;
            case 'hard': gemsEarned = Math.ceil(20 * waveProgress); break;
            case 'nightmare': gemsEarned = Math.ceil(50 * waveProgress); break;
            case 'void': gemsEarned = Math.ceil(100 * waveProgress); break;
            default: gemsEarned = Math.ceil(5 * waveProgress);
          }

          // Ensure at least 1 gem is awarded
          gemsEarned = Math.max(1, gemsEarned);

          // Update player data if available
          if (typeof addSilver === 'function' && typeof addGems === 'function') {
            addSilver(this.silverEarned);
            addGems(gemsEarned);
            updateHighScore(this.score);
            updateHighestWave(this.wave);

            // Show gems earned notification
            this.showGemsReward(gemsEarned);
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

          // Add gems earned to game over screen
          const gemsElement = document.getElementById('gems-earned');
          if (gemsElement) {
            gemsElement.textContent = gemsEarned;
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
      // Pass the towers array to the update method for tower interactions (like Archangel buffs)
      tower.update(currentTime, this.enemies, this.projectiles, this.towers);
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

            // Update UI immediately when an enemy is killed
            const enemiesKilledElement = document.getElementById('enemies-killed');
            if (enemiesKilledElement) {
              enemiesKilledElement.textContent = this.enemiesKilled;
            }
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

        // Calculate gems earned based on difficulty
        let gemsEarned = 0;
        switch(this.difficulty) {
          case 'easy': gemsEarned = 5; break;
          case 'medium': gemsEarned = 10; break;
          case 'hard': gemsEarned = 20; break;
          case 'nightmare': gemsEarned = 50; break;
          case 'void': gemsEarned = 100; break;
          default: gemsEarned = 5;
        }

        // Update player data
        if (typeof addSilver === 'function' && typeof addGems === 'function') {
          addSilver(this.silverEarned);
          addGems(gemsEarned);
          updateHighScore(this.score);
          updateHighestWave(this.wave);

          // Mark this difficulty as completed
          completeDifficulty(this.difficulty);

          // Show gems earned notification
          this.showGemsReward(gemsEarned);
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

        // Add gems earned to victory screen
        const gemsElement = document.getElementById('gems-earned');
        if (gemsElement) {
          gemsElement.textContent = gemsEarned;
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
        // Check if mouse is hovering over this tower
        const isHovered = this.mouseX && this.mouseY &&
          Math.sqrt(
            Math.pow(this.mouseX - tower.x, 2) +
            Math.pow(this.mouseY - tower.y, 2)
          ) < tower.tileSize / 2;

        // Show range circle if tower is hovered
        tower.draw(this.ctx, isHovered, currentTime);
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

    // Tower color for preview
    let color;

    // Check if there's a variant selected
    const towerOption = document.querySelector(`.tower-option[data-type="${this.selectedTowerType}"]`);
    const variant = towerOption?.dataset.variant;

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

    // Get tower color based on type
    switch (this.selectedTowerType) {
      case 'sniper':
        color = '#2196F3';
        break;
      case 'cannon':
        color = '#795548';
        break;
      case 'archer':
        color = '#8BC34A';
        break;
      case 'freeze':
        color = '#00BCD4';
        break;
      case 'mortar':
        color = '#607D8B';
        break;
      case 'laser':
        color = '#F44336';
        break;
      case 'tesla':
        color = '#FFC107';
        break;
      case 'flame':
        color = '#FF9800';
        break;
      case 'missile':
        color = '#9E9E9E';
        break;
      case 'poison':
        color = '#9C27B0';
        break;
      case 'vortex':
        color = '#009688';
        break;
      case 'basic':
      default:
        color = '#4CAF50';
        break;
    }

    // Apply variant color if available
    if (variant && variantColors[variant]) {
      color = variantColors[variant];
    }

    // Get the map's tile size for scaling
    const tileSize = this.map.tileSize || 40;
    const scaleFactor = tileSize / 40;

    // Draw range circle
    if (canPlace) {
      const range = towerStats[this.selectedTowerType].range || 200;
      const scaledRange = range * scaleFactor;

      this.ctx.beginPath();
      this.ctx.arc(pixelPos.x, pixelPos.y, scaledRange, 0, Math.PI * 2);
      this.ctx.fillStyle = 'rgba(100, 100, 255, 0.1)';
      this.ctx.fill();
      this.ctx.strokeStyle = 'rgba(100, 100, 255, 0.3)';
      this.ctx.stroke();
    }

    // Draw tower base
    this.ctx.fillStyle = canPlace ? '#555' : '#F44336';
    this.ctx.beginPath();
    this.ctx.arc(pixelPos.x, pixelPos.y, 20 * scaleFactor, 0, Math.PI * 2);
    this.ctx.fill();

    // Draw tower body
    this.ctx.fillStyle = canPlace ? color : '#F44336';
    this.ctx.fillRect(
      pixelPos.x - 8 * scaleFactor,
      pixelPos.y - 25 * scaleFactor,
      16 * scaleFactor,
      25 * scaleFactor
    );

    // Draw tower head
    this.ctx.beginPath();
    this.ctx.arc(pixelPos.x, pixelPos.y - 25 * scaleFactor, 8 * scaleFactor, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.globalAlpha = 1;
  }

  // Update UI elements
  updateUI() {
    document.getElementById('lives').textContent = Math.floor(this.lives); // Ensure displayed lives is an integer
    document.getElementById('gold').textContent = formatNumber(Math.floor(this.gold)); // Ensure displayed gold is an integer
    document.getElementById('wave').textContent = this.wave;
    document.getElementById('score').textContent = formatNumber(this.score);

    // Update wave counter
    document.getElementById('wave-counter').innerHTML = 'Wave: <span id="wave">' + this.wave + '</span>';

    // Update sidebar game info - enemies remaining
    let enemiesRemaining = 0;
    if (this.waveInProgress) {
      // Calculate remaining enemies as those not yet spawned plus those still alive
      enemiesRemaining = (this.totalEnemiesInWave - this.enemiesSpawned) + this.enemies.length;
    }
    const enemiesRemainingElement = document.getElementById('enemies-remaining');
    if (enemiesRemainingElement) {
      enemiesRemainingElement.textContent = enemiesRemaining;
    }

    // Calculate wave progress percentage
    let waveProgress = 0;
    if (this.totalEnemiesInWave > 0 && this.waveInProgress) {
      waveProgress = Math.floor(((this.enemiesKilled + this.enemiesLeaked) / this.totalEnemiesInWave) * 100);
      // Cap at 100%
      waveProgress = Math.min(waveProgress, 100);
    }
    const waveProgressElement = document.getElementById('wave-progress');
    if (waveProgressElement) {
      waveProgressElement.textContent = waveProgress + '%';
    }

    // Update game stats
    const enemiesKilledElement = document.getElementById('enemies-killed');
    if (enemiesKilledElement) {
      enemiesKilledElement.textContent = this.enemiesKilled;
    }

    const towersBuiltElement = document.getElementById('towers-built');
    if (towersBuiltElement) {
      towersBuiltElement.textContent = this.towers.length;
    }
  }

  // Create the tower selection bar at the bottom
  createTowerSelectionBar() {
    // Remove the existing sidebar
    const existingSidebar = document.getElementById('tower-selection');
    if (existingSidebar) {
      existingSidebar.remove();
    }

    // Create the tower selection bar container
    const towerBar = document.createElement('div');
    towerBar.id = 'tower-bar';
    document.getElementById('game-container').appendChild(towerBar);

    // Add CSS for the tower bar
    const style = document.createElement('style');
    style.textContent = `
      #tower-bar {
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        display: flex;
        gap: 15px;
        padding: 10px 20px;
        background: rgba(255, 248, 231, 0.9);
        border-radius: 15px;
        box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
        z-index: 100;
      }

      .tower-option {
        width: 80px;
        height: 80px;
        background: linear-gradient(45deg, #D2B48C, #CD853F);
        border-radius: 10px;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        cursor: pointer;
        transition: all 0.3s ease;
        position: relative;
      }

      .tower-option:hover {
        transform: translateY(-5px);
        box-shadow: 0 5px 15px rgba(160, 120, 80, 0.4);
      }

      .tower-option.selected {
        background: linear-gradient(45deg, #A0522D, #8B4513);
        box-shadow: 0 0 10px rgba(160, 120, 80, 0.7);
      }

      .tower-icon {
        width: 50px;
        height: 50px;
        border-radius: 50%;
        margin-bottom: 5px;
      }

      .tower-name {
        font-size: 12px;
        color: white;
        text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
      }

      .tower-cost {
        position: absolute;
        bottom: -5px;
        right: -5px;
        background: #4CAF50;
        color: white;
        border-radius: 10px;
        padding: 2px 5px;
        font-size: 10px;
        font-weight: bold;
      }

      #tower-preview {
        position: fixed;
        bottom: 120px;
        left: 50%;
        transform: translateX(-50%);
        width: 300px;
        background: rgba(255, 248, 231, 0.95);
        border-radius: 10px;
        padding: 15px;
        box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
        z-index: 101;
        display: none;
        color: #000000;
      }

      #tower-preview h3 {
        color: #000000;
        margin-top: 0;
        margin-bottom: 10px;
      }

      #tower-preview.visible {
        display: block;
      }

      #preview-stats {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 10px;
      }

      #preview-stats p {
        margin: 5px 0;
        font-size: 14px;
        color: #000000;
      }

      #preview-stats span {
        color: #000000;
        font-weight: 600;
      }

      #tower-preview .targeting-info {
        margin-top: 15px;
        padding-top: 10px;
        border-top: 1px dashed rgba(210, 180, 140, 0.5);
        grid-column: span 2;
      }

      #tower-preview .targeting-info p {
        margin: 5px 0;
        font-size: 13px;
        color: #000000;
      }

      #tower-preview .target-yes {
        color: #4CAF50 !important; /* Green */
        font-weight: bold;
      }

      #tower-preview .target-no {
        color: #F44336 !important; /* Red */
        font-weight: bold;
      }
    `;
    document.head.appendChild(style);

    // Create tower preview element
    const towerPreview = document.createElement('div');
    towerPreview.id = 'tower-preview';
    towerPreview.innerHTML = `
      <h3 id="preview-name">Tower Name</h3>
      <div id="preview-stats">
        <p>Damage: <span id="preview-damage">0</span></p>
        <p>Range: <span id="preview-range">0</span></p>
        <p>Fire Rate: <span id="preview-fire-rate">0</span></p>
        <p>Special: <span id="preview-special">None</span></p>
        <div class="targeting-info">
          <p>Can Target:</p>
          <p>Ground: <span id="preview-target-ground" class="target-yes">Yes</span></p>
          <p>Flying: <span id="preview-target-flying" class="target-no">No</span></p>
          <p>Shadow: <span id="preview-target-shadow" class="target-no">No</span></p>
        </div>
      </div>
    `;
    document.getElementById('game-container').appendChild(towerPreview);

    // Add towers to the bar based on the available towers
    this.availableTowers.forEach(towerType => {
      const towerData = towerStats[towerType];
      if (!towerData) return;

      const towerOption = document.createElement('div');
      towerOption.className = 'tower-option';
      towerOption.dataset.type = towerType;

      const towerIcon = document.createElement('div');
      towerIcon.className = 'tower-icon';
      towerIcon.style.backgroundColor = towerData.color || '#4CAF50';

      const towerName = document.createElement('div');
      towerName.className = 'tower-name';
      towerName.textContent = towerData.name || towerType;

      const towerCost = document.createElement('div');
      towerCost.className = 'tower-cost';
      towerCost.textContent = towerData.persistentCost || towerData.cost || 100;

      towerOption.appendChild(towerIcon);
      towerOption.appendChild(towerName);
      towerOption.appendChild(towerCost);

      // Add click event to select tower
      towerOption.addEventListener('click', () => {
        this.selectTowerType(towerType);
      });

      // Add hover event to show tower preview
      towerOption.addEventListener('mouseenter', () => {
        this.showTowerPreview(towerType, towerData);
      });

      towerOption.addEventListener('mouseleave', () => {
        this.hideTowerPreview();
      });

      towerBar.appendChild(towerOption);
    });
  }

  // Show tower preview
  showTowerPreview(towerType, towerData) {
    const previewElement = document.getElementById('tower-preview');

    // Set tower name
    document.getElementById('preview-name').textContent = towerData.name || towerType;

    // Set tower stats
    document.getElementById('preview-damage').textContent = towerData.damage || 0;
    document.getElementById('preview-range').textContent = towerData.range || 0;
    document.getElementById('preview-fire-rate').textContent = towerData.fireRate?.toFixed(1) || 0;
    document.getElementById('preview-special').textContent = towerData.ability || 'None';

    // Set targeting capabilities
    document.getElementById('preview-target-ground').textContent = 'Yes';
    document.getElementById('preview-target-ground').className = 'target-yes';

    // Flying targeting
    if (towerData.canTargetFlying) {
      document.getElementById('preview-target-flying').textContent = 'Yes';
      document.getElementById('preview-target-flying').className = 'target-yes';
    } else {
      document.getElementById('preview-target-flying').textContent = 'No';
      document.getElementById('preview-target-flying').className = 'target-no';
    }

    // Shadow targeting (only certain tower types)
    const shadowTargetingTowers = ['tesla', 'laser', 'flame'];
    if (shadowTargetingTowers.includes(towerType)) {
      document.getElementById('preview-target-shadow').textContent = 'Yes';
      document.getElementById('preview-target-shadow').className = 'target-yes';
    } else {
      document.getElementById('preview-target-shadow').textContent = 'No';
      document.getElementById('preview-target-shadow').className = 'target-no';
    }

    // Show the preview
    previewElement.classList.add('visible');
  }

  // Hide tower preview
  hideTowerPreview() {
    document.getElementById('tower-preview').classList.remove('visible');
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

  // Show gems reward notification
  showGemsReward(amount) {
    // Create notification element if it doesn't exist
    let notification = document.getElementById('gems-notification');
    if (!notification) {
      notification = document.createElement('div');
      notification.id = 'gems-notification';
      notification.style.position = 'absolute';
      notification.style.top = '150px';
      notification.style.left = '50%';
      notification.style.transform = 'translateX(-50%)';
      notification.style.backgroundColor = '#E91E63';
      notification.style.color = '#FFF';
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
    notification.textContent = `+ ${amount} Gems!`;

    // Show notification
    notification.style.opacity = '1';

    // Hide notification after 3 seconds
    setTimeout(() => {
      notification.style.opacity = '0';
    }, 3000);
  }

  // Apply map based on difficulty
  applyDifficultyMap() {
    if (!this.map) return;

    // Use the difficultyMaps to apply the appropriate map template
    if (window.applyMapTemplate && window.difficultyMaps) {
      console.log(`Applying map template for difficulty: ${this.difficulty}`);
      window.applyMapTemplate(this.map, this.difficulty);
    } else {
      console.warn('difficultyMaps or applyMapTemplate not found');
    }

    // Initialize dual path mode for Hell and Heaven's Trial
    if (this.difficulty === 'trial' && this.initializeDualPathMode) {
      this.dualPathMode = true;
      console.log('Dual path mode enabled for Hell and Heaven\'s Trial');
    }
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

    // Apply difficulty-specific map settings
    this.applyDifficultyMap();

    this.towers = [];
    this.enemies = [];
    this.projectiles = [];
    this.effects = [];

    // Reset player stats
    this.lives = Math.floor(this.getDifficultyLives()); // Ensure lives is an integer
    this.gold = Math.floor(this.getDifficultyGold()); // Ensure gold is an integer
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
    document.querySelectorAll('.tower-option').forEach(option => {
      option.classList.remove('selected');
    });

    // Reset UI
    document.getElementById('game-over').classList.remove('active');
    document.getElementById('startWave').textContent = 'Start Wave';
    document.getElementById('speedUp').textContent = 'Speed Up';
    this.showTowerRanges = true;

    // Recreate the tower selection bar
    this.createTowerSelectionBar();

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
      case 'trial': return 4; // Dual paths need more lives
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
      case 'trial': return 1000; // Need more gold for dual paths
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
      case 'trial': return Math.floor(baseEnemies * 1.6); // 60% more enemies for dual paths
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

      case 'trial':
        // For Hell and Heaven's Trial, we use the getRandomEnemyType function in dualPathMode.js
        // which modifies these probabilities based on the path (heaven or hell)
        return {
          'normal': Math.max(0.25 - (waveProgress * 0.15), 0.1),
          'fast': Math.min(0.15 + (waveProgress * 0.05), 0.2),
          'tank': Math.min(0.15 + (waveProgress * 0.05), 0.2),
          'flying': Math.min(0.1 + (waveProgress * 0.05), 0.15),
          'armored': Math.min(0.1 + (waveProgress * 0.05), 0.15),
          'healing': Math.min(0.05 + (waveProgress * 0.05), 0.1),
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
