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
    color: "#FFFFFF",
    dropRate: 60 // 60% drop rate
  },
  bronze: {
    name: "Bronze",
    description: "Bronze-plated tower with damage bonus",
    tier: "common",
    bonusMultiplier: 1.15, // 15% bonus
    visualEffect: "metallic",
    color: "#CD7F32",
    dropRate: 30 // 30% drop rate
  },
  silver: {
    name: "Silver",
    description: "Silver-plated tower with improved range",
    tier: "common",
    bonusMultiplier: 1.15, // 15% bonus
    rangeBonus: 20, // +20 range
    visualEffect: "metallic",
    color: "#C0C0C0",
    dropRate: 20 // 20% drop rate
  },

  // Elemental variants (rare tier - 25%)
  fire: {
    name: "Fire",
    description: "Infused with fire energy, adds burn damage",
    tier: "rare",
    bonusMultiplier: 1.3, // 30% bonus
    burnDamage: 15,
    burnDuration: 3000,
    visualEffect: "flames",
    color: "#FF5722",
    dropRate: 10 // 10% drop rate
  },
  ice: {
    name: "Ice",
    description: "Infused with ice energy, slows enemies",
    tier: "rare",
    bonusMultiplier: 1.3, // 30% bonus
    slowFactor: 0.4,
    slowDuration: 3000,
    visualEffect: "frost",
    color: "#00BCD4",
    dropRate: 10 // 10% drop rate
  },
  lightning: {
    name: "Lightning",
    description: "Infused with lightning energy, chance to chain to nearby enemies",
    tier: "rare",
    bonusMultiplier: 1.3, // 30% bonus
    chainChance: 0.4,
    chainCount: 3,
    chainRange: 120,
    visualEffect: "electricity",
    color: "#FFC107",
    dropRate: 10 // 10% drop rate
  },
  earth: {
    name: "Earth",
    description: "Infused with earth energy, chance to stun enemies",
    tier: "rare",
    bonusMultiplier: 1.3, // 30% bonus
    stunChance: 0.3,
    stunDuration: 1000,
    visualEffect: "rocks",
    color: "#795548",
    dropRate: 10 // 10% drop rate
  },

  // Special variants (epic tier - 10%)
  shadow: {
    name: "Shadow",
    description: "Infused with shadow energy, can target shadow enemies",
    tier: "epic",
    bonusMultiplier: 1.5, // 50% bonus
    canTargetShadow: true,
    visualEffect: "darkness",
    color: "#424242",
    dropRate: 5 // 5% drop rate
  },
  crystal: {
    name: "Crystal",
    description: "Made of pure crystal, increases critical hit chance",
    tier: "epic",
    bonusMultiplier: 1.5, // 50% bonus
    critChance: 0.3,
    critMultiplier: 2.5,
    visualEffect: "sparkle",
    color: "#9C27B0",
    dropRate: 5 // 5% drop rate
  },
  void: {
    name: "Void",
    description: "Infused with void energy, ignores enemy armor",
    tier: "epic",
    bonusMultiplier: 1.5, // 50% bonus
    armorPiercing: 0.7, // 70% armor piercing
    visualEffect: "void",
    color: "#311B92",
    dropRate: 5 // 5% drop rate
  },

  // Ultimate variants (legendary tier - 5%)
  gold: {
    name: "Gold",
    description: "Pure gold tower with significantly increased stats",
    tier: "legendary",
    bonusMultiplier: 2.0, // 100% bonus
    rangeBonus: 50,
    fireRateBonus: 0.3, // 30% faster firing
    visualEffect: "golden",
    color: "#FFD700",
    dropRate: 2 // 2% drop rate
  },

  // Divine tier variants (divine tier - 0.1%)
  divine: {
    name: "Divine",
    description: "Blessed by celestial light, this tower radiates pure divine energy",
    tier: "divine",
    bonusMultiplier: 5.0, // 500% bonus
    rangeBonus: 80,
    fireRateBonus: 0.5, // 50% faster firing
    aoeRadius: 60,
    pierceCount: 3,
    critChance: 0.4,
    critMultiplier: 3.0,
    visualEffect: "divine",
    color: "#FFEB3B",
    dropRate: 0.1 // 0.1% drop rate
  },
  rainbow: {
    name: "Rainbow",
    description: "Infused with all elements, applies random effects",
    tier: "legendary",
    bonusMultiplier: 2.0, // 100% bonus
    randomEffectChance: 0.5, // 50% chance for random effect
    visualEffect: "rainbow",
    color: "#E91E63",
    dropRate: 1 // 1% drop rate
  },
  cosmic: {
    name: "Cosmic",
    description: "Infused with cosmic energy, devastating power",
    tier: "legendary",
    bonusMultiplier: 2.2, // 120% bonus
    pierceCount: 3,
    aoeRadius: 50,
    visualEffect: "cosmic",
    color: "#3F51B5",
    dropRate: 1 // 1% drop rate
  },
  holy: {
    name: "Holy",
    description: "Blessed by divine light, this tower radiates pure celestial energy",
    tier: "divine", // New ultra-rare tier
    bonusMultiplier: 10.0, // 1000% bonus
    rangeBonus: 100,
    fireRateBonus: 1.0, // 100% faster firing
    aoeRadius: 80,
    pierceCount: 5,
    critChance: 0.5,
    critMultiplier: 4.0,
    visualEffect: "holy",
    color: "#FFFFFF",
    specialAnimation: true,
    dropRate: 0.1 // 0.1% drop rate
  },

  satanic: {
    name: "Satanic",
    description: "Infused with infernal power, this tower channels the darkness of the abyss",
    tier: "divine", // New ultra-rare tier
    bonusMultiplier: 10.0, // 1000% bonus
    rangeBonus: 100,
    fireRateBonus: 1.0, // 100% faster firing
    aoeRadius: 80,
    armorPiercing: 1.0, // 100% armor piercing
    burnDamage: 50,
    burnDuration: 8000,
    visualEffect: "satanic",
    color: "#990000",
    specialAnimation: true,
    dropRate: 0.1 // 0.1% drop rate
  },

  hell: {
    name: "Hell",
    description: "Forged in the depths of Hell, this tower unleashes devastating infernal power",
    tier: "divine", // Divine tier
    bonusMultiplier: 12.0, // 1200% bonus
    rangeBonus: 120,
    fireRateBonus: 1.2, // 120% faster firing
    aoeRadius: 100,
    armorPiercing: 1.0, // 100% armor piercing
    burnDamage: 80,
    burnDuration: 10000,
    chainCount: 5,
    chainRange: 200,
    visualEffect: "hell",
    color: "#FF3300",
    specialAnimation: true,
    dropRate: 0.05 // 0.05% drop rate - even rarer than other divine variants
  },


  // Special tower-specific variants
  poisonCloud: {
    name: "Poison Cloud",
    description: "Creates a deadly cloud of poison that damages all enemies in range",
    tier: "epic",
    bonusMultiplier: 1.8, // 80% bonus
    poisonDamage: 20,
    poisonDuration: 6000,
    aoeRadius: 60,
    visualEffect: "toxic",
    color: "#8BC34A",
    dropRate: 3 // 3% drop rate
  }
};
