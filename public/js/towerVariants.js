/**
 * Tower variants for the tower defense game
 */
// Log that towerVariants.js is loaded
console.log('Tower variants loaded');

// Tower variant data
const towerVariants = {
  // Basic variants (common tier - 60%)
  normal: {
    name: "Normal",
    description: "Standard tower appearance",
    tier: "common",
    bonusMultiplier: 1.0, // No bonus
    visualEffect: "none",
    color: "#FFFFFF"
  },
  bronze: {
    name: "Bronze",
    description: "Bronze-plated tower with slight damage bonus",
    tier: "common",
    bonusMultiplier: 1.05, // 5% bonus
    visualEffect: "metallic",
    color: "#CD7F32"
  },
  silver: {
    name: "Silver",
    description: "Silver-plated tower with improved range",
    tier: "common",
    bonusMultiplier: 1.05, // 5% bonus
    rangeBonus: 10, // +10 range
    visualEffect: "metallic",
    color: "#C0C0C0"
  },

  // Elemental variants (rare tier - 25%)
  fire: {
    name: "Fire",
    description: "Infused with fire energy, adds burn damage",
    tier: "rare",
    bonusMultiplier: 1.1, // 10% bonus
    burnDamage: 5,
    burnDuration: 2000,
    visualEffect: "flames",
    color: "#FF5722"
  },
  ice: {
    name: "Ice",
    description: "Infused with ice energy, slows enemies",
    tier: "rare",
    bonusMultiplier: 1.1, // 10% bonus
    slowFactor: 0.2,
    slowDuration: 1500,
    visualEffect: "frost",
    color: "#00BCD4"
  },
  lightning: {
    name: "Lightning",
    description: "Infused with lightning energy, chance to chain to nearby enemies",
    tier: "rare",
    bonusMultiplier: 1.1, // 10% bonus
    chainChance: 0.2,
    chainCount: 2,
    chainRange: 80,
    visualEffect: "electricity",
    color: "#FFC107"
  },
  earth: {
    name: "Earth",
    description: "Infused with earth energy, chance to stun enemies",
    tier: "rare",
    bonusMultiplier: 1.1, // 10% bonus
    stunChance: 0.15,
    stunDuration: 500,
    visualEffect: "rocks",
    color: "#795548"
  },

  // Special variants (epic tier - 10%)
  shadow: {
    name: "Shadow",
    description: "Infused with shadow energy, can target shadow enemies",
    tier: "epic",
    bonusMultiplier: 1.2, // 20% bonus
    canTargetShadow: true,
    visualEffect: "darkness",
    color: "#424242"
  },
  crystal: {
    name: "Crystal",
    description: "Made of pure crystal, increases critical hit chance",
    tier: "epic",
    bonusMultiplier: 1.2, // 20% bonus
    critChance: 0.2,
    critMultiplier: 2.0,
    visualEffect: "sparkle",
    color: "#9C27B0"
  },
  void: {
    name: "Void",
    description: "Infused with void energy, ignores enemy armor",
    tier: "epic",
    bonusMultiplier: 1.2, // 20% bonus
    armorPiercing: 0.5, // 50% armor piercing
    visualEffect: "void",
    color: "#311B92"
  },

  // Ultimate variants (legendary tier - 5%)
  gold: {
    name: "Gold",
    description: "Pure gold tower with significantly increased stats",
    tier: "legendary",
    bonusMultiplier: 1.5, // 50% bonus
    rangeBonus: 30,
    visualEffect: "golden",
    color: "#FFD700"
  },

  // Divine tier variants (divine tier - 0.1%)
  divine: {
    name: "Divine",
    description: "Blessed by celestial light, this tower radiates pure divine energy",
    tier: "divine",
    bonusMultiplier: 3.0, // 300% bonus
    rangeBonus: 40,
    aoeRadius: 40,
    pierceCount: 2,
    critChance: 0.2,
    critMultiplier: 2.5,
    visualEffect: "divine",
    color: "#FFEB3B"
  },
  rainbow: {
    name: "Rainbow",
    description: "Infused with all elements, applies random effects",
    tier: "legendary",
    bonusMultiplier: 1.4, // 40% bonus
    randomEffectChance: 0.3,
    visualEffect: "rainbow",
    color: "#E91E63"
  },
  cosmic: {
    name: "Cosmic",
    description: "Infused with cosmic energy, devastating power",
    tier: "legendary",
    bonusMultiplier: 1.6, // 60% bonus
    pierceCount: 2,
    aoeRadius: 30,
    visualEffect: "cosmic",
    color: "#3F51B5"
  },
  holy: {
    name: "Holy",
    description: "Blessed by divine light, this tower radiates pure celestial energy",
    tier: "divine", // New ultra-rare tier
    bonusMultiplier: 5.0, // 500% bonus
    rangeBonus: 50,
    aoeRadius: 60,
    pierceCount: 3,
    critChance: 0.3,
    critMultiplier: 3.0,
    visualEffect: "holy",
    color: "#FFFFFF",
    specialAnimation: true
  },

  satanic: {
    name: "Satanic",
    description: "Infused with infernal power, this tower channels the darkness of the abyss",
    tier: "divine", // New ultra-rare tier
    bonusMultiplier: 5.0, // 500% bonus
    rangeBonus: 50,
    aoeRadius: 60,
    armorPiercing: 0.8, // 80% armor piercing
    burnDamage: 20,
    burnDuration: 5000,
    visualEffect: "satanic",
    color: "#990000",
    specialAnimation: true
  },


  // Special tower-specific variants
  poisonCloud: {
    name: "Poison Cloud",
    description: "Creates a deadly cloud of poison that damages all enemies in range",
    tier: "epic",
    bonusMultiplier: 1.3, // 30% bonus
    poisonDamage: 8,
    poisonDuration: 4000,
    aoeRadius: 40,
    visualEffect: "toxic",
    color: "#8BC34A"
  }
};
