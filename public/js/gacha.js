/**
 * Simple gacha system for tower defense game
 */

// Log that gacha.js is loaded
console.log('Gacha system loaded');

// Simple gacha system
const gachaSystem = {
  // Tower costs
  costs: {
    tower: {
      single: 100,
      ten: 900,
      hundred: 8000
    },
    variant: {
      single: 150,
      ten: 1350,
      hundred: 12000
    }
  },

  // Roll a single tower
  rollTower: function() {
    // Determine tier based on random chance
    const rand = Math.random();
    let tier;

    if (rand < 0.05) {
      tier = 'legendary';
    } else if (rand < 0.15) {
      tier = 'epic';
    } else if (rand < 0.40) {
      tier = 'rare';
    } else {
      tier = 'common';
    }

    // Get all towers of this tier
    const towersOfTier = Object.keys(towerStats).filter(tower => towerStats[tower].tier === tier);

    // Randomly select one tower from the tier
    const randomIndex = Math.floor(Math.random() * towersOfTier.length);
    const selectedTower = towersOfTier[randomIndex];

    // Unlock the tower if not already unlocked
    if (!playerData.unlockedTowers.includes(selectedTower)) {
      playerData.unlockedTowers.push(selectedTower);
      savePlayerData();
    }

    return selectedTower;
  },

  // Roll multiple towers
  rollTowers: function(count) {
    const results = [];

    for (let i = 0; i < count; i++) {
      results.push(this.rollTower());
    }

    // Show the results
    alert(`You got: ${results.map(tower => towerStats[tower].name).join(', ')}`);

    return results;
  },

  // Roll a single variant
  rollVariant: function(towerType) {
    // Check if the tower is unlocked
    if (!playerData.unlockedTowers.includes(towerType)) {
      alert(`You need to unlock the ${towerStats[towerType]?.name || towerType} tower first!`);
      return null;
    }

    // Determine tier based on random chance
    const rand = Math.random();
    let tier;

    if (rand < 0.05) {
      tier = 'legendary';
    } else if (rand < 0.15) {
      tier = 'epic';
    } else if (rand < 0.40) {
      tier = 'rare';
    } else {
      tier = 'common';
    }

    // Get all variants of this tier
    const variantsOfTier = Object.keys(towerVariants).filter(variant => towerVariants[variant].tier === tier);

    // Randomly select one variant from the tier
    const randomIndex = Math.floor(Math.random() * variantsOfTier.length);
    const selectedVariant = variantsOfTier[randomIndex];

    // Add the variant to the tower if not already added
    if (!playerData.towerVariants[towerType].includes(selectedVariant)) {
      playerData.towerVariants[towerType].push(selectedVariant);
      savePlayerData();
    }

    return selectedVariant;
  },

  // Roll multiple variants
  rollVariants: function(count, towerType) {
    // Check if the tower is unlocked
    if (!playerData.unlockedTowers.includes(towerType)) {
      alert(`You need to unlock the ${towerStats[towerType]?.name || towerType} tower first!`);
      return [];
    }

    const results = [];

    for (let i = 0; i < count; i++) {
      const variant = this.rollVariant(towerType);
      if (variant) {
        results.push(variant);
      }
    }

    if (results.length > 0) {
      // Show the results
      alert(`You got variants: ${results.map(variant => towerVariants[variant].name).join(', ')}`);
    }

    return results;
  }
};


