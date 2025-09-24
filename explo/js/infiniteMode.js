/**
 * Infinite Mode for the tower defense game
 */
// Log that infiniteMode.js is loaded
console.log('Infinite Mode loaded');

// Enemy types with their properties
const enemyTypes = {
  normal: {
    name: "Normal",
    health: 100,
    speed: 1.2,
    reward: 20,
    damage: 1, // Damage to player lives
    color: '#FFC107',
    size: 24,
    flying: false
  },
  fast: {
    name: "Fast",
    health: 50,
    speed: 2.5,
    reward: 15,
    damage: 1,
    color: '#FF5722',
    size: 20,
    flying: false
  },
  tank: {
    name: "Tank",
    health: 300,
    speed: 0.8,
    reward: 30,
    damage: 2,
    color: '#607D8B',
    size: 30,
    flying: false
  },
  flying: {
    name: "Flying",
    health: 80,
    speed: 1.8,
    reward: 25,
    damage: 1,
    color: '#9C27B0',
    size: 22,
    flying: true
  },
  healing: {
    name: "Healer",
    health: 120,
    speed: 1.0,
    reward: 35,
    damage: 1,
    color: '#4CAF50',
    size: 26,
    flying: false,
    healRadius: 100,
    healAmount: 5,
    healInterval: 2 // seconds
  },
  spawner: {
    name: "Spawner",
    health: 150,
    speed: 0.9,
    reward: 40,
    damage: 1,
    color: '#FF9800',
    size: 28,
    flying: false,
    spawnType: 'normal',
    spawnInterval: 5, // seconds
    maxSpawns: 3
  },
  armored: {
    name: "Armored",
    health: 200,
    speed: 1.0,
    reward: 30,
    damage: 1,
    color: '#795548',
    size: 26,
    flying: false,
    armor: 0.5 // Damage reduction percentage
  },
  invisible: {
    name: "Invisible",
    health: 70,
    speed: 1.5,
    reward: 35,
    damage: 1,
    color: 'rgba(255, 255, 255, 0.3)',
    size: 22,
    flying: false,
    invisibility: 0.8, // Chance to dodge attacks
    visibleToSpecialTowers: ['tesla', 'sniper']
  },
  explosive: {
    name: "Explosive",
    health: 120,
    speed: 1.1,
    reward: 35,
    damage: 2,
    color: '#F44336',
    size: 25,
    flying: false,
    explosionRadius: 100,
    explosionDamage: 30 // Damage to nearby towers when killed
  }
};

// Boss types with their properties
const bossTypes = {
  megaTank: {
    name: "Mega Tank",
    baseHealth: 500, // Reduced from 1000 to make it easier in early waves
    speed: 0.7, // Slightly faster
    reward: 250, // Increased reward
    damage: 4, // Reduced damage
    color: '#263238',
    size: 45,
    flying: false,
    armor: 0.5, // Reduced armor from 0.7
    abilities: [
      {
        name: "Regeneration",
        effect: "Regenerates health over time",
        healAmount: 5, // Reduced from 10
        interval: 2 // Increased from 1 (less frequent healing)
      }
    ]
  },
  mothership: {
    name: "Mothership",
    baseHealth: 800,
    speed: 0.7,
    reward: 250,
    damage: 3,
    color: '#673AB7',
    size: 50,
    flying: true,
    abilities: [
      {
        name: "Spawn Minions",
        effect: "Spawns flying enemies every 8 seconds",
        spawnType: 'flying',
        spawnCount: 2,
        interval: 8
      },
      {
        name: "Shield",
        effect: "Periodically becomes immune to damage",
        duration: 3,
        cooldown: 15
      }
    ]
  },
  juggernaut: {
    name: "Juggernaut",
    baseHealth: 1500,
    speed: 0.5,
    reward: 300,
    damage: 10,
    color: '#BF360C',
    size: 55,
    flying: false,
    abilities: [
      {
        name: "Charge",
        effect: "Periodically increases speed for a short duration",
        speedBoost: 3,
        duration: 2,
        cooldown: 10
      },
      {
        name: "Shockwave",
        effect: "Disables nearby towers for a short duration",
        radius: 150,
        duration: 3,
        cooldown: 20
      }
    ]
  },
  necromancer: {
    name: "Necromancer",
    baseHealth: 900,
    speed: 0.8,
    reward: 275,
    damage: 4,
    color: '#4A148C',
    size: 40,
    flying: false,
    abilities: [
      {
        name: "Resurrect",
        effect: "Resurrects defeated enemies",
        resurrectCount: 3,
        healthPercentage: 0.5,
        cooldown: 25
      },
      {
        name: "Life Drain",
        effect: "Drains health from towers to heal itself",
        drainAmount: 20,
        radius: 120,
        interval: 5
      }
    ]
  },
  elementalLord: {
    name: "Elemental Lord",
    baseHealth: 1200,
    speed: 0.7,
    reward: 350,
    damage: 6,
    color: '#00BCD4',
    size: 48,
    flying: true,
    abilities: [
      {
        name: "Element Shift",
        effect: "Changes element to become resistant to different tower types",
        elements: ['fire', 'ice', 'lightning', 'earth'],
        duration: 10,
        resistanceAmount: 0.8
      },
      {
        name: "Elemental Burst",
        effect: "Damages and applies effects to all towers in range",
        radius: 200,
        damage: 30,
        effectDuration: 5,
        cooldown: 30
      }
    ]
  }
};

// Wave configuration for infinite mode
class InfiniteWaveManager {
  constructor(game) {
    this.game = game;
    this.currentWave = 0;
    this.difficultyMultiplier = 1.0;
    this.bossInterval = 5; // Boss every X waves
    this.specialEnemyThreshold = 3; // Special enemies start appearing after this wave
    this.lastBossWave = 0;

    // Enemy pool - which enemies can appear at which wave
    this.enemyPool = {
      1: ['normal'],
      3: ['normal', 'fast'],
      5: ['normal', 'fast', 'tank'],
      8: ['normal', 'fast', 'tank', 'flying'],
      12: ['normal', 'fast', 'tank', 'flying', 'healing'],
      15: ['normal', 'fast', 'tank', 'flying', 'healing', 'armored'],
      20: ['normal', 'fast', 'tank', 'flying', 'healing', 'armored', 'spawner'],
      25: ['normal', 'fast', 'tank', 'flying', 'healing', 'armored', 'spawner', 'invisible'],
      30: ['normal', 'fast', 'tank', 'flying', 'healing', 'armored', 'spawner', 'invisible', 'explosive']
    };

    // Boss pool - which bosses can appear at which wave
    this.bossPool = {
      5: ['megaTank'],
      10: ['megaTank', 'mothership'],
      20: ['megaTank', 'mothership', 'juggernaut'],
      30: ['megaTank', 'mothership', 'juggernaut', 'necromancer'],
      50: ['megaTank', 'mothership', 'juggernaut', 'necromancer', 'elementalLord']
    };
  }

  // Get the next wave configuration
  getNextWave() {
    this.currentWave++;

    // Calculate difficulty multiplier (increases with each wave)
    this.difficultyMultiplier = 1.0 + (this.currentWave * 0.1);

    // Determine if this is a boss wave
    const isBossWave = this.currentWave % this.bossInterval === 0;

    // Create wave configuration
    const waveConfig = {
      wave: this.currentWave,
      enemies: [],
      boss: null,
      totalEnemies: Math.floor(5 + (this.currentWave * 1.0)), // Reduced number of enemies per wave
      spawnInterval: Math.max(2.0, 5.0 - (this.currentWave * 0.1)), // Slower spawn rate with gradual increase
      difficultyMultiplier: this.difficultyMultiplier
    };

    // Add regular enemies
    waveConfig.enemies = this.getEnemiesForWave();

    // Add boss if it's a boss wave
    if (isBossWave) {
      waveConfig.boss = this.getBossForWave();
      this.lastBossWave = this.currentWave;
    }

    return waveConfig;
  }

  // Get available enemies for the current wave
  getEnemiesForWave() {
    let availableEnemies = ['normal']; // Always include normal enemies

    // Find the highest wave threshold that is less than or equal to the current wave
    const thresholds = Object.keys(this.enemyPool).map(Number).sort((a, b) => a - b);

    for (const threshold of thresholds) {
      if (this.currentWave >= threshold) {
        availableEnemies = this.enemyPool[threshold];
      } else {
        break;
      }
    }

    return availableEnemies;
  }

  // Get a boss for the current wave
  getBossForWave() {
    let availableBosses = ['megaTank']; // Default boss

    // Find the highest wave threshold that is less than or equal to the current wave
    const thresholds = Object.keys(this.bossPool).map(Number).sort((a, b) => a - b);

    for (const threshold of thresholds) {
      if (this.currentWave >= threshold) {
        availableBosses = this.bossPool[threshold];
      } else {
        break;
      }
    }

    // Randomly select a boss from the available pool
    const randomIndex = Math.floor(Math.random() * availableBosses.length);
    return availableBosses[randomIndex];
  }

  // Calculate health for an enemy based on wave and type
  calculateEnemyHealth(baseHealth) {
    return Math.floor(baseHealth * this.difficultyMultiplier);
  }

  // Calculate reward for an enemy based on wave and type
  calculateEnemyReward(baseReward) {
    return Math.floor(baseReward * Math.sqrt(this.difficultyMultiplier));
  }
}

// Utility function for calculating distance between two points
function distance(x1, y1, x2, y2) {
  return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}

// Extend the Enemy class to support special abilities
Enemy.prototype.initializeSpecialAbilities = function() {
  // Initialize based on enemy type
  switch (this.type) {
    case 'healing':
      this.healTimer = 0;
      this.healRadius = enemyTypes.healing.healRadius;
      this.healAmount = enemyTypes.healing.healAmount;
      this.healInterval = enemyTypes.healing.healInterval;
      break;

    case 'spawner':
      this.spawnTimer = 0;
      this.spawnType = enemyTypes.spawner.spawnType;
      this.spawnInterval = enemyTypes.spawner.spawnInterval;
      this.spawnCount = 0;
      this.maxSpawns = enemyTypes.spawner.maxSpawns;
      break;

    case 'armored':
      this.armor = enemyTypes.armored.armor;
      break;

    case 'invisible':
      this.invisibility = enemyTypes.invisible.invisibility;
      this.visibleToSpecialTowers = enemyTypes.invisible.visibleToSpecialTowers;
      break;

    case 'explosive':
      this.explosionRadius = enemyTypes.explosive.explosionRadius;
      this.explosionDamage = enemyTypes.explosive.explosionDamage;
      break;
  }

  // Initialize boss abilities
  if (this.isBoss) {
    this.abilities = [];
    const bossData = bossTypes[this.bossType];

    if (bossData && bossData.abilities) {
      bossData.abilities.forEach(ability => {
        this.abilities.push({
          ...ability,
          cooldownTimer: 0,
          active: false,
          duration: ability.duration || 0,
          durationTimer: 0
        });
      });
    }
  }
};

// Update method for special abilities
Enemy.prototype.updateSpecialAbilities = function(deltaTime, enemies, towers) {
  if (!this.alive) return;

  // Update based on enemy type
  switch (this.type) {
    case 'healing':
      this.updateHealingAbility(deltaTime, enemies);
      break;

    case 'spawner':
      this.updateSpawnerAbility(deltaTime, enemies);
      break;
  }

  // Update boss abilities
  if (this.isBoss && this.abilities) {
    this.abilities.forEach(ability => {
      // Update cooldown timer
      if (!ability.active && ability.cooldownTimer > 0) {
        ability.cooldownTimer -= deltaTime;
      }

      // Check if ability can be activated
      if (!ability.active && ability.cooldownTimer <= 0) {
        this.activateBossAbility(ability, enemies, towers);
        ability.active = true;
        ability.durationTimer = ability.duration || 0;
      }

      // Update active ability
      if (ability.active) {
        this.updateBossAbility(ability, deltaTime, enemies, towers);

        // Check if ability duration is over
        if (ability.durationTimer > 0) {
          ability.durationTimer -= deltaTime;
          if (ability.durationTimer <= 0) {
            this.deactivateBossAbility(ability);
            ability.active = false;
            ability.cooldownTimer = ability.cooldown || 10;
          }
        }
      }
    });
  }
};

// Healing ability for healer enemies
Enemy.prototype.updateHealingAbility = function(deltaTime, enemies) {
  this.healTimer += deltaTime;

  if (this.healTimer >= this.healInterval) {
    this.healTimer = 0;

    // Heal nearby enemies
    enemies.forEach(enemy => {
      if (enemy !== this && enemy.alive) {
        const dist = distance(this.x, this.y, enemy.x, enemy.y);
        if (dist <= this.healRadius) {
          enemy.health = Math.min(enemy.maxHealth, enemy.health + this.healAmount);
        }
      }
    });
  }
};

// Spawner ability for spawner enemies
Enemy.prototype.updateSpawnerAbility = function(deltaTime, enemies) {
  if (this.spawnCount >= this.maxSpawns) return;

  this.spawnTimer += deltaTime;

  if (this.spawnTimer >= this.spawnInterval) {
    this.spawnTimer = 0;
    this.spawnCount++;

    // Create a new enemy
    const spawnedEnemy = new Enemy(this.path, this.spawnType);
    spawnedEnemy.x = this.x;
    spawnedEnemy.y = this.y;
    spawnedEnemy.pathIndex = this.pathIndex;

    // Add to the game's enemy array
    enemies.push(spawnedEnemy);
  }
};

// Activate boss ability
Enemy.prototype.activateBossAbility = function(ability, enemies, towers) {
  switch (ability.name) {
    case "Spawn Minions":
      for (let i = 0; i < ability.spawnCount; i++) {
        const spawnedEnemy = new Enemy(this.path, ability.spawnType);
        spawnedEnemy.x = this.x;
        spawnedEnemy.y = this.y;
        spawnedEnemy.pathIndex = this.pathIndex;
        enemies.push(spawnedEnemy);
      }
      break;

    case "Shield":
      this.isInvulnerable = true;
      break;

    case "Charge":
      this.speedBoost = ability.speedBoost;
      break;

    case "Shockwave":
      // Disable nearby towers
      towers.forEach(tower => {
        const dist = distance(this.x, this.y, tower.x, tower.y);
        if (dist <= ability.radius) {
          tower.disabled = true;
          tower.disabledDuration = ability.duration;
        }
      });
      break;

    case "Element Shift":
      const randomElement = ability.elements[Math.floor(Math.random() * ability.elements.length)];
      this.currentElement = randomElement;
      this.elementResistance = ability.resistanceAmount;
      break;
  }
};

// Update active boss ability
Enemy.prototype.updateBossAbility = function(ability, deltaTime, enemies, towers) {
  switch (ability.name) {
    case "Regeneration":
      this.health = Math.min(this.maxHealth, this.health + ability.healAmount * deltaTime);
      break;

    case "Life Drain":
      ability.timer = (ability.timer || 0) + deltaTime;
      if (ability.timer >= ability.interval) {
        ability.timer = 0;

        // Drain health from nearby towers
        let totalDrained = 0;
        towers.forEach(tower => {
          const dist = distance(this.x, this.y, tower.x, tower.y);
          if (dist <= ability.radius) {
            tower.health = (tower.health || 100) - ability.drainAmount;
            totalDrained += ability.drainAmount;

            // If tower health reaches 0, destroy it
            if (tower.health <= 0) {
              tower.destroyed = true;
            }
          }
        });

        // Heal the boss
        this.health = Math.min(this.maxHealth, this.health + totalDrained);
      }
      break;
  }
};

// Deactivate boss ability
Enemy.prototype.deactivateBossAbility = function(ability) {
  switch (ability.name) {
    case "Shield":
      this.isInvulnerable = false;
      break;

    case "Charge":
      this.speedBoost = 1;
      break;

    case "Element Shift":
      this.currentElement = null;
      this.elementResistance = 0;
      break;
  }
};

// Override takeDamage method to handle special enemy types
const originalTakeDamage = Enemy.prototype.takeDamage;
Enemy.prototype.takeDamage = function(amount, towerType) {
  // Check for invulnerability
  if (this.isInvulnerable) return false;

  // Check for invisibility dodge
  if (this.type === 'invisible' && Math.random() < this.invisibility) {
    // Check if the tower can see invisible enemies
    if (!towerType || !this.visibleToSpecialTowers.includes(towerType)) {
      return false;
    }
  }

  // Apply armor reduction
  if (this.type === 'armored' || this.isBoss) {
    amount *= (1 - (this.armor || 0));
  }

  // Apply elemental resistance
  if (this.currentElement) {
    // Check if tower type is weak against current element
    if (this.isWeakAgainstElement(towerType)) {
      amount *= (1 - (this.elementResistance || 0));
    }
  }

  // Call the original method with modified damage
  return originalTakeDamage.call(this, amount);
};

// Check if tower is weak against current element
Enemy.prototype.isWeakAgainstElement = function(towerType) {
  if (!this.currentElement || !towerType) return false;

  const weaknesses = {
    'fire': ['freeze', 'water'],
    'ice': ['fire', 'laser'],
    'lightning': ['earth', 'rubber'],
    'earth': ['water', 'acid']
  };

  return weaknesses[this.currentElement] && weaknesses[this.currentElement].includes(towerType);
};

// Handle enemy death with special effects
Enemy.prototype.onDeath = function(towers) {
  // Explosive enemy damages nearby towers
  if (this.type === 'explosive') {
    towers.forEach(tower => {
      const dist = distance(this.x, this.y, tower.x, tower.y);
      if (dist <= this.explosionRadius) {
        tower.health = (tower.health || 100) - this.explosionDamage;

        // If tower health reaches 0, destroy it
        if (tower.health <= 0) {
          tower.destroyed = true;
        }
      }
    });
  }
};

// Extend the Game class to support infinite mode
Game.prototype.initializeInfiniteMode = function() {
  this.infiniteMode = false;
  this.waveManager = new InfiniteWaveManager(this);
  this.defeatedBosses = [];

  // Add toggle button for infinite mode
  const controlGroup = document.createElement('div');
  controlGroup.className = 'control-group';

  const infiniteModeToggle = document.createElement('label');
  infiniteModeToggle.innerHTML = `
    <input type="checkbox" id="infiniteMode">
    Infinite Mode
  `;

  controlGroup.appendChild(infiniteModeToggle);
  document.getElementById('fixed-controls').appendChild(controlGroup);

  // Add event listener for infinite mode toggle
  document.getElementById('infiniteMode').addEventListener('change', (e) => {
    this.infiniteMode = e.target.checked;
    this.resetGame();
    console.log(`Infinite mode ${this.infiniteMode ? 'enabled' : 'disabled'}`);
  });
};

// Override startWave method to use infinite mode
const originalStartWave = Game.prototype.startWave;
Game.prototype.startWave = function() {
  // Make sure the map is fully loaded before starting a wave
  if (!this.map || !this.map.grid || this.map.grid.length === 0) {
    console.log('Cannot start wave - map not fully loaded yet');
    return;
  }

  if (this.infiniteMode) {
    this.startInfiniteWave();
  } else {
    originalStartWave.call(this);
  }
};

// Start a wave in infinite mode
Game.prototype.startInfiniteWave = function() {
  if (this.waveInProgress) return;

  this.waveInProgress = true;
  this.enemiesSpawned = 0;
  this.enemiesKilled = 0;
  this.enemiesLeaked = 0;

  // Get the next wave configuration
  const waveConfig = this.waveManager.getNextWave();
  this.wave = waveConfig.wave;
  this.totalEnemiesInWave = waveConfig.totalEnemies;
  this.spawnInterval = waveConfig.spawnInterval;
  this.currentWaveConfig = waveConfig;

  // Update UI
  document.getElementById('startWave').textContent = 'Wave in Progress...';

  // Start the game if not already started
  if (!this.gameStarted) {
    this.gameStarted = true;
    this.lastUpdateTime = performance.now();
    window.requestAnimationFrame((time) => this.gameLoop(time));
  }

  // Force spawn the first enemy immediately
  this.timeSinceLastSpawn = this.spawnInterval;
  this.spawnInfiniteEnemy();

  console.log(`Starting infinite wave ${this.wave} with ${this.totalEnemiesInWave} enemies`);
  if (waveConfig.boss) {
    console.log(`Boss for this wave: ${waveConfig.boss}`);
  }
};

// Spawn an enemy in infinite mode
Game.prototype.spawnInfiniteEnemy = function() {
  if (this.enemiesSpawned >= this.totalEnemiesInWave) return;

  // Determine if this should be a boss spawn
  const shouldSpawnBoss = this.currentWaveConfig.boss &&
                         this.enemiesSpawned === this.totalEnemiesInWave - 1;

  let enemyType;

  if (shouldSpawnBoss) {
    // Spawn the boss
    enemyType = this.currentWaveConfig.boss;

    // Create the enemy with boss properties
    const enemy = new Enemy(this.map.pathCoordinates);

    // Set boss properties
    const bossData = bossTypes[enemyType];
    enemy.type = 'boss';
    enemy.bossType = enemyType;
    enemy.isBoss = true;
    enemy.name = bossData.name;
    enemy.maxHealth = this.waveManager.calculateEnemyHealth(bossData.baseHealth);
    enemy.health = enemy.maxHealth;
    enemy.speed = bossData.speed;
    enemy.size = bossData.size;
    enemy.color = bossData.color;
    enemy.flying = bossData.flying;
    enemy.reward = this.waveManager.calculateEnemyReward(bossData.reward);
    enemy.damage = bossData.damage;
    enemy.armor = bossData.armor || 0;

    // Initialize boss abilities
    enemy.initializeSpecialAbilities();

    this.enemies.push(enemy);
    console.log(`Spawned boss: ${enemy.name} with ${enemy.health} health`);
  } else {
    // Spawn a regular enemy
    const availableEnemies = this.currentWaveConfig.enemies;
    enemyType = availableEnemies[Math.floor(Math.random() * availableEnemies.length)];

    // Create the enemy
    const enemy = new Enemy(this.map.pathCoordinates, enemyType);

    // Adjust enemy properties based on wave difficulty
    const enemyData = enemyTypes[enemyType];
    enemy.maxHealth = this.waveManager.calculateEnemyHealth(enemyData.health);
    enemy.health = enemy.maxHealth;
    enemy.reward = this.waveManager.calculateEnemyReward(enemyData.reward);
    enemy.damage = enemyData.damage;

    // Initialize special abilities
    enemy.initializeSpecialAbilities();

    this.enemies.push(enemy);
  }

  this.enemiesSpawned++;
};

// Override the spawnEnemy method to use infinite mode
const originalSpawnEnemy = Game.prototype.spawnEnemy;
Game.prototype.spawnEnemy = function() {
  if (this.infiniteMode) {
    this.spawnInfiniteEnemy();
  } else {
    originalSpawnEnemy.call(this);
  }
};

// Override the update method to handle special enemy abilities
const originalUpdate = Game.prototype.update;
Game.prototype.update = function(currentTime) {
  // Call the original update method
  originalUpdate.call(this, currentTime);

  // Update special enemy abilities
  if (this.infiniteMode) {
    this.enemies.forEach(enemy => {
      if (enemy.updateSpecialAbilities) {
        enemy.updateSpecialAbilities(currentTime, this.enemies, this.towers);
      }
    });

    // Check for destroyed towers
    this.towers = this.towers.filter(tower => !tower.destroyed);
  }
};

// Override the enemy death handling
Game.prototype.handleEnemyDeath = function(enemy) {
  // Add gold and score
  this.gold += enemy.reward;
  this.score += enemy.reward * 10;
  this.enemiesKilled++;

  // Handle special death effects
  if (enemy.onDeath) {
    enemy.onDeath(this.towers);
  }

  // Track defeated bosses
  if (enemy.isBoss) {
    this.defeatedBosses.push({
      type: enemy.bossType,
      wave: this.wave,
      name: enemy.name
    });

    // Give bonus gold for defeating a boss
    const bossBonus = Math.floor(enemy.reward * 0.5);
    this.gold += bossBonus;
    this.score += bossBonus * 20;

    console.log(`Defeated boss ${enemy.name}! Bonus gold: ${bossBonus}`);
  }
};

// Reset the game for infinite mode
Game.prototype.resetGame = function() {
  // Reset game state
  this.towers = [];
  this.enemies = [];
  this.projectiles = [];
  this.gold = 100;
  this.lives = 10;
  this.score = 0;
  this.wave = 1;
  this.waveInProgress = false;
  this.gameOver = false;

  // Reset wave manager for infinite mode
  if (this.infiniteMode) {
    this.waveManager = new InfiniteWaveManager(this);
    this.defeatedBosses = [];
  }

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

  // Create a new map
  this.map = new GameMap(this.canvas, this.ctx, this.currentMapTemplate);

  // Draw the new map
  this.draw();
};
