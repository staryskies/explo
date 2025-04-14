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
  }
};
