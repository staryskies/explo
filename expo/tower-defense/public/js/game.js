/**
 * Game class for the tower defense game
 */
class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    
    // Set canvas size
    this.resizeCanvas();
    
    // Game state
    this.gameStarted = false;
    this.gameOver = false;
    this.paused = false;
    this.speedMultiplier = 1;
    
    // Game objects
    this.map = new GameMap(canvas, this.ctx);
    this.towers = [];
    this.enemies = [];
    this.projectiles = [];
    this.effects = [];
    
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
    this.spawnInterval = 1000; // ms
    this.lastSpawnTime = 0;
    
    // Tower placement
    this.selectedTowerType = null;
    this.showTowerRanges = false;
    
    // Time tracking
    this.lastUpdateTime = 0;
    
    // Initialize event listeners
    this.initEventListeners();
    
    // Update UI
    this.updateUI();
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
    document.getElementById('basicTower').addEventListener('click', () => {
      this.selectTowerType('basic');
    });
    
    document.getElementById('sniperTower').addEventListener('click', () => {
      this.selectTowerType('sniper');
    });
    
    document.getElementById('aoeTower').addEventListener('click', () => {
      this.selectTowerType('aoe');
    });
    
    document.getElementById('slowTower').addEventListener('click', () => {
      this.selectTowerType('slow');
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
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }
  
  // Select tower type for placement
  selectTowerType(type) {
    // Deselect all tower buttons
    document.querySelectorAll('.tower-btn').forEach(btn => {
      btn.classList.remove('selected');
    });
    
    // Check if player has enough gold
    const towerCost = this.getTowerCost(type);
    if (this.gold < towerCost) {
      // Not enough gold, show feedback
      return;
    }
    
    // Select the tower
    this.selectedTowerType = type;
    document.getElementById(`${type}Tower`).classList.add('selected');
  }
  
  // Get tower cost based on type
  getTowerCost(type) {
    const costs = {
      'basic': 50,
      'sniper': 100,
      'aoe': 150,
      'slow': 75
    };
    return costs[type] || 50;
  }
  
  // Place a tower at the given coordinates
  placeTower(x, y) {
    if (!this.selectedTowerType) return;
    
    // Convert pixel coordinates to grid coordinates
    const gridPos = this.map.pixelToGrid(x, y);
    
    // Check if tower can be placed here
    if (this.map.canPlaceTower(gridPos.x, gridPos.y)) {
      // Get tower cost
      const towerCost = this.getTowerCost(this.selectedTowerType);
      
      // Check if player has enough gold
      if (this.gold < towerCost) {
        return;
      }
      
      // Convert grid coordinates to pixel coordinates (center of tile)
      const pixelPos = this.map.gridToPixel(gridPos.x, gridPos.y);
      
      // Create the tower
      const tower = new Tower(pixelPos.x, pixelPos.y, this.selectedTowerType);
      this.towers.push(tower);
      
      // Mark the tile as occupied
      this.map.placeTower(gridPos.x, gridPos.y);
      
      // Deduct gold
      this.gold -= towerCost;
      
      // Update UI
      this.updateUI();
    }
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
    
    // Calculate number of enemies based on wave
    this.totalEnemiesInWave = 10 + Math.floor(this.wave * 1.5);
    
    // Update UI
    document.getElementById('startWave').textContent = 'Wave in Progress...';
    
    // Start the game if not already started
    if (!this.gameStarted) {
      this.gameStarted = true;
      this.lastUpdateTime = performance.now();
      this.gameLoop();
    }
  }
  
  // Spawn an enemy
  spawnEnemy() {
    if (this.enemiesSpawned >= this.totalEnemiesInWave) return;
    
    // Determine enemy type based on wave and randomness
    let enemyType = 'normal';
    const rand = Math.random();
    
    if (this.wave >= 10 && this.enemiesSpawned === this.totalEnemiesInWave - 1) {
      // Spawn a boss at the end of waves 10+
      enemyType = 'boss';
    } else if (this.wave >= 5 && rand < 0.1) {
      enemyType = 'tank';
    } else if (this.wave >= 3 && rand < 0.2) {
      enemyType = 'fast';
    } else if (this.wave >= 7 && rand < 0.15) {
      enemyType = 'flying';
    }
    
    // Create the enemy
    const enemy = new Enemy(this.map.pathCoordinates, enemyType);
    this.enemies.push(enemy);
    
    this.enemiesSpawned++;
  }
  
  // Update game state
  update(currentTime) {
    if (this.paused || this.gameOver) return;
    
    // Calculate delta time
    const deltaTime = (currentTime - this.lastUpdateTime) * this.speedMultiplier;
    this.lastUpdateTime = currentTime;
    
    // Spawn enemies
    if (this.waveInProgress && currentTime - this.lastSpawnTime > this.spawnInterval / this.speedMultiplier) {
      this.spawnEnemy();
      this.lastSpawnTime = currentTime;
    }
    
    // Update enemies
    this.enemies.forEach(enemy => {
      enemy.update(deltaTime);
      
      // Check if enemy reached the end
      if (enemy.reachedEnd) {
        this.lives--;
        this.enemiesLeaked++;
        
        // Check if game over
        if (this.lives <= 0) {
          this.gameOver = true;
          document.getElementById('game-over').classList.add('active');
          document.getElementById('final-score').textContent = formatNumber(this.score);
        }
      }
    });
    
    // Remove dead or leaked enemies
    this.enemies = this.enemies.filter(enemy => enemy.alive && !enemy.reachedEnd);
    
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
      document.getElementById('startWave').textContent = 'Start Wave';
      
      // Update UI
      this.updateUI();
    }
    
    // Update UI
    this.updateUI();
  }
  
  // Draw game state
  draw() {
    // Clear canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Draw map
    this.map.draw();
    
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
  
  // Draw tower placement preview
  drawTowerPlacementPreview() {
    // Get mouse position
    const rect = this.canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;
    
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
  }
  
  // Game loop
  gameLoop(currentTime) {
    // Update game state
    this.update(currentTime);
    
    // Draw game state
    this.draw();
    
    // Continue game loop
    if (!this.gameOver) {
      requestAnimationFrame(this.gameLoop.bind(this));
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
    this.gameLoop(this.lastUpdateTime);
  }
}
