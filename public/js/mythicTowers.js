/**
 * Mythic and Divine Towers
 * Special high-rarity towers with unique abilities
 */
// Log that mythicTowers.js is loaded
console.log('Mythic and Divine Towers loaded');

// Add mythic and divine towers to the towerStats object
(function() {
  // Make sure towerStats exists
  if (!window.towerStats) {
    console.error('towerStats not found, cannot add mythic towers');
    return;
  }
  
  // Add False God tower (Mythic)
  towerStats.falseGod = {
    name: "False God",
    description: "A deceptive deity that manipulates reality, causing enemies to take damage from illusions.",
    tier: "mythic",
    color: "#9C27B0", // Purple
    range: 180,
    damage: 75,
    attackSpeed: 1.2,
    projectileSpeed: 12,
    cost: 1200,
    persistentCost: 1200,
    sellValue: 960,
    targetTypes: ["ground", "flying"],
    upgrades: [
      {
        name: "Divine Deception",
        description: "Increases damage and creates illusions that deal additional damage.",
        cost: 800,
        damageIncrease: 50,
        rangeIncrease: 20,
        special: "Creates illusion copies that deal 30% damage"
      },
      {
        name: "Reality Warp",
        description: "Warps reality around enemies, slowing them and increasing damage taken.",
        cost: 1200,
        damageIncrease: 75,
        attackSpeedIncrease: 0.3,
        special: "Slows enemies by 20% and increases damage taken by 15%"
      },
      {
        name: "Forbidden Knowledge",
        description: "Grants forbidden knowledge that greatly increases damage and attack speed.",
        cost: 2000,
        damageIncrease: 150,
        attackSpeedIncrease: 0.5,
        special: "25% chance to instantly defeat non-boss enemies"
      }
    ],
    special: {
      type: "illusion",
      description: "Creates illusions that deal additional damage to enemies",
      effectRadius: 150,
      effectDuration: 3,
      effectChance: 0.3
    }
  };
  
  // Add Cupid tower (Mythic)
  towerStats.cupid = {
    name: "Cupid",
    description: "Fires arrows of love that charm enemies, causing them to fight for you temporarily.",
    tier: "mythic",
    color: "#E91E63", // Pink
    range: 160,
    damage: 60,
    attackSpeed: 1.5,
    projectileSpeed: 15,
    cost: 1100,
    persistentCost: 1100,
    sellValue: 880,
    targetTypes: ["ground", "flying"],
    upgrades: [
      {
        name: "Heartfelt Arrows",
        description: "Arrows pierce through enemies, hitting multiple targets in a line.",
        cost: 750,
        damageIncrease: 40,
        special: "Arrows pierce through up to 3 enemies"
      },
      {
        name: "Eternal Love",
        description: "Increases charm duration and adds a healing effect to charmed enemies.",
        cost: 1100,
        damageIncrease: 60,
        attackSpeedIncrease: 0.2,
        special: "Charmed enemies heal nearby towers for 5 health per second"
      },
      {
        name: "Passionate Fury",
        description: "Charmed enemies explode with passion when defeated, damaging nearby enemies.",
        cost: 1800,
        damageIncrease: 120,
        rangeIncrease: 30,
        special: "Charmed enemies explode on death, dealing 150 damage in a small area"
      }
    ],
    special: {
      type: "charm",
      description: "Charms enemies, causing them to fight for you temporarily",
      effectDuration: 4,
      effectChance: 0.25,
      damageMultiplier: 0.5
    }
  };
  
  // Add Archangel tower (Divine)
  towerStats.archangel = {
    name: "Archangel",
    description: "A divine being of pure light that smites enemies with holy energy.",
    tier: "divine",
    color: "#FFD700", // Gold
    range: 200,
    damage: 120,
    attackSpeed: 1.0,
    projectileSpeed: 20,
    cost: 1500,
    persistentCost: 1500,
    sellValue: 1200,
    targetTypes: ["ground", "flying"],
    upgrades: [
      {
        name: "Divine Radiance",
        description: "Emits a constant aura of light that damages all enemies in range.",
        cost: 1000,
        damageIncrease: 80,
        rangeIncrease: 30,
        special: "Deals 20 damage per second to all enemies in range"
      },
      {
        name: "Heavenly Host",
        description: "Summons angelic minions to assist in battle.",
        cost: 1500,
        damageIncrease: 100,
        attackSpeedIncrease: 0.3,
        special: "Summons 3 angelic minions that deal 40 damage per attack"
      },
      {
        name: "Divine Judgment",
        description: "Calls down divine judgment, dealing massive damage to all enemies on screen.",
        cost: 2500,
        damageIncrease: 200,
        special: "Every 15 seconds, deals 300 damage to all enemies on screen"
      }
    ],
    special: {
      type: "divine",
      description: "Attacks all enemy types and deals bonus damage to boss enemies",
      bossDamageMultiplier: 2.0,
      aoeRadius: 80,
      buffRadius: 150,
      buffAmount: 0.3
    }
  };
  
  // Add Seraphim tower (Divine)
  towerStats.seraphim = {
    name: "Seraphim",
    description: "A six-winged angel of the highest order that purifies enemies with holy fire.",
    tier: "divine",
    color: "#FFA500", // Orange
    range: 180,
    damage: 100,
    attackSpeed: 1.2,
    projectileSpeed: 18,
    cost: 1600,
    persistentCost: 1600,
    sellValue: 1280,
    targetTypes: ["ground", "flying"],
    upgrades: [
      {
        name: "Purifying Flames",
        description: "Holy fire burns enemies over time, dealing additional damage.",
        cost: 1100,
        damageIncrease: 70,
        special: "Applies a burn effect that deals 30 damage per second for 3 seconds"
      },
      {
        name: "Wings of Protection",
        description: "Protects nearby towers, reducing damage they take and increasing their attack speed.",
        cost: 1600,
        damageIncrease: 90,
        rangeIncrease: 20,
        special: "Nearby towers take 30% less damage and attack 20% faster"
      },
      {
        name: "Celestial Wrath",
        description: "Unleashes celestial wrath, dealing massive damage in a large area.",
        cost: 2700,
        damageIncrease: 180,
        attackSpeedIncrease: 0.4,
        special: "Every 20 seconds, deals 400 damage in a large area"
      }
    ],
    special: {
      type: "divine",
      description: "Purifies enemies with holy fire, dealing damage over time",
      burnDamage: 40,
      burnDuration: 4,
      aoeRadius: 100,
      buffRadius: 170,
      buffAmount: 0.25
    }
  };
  
  console.log('Added mythic and divine towers to towerStats');
})();

// Add mythic and divine towers to the gacha pool
(function() {
  // Make sure gachaSystem exists
  if (!window.gachaSystem) {
    console.error('gachaSystem not found, cannot add mythic towers to gacha pool');
    return;
  }
  
  // Add the new towers to the tower pool
  const towerPool = gachaSystem.getTowerPool();
  
  // Add mythic towers
  if (!towerPool.mythic.includes('falseGod')) {
    towerPool.mythic.push('falseGod');
  }
  
  if (!towerPool.mythic.includes('cupid')) {
    towerPool.mythic.push('cupid');
  }
  
  // Add divine towers (only available through premium currency)
  if (!towerPool.divine.includes('archangel')) {
    towerPool.divine.push('archangel');
  }
  
  if (!towerPool.divine.includes('seraphim')) {
    towerPool.divine.push('seraphim');
  }
  
  console.log('Added mythic and divine towers to gacha pool');
})();

// Make divine towers only available through premium currency
(function() {
  // Make sure gachaSystem exists
  if (!window.gachaSystem) {
    console.error('gachaSystem not found, cannot modify gacha rates');
    return;
  }
  
  // Store the original roll function
  const originalRollTower = gachaSystem.rollTower;
  
  // Override the roll function to exclude divine towers from regular rolls
  gachaSystem.rollTower = function(usePremiumCurrency = false) {
    // If using premium currency, use the original function
    if (usePremiumCurrency) {
      return originalRollTower.call(this, usePremiumCurrency);
    }
    
    // For regular currency, roll until we get a non-divine tower
    let result;
    do {
      result = originalRollTower.call(this, usePremiumCurrency);
    } while (towerStats[result]?.tier === 'divine');
    
    return result;
  };
  
  console.log('Modified gacha system to make divine towers premium-only');
})();
