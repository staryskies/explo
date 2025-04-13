/**
 * Game class for the tower defense game
 */
class Game {
  constructor(canvas, mapTemplate = null) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');

    // Set canvas size
    this.resizeCanvas();

    // Game state
    this.gameStarted = false;
    this.gameOver = false;
    this.paused = false;
    this.speedMultiplier = 1;
    this.isInfiniteMode = false;

    // Game objects
    this.map = new GameMap(canvas, this.ctx, mapTemplate);
    this.towers = [];
    this.enemies = [];
    this.projectiles = [];
    this.effects = [];

    // Silver earned in this game (permanent currency)
    this.silverEarned = 0;

    // Player stats
    this.lives = 10;
    this.gold = 100;
    this.score = 0;
    this.wave = 1;

    // Wave management
    this.waveInProgress = false;
    this.enemiesSpawned = 0;
    this.enemiesKilled = 0;
    this.enemiesLeaked = 0;
    this.totalEnemiesInWave = 0;
    this.spawnInterval = 15.0; // seconds - increased to make enemies spawn slower
    this.timeSinceLastSpawn = 0;

    // Tower placement
    this.selectedTowerType = null;
    this.showTowerRanges = false;

    // Time tracking
    this.lastUpdateTime = 0;

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
    // Canvas click for tower placement
    this.canvas.addEventListener('click', (e) => {
      if (this.gameOver || !this.selectedTowerType) return;

      const rect = this.canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      this.placeTower(x, y);
    });

    // Tower selection buttons
    document.querySelectorAll('.tower-btn').forEach(button => {
      button.addEventListener('click', (e) => {
        const towerType = e.target.dataset.type;
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
    document.getElementById(`${type}Tower`).classList.add('selected');
  }

  // Get tower cost based on type
  getTowerCost(type) {
    // Get cost from towerStats
    return towerStats[type]?.persistentCost || 50;
  }

  // Place a tower at the given coordinates or select a tower for upgrade
  placeTower(x, y) {
    // Check if we're clicking on an existing tower for upgrade
    const clickedTower = this.getTowerAtPosition(x, y);
    if (clickedTower) {
      // Select the tower for upgrade
      this.selectTowerForUpgrade(clickedTower);
      return;
    }

    // If no tower type is selected, do nothing
    if (!this.selectedTowerType) return;

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

      // Convert grid coordinates to pixel coordinates (center of tile)
      const pixelPos = this.map.gridToPixel(gridPos.x, gridPos.y);

      // Create the tower with grid coordinates
      const tower = new Tower(pixelPos.x, pixelPos.y, this.selectedTowerType, gridPos.x, gridPos.y);
      this.towers.push(tower);

      // Mark the tile as occupied
      this.map.placeTower(gridPos.x, gridPos.y);

      // Deduct gold
      this.gold -= towerCost;

      // Update UI
      this.updateUI();

      console.log(`Placed ${this.selectedTowerType} tower at (${gridPos.x}, ${gridPos.y})`);
    } else {
      console.log('Cannot place tower here');
    }
  }

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
      this.speedMultiplier = 2;
      document.getElementById('speedUp').textContent = 'Normal Speed';
    } else {
      this.speedMultiplier = 1;
      document.getElementById('speedUp').textContent = 'Speed Up';
    }
  }

  // Start a new wave
  startWave() {
    if (this.waveInProgress) return;

    this.waveInProgress = true;
    this.enemiesSpawned = 0;
    this.enemiesKilled = 0;
    this.enemiesLeaked = 0;

    // Calculate number of enemies based on wave (reduced for slower spawning)
    if (this.isInfiniteMode) {
      // Infinite mode has more enemies and they get stronger faster
      this.totalEnemiesInWave = 8 + Math.floor(this.wave * 1.5);
    } else {
      this.totalEnemiesInWave = 5 + Math.floor(this.wave * 1.0);
    }

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
  }

  // Spawn an enemy
  spawnEnemy() {
    if (this.enemiesSpawned >= this.totalEnemiesInWave) return;

    // Determine enemy type based on wave and randomness
    let enemyType = 'normal';
    const rand = Math.random();

    if (this.isInfiniteMode) {
      // Infinite mode has more varied and challenging enemies
      if (this.wave >= 5 && this.enemiesSpawned === this.totalEnemiesInWave - 1) {
        // Spawn a boss at the end of waves 5+ in infinite mode
        enemyType = 'boss';
      } else if (this.wave >= 3 && rand < 0.2) {
        enemyType = 'tank';
      } else if (this.wave >= 2 && rand < 0.3) {
        enemyType = 'fast';
      } else if (this.wave >= 4 && rand < 0.15) {
        enemyType = 'flying';
      } else if (this.wave >= 6 && rand < 0.1) {
        enemyType = 'invisible';
      }
    } else {
      // Normal mode enemy spawning
      if (this.wave >= 8 && this.enemiesSpawned === this.totalEnemiesInWave - 1) {
        // Spawn a boss at the end of waves 8+ (reduced from 10)
        enemyType = 'boss';
      } else if (this.wave >= 4 && rand < 0.15) {
        enemyType = 'tank';
      } else if (this.wave >= 2 && rand < 0.25) {
        enemyType = 'fast';
      } else if (this.wave >= 6 && rand < 0.2) {
        enemyType = 'flying';
      }
    }

    // Create the enemy
    const enemy = new Enemy(this.map.pathCoordinates, enemyType);
    this.enemies.push(enemy);

    this.enemiesSpawned++;
  }

  // Update game state
  update(currentTime) {
    if (this.paused || this.gameOver) return;

    // Calculate delta time (in seconds)
    // Ensure we have a valid time difference and it's not too large (can happen on first frame or tab switch)
    let deltaTime = 0;
    if (this.lastUpdateTime > 0) {
      // Convert to seconds and apply speed multiplier
      deltaTime = Math.min(currentTime - this.lastUpdateTime, 100) / 1000 * this.speedMultiplier;
    }
    this.lastUpdateTime = currentTime;

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

          // Calculate silver earned (10% of score + 5 per wave completed)
          this.silverEarned = Math.floor(this.score * 0.1) + (this.wave * 5);

          // Update player data if available
          if (typeof addSilver === 'function') {
            addSilver(this.silverEarned);
            updateHighScore(this.score);
          }

          // Show game over screen
          document.getElementById('game-over').classList.add('active');
          document.getElementById('final-score').textContent = formatNumber(this.score);

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
        this.handleEnemyDeath(enemy);
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
      this.wave++;

      // Bonus gold for completing wave
      const waveBonus = 50 + this.wave * 10;
      this.gold += waveBonus;

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
  draw() {
    // Clear canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw map - always draw the map regardless of game state

    this.map.draw();

    // If the game hasn't started yet, we can return after drawing the map
    // This ensures the map is visible even before the game starts
    if (!this.gameStarted && !this.selectedTowerType) {
      return;
    }

    // Draw enemies
    this.enemies.forEach(enemy => {
      enemy.draw(this.ctx);
    });

    // Draw towers
    this.towers.forEach(tower => {
      tower.draw(this.ctx, this.showTowerRanges);
    });

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

  // Store mouse position
  mouseX = 0;
  mouseY = 0;

  // Track mouse movement
  trackMouseMovement(event) {
    if (!event) return;
    const rect = this.canvas.getBoundingClientRect();
    this.mouseX = event.clientX - rect.left;
    this.mouseY = event.clientY - rect.top;
  }

  // Draw tower placement preview
  drawTowerPlacementPreview() {
    // Use stored mouse position
    const mouseX = this.mouseX;
    const mouseY = this.mouseY;

    // Convert to grid coordinates
    const gridPos = this.map.pixelToGrid(mouseX, mouseY);

    // Check if tower can be placed here
    const canPlace = this.map.canPlaceTower(gridPos.x, gridPos.y);

    // Convert back to pixel coordinates (center of tile)
    const pixelPos = this.map.gridToPixel(gridPos.x, gridPos.y);

    // Draw tower preview
    this.ctx.globalAlpha = 0.6;

    // Draw range indicator
    let range;
    let color;

    switch (this.selectedTowerType) {
      case 'sniper':
        range = 300;
        color = '#2196F3';
        break;
      case 'aoe':
        range = 150;
        color = '#F44336';
        break;
      case 'slow':
        range = 180;
        color = '#00BCD4';
        break;
      case 'basic':
      default:
        range = 200;
        color = '#4CAF50';
        break;
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

    // Update wave display with infinite mode indicator if applicable
    if (this.isInfiniteMode) {
      document.getElementById('wave-counter').innerHTML = 'Infinite Mode: Wave <span id="wave">' + this.wave + '</span>';
    } else {
      document.getElementById('wave-counter').innerHTML = 'Wave: <span id="wave">' + this.wave + '</span>';
    }
  }

  // Resize canvas to fit the screen
  resizeCanvas() {
    const container = this.canvas.parentElement;
    const sidebarWidth = 250; // Match the sidebar width

    // Set canvas size to fit the container minus the sidebar width
    this.canvas.width = Math.max(800, container.clientWidth - sidebarWidth);
    this.canvas.height = Math.max(600, container.clientHeight);

    console.log(`Canvas resized to ${this.canvas.width}x${this.canvas.height}`);
  }

  // Game loop
  gameLoop(currentTime) {
    // Request the next frame first to ensure smooth animation
    if (!this.gameOver) {
      window.requestAnimationFrame((time) => this.gameLoop(time));
    }

    // Update game state
    this.update(currentTime);

    // Draw game state
    this.draw();
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
}
