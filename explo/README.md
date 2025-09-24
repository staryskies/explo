# Tower Defense Game

A browser-based tower defense game with a gacha system for unlocking towers and variants.

## Adding New Towers and Variants

This guide explains how to add new towers and variants to the game using the TowerHelper utility.

### Adding a New Tower

To add a new tower, use the `TowerHelper.addTower` method:

```javascript
TowerHelper.addTower('newTowerType', {
  name: "New Tower Name",
  description: "Description of the new tower",
  persistentCost: 500, // Cost to place the tower in the game
  ability: "Special ability description",
  range: 200,
  damage: 50,
  fireRate: 1.0,
  projectileSpeed: 10,
  canTargetFlying: true,
  color: '#FF5722', // Tower color
  tier: 'epic' // Tower rarity tier
});
```

### Adding Tower Upgrade Paths

To add upgrade paths for a tower, use the `TowerHelper.addTowerUpgradePath` method:

```javascript
TowerHelper.addTowerUpgradePath('newTowerType', 'pathA', {
  name: "Path A Name",
  description: "Path A description",
  upgrades: [
    { level: 1, cost: 100, damageBonus: 10, description: "+10 damage" },
    { level: 2, cost: 200, damageBonus: 20, description: "+20 damage" },
    { level: 3, cost: 400, damageBonus: 40, description: "+40 damage" },
    { level: 4, cost: 800, damageBonus: 80, description: "+80 damage" }
  ]
});

TowerHelper.addTowerUpgradePath('newTowerType', 'pathB', {
  name: "Path B Name",
  description: "Path B description",
  upgrades: [
    { level: 1, cost: 100, rangeBonus: 20, description: "+20 range" },
    { level: 2, cost: 200, rangeBonus: 40, description: "+40 range" },
    { level: 3, cost: 400, rangeBonus: 60, description: "+60 range" },
    { level: 4, cost: 800, rangeBonus: 80, description: "+80 range" }
  ]
});
```

### Adding a New Variant

To add a new tower variant, use the `TowerHelper.addVariant` method:

```javascript
TowerHelper.addVariant('newVariant', {
  name: "New Variant",
  description: "Description of the new variant",
  tier: "legendary", // Variant rarity tier
  bonusMultiplier: 1.5, // 50% damage bonus
  rangeBonus: 30, // +30 range bonus
  visualEffect: "special", // Visual effect name
  color: "#FFD700" // Variant color
});
```

### Unlocking Towers and Variants

To unlock a tower or variant for the player, use these methods:

```javascript
// Unlock a tower
TowerHelper.unlockTower('newTowerType');

// Unlock a variant for a specific tower
TowerHelper.unlockVariant('basic', 'newVariant');
```

### Tower Tiers

Towers can be assigned to the following tiers:
- common
- rare
- epic
- legendary
- mythic
- divine

### Variant Tiers

Variants can be assigned to the following tiers:
- common
- rare
- epic
- legendary
- divine

### Example: Adding a Complete Tower

Here's a complete example of adding a new tower with upgrade paths:

```javascript
// Add the tower
TowerHelper.addTower('lightning', {
  name: "Lightning Tower",
  description: "Strikes enemies with lightning bolts",
  persistentCost: 400,
  ability: "Chain Lightning",
  range: 180,
  damage: 30,
  fireRate: 0.8,
  projectileSpeed: 20,
  canTargetFlying: true,
  chainCount: 2, // Special property for chain lightning
  chainRange: 80, // Range for chain lightning jumps
  color: '#29B6F6',
  tier: 'epic'
});

// Add upgrade paths
TowerHelper.addTowerUpgradePath('lightning', 'pathA', {
  name: "Storm",
  description: "Increases chain lightning effectiveness",
  upgrades: [
    { level: 1, cost: 200, chainCount: 1, description: "+1 chain target" },
    { level: 2, cost: 400, chainCount: 1, description: "+1 chain target" },
    { level: 3, cost: 800, chainCount: 1, description: "+1 chain target" },
    { level: 4, cost: 1600, chainCount: 2, description: "+2 chain targets" }
  ]
});

TowerHelper.addTowerUpgradePath('lightning', 'pathB', {
  name: "Voltage",
  description: "Increases damage and range",
  upgrades: [
    { level: 1, cost: 200, damageBonus: 15, description: "+15 damage" },
    { level: 2, cost: 400, rangeBonus: 20, description: "+20 range" },
    { level: 3, cost: 800, damageBonus: 30, description: "+30 damage" },
    { level: 4, cost: 1600, rangeBonus: 40, description: "+40 range" }
  ]
});

// Unlock the tower for the player
TowerHelper.unlockTower('lightning');
```

## Utility Methods

The TowerHelper provides these additional utility methods:

- `TowerHelper.updateTower(towerType, towerData)` - Update an existing tower
- `TowerHelper.updateVariant(variantType, variantData)` - Update an existing variant
- `TowerHelper.getTowersOfTier(tier)` - Get all towers of a specific tier
- `TowerHelper.getVariantsOfTier(tier)` - Get all variants of a specific tier
