/**
 * Dual Path Mode - Hell and Heaven's Trial
 * A special game mode with two separate paths for enemies
 */
// Log that dualPathMode.js is loaded
console.log('Dual Path Mode loaded');

// Extend the Game class to support dual path mode
Game.prototype.initializeDualPathMode = function() {
  this.dualPathMode = false;
  this.heavenPath = [];
  this.hellPath = [];
  this.heavenPathCoordinates = [];
  this.hellPathCoordinates = [];
  this.heavenEnemies = [];
  this.hellEnemies = [];
  
  console.log('Dual Path Mode initialized');
};

// Generate dual paths for Hell and Heaven's Trial
GameMap.prototype.generateDualPaths = function() {
  // Clear existing paths
  this.path = [];
  this.heavenPath = [];
  this.hellPath = [];
  
  // Generate Heaven path (top half of the map)
  this.generateHeavenPath();
  
  // Generate Hell path (bottom half of the map)
  this.generateHellPath();
  
  // Store both paths for the game
  if (window.game) {
    window.game.heavenPath = this.heavenPath;
    window.game.hellPath = this.hellPath;
  }
  
  // Convert grid coordinates to pixel coordinates for both paths
  this.heavenPathCoordinates = this.heavenPath.map(point => ({
    x: point.x * this.tileSize + this.tileSize / 2,
    y: point.y * this.tileSize + this.tileSize / 2
  }));
  
  this.hellPathCoordinates = this.hellPath.map(point => ({
    x: point.x * this.tileSize + this.tileSize / 2,
    y: point.y * this.tileSize + this.tileSize / 2
  }));
  
  // Store path coordinates for the game
  if (window.game) {
    window.game.heavenPathCoordinates = this.heavenPathCoordinates;
    window.game.hellPathCoordinates = this.hellPathCoordinates;
  }
  
  // Set the main path to the combined paths for compatibility
  this.path = [...this.heavenPath, ...this.hellPath];
  this.pathCoordinates = [...this.heavenPathCoordinates, ...this.hellPathCoordinates];
};

// Generate Heaven path (top half of the map)
GameMap.prototype.generateHeavenPath = function() {
  // Start from the left side, top quarter
  let x = 0;
  let y = Math.floor(this.gridHeight * 0.25);
  
  // Add starting point
  this.heavenPath.push({x, y});
  this.grid[y][x] = this.TILE_TYPES.PATH;
  
  // Generate path until we reach the right edge
  while (x < this.gridWidth - 1) {
    // Possible directions: right, up, down (within top half)
    const directions = [
      {dx: 1, dy: 0, weight: 3}, // Prefer right
      {dx: 0, dy: -1, weight: 1}, // Up
      {dx: 0, dy: 1, weight: 1}  // Down
    ];
    
    // Create a weighted random selection
    let totalWeight = directions.reduce((sum, dir) => sum + dir.weight, 0);
    let random = Math.random() * totalWeight;
    let selectedDir = directions[0];
    
    for (const dir of directions) {
      if (random < dir.weight) {
        selectedDir = dir;
        break;
      }
      random -= dir.weight;
    }
    
    // Move in that direction
    x += selectedDir.dx;
    y += selectedDir.dy;
    
    // Check if we're within bounds (top half only)
    if (x < 0 || x >= this.gridWidth || y < 0 || y >= Math.floor(this.gridHeight * 0.5)) {
      // Try a different direction
      x -= selectedDir.dx;
      y -= selectedDir.dy;
      continue;
    }
    
    // Check if this tile is already part of a path
    if (this.grid[y][x] === this.TILE_TYPES.PATH) {
      // Try a different direction
      x -= selectedDir.dx;
      y -= selectedDir.dy;
      continue;
    }
    
    // Add this point to the path
    this.heavenPath.push({x, y});
    this.grid[y][x] = this.TILE_TYPES.PATH;
  }
};

// Generate Hell path (bottom half of the map)
GameMap.prototype.generateHellPath = function() {
  // Start from the left side, bottom quarter
  let x = 0;
  let y = Math.floor(this.gridHeight * 0.75);
  
  // Add starting point
  this.hellPath.push({x, y});
  this.grid[y][x] = this.TILE_TYPES.PATH;
  
  // Generate path until we reach the right edge
  while (x < this.gridWidth - 1) {
    // Possible directions: right, up, down (within bottom half)
    const directions = [
      {dx: 1, dy: 0, weight: 3}, // Prefer right
      {dx: 0, dy: -1, weight: 1}, // Up
      {dx: 0, dy: 1, weight: 1}  // Down
    ];
    
    // Create a weighted random selection
    let totalWeight = directions.reduce((sum, dir) => sum + dir.weight, 0);
    let random = Math.random() * totalWeight;
    let selectedDir = directions[0];
    
    for (const dir of directions) {
      if (random < dir.weight) {
        selectedDir = dir;
        break;
      }
      random -= dir.weight;
    }
    
    // Move in that direction
    x += selectedDir.dx;
    y += selectedDir.dy;
    
    // Check if we're within bounds (bottom half only)
    if (x < 0 || x >= this.gridWidth || y < Math.floor(this.gridHeight * 0.5) || y >= this.gridHeight) {
      // Try a different direction
      x -= selectedDir.dx;
      y -= selectedDir.dy;
      continue;
    }
    
    // Check if this tile is already part of a path
    if (this.grid[y][x] === this.TILE_TYPES.PATH) {
      // Try a different direction
      x -= selectedDir.dx;
      y -= selectedDir.dy;
      continue;
    }
    
    // Add this point to the path
    this.hellPath.push({x, y});
    this.grid[y][x] = this.TILE_TYPES.PATH;
  }
};

// Override the draw method to add special effects for Heaven and Hell paths
const originalDraw = GameMap.prototype.draw;
GameMap.prototype.draw = function(currentTime) {
  // Call the original draw method
  originalDraw.call(this, currentTime);
  
  // If not in dual path mode, return
  if (!window.game || !window.game.dualPathMode) return;
  
  // Draw special effects for Heaven path
  this.drawHeavenPathEffects(currentTime);
  
  // Draw special effects for Hell path
  this.drawHellPathEffects(currentTime);
};

// Draw special effects for Heaven path
GameMap.prototype.drawHeavenPathEffects = function(currentTime) {
  // Skip if no heaven path
  if (!this.heavenPath || this.heavenPath.length === 0) return;
  
  // Draw light aura along the heaven path
  this.ctx.save();
  
  // Create gradient for heaven path
  const gradient = this.ctx.createLinearGradient(0, 0, this.canvas.width, 0);
  gradient.addColorStop(0, 'rgba(255, 255, 255, 0.2)');
  gradient.addColorStop(0.5, 'rgba(173, 216, 230, 0.3)');
  gradient.addColorStop(1, 'rgba(255, 255, 255, 0.2)');
  
  // Draw light particles along the heaven path
  for (let i = 0; i < this.heavenPath.length; i++) {
    const point = this.heavenPath[i];
    const x = point.x * this.tileSize + this.tileSize / 2;
    const y = point.y * this.tileSize + this.tileSize / 2;
    
    // Draw light aura
    this.ctx.globalAlpha = 0.1 + 0.05 * Math.sin(currentTime / 1000 + i * 0.1);
    this.ctx.fillStyle = gradient;
    this.ctx.beginPath();
    this.ctx.arc(x, y, this.tileSize * 0.6, 0, Math.PI * 2);
    this.ctx.fill();
    
    // Draw light particles
    if (Math.random() < 0.05) {
      this.ctx.globalAlpha = 0.7;
      this.ctx.fillStyle = 'white';
      this.ctx.beginPath();
      this.ctx.arc(
        x + (Math.random() - 0.5) * this.tileSize,
        y + (Math.random() - 0.5) * this.tileSize,
        this.tileSize * 0.1,
        0,
        Math.PI * 2
      );
      this.ctx.fill();
    }
  }
  
  this.ctx.restore();
};

// Draw special effects for Hell path
GameMap.prototype.drawHellPathEffects = function(currentTime) {
  // Skip if no hell path
  if (!this.hellPath || this.hellPath.length === 0) return;
  
  // Draw fire effects along the hell path
  this.ctx.save();
  
  // Create gradient for hell path
  const gradient = this.ctx.createLinearGradient(0, 0, this.canvas.width, 0);
  gradient.addColorStop(0, 'rgba(255, 0, 0, 0.2)');
  gradient.addColorStop(0.5, 'rgba(255, 165, 0, 0.3)');
  gradient.addColorStop(1, 'rgba(255, 0, 0, 0.2)');
  
  // Draw fire particles along the hell path
  for (let i = 0; i < this.hellPath.length; i++) {
    const point = this.hellPath[i];
    const x = point.x * this.tileSize + this.tileSize / 2;
    const y = point.y * this.tileSize + this.tileSize / 2;
    
    // Draw fire aura
    this.ctx.globalAlpha = 0.1 + 0.05 * Math.sin(currentTime / 800 + i * 0.1);
    this.ctx.fillStyle = gradient;
    this.ctx.beginPath();
    this.ctx.arc(x, y, this.tileSize * 0.6, 0, Math.PI * 2);
    this.ctx.fill();
    
    // Draw fire particles
    if (Math.random() < 0.05) {
      this.ctx.globalAlpha = 0.7;
      this.ctx.fillStyle = Math.random() < 0.5 ? '#FF4500' : '#FF8C00';
      this.ctx.beginPath();
      this.ctx.arc(
        x + (Math.random() - 0.5) * this.tileSize,
        y + (Math.random() - 0.5) * this.tileSize,
        this.tileSize * 0.1,
        0,
        Math.PI * 2
      );
      this.ctx.fill();
    }
  }
  
  this.ctx.restore();
};

// Override the spawnEnemy method to handle dual paths
const originalSpawnEnemy = Game.prototype.spawnEnemy;
Game.prototype.spawnEnemy = function() {
  // If not in dual path mode, use the original method
  if (!this.dualPathMode) {
    originalSpawnEnemy.call(this);
    return;
  }
  
  // In dual path mode, spawn enemies on both paths
  this.spawnHeavenEnemy();
  this.spawnHellEnemy();
};

// Spawn an enemy on the Heaven path
Game.prototype.spawnHeavenEnemy = function() {
  if (this.enemiesSpawned >= this.totalEnemiesInWave / 2) return;
  
  // Get the starting point of the Heaven path
  const startPoint = this.heavenPathCoordinates[0];
  
  // Determine enemy type based on probabilities
  const enemyType = this.getRandomEnemyType('heaven');
  
  // Create the enemy
  const enemy = new Enemy(
    startPoint.x,
    startPoint.y,
    enemyType,
    this.heavenPathCoordinates,
    this.difficulty
  );
  
  // Add special properties for Heaven enemies
  enemy.isHeavenEnemy = true;
  enemy.color = '#FFFFFF'; // White
  enemy.glowColor = 'rgba(173, 216, 230, 0.5)'; // Light blue glow
  
  // Add to enemies array
  this.enemies.push(enemy);
  this.heavenEnemies.push(enemy);
  
  this.enemiesSpawned++;
};

// Spawn an enemy on the Hell path
Game.prototype.spawnHellEnemy = function() {
  if (this.enemiesSpawned >= this.totalEnemiesInWave) return;
  
  // Get the starting point of the Hell path
  const startPoint = this.hellPathCoordinates[0];
  
  // Determine enemy type based on probabilities
  const enemyType = this.getRandomEnemyType('hell');
  
  // Create the enemy
  const enemy = new Enemy(
    startPoint.x,
    startPoint.y,
    enemyType,
    this.hellPathCoordinates,
    this.difficulty
  );
  
  // Add special properties for Hell enemies
  enemy.isHellEnemy = true;
  enemy.color = '#000000'; // Black
  enemy.glowColor = 'rgba(255, 0, 0, 0.5)'; // Red glow
  
  // Add to enemies array
  this.enemies.push(enemy);
  this.hellEnemies.push(enemy);
  
  this.enemiesSpawned++;
};

// Get a random enemy type based on path
Game.prototype.getRandomEnemyType = function(path) {
  const probabilities = this.getEnemyProbabilities();
  
  // Modify probabilities based on path
  if (path === 'heaven') {
    // Heaven path has more flying enemies
    probabilities.flying = Math.min(probabilities.flying * 2, 0.4);
    probabilities.healing = Math.min(probabilities.healing * 1.5, 0.2);
    
    // Adjust other probabilities to ensure sum is 1
    const totalSpecial = probabilities.flying + probabilities.healing;
    const remainingProb = 1 - totalSpecial;
    const normalizedRatio = remainingProb / (probabilities.normal + probabilities.fast + probabilities.tank + probabilities.armored);
    
    probabilities.normal *= normalizedRatio;
    probabilities.fast *= normalizedRatio;
    probabilities.tank *= normalizedRatio;
    probabilities.armored *= normalizedRatio;
  } else if (path === 'hell') {
    // Hell path has more armored and tank enemies
    probabilities.armored = Math.min(probabilities.armored * 2, 0.4);
    probabilities.tank = Math.min(probabilities.tank * 1.5, 0.3);
    
    // Adjust other probabilities to ensure sum is 1
    const totalSpecial = probabilities.armored + probabilities.tank;
    const remainingProb = 1 - totalSpecial;
    const normalizedRatio = remainingProb / (probabilities.normal + probabilities.fast + probabilities.flying + probabilities.healing);
    
    probabilities.normal *= normalizedRatio;
    probabilities.fast *= normalizedRatio;
    probabilities.flying *= normalizedRatio;
    probabilities.healing *= normalizedRatio;
  }
  
  // Determine enemy type based on random chance
  const rand = Math.random();
  let cumulativeProbability = 0;
  
  for (const [type, probability] of Object.entries(probabilities)) {
    cumulativeProbability += probability;
    if (rand < cumulativeProbability) {
      return type;
    }
  }
  
  // Default to normal enemy
  return 'normal';
};

// Override the Enemy draw method to add special effects
const originalEnemyDraw = Enemy.prototype.draw;
Enemy.prototype.draw = function(ctx) {
  // Call the original draw method
  originalEnemyDraw.call(this, ctx);
  
  // Add special effects for Heaven and Hell enemies
  if (this.isHeavenEnemy) {
    // Add glow effect for Heaven enemies
    ctx.save();
    ctx.globalAlpha = 0.3 + 0.1 * Math.sin(Date.now() / 500);
    ctx.shadowColor = this.glowColor || 'rgba(173, 216, 230, 0.5)';
    ctx.shadowBlur = 15;
    ctx.fillStyle = this.glowColor || 'rgba(173, 216, 230, 0.5)';
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size * 1.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  } else if (this.isHellEnemy) {
    // Add fire effect for Hell enemies
    ctx.save();
    ctx.globalAlpha = 0.3 + 0.1 * Math.sin(Date.now() / 300);
    ctx.shadowColor = this.glowColor || 'rgba(255, 0, 0, 0.5)';
    ctx.shadowBlur = 15;
    ctx.fillStyle = this.glowColor || 'rgba(255, 0, 0, 0.5)';
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size * 1.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
};

// Add the Hell and Heaven's Trial difficulty to the difficulty selection
function addHellAndHeavenTrial() {
  // Get the difficulty selection container
  const difficultyGrid = document.getElementById('difficulty-selection-options');
  if (!difficultyGrid) return;
  
  // Create the new difficulty option
  const trialOption = document.createElement('div');
  trialOption.className = 'difficulty-option trial';
  trialOption.dataset.difficulty = 'trial';
  
  // Add content
  trialOption.innerHTML = `
    <div class="difficulty-icon">⚖️</div>
    <h3>Hell and Heaven's Trial</h3>
    <p>The ultimate challenge with dual paths of light and darkness. Defeat both heavenly and hellish enemies.</p>
    <div class="waves">60 Waves</div>
    <div class="reward">Silver Reward: x5</div>
    <div class="reward">Gems Reward: 150</div>
  `;
  
  // Add to the grid
  difficultyGrid.appendChild(trialOption);
  
  // Add event listener
  trialOption.addEventListener('click', () => {
    // Remove selected class from all options
    document.querySelectorAll('.difficulty-option').forEach(opt => {
      opt.classList.remove('selected');
    });
    
    // Add selected class to this option
    trialOption.classList.add('selected');
  });
}

// Initialize dual path mode when the DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  // Add the Hell and Heaven's Trial difficulty to the difficulty selection
  addHellAndHeavenTrial();
});
