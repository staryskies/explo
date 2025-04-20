/**
 * Player data management for the tower defense game
 */
// Log that playerData.js is loaded
console.log('Player data loaded');

// Player data structure
const playerData = {
  // Currency
  silver: 1000, // Start with some silver for testing

  // Game stats
  highScore: 0,
  gamesPlayed: 0,
  wavesCompleted: 0,
  enemiesKilled: 0,
  highestWaveCompleted: 0,
  completedDifficulties: [],

  // Gacha system stats
  towerRolls: 0,
  variantRolls: 0,
  towerPity: {
    rare: 0,
    epic: 0,
    legendary: 0
  },
  variantPity: {
    rare: 0,
    epic: 0,
    legendary: 0
  },

  // Unlocked towers (basic is always unlocked)
  unlockedTowers: ['basic'],

  // Tower variants for each tower
  towerVariants: {
    basic: ['normal'],
    archer: [],
    cannon: [],
    sniper: [],
    freeze: [],
    mortar: [],
    laser: [],
    tesla: [],
    flame: [],
    missile: [],
    poison: [],
    vortex: [],
    archangel: []
  },

  // Towers that require completing specific difficulties
  lockedTowers: {
    'tesla': 'easy',     // Unlocked after completing Easy difficulty
    'flame': 'medium',   // Unlocked after completing Medium difficulty
    'poison': 'hard',    // Unlocked after completing Hard difficulty
    'vortex': 'nightmare' // Unlocked after completing Nightmare difficulty
  },

  // Tower prices in silver
  towerPrices: {
    basic: 0, // Already unlocked
    archer: 500,
    cannon: 1000,
    sniper: 1500,
    freeze: 2000,
    mortar: 2500,
    laser: 3000,
    tesla: 3500,
    flame: 4000,
    missile: 4500,
    poison: 5000,
    vortex: 5500,
    archangel: 600 // Divine tier tower with special price
  },

  // Tower variant prices in silver
  variantPrices: {
    basic: {
      gold: 1000,
      crystal: 2000,
      shadow: 3000
    },
    archer: {
      ice: 1500,
      fire: 2000,
      poison: 2500,
      dragon: 3500
    },
    cannon: {
      double: 2000,
      heavy: 3000,
      explosive: 4000
    },
    sniper: {
      rapid: 2500,
      stealth: 3500,
      railgun: 5000
    },
    freeze: {
      cryo: 2000,
      blizzard: 3500,
      temporal: 5000
    },
    mortar: {
      cluster: 3000,
      napalm: 4000,
      artillery: 5500
    },
    laser: {
      prismatic: 3500,
      plasma: 4500,
      quantum: 6000
    },
    tesla: {
      storm: 4000,
      overcharge: 5000,
      lightning: 6500
    },
    flame: {
      inferno: 3500,
      magma: 4500,
      phoenix: 6000
    },
    missile: {
      guided: 4000,
      multi: 5000,
      nuclear: 7000
    },
    poison: {
      toxic: 3500,
      plague: 4500,
      acid: 5500
    },
    vortex: {
      gravity: 5000,
      black_hole: 7000,
      dimensional: 10000
    }
  },

  // Selected tower variants
  selectedVariants: {
    basic: 'normal',
    archer: null,
    cannon: null,
    sniper: null,
    freeze: null,
    mortar: null,
    laser: null,
    tesla: null,
    flame: null,
    missile: null,
    poison: null,
    vortex: null,
    archangel: null
  }
};

// Save player data to local storage
function savePlayerData() {
  localStorage.setItem('towerDefensePlayerData', JSON.stringify(playerData));
  console.log('Player data saved');
}

// Load player data from local storage
function loadPlayerData() {
  const savedData = localStorage.getItem('towerDefensePlayerData');
  if (savedData) {
    try {
      const parsedData = JSON.parse(savedData);
      // Update playerData with saved values
      Object.assign(playerData, parsedData);
      console.log('Player data loaded');
    } catch (error) {
      console.error('Error loading player data:', error);
    }
  } else {
    console.log('No saved player data found, using defaults');
    savePlayerData(); // Save default data
  }
}

// Add silver to player's account
function addSilver(amount) {
  playerData.silver += amount;
  savePlayerData();
  updateSilverDisplay();
  return playerData.silver;
}

// Spend silver (returns true if successful, false if not enough)
function spendSilver(amount) {
  if (playerData.silver >= amount) {
    playerData.silver -= amount;
    savePlayerData();
    updateSilverDisplay();
    return true;
  }
  return false;
}

// Update silver display in UI
function updateSilverDisplay() {
  // Update all silver displays
  document.querySelectorAll('[id$="silver-amount"]').forEach(element => {
    element.textContent = playerData.silver;
  });
}

// Check if a tower is unlocked
function isTowerUnlocked(towerType) {
  return playerData.unlockedTowers.includes(towerType);
}

// Unlock a tower
function unlockTower(towerType) {
  if (!isTowerUnlocked(towerType)) {
    playerData.unlockedTowers.push(towerType);
    // Unlock the normal variant
    playerData.towerVariants[towerType].push('normal');
    playerData.selectedVariants[towerType] = 'normal';
    savePlayerData();
    return true;
  }
  return false;
}

// Check if a tower variant is unlocked
function isVariantUnlocked(towerType, variant) {
  return playerData.towerVariants[towerType]?.includes(variant);
}

// Unlock a tower variant
function unlockVariant(towerType, variant) {
  if (!isVariantUnlocked(towerType, variant)) {
    playerData.towerVariants[towerType].push(variant);
    savePlayerData();
    return true;
  }
  return false;
}

// Select a tower variant
function selectVariant(towerType, variant) {
  if (isVariantUnlocked(towerType, variant)) {
    playerData.selectedVariants[towerType] = variant;
    savePlayerData();
    return true;
  }
  return false;
}

// Update high score
function updateHighScore(score) {
  if (score > playerData.highScore) {
    playerData.highScore = score;
    savePlayerData();
    return true;
  }
  return false;
}

// Get the number of unlocked towers
function getUnlockedTowerCount() {
  return playerData.unlockedTowers.length;
}

// Get the total number of towers
function getTotalTowerCount() {
  return Object.keys(playerData.towerPrices).length;
}

// Add silver to player's account
function addSilver(amount) {
  playerData.silver += amount;
  playerData.totalSilverEarned = (playerData.totalSilverEarned || 0) + amount;
  savePlayerData();

  // Update silver display if it exists
  const silverDisplay = document.getElementById('silver-display');
  if (silverDisplay) {
    silverDisplay.textContent = playerData.silver;
  }

  return amount;
}

// Complete a difficulty level
function completeDifficulty(difficulty) {
  if (!playerData.completedDifficulties.includes(difficulty)) {
    playerData.completedDifficulties.push(difficulty);
    savePlayerData();

    // Unlock towers associated with this difficulty
    Object.entries(playerData.lockedTowers).forEach(([tower, requiredDifficulty]) => {
      if (requiredDifficulty === difficulty && !playerData.unlockedTowers.includes(tower)) {
        unlockTower(tower);
        console.log(`Unlocked ${tower} tower for completing ${difficulty} difficulty!`);
      }
    });

    return true;
  }
  return false;
}

// Check if a difficulty is completed
function isDifficultyCompleted(difficulty) {
  return playerData.completedDifficulties.includes(difficulty);
}

// Update highest wave completed
function updateHighestWave(wave) {
  if (wave > playerData.highestWaveCompleted) {
    playerData.highestWaveCompleted = wave;
    savePlayerData();
    return true;
  }
  return false;
}

// Get silver multiplier based on difficulty
function getSilverMultiplier(difficulty) {
  const multipliers = {
    'easy': 1,
    'medium': 1.5,
    'hard': 2,
    'nightmare': 3,
    'void': 4
  };

  return multipliers[difficulty] || 1;
}

// Get wave limit based on difficulty
function getWaveLimit(difficulty) {
  const waveLimits = {
    'easy': 20,
    'medium': 30,
    'hard': 40,
    'nightmare': 50,
    'void': 50
  };

  return waveLimits[difficulty] || 20;
}

// Initialize player data
loadPlayerData();
