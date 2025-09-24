/**
 * Tower Helper - Utility functions for adding new towers and variants
 * This file provides helper functions to make it easier to add new towers and variants
 */

// Log that towerHelper.js is loaded
console.log('Tower Helper loaded');

// Tower Helper object
const TowerHelper = {
  // Add a new tower type to the game
  addTower: function(towerType, towerData) {
    // Add tower to towerStats
    if (!towerStats[towerType]) {
      towerStats[towerType] = towerData;
      console.log(`Added new tower type: ${towerType}`);
    } else {
      console.warn(`Tower type ${towerType} already exists. Use updateTower to modify it.`);
    }

    // Add tower to towerPrices if not already there
    if (!playerData.towerPrices[towerType] && towerData.persistentCost) {
      playerData.towerPrices[towerType] = towerData.persistentCost;
    }

    // Add tower to towerVariants if not already there
    if (!playerData.towerVariants[towerType]) {
      playerData.towerVariants[towerType] = [];
    }

    // Save player data
    savePlayerData();

    return towerType;
  },

  // Update an existing tower type
  updateTower: function(towerType, towerData) {
    if (towerStats[towerType]) {
      // Merge new data with existing data
      Object.assign(towerStats[towerType], towerData);
      console.log(`Updated tower type: ${towerType}`);

      // Update price if provided
      if (towerData.persistentCost) {
        playerData.towerPrices[towerType] = towerData.persistentCost;
      }

      // Save player data
      savePlayerData();
      return true;
    } else {
      console.warn(`Tower type ${towerType} does not exist. Use addTower to create it.`);
      return false;
    }
  },

  // Add a new tower variant
  addVariant: function(variantType, variantData) {
    // Add variant to towerVariants
    if (!towerVariants[variantType]) {
      towerVariants[variantType] = variantData;
      console.log(`Added new variant: ${variantType}`);
      return true;
    } else {
      console.warn(`Variant ${variantType} already exists. Use updateVariant to modify it.`);
      return false;
    }
  },

  // Update an existing tower variant
  updateVariant: function(variantType, variantData) {
    if (towerVariants[variantType]) {
      // Merge new data with existing data
      Object.assign(towerVariants[variantType], variantData);
      console.log(`Updated variant: ${variantType}`);
      return true;
    } else {
      console.warn(`Variant ${variantType} does not exist. Use addVariant to create it.`);
      return false;
    }
  },

  // Add a tower upgrade path
  addTowerUpgradePath: function(towerType, pathKey, pathData) {
    if (towerUpgrades[towerType]) {
      towerUpgrades[towerType][pathKey] = pathData;
      console.log(`Added upgrade path ${pathKey} to tower ${towerType}`);
      return true;
    } else {
      console.warn(`Tower type ${towerType} does not exist in towerUpgrades.`);
      return false;
    }
  },

  // Add a tower to the player's inventory
  unlockTower: function(towerType) {
    if (!playerData.unlockedTowers.includes(towerType)) {
      playerData.unlockedTowers.push(towerType);
      savePlayerData();
      console.log(`Unlocked tower: ${towerType}`);
      return true;
    } else {
      console.log(`Tower ${towerType} is already unlocked.`);
      return false;
    }
  },

  // Add a variant to a tower in the player's inventory
  unlockVariant: function(towerType, variantType) {
    if (!playerData.towerVariants[towerType]) {
      playerData.towerVariants[towerType] = [];
    }

    if (!playerData.towerVariants[towerType].includes(variantType)) {
      playerData.towerVariants[towerType].push(variantType);
      savePlayerData();
      console.log(`Unlocked variant ${variantType} for tower ${towerType}`);
      return true;
    } else {
      console.log(`Variant ${variantType} is already unlocked for tower ${towerType}.`);
      return false;
    }
  },

  // Get all towers of a specific tier
  getTowersOfTier: function(tier) {
    return Object.keys(towerStats).filter(tower => towerStats[tower].tier === tier);
  },

  // Get all variants of a specific tier
  getVariantsOfTier: function(tier) {
    return Object.keys(towerVariants).filter(variant => towerVariants[variant].tier === tier);
  }
};

// Export the TowerHelper object
window.TowerHelper = TowerHelper;
