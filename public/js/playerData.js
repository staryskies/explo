/**
 * Player data management for the tower defense game
 */
// Log that playerData.js is loaded
console.log('Player data loaded');

// Player data structure
const playerData = {
  // Currency
  silver: 1000, // Start with some silver for testing
  gems: 50, // Premium currency

  // Game stats
  highScore: 0,
  gamesPlayed: 0,
  wavesCompleted: 0,
  enemiesKilled: 0,
  highestWaveCompleted: 0,
  completedDifficulties: [],

  // Market data
  marketListings: [], // Player's active market listings
  marketHistory: [], // History of player's market transactions

  // Gacha system stats
  towerRolls: 0,
  variantRolls: 0,
  towerPity: {
    rare: 0,
    epic: 0,
    legendary: 0,
    mythic: 0,
    divine: 0
  },
  variantPity: {
    rare: 0,
    epic: 0,
    legendary: 0,
    divine: 0
  },

  // Unlocked towers (basic is always unlocked)
  unlockedTowers: ['basic'],

  // Tower inventory with combined tower+variant format
  towerInventory: {
    "basic_normal": 1 // Format: "towerType_variantType": count
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

  // Selected towers for loadout (combined tower+variant format)
  selectedTowersForLoadout: [
    "basic_normal" // Format: "towerType_variantType"
  ]
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
  playerData.totalSilverEarned = (playerData.totalSilverEarned || 0) + amount;
  savePlayerData();
  updateCurrencyDisplay();
  return playerData.silver;
}

// Spend silver (returns true if successful, false if not enough)
function spendSilver(amount) {
  if (playerData.silver >= amount) {
    playerData.silver -= amount;
    savePlayerData();
    updateCurrencyDisplay();
    return true;
  }
  return false;
}

// Update currency display in UI
function updateCurrencyDisplay() {
  // Update all silver displays
  document.querySelectorAll('[id$="silver-amount"]').forEach(element => {
    element.textContent = playerData.silver;
  });

  // Update all gems displays
  document.querySelectorAll('[id$="gems-amount"]').forEach(element => {
    element.textContent = playerData.gems;
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
    // Unlock the normal variant and add to inventory
    const combinedKey = `${towerType}_normal`;
    playerData.towerInventory[combinedKey] = 1;
    // Add to loadout if there's space
    if (playerData.selectedTowersForLoadout.length < 4) {
      playerData.selectedTowersForLoadout.push(combinedKey);
    }
    savePlayerData();
    return true;
  }
  return false;
}

// Check if a tower variant is unlocked
function isTowerVariantUnlocked(towerType, variant) {
  const combinedKey = `${towerType}_${variant}`;
  return (playerData.towerInventory[combinedKey] || 0) > 0;
}

// Unlock a tower variant (adds it to inventory)
function unlockTowerVariant(towerType, variant) {
  const combinedKey = `${towerType}_${variant}`;
  if (!isTowerVariantUnlocked(towerType, variant)) {
    playerData.towerInventory[combinedKey] = 1;
    savePlayerData();
    return true;
  }
  return false;
}

// Select a tower variant for loadout
function selectTowerVariantForLoadout(towerType, variant) {
  const combinedKey = `${towerType}_${variant}`;
  if (isTowerVariantUnlocked(towerType, variant)) {
    // Check if this tower type is already in the loadout
    const existingIndex = playerData.selectedTowersForLoadout.findIndex(item =>
      item.split('_')[0] === towerType
    );

    if (existingIndex >= 0) {
      // Replace existing entry
      playerData.selectedTowersForLoadout[existingIndex] = combinedKey;
    } else {
      // Add new entry
      playerData.selectedTowersForLoadout.push(combinedKey);
    }

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

// Add gems to player's account
function addGems(amount) {
  playerData.gems += amount;
  playerData.totalGemsEarned = (playerData.totalGemsEarned || 0) + amount;
  savePlayerData();
  updateCurrencyDisplay();
  return amount;
}

// Spend gems from player's account
function spendGems(amount) {
  if (playerData.gems >= amount) {
    playerData.gems -= amount;
    savePlayerData();
    updateCurrencyDisplay();
    return true;
  }
  return false;
}

// Add tower to inventory
function addTowerToInventory(towerType, variant = 'normal') {
  const combinedKey = `${towerType}_${variant}`;

  // Initialize or increment count
  playerData.towerInventory[combinedKey] = (playerData.towerInventory[combinedKey] || 0) + 1;

  // Make sure the tower is in unlockedTowers
  if (!playerData.unlockedTowers.includes(towerType)) {
    playerData.unlockedTowers.push(towerType);
  }

  savePlayerData();
  return playerData.towerInventory[combinedKey];
}

// Remove tower from inventory
function removeTowerFromInventory(towerType, variant = 'normal') {
  const combinedKey = `${towerType}_${variant}`;

  // Check if tower exists in inventory
  if (!playerData.towerInventory[combinedKey] || playerData.towerInventory[combinedKey] <= 0) {
    return false;
  }

  // Decrement count
  playerData.towerInventory[combinedKey]--;

  savePlayerData();
  return true;
}

// Get tower count from inventory
function getTowerCount(towerType, variant = null) {
  if (variant) {
    const combinedKey = `${towerType}_${variant}`;
    return playerData.towerInventory[combinedKey] || 0;
  } else {
    // Count all variants of this tower type
    let count = 0;
    Object.keys(playerData.towerInventory).forEach(key => {
      if (key.startsWith(`${towerType}_`)) {
        count += playerData.towerInventory[key];
      }
    });
    return count;
  }
}

// Create a market listing
function createMarketListing(combinedTowerKey, price) {
  // Parse the combined key
  const [towerType, variant] = combinedTowerKey.split('_');

  // Check if player has the tower in inventory
  if (!playerData.towerInventory[combinedTowerKey] || playerData.towerInventory[combinedTowerKey] <= 0) {
    return false;
  }

  // Remove the tower from inventory
  if (!removeTowerFromInventory(towerType, variant)) {
    return false;
  }

  // Create the listing
  const listing = {
    id: Date.now().toString(36) + Math.random().toString(36).substring(2, 7),
    combinedKey: combinedTowerKey,
    towerType,
    variant,
    price,
    sellerId: window.authService?.getCurrentUser()?.id || 'guest',
    sellerName: window.authService?.getCurrentUser()?.username || 'Guest',
    createdAt: new Date().toISOString()
  };

  // Add to player's listings
  playerData.marketListings.push(listing);
  savePlayerData();

  return listing;
}

// Cancel a market listing
function cancelMarketListing(listingId) {
  // Find the listing
  const listingIndex = playerData.marketListings.findIndex(listing => listing.id === listingId);
  if (listingIndex === -1) {
    return false;
  }

  // Get the listing
  const listing = playerData.marketListings[listingIndex];

  // Add the tower back to inventory
  if (listing.combinedKey) {
    // New format
    playerData.towerInventory[listing.combinedKey] = (playerData.towerInventory[listing.combinedKey] || 0) + 1;
  } else {
    // Old format for backward compatibility
    addTowerToInventory(listing.towerType, listing.variant);
  }

  // Remove the listing
  playerData.marketListings.splice(listingIndex, 1);
  savePlayerData();

  return true;
}

// Initialize player data
loadPlayerData();
