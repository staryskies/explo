/**
 * Enemy types for the tower defense game
 */
// Log that enemyTypes.js is loaded
console.log('Enemy types loaded');

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
  },
  shadow: {
    name: "Shadow",
    health: 90,
    speed: 1.6,
    reward: 40,
    damage: 2,
    color: '#212121', // Very dark gray
    size: 24,
    flying: false,
    shadowEffect: true, // Can only be targeted by certain towers
    visibleToSpecialTowers: ['tesla', 'laser', 'flame']
  },
  boss: {
    name: "Boss",
    health: 1000,
    speed: 0.6,
    reward: 200,
    damage: 5,
    color: '#F44336',
    size: 40,
    flying: false,
    armor: 0.3
  }
};

// Boss types with their properties
const bossTypes = {
  // Original bosses
  megaTank: {
    name: "Mega Tank",
    baseHealth: 500,
    speed: 0.7,
    reward: 250,
    damage: 4,
    color: '#263238',
    size: 45,
    flying: false,
    armor: 0.5,
    abilities: [
      {
        name: "Regeneration",
        effect: "Regenerates health over time",
        healAmount: 5,
        interval: 2
      }
    ]
  },
  swarmLord: {
    name: "Swarm Lord",
    baseHealth: 400,
    speed: 1.0,
    reward: 300,
    damage: 3,
    color: '#FF9800',
    size: 40,
    flying: false,
    abilities: [
      {
        name: "Summon Minions",
        effect: "Spawns smaller enemies",
        spawnType: 'normal',
        spawnCount: 2,
        interval: 5
      }
    ]
  },
  voidWalker: {
    name: "Void Walker",
    baseHealth: 350,
    speed: 1.2,
    reward: 350,
    damage: 3,
    color: '#9C27B0',
    size: 38,
    flying: true,
    abilities: [
      {
        name: "Phase Shift",
        effect: "Becomes temporarily invulnerable",
        duration: 2,
        interval: 8
      }
    ]
  },

  // Difficulty-specific bosses
  easyBoss: {
    name: "Forest Guardian",
    baseHealth: 1500,
    speed: 0.6,
    reward: 150,
    damage: 3,
    color: '#4CAF50', // Green
    size: 40,
    flying: false,
    armor: 0.3,
    abilities: [
      {
        name: "Nature's Blessing",
        effect: "Heals itself over time",
        healAmount: 10,
        interval: 3
      }
    ],
    specialEffect: 'pulse'
  },

  mediumBoss: {
    name: "Frost Titan",
    baseHealth: 3000,
    speed: 0.5,
    reward: 250,
    damage: 4,
    color: '#2196F3', // Blue
    size: 45,
    flying: false,
    armor: 0.4,
    abilities: [
      {
        name: "Freezing Aura",
        effect: "Slows nearby towers",
        radius: 150,
        slowFactor: 0.5,
        duration: 3,
        interval: 5
      }
    ],
    specialEffect: 'ice'
  },

  hardBoss: {
    name: "Inferno Colossus",
    baseHealth: 5000,
    speed: 0.4,
    reward: 400,
    damage: 5,
    color: '#FF9800', // Orange
    size: 50,
    flying: false,
    armor: 0.5,
    abilities: [
      {
        name: "Flame Dash",
        effect: "Teleports forward on the path",
        distance: 200,
        interval: 8
      },
      {
        name: "Heat Wave",
        effect: "Damages nearby towers",
        radius: 120,
        damage: 20,
        interval: 10
      }
    ],
    specialEffect: 'fire'
  },

  nightmareBoss: {
    name: "Nightmare Devourer",
    baseHealth: 8000,
    speed: 0.35,
    reward: 600,
    damage: 8,
    color: '#F44336', // Red
    size: 55,
    flying: true,
    armor: 0.6,
    abilities: [
      {
        name: "Shadow Step",
        effect: "Teleports forward on the path",
        distance: 250,
        interval: 6
      },
      {
        name: "Summon Nightmares",
        effect: "Spawns smaller enemies",
        spawnType: 'fast',
        spawnCount: 3,
        interval: 7
      },
      {
        name: "Life Drain",
        effect: "Heals itself by damaging towers",
        radius: 150,
        damage: 15,
        healFactor: 2,
        interval: 5
      }
    ],
    specialEffect: 'shadow'
  },

  voidBoss: {
    name: "Void Entity",
    baseHealth: 8000, // Reduced from 12000
    speed: 0.35, // Increased from 0.3
    reward: 1500, // Increased from 1000
    damage: 8, // Reduced from 10
    color: '#9C27B0', // Purple
    size: 60,
    flying: true,
    armor: 0.5, // Reduced from 0.7
    abilities: [
      {
        name: "Reality Warp",
        effect: "Teleports forward on the path",
        distance: 200, // Reduced from 300
        interval: 8 // Increased from 5
      },
      {
        name: "Void Spawn",
        effect: "Spawns corrupted enemies",
        spawnType: 'armored',
        spawnCount: 2, // Reduced from 4
        interval: 10 // Increased from 6
      },
      {
        name: "Energy Absorption",
        effect: "Heals itself by disabling towers",
        radius: 150, // Reduced from 200
        disableDuration: 2, // Reduced from 3
        healAmount: 50, // Reduced from 100
        interval: 12 // Increased from 8
      },
      {
        name: "Dimensional Shift",
        effect: "Becomes invulnerable briefly",
        duration: 1.5, // Reduced from 2
        interval: 15 // Increased from 12
      }
    ],
    specialEffect: 'void',
    weaknesses: ['archangel', 'seraphim', 'demonLord'] // These towers deal extra damage to the Void Entity
  },

  // Void versions of other bosses (black versions)
  voidEasyBoss: {
    name: "Corrupted Forest Guardian",
    baseHealth: 3000,
    speed: 0.5,
    reward: 300,
    damage: 5,
    color: '#000000', // Black
    secondaryColor: '#4CAF50', // Green glow
    size: 40,
    flying: false,
    armor: 0.4,
    abilities: [
      {
        name: "Corrupted Blessing",
        effect: "Heals itself and nearby enemies",
        healAmount: 15,
        radius: 120,
        interval: 3
      },
      {
        name: "Nature's Wrath",
        effect: "Disables towers temporarily",
        radius: 150,
        disableDuration: 2,
        interval: 8
      }
    ],
    specialEffect: 'void'
  },

  voidMediumBoss: {
    name: "Corrupted Frost Titan",
    baseHealth: 5000,
    speed: 0.45,
    reward: 400,
    damage: 6,
    color: '#000000', // Black
    secondaryColor: '#2196F3', // Blue glow
    size: 45,
    flying: false,
    armor: 0.5,
    abilities: [
      {
        name: "Void Freeze",
        effect: "Freezes all towers briefly",
        radius: 250,
        freezeDuration: 1.5,
        interval: 10
      },
      {
        name: "Dimensional Shift",
        effect: "Teleports forward on the path",
        distance: 200,
        interval: 7
      }
    ],
    specialEffect: 'void'
  },

  voidHardBoss: {
    name: "Corrupted Inferno Colossus",
    baseHealth: 8000,
    speed: 0.4,
    reward: 600,
    damage: 8,
    color: '#000000', // Black
    secondaryColor: '#FF9800', // Orange glow
    size: 50,
    flying: false,
    armor: 0.6,
    abilities: [
      {
        name: "Void Flame",
        effect: "Damages all towers in range",
        radius: 200,
        damage: 30,
        interval: 8
      },
      {
        name: "Summon Void Flames",
        effect: "Spawns smaller enemies",
        spawnType: 'fast',
        spawnCount: 3,
        interval: 6
      }
    ],
    specialEffect: 'void'
  },

  voidNightmareBoss: {
    name: "Corrupted Nightmare Devourer",
    baseHealth: 12000,
    speed: 0.35,
    reward: 800,
    damage: 10,
    color: '#000000', // Black
    secondaryColor: '#F44336', // Red glow
    size: 55,
    flying: true,
    armor: 0.7,
    abilities: [
      {
        name: "Void Step",
        effect: "Teleports forward on the path",
        distance: 300,
        interval: 5
      },
      {
        name: "Summon Void Nightmares",
        effect: "Spawns corrupted enemies",
        spawnType: 'armored',
        spawnCount: 4,
        interval: 6
      },
      {
        name: "Void Drain",
        effect: "Disables towers and heals",
        radius: 180,
        disableDuration: 2,
        healAmount: 200,
        interval: 7
      }
    ],
    specialEffect: 'void'
  }
};
