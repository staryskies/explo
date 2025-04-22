/**
 * Tower data for the tower defense game
 */
// Log that towerData.js is loaded
console.log('Tower data loaded');

// Tower stats and costs
const towerStats = {
  basic: {
    name: "Basic Tower",
    description: "A basic tower with decent stats",
    persistentCost: 50,
    ability: "Basic shot",
    range: 180, // Increased range
    damage: 30, // 3x damage
    fireRate: 1.2, // Faster fire rate
    projectileSpeed: 12, // Faster projectiles
    canTargetFlying: true, // Allow targeting flying enemies
    color: '#4CAF50',
    tier: 'common'
  },
  archer: {
    name: "Archer Tower",
    description: "Fires multiple arrows in quick succession",
    persistentCost: 225,
    ability: "Triple shot",
    range: 300, // Increased range
    damage: 90, // 3x damage
    fireRate: 2.5, // Faster fire rate
    projectileSpeed: 22, // Faster projectiles
    canTargetFlying: true,
    multiShot: 3, // Now fires 3 arrows by default
    color: '#8BC34A',
    tier: 'common'
  },
  cannon: {
    name: "Cannon Tower",
    description: "Deals massive splash damage to enemies",
    persistentCost: 300,
    ability: "Heavy splash damage",
    range: 240, // Increased range
    damage: 180, // 3x damage
    fireRate: 1.5, // Faster fire rate
    projectileSpeed: 15, // Faster projectiles
    canTargetFlying: true, // Allow targeting flying enemies
    aoeRadius: 80, // Larger splash radius
    stunChance: 0.25, // Increased stun chance
    color: '#795548',
    tier: 'common'
  },
  sniper: {
    name: "Sniper Tower",
    description: "Extreme range with high chance for devastating critical hits",
    persistentCost: 350,
    ability: "Deadly precision",
    range: 450, // Even greater range
    damage: 240, // 3x damage
    fireRate: 1.0, // Faster fire rate
    projectileSpeed: 30, // Faster projectiles
    canTargetFlying: true,
    critChance: 0.5, // 50% chance for critical hit
    critMultiplier: 4.0, // 400% damage on critical hit
    pierceCount: 2, // Increased pierce ability
    color: '#2196F3',
    tier: 'rare'
  },
  freeze: {
    name: "Freeze Tower",
    description: "Severely slows and damages enemies in its range",
    persistentCost: 400,
    ability: "Arctic blast",
    range: 260, // Increased range
    damage: 75, // 3x damage
    fireRate: 2.0, // Faster fire rate
    projectileSpeed: 18, // Faster projectiles
    canTargetFlying: true,
    slowFactor: 0.8, // Stronger slow effect
    slowDuration: 4500, // Longer slow duration
    aoeRadius: 60, // Larger area effect
    color: '#00BCD4',
    tier: 'rare'
  },
  mortar: {
    name: "Mortar Tower",
    description: "Deals devastating splash damage across a massive area",
    persistentCost: 450,
    ability: "Massive bombardment",
    range: 350, // Increased range
    damage: 300, // 3x damage
    fireRate: 1.0, // Faster fire rate
    projectileSpeed: 15, // Faster projectiles
    canTargetFlying: true, // Allow targeting flying enemies
    aoeRadius: 120, // Larger splash radius
    stunChance: 0.35, // Increased stun chance
    stunDuration: 1500, // Longer stun duration
    color: '#607D8B',
    tier: 'rare'
  },
  laser: {
    name: "Laser Tower",
    description: "Fires a powerful continuous beam that pierces through enemies",
    persistentCost: 500,
    ability: "Piercing beam",
    range: 300, // Increased range
    damage: 36, // 3x damage
    fireRate: 20, // Even faster fire rate
    projectileSpeed: 40, // Faster projectiles
    canTargetFlying: true,
    pierceCount: 5, // Can hit more enemies in a line
    rampUpRate: 0.2, // Damage increases faster
    maxRampUp: 2.0, // Up to triple damage
    color: '#E91E63',
    tier: 'epic'
  },
  tesla: {
    name: "Tesla Tower",
    description: "Extremely rare tower that unleashes devastating chain lightning",
    persistentCost: 1000,
    ability: "Mythic chain lightning",
    range: 300, // Even greater range
    damage: 240, // 3x damage
    fireRate: 2.0, // Even faster fire rate
    projectileSpeed: 30, // Faster projectiles
    canTargetFlying: true,
    chainCount: 10, // More chain targets
    chainRange: 180, // Even longer chain range
    stunChance: 0.7, // Higher stun chance
    stunDuration: 1800, // Longer stun duration
    color: '#9C27B0', // More vibrant purple
    tier: 'mythic'
  },
  flame: {
    name: "Flame Tower",
    description: "Engulfs enemies in a raging inferno, dealing massive damage over time",
    persistentCost: 350,
    ability: "Inferno",
    range: 220, // Increased range
    damage: 75, // 3x damage
    fireRate: 3.0, // Faster fire rate
    projectileSpeed: 15, // Faster projectiles
    canTargetFlying: true, // Now can target flying enemies
    burnDuration: 6000, // Even longer burn duration
    burnDamage: 36, // 3x burn damage
    aoeRadius: 45, // Larger splash damage
    spreadChance: 0.3, // Higher chance to spread
    spreadRadius: 60, // Larger spread radius
    color: '#FF5722',
    tier: 'epic'
  },
  missile: {
    name: "Missile Tower",
    description: "Launches devastating guided missiles that obliterate groups of enemies",
    persistentCost: 650,
    ability: "Guided destruction",
    range: 320, // Increased range
    damage: 450, // 3x damage
    fireRate: 0.9, // Faster fire rate
    projectileSpeed: 15, // Faster projectiles
    canTargetFlying: true,
    aoeRadius: 100, // Larger splash radius
    trackingStrength: 0.6, // Better tracking ability
    multiHit: 2, // Hits three times
    color: '#F44336',
    tier: 'legendary'
  },
  poison: {
    name: "Poison Tower",
    description: "Unleashes deadly toxins that devastate enemies and weaken their defenses",
    persistentCost: 700,
    ability: "Toxic cloud",
    range: 220, // Increased range
    damage: 20, // Doubled initial damage
    fireRate: 1.0, // Faster fire rate
    projectileSpeed: 14, // Faster projectiles
    canTargetFlying: true,
    poisonDuration: 6000, // 50% longer poison duration
    poisonDamage: 18, // More than doubled poison damage
    aoeRadius: 70, // Much larger splash radius
    armorReduction: 0.3, // Reduces enemy armor
    speedReduction: 0.2, // Slows enemies
    color: '#9C27B0',
    tier: 'legendary'
  },
  vortex: {
    name: "Vortex Tower",
    description: "Creates a powerful black hole that pulls enemies in and crushes them",
    persistentCost: 750,
    ability: "Gravitational collapse",
    range: 250, // Increased range
    damage: 40, // Doubled damage
    fireRate: 0.9, // Faster fire rate
    projectileSpeed: 14, // Faster projectiles
    canTargetFlying: true,
    pullStrength: 60, // Doubled pull strength
    pullDuration: 2500, // Longer pull duration
    damagePerSecond: 20, // Added damage over time while pulling
    slowFactor: 0.3, // Added slow effect
    aoeRadius: 60, // Added area effect
    color: '#009688',
    tier: 'legendary'
  },
  archangel: {
    name: "Archangel Tower",
    description: "Divine tower that smites enemies with holy light and blesses nearby towers",
    persistentCost: 600,
    ability: "Divine Judgment",
    range: 400, // Increased range even more
    damage: 2500, // Significantly increased damage
    fireRate: 4.5, // Faster fire rate
    projectileSpeed: 50, // Faster projectiles
    canTargetFlying: true,
    pierceCount: 8, // Pierces through more enemies
    critChance: 0.6, // Higher crit chance
    critMultiplier: 5.0, // Higher crit multiplier
    aoeRadius: 120, // Larger area damage
    chainCount: 8, // Can chain to more enemies
    chainRange: 400, // Longer chain range
    buffRadius: 250, // Larger buff radius
    buffDamage: 0.4, // 40% damage buff to nearby towers
    buffRange: 0.3, // 30% range buff to nearby towers
    color: '#FFEB3B', // Bright yellow/gold
    tier: 'divine'
  }
};

// Define upgrade paths for each tower
// Each tower has two upgrade paths with 4 upgrades each
const towerUpgrades = {
  basic: {
    // Path A: Increase damage (but less effective)
    pathA: {
      name: "Power",
      description: "Slightly increases attack damage",
      upgrades: [
        { level: 1, cost: 50, damageBonus: 5, description: "5% more damage" },
        { level: 2, cost: 100, damageBonus: 10, description: "10% more damage" },
        { level: 3, cost: 200, damageBonus: 20, description: "20% more damage" },
        { level: 4, cost: 400, damageBonus: 40, description: "40% more damage" }
      ]
    },
    // Path B: Increase attack speed (but less effective)
    pathB: {
      name: "Speed",
      description: "Slightly increases attack speed",
      upgrades: [
        { level: 1, cost: 50, fireRateBonus: 5, description: "5% faster attacks" },
        { level: 2, cost: 100, fireRateBonus: 10, description: "10% faster attacks" },
        { level: 3, cost: 200, fireRateBonus: 20, description: "20% faster attacks" },
        { level: 4, cost: 400, fireRateBonus: 40, description: "40% faster attacks" }
      ]
    }
  },

  archer: {
    // Path A: Multi-shot
    pathA: {
      name: "Multi-shot",
      description: "Increases number of arrows fired",
      upgrades: [
        { level: 1, cost: 75, extraShots: 1, description: "Fires 3 arrows" },
        { level: 2, cost: 150, extraShots: 2, description: "Fires 4 arrows" },
        { level: 3, cost: 300, extraShots: 3, description: "Fires 5 arrows" },
        { level: 4, cost: 600, extraShots: 4, description: "Fires 6 arrows" }
      ]
    },
    // Path B: Piercing arrows
    pathB: {
      name: "Piercing",
      description: "Arrows pierce through enemies",
      upgrades: [
        { level: 1, cost: 75, pierceCount: 1, description: "Arrows pierce 1 enemy" },
        { level: 2, cost: 150, pierceCount: 2, description: "Arrows pierce 2 enemies" },
        { level: 3, cost: 300, pierceCount: 3, description: "Arrows pierce 3 enemies" },
        { level: 4, cost: 600, pierceCount: 5, description: "Arrows pierce 5 enemies" }
      ]
    }
  },

  cannon: {
    // Path A: Bigger explosions
    pathA: {
      name: "Blast Radius",
      description: "Increases explosion radius",
      upgrades: [
        { level: 1, cost: 100, radiusBonus: 20, description: "20% larger explosions" },
        { level: 2, cost: 200, radiusBonus: 40, description: "40% larger explosions" },
        { level: 3, cost: 400, radiusBonus: 70, description: "70% larger explosions" },
        { level: 4, cost: 800, radiusBonus: 100, description: "100% larger explosions" }
      ]
    },
    // Path B: Heavier cannonballs
    pathB: {
      name: "Heavy Impact",
      description: "Cannonballs deal more damage",
      upgrades: [
        { level: 1, cost: 100, damageBonus: 25, stunChance: 0.1, description: "25% more damage, 10% stun chance" },
        { level: 2, cost: 200, damageBonus: 50, stunChance: 0.2, description: "50% more damage, 20% stun chance" },
        { level: 3, cost: 400, damageBonus: 75, stunChance: 0.3, description: "75% more damage, 30% stun chance" },
        { level: 4, cost: 800, damageBonus: 100, stunChance: 0.5, description: "100% more damage, 50% stun chance" }
      ]
    }
  },

  sniper: {
    // Path A: Critical hits
    pathA: {
      name: "Precision",
      description: "Increases critical hit chance and damage",
      upgrades: [
        { level: 1, cost: 125, critChanceBonus: 0.1, critMultiplierBonus: 0.5, description: "30% crit chance, 3x damage" },
        { level: 2, cost: 250, critChanceBonus: 0.2, critMultiplierBonus: 1, description: "40% crit chance, 3.5x damage" },
        { level: 3, cost: 500, critChanceBonus: 0.3, critMultiplierBonus: 1.5, description: "50% crit chance, 4x damage" },
        { level: 4, cost: 1000, critChanceBonus: 0.5, critMultiplierBonus: 2.5, description: "70% crit chance, 5x damage" }
      ]
    },
    // Path B: Long range
    pathB: {
      name: "Long Range",
      description: "Increases attack range and penetration",
      upgrades: [
        { level: 1, cost: 125, rangeBonus: 50, armorPiercing: 0.2, description: "+50 range, 20% armor piercing" },
        { level: 2, cost: 250, rangeBonus: 100, armorPiercing: 0.4, description: "+100 range, 40% armor piercing" },
        { level: 3, cost: 500, rangeBonus: 150, armorPiercing: 0.6, description: "+150 range, 60% armor piercing" },
        { level: 4, cost: 1000, rangeBonus: 200, armorPiercing: 1, description: "+200 range, 100% armor piercing" }
      ]
    }
  },

  freeze: {
    // Path A: Deep freeze
    pathA: {
      name: "Deep Freeze",
      description: "Increases slow effect and duration",
      upgrades: [
        { level: 1, cost: 150, slowFactorBonus: 0.1, durationBonus: 500, description: "60% slow for 2.5s" },
        { level: 2, cost: 300, slowFactorBonus: 0.15, durationBonus: 1000, description: "65% slow for 3s" },
        { level: 3, cost: 600, slowFactorBonus: 0.2, durationBonus: 1500, description: "70% slow for 3.5s" },
        { level: 4, cost: 1200, slowFactorBonus: 0.3, durationBonus: 2000, description: "80% slow for 4s" }
      ]
    },
    // Path B: Ice shards
    pathB: {
      name: "Ice Shards",
      description: "Adds damage and splash effect",
      upgrades: [
        { level: 1, cost: 150, damageBonus: 15, splashRadius: 20, description: "+15 damage, 20 splash radius" },
        { level: 2, cost: 300, damageBonus: 30, splashRadius: 30, description: "+30 damage, 30 splash radius" },
        { level: 3, cost: 600, damageBonus: 50, splashRadius: 40, description: "+50 damage, 40 splash radius" },
        { level: 4, cost: 1200, damageBonus: 80, splashRadius: 60, description: "+80 damage, 60 splash radius" }
      ]
    }
  },

  mortar: {
    // Path A: Artillery
    pathA: {
      name: "Artillery",
      description: "Increases damage and blast radius",
      upgrades: [
        { level: 1, cost: 175, damageBonus: 30, radiusBonus: 15, description: "+30 damage, +15 radius" },
        { level: 2, cost: 350, damageBonus: 60, radiusBonus: 30, description: "+60 damage, +30 radius" },
        { level: 3, cost: 700, damageBonus: 100, radiusBonus: 45, description: "+100 damage, +45 radius" },
        { level: 4, cost: 1400, damageBonus: 150, radiusBonus: 60, description: "+150 damage, +60 radius" }
      ]
    },
    // Path B: Cluster bombs
    pathB: {
      name: "Cluster Bombs",
      description: "Bombs split into smaller explosives",
      upgrades: [
        { level: 1, cost: 175, clusterCount: 3, clusterDamage: 0.3, description: "3 clusters, 30% damage each" },
        { level: 2, cost: 350, clusterCount: 4, clusterDamage: 0.4, description: "4 clusters, 40% damage each" },
        { level: 3, cost: 700, clusterCount: 5, clusterDamage: 0.5, description: "5 clusters, 50% damage each" },
        { level: 4, cost: 1400, clusterCount: 6, clusterDamage: 0.6, description: "6 clusters, 60% damage each" }
      ]
    }
  },

  laser: {
    // Path A: Focused beam
    pathA: {
      name: "Focused Beam",
      description: "Increases damage and penetration",
      upgrades: [
        { level: 1, cost: 200, damageBonus: 5, penetration: 1, description: "+5 damage, penetrates 1 enemy" },
        { level: 2, cost: 400, damageBonus: 10, penetration: 2, description: "+10 damage, penetrates 2 enemies" },
        { level: 3, cost: 800, damageBonus: 15, penetration: 3, description: "+15 damage, penetrates 3 enemies" },
        { level: 4, cost: 1600, damageBonus: 25, penetration: 5, description: "+25 damage, penetrates 5 enemies" }
      ]
    },
    // Path B: Overcharge
    pathB: {
      name: "Overcharge",
      description: "Beam gets stronger the longer it fires",
      upgrades: [
        { level: 1, cost: 200, rampUpRate: 0.1, maxRampUp: 0.5, description: "Damage increases by 10% per second, up to 50%" },
        { level: 2, cost: 400, rampUpRate: 0.15, maxRampUp: 1, description: "Damage increases by 15% per second, up to 100%" },
        { level: 3, cost: 800, rampUpRate: 0.2, maxRampUp: 1.5, description: "Damage increases by 20% per second, up to 150%" },
        { level: 4, cost: 1600, rampUpRate: 0.25, maxRampUp: 2, description: "Damage increases by 25% per second, up to 200%" }
      ]
    }
  },

  tesla: {
    // Path A: Chain lightning
    pathA: {
      name: "Chain Lightning",
      description: "Increases chain jumps and range",
      upgrades: [
        { level: 1, cost: 225, chainBonus: 1, chainRangeBonus: 20, description: "Chains to 4 targets, +20 chain range" },
        { level: 2, cost: 450, chainBonus: 2, chainRangeBonus: 40, description: "Chains to 5 targets, +40 chain range" },
        { level: 3, cost: 900, chainBonus: 3, chainRangeBonus: 60, description: "Chains to 6 targets, +60 chain range" },
        { level: 4, cost: 1800, chainBonus: 5, chainRangeBonus: 80, description: "Chains to 8 targets, +80 chain range" }
      ]
    },
    // Path B: Electrocution
    pathB: {
      name: "Electrocution",
      description: "Adds stun effect and damage over time",
      upgrades: [
        { level: 1, cost: 225, stunDuration: 500, dotDamage: 5, description: "0.5s stun, 5 damage over time" },
        { level: 2, cost: 450, stunDuration: 750, dotDamage: 10, description: "0.75s stun, 10 damage over time" },
        { level: 3, cost: 900, stunDuration: 1000, dotDamage: 15, description: "1s stun, 15 damage over time" },
        { level: 4, cost: 1800, stunDuration: 1500, dotDamage: 25, description: "1.5s stun, 25 damage over time" }
      ]
    }
  },

  flame: {
    // Path A: Inferno
    pathA: {
      name: "Inferno",
      description: "Increases burn damage and duration",
      upgrades: [
        { level: 1, cost: 250, burnDamageBonus: 5, burnDurationBonus: 1000, description: "10 burn damage for 4s" },
        { level: 2, cost: 500, burnDamageBonus: 10, burnDurationBonus: 2000, description: "15 burn damage for 5s" },
        { level: 3, cost: 1000, burnDamageBonus: 15, burnDurationBonus: 3000, description: "20 burn damage for 6s" },
        { level: 4, cost: 2000, burnDamageBonus: 25, burnDurationBonus: 4000, description: "30 burn damage for 7s" }
      ]
    },
    // Path B: Wildfire
    pathB: {
      name: "Wildfire",
      description: "Fire spreads to nearby enemies",
      upgrades: [
        { level: 1, cost: 250, spreadRadius: 30, spreadChance: 0.2, description: "20% chance to spread within 30 range" },
        { level: 2, cost: 500, spreadRadius: 40, spreadChance: 0.3, description: "30% chance to spread within 40 range" },
        { level: 3, cost: 1000, spreadRadius: 50, spreadChance: 0.4, description: "40% chance to spread within 50 range" },
        { level: 4, cost: 2000, spreadRadius: 60, spreadChance: 0.6, description: "60% chance to spread within 60 range" }
      ]
    }
  },

  missile: {
    // Path A: Heavy ordnance
    pathA: {
      name: "Heavy Ordnance",
      description: "Increases damage and explosion radius",
      upgrades: [
        { level: 1, cost: 275, damageBonus: 40, radiusBonus: 10, description: "+40 damage, +10 explosion radius" },
        { level: 2, cost: 550, damageBonus: 80, radiusBonus: 20, description: "+80 damage, +20 explosion radius" },
        { level: 3, cost: 1100, damageBonus: 120, radiusBonus: 30, description: "+120 damage, +30 explosion radius" },
        { level: 4, cost: 2200, damageBonus: 200, radiusBonus: 50, description: "+200 damage, +50 explosion radius" }
      ]
    },
    // Path B: Guided missiles
    pathB: {
      name: "Guided Missiles",
      description: "Missiles track targets and hit multiple times",
      upgrades: [
        { level: 1, cost: 275, trackingStrength: 0.2, multiHit: 1, description: "20% tracking, hits twice" },
        { level: 2, cost: 550, trackingStrength: 0.4, multiHit: 1, description: "40% tracking, hits twice" },
        { level: 3, cost: 1100, trackingStrength: 0.6, multiHit: 2, description: "60% tracking, hits 3 times" },
        { level: 4, cost: 2200, trackingStrength: 0.8, multiHit: 3, description: "80% tracking, hits 4 times" }
      ]
    }
  },

  poison: {
    // Path A: Toxic cloud
    pathA: {
      name: "Toxic Cloud",
      description: "Increases poison area and duration",
      upgrades: [
        { level: 1, cost: 300, radiusBonus: 15, durationBonus: 1000, description: "+15 radius, +1s duration" },
        { level: 2, cost: 600, radiusBonus: 30, durationBonus: 2000, description: "+30 radius, +2s duration" },
        { level: 3, cost: 1200, radiusBonus: 45, durationBonus: 3000, description: "+45 radius, +3s duration" },
        { level: 4, cost: 2400, radiusBonus: 60, durationBonus: 4000, description: "+60 radius, +4s duration" }
      ]
    },
    // Path B: Corrosive acid
    pathB: {
      name: "Corrosive Acid",
      description: "Poison reduces enemy armor and speed",
      upgrades: [
        { level: 1, cost: 300, armorReduction: 0.1, speedReduction: 0.1, description: "10% armor and speed reduction" },
        { level: 2, cost: 600, armorReduction: 0.2, speedReduction: 0.2, description: "20% armor and speed reduction" },
        { level: 3, cost: 1200, armorReduction: 0.3, speedReduction: 0.3, description: "30% armor and speed reduction" },
        { level: 4, cost: 2400, armorReduction: 0.5, speedReduction: 0.5, description: "50% armor and speed reduction" }
      ]
    }
  },

  vortex: {
    // Path A: Gravity well
    pathA: {
      name: "Gravity Well",
      description: "Increases pull strength and range",
      upgrades: [
        { level: 1, cost: 325, pullStrengthBonus: 10, rangeBonus: 20, description: "+10 pull strength, +20 range" },
        { level: 2, cost: 650, pullStrengthBonus: 20, rangeBonus: 40, description: "+20 pull strength, +40 range" },
        { level: 3, cost: 1300, pullStrengthBonus: 30, rangeBonus: 60, description: "+30 pull strength, +60 range" },
        { level: 4, cost: 2600, pullStrengthBonus: 50, rangeBonus: 80, description: "+50 pull strength, +80 range" }
      ]
    },
    // Path B: Black hole
    pathB: {
      name: "Black Hole",
      description: "Damages enemies while they're being pulled",
      upgrades: [
        { level: 1, cost: 325, damagePerSecond: 10, slowFactor: 0.1, description: "10 DPS, 10% slow effect" },
        { level: 2, cost: 650, damagePerSecond: 20, slowFactor: 0.2, description: "20 DPS, 20% slow effect" },
        { level: 3, cost: 1300, damagePerSecond: 30, slowFactor: 0.3, description: "30 DPS, 30% slow effect" },
        { level: 4, cost: 2600, damagePerSecond: 50, slowFactor: 0.5, description: "50 DPS, 50% slow effect" }
      ]
    }
  },
  archangel: {
    // Path A: Divine Wrath
    pathA: {
      name: "Divine Wrath",
      description: "Enhances the tower's offensive capabilities",
      upgrades: [
        { level: 1, cost: 350, damageBonus: 250, critChanceBonus: 0.1, description: "+50 damage, +10% crit chance" },
        { level: 2, cost: 700, damageBonus: 500, critChanceBonus: 0.15, description: "+100 damage, +15% crit chance" },
        { level: 3, cost: 1400, damageBonus: 800, critChanceBonus: 0.2, description: "+200 damage, +20% crit chance" },
        { level: 4, cost: 2800, damageBonus: 1700, critChanceBonus: 0.3, description: "+400 damage, +30% crit chance" }
      ]
    },
    // Path B: Blessing Aura
    pathB: {
      name: "Blessing Aura",
      description: "Enhances the tower's support capabilities",
      upgrades: [
        { level: 1, cost: 350, buffRadiusBonus: 50, buffDamageBonus: 0.1, description: "+50 buff radius, +10% damage buff" },
        { level: 2, cost: 700, buffRadiusBonus: 75, buffDamageBonus: 0.15, description: "+75 buff radius, +15% damage buff" },
        { level: 3, cost: 1400, buffRadiusBonus: 100, buffDamageBonus: 0.2, description: "+100 buff radius, +20% damage buff" },
        { level: 4, cost: 2800, buffRadiusBonus: 150, buffDamageBonus: 0.3, description: "+150 buff radius, +30% damage buff" }
      ]
    }
  }
};

// Map templates
const mapTemplates = [
  {
    id: "classic",
    name: "Classic",
    description: "A simple path from left to right",
    difficulty: "Easy",
    pathType: "single",
    terrainFeatures: "basic"
  },
  {
    id: "spiral",
    name: "Spiral",
    description: "A spiral path that winds toward the center",
    difficulty: "Medium",
    pathType: "single",
    terrainFeatures: "basic"
  },
  {
    id: "crossroads",
    name: "Crossroads",
    description: "Multiple paths that intersect",
    difficulty: "Hard",
    pathType: "multiple",
    terrainFeatures: "advanced"
  },
  {
    id: "islands",
    name: "Islands",
    description: "Separate islands connected by bridges",
    difficulty: "Hard",
    pathType: "multiple",
    terrainFeatures: "water"
  },
  {
    id: "maze",
    name: "Maze",
    description: "A complex maze with many twists and turns",
    difficulty: "Very Hard",
    pathType: "single",
    terrainFeatures: "walls"
  }
];
