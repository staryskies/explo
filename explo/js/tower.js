/**
 * Tower class for the tower defense game
 */
// Log that tower.js is loaded
console.log('Tower class loaded');

class Tower {
  constructor(x, y, towerKey = 'basic_normal', gridX, gridY) {
    this.x = x;
    this.y = y;
    this.gridX = gridX; // Store grid coordinates for tower removal
    this.gridY = gridY;

    // Parse the combined tower key (format: "towerType_variantType")
    const [type, variant] = towerKey.split('_');
    this.type = type;
    this.variant = variant || 'normal'; // Default to normal if no variant
    this.towerKey = towerKey; // Store the combined key

    this.level = 1;
    this.target = null;
    this.angle = 0;
    this.lastShot = 0;

    // Get the map's tile size for scaling
    this.tileSize = window.game?.map?.tileSize || 40; // Default to 40 if not available

    // Upgrade paths
    this.pathALevel = 0;
    this.pathBLevel = 0;

    // Animation properties
    this.recoilAnimation = 0;
    this.animationTime = 0;
    this.animationFrame = 0;

    // Set properties based on tower type
    this.setPropertiesByType();

    // Initialize special properties
    this.initializeSpecialProperties();

    // Apply variant-specific properties if a variant is specified
    if (this.variant) {
      this.applyVariantProperties();
    }
  }

  // Set tower properties based on type using towerStats
  setPropertiesByType() {
    // Get stats from towerData.js
    const stats = towerStats[this.type];

    if (stats) {
      this.name = stats.name || this.type.charAt(0).toUpperCase() + this.type.slice(1) + ' Tower';
      this.description = stats.description || '';
      this.range = stats.range || 200;
      this.damage = stats.damage || 25;
      this.fireRate = stats.fireRate || 1; // Shots per second
      this.projectileSpeed = stats.projectileSpeed || 12;
      this.cost = stats.persistentCost || 50;
      this.ability = stats.ability || 'Basic shot';
      this.color = stats.color || '#4CAF50';
      this.canTargetFlying = stats.canTargetFlying || false;

      // Special properties
      if (stats.aoeRadius) this.aoeRadius = stats.aoeRadius;
      if (stats.slowFactor) this.slowFactor = stats.slowFactor;
      if (stats.slowDuration) this.slowDuration = stats.slowDuration;
      if (stats.critChance) this.critChance = stats.critChance;
      if (stats.critMultiplier) this.critMultiplier = stats.critMultiplier;
      if (stats.chainCount) this.chainCount = stats.chainCount;
      if (stats.chainRange) this.chainRange = stats.chainRange;
      if (stats.burnDuration) this.burnDuration = stats.burnDuration;
      if (stats.burnDamage) this.burnDamage = stats.burnDamage;
      if (stats.poisonDuration) this.poisonDuration = stats.poisonDuration;
      if (stats.poisonDamage) this.poisonDamage = stats.poisonDamage;
      if (stats.pullStrength) this.pullStrength = stats.pullStrength;
      if (stats.pullDuration) this.pullDuration = stats.pullDuration;
    } else {
      // Default values if tower type not found
      this.name = this.type.charAt(0).toUpperCase() + this.type.slice(1) + ' Tower';
      this.range = 200;
      this.damage = 25;
      this.fireRate = 1;
      this.projectileSpeed = 12;
      this.cost = 50;
      this.ability = 'Basic shot';
      this.color = '#4CAF50';
      this.canTargetFlying = false;
    }

    // Calculate cooldown in milliseconds
    this.cooldown = 1000 / this.fireRate;
  }

  // Initialize special properties based on tower type
  initializeSpecialProperties() {
    // Initialize properties for special abilities
    switch (this.type) {
      case 'archer':
        this.extraShots = 1; // Fires 2 arrows by default
        this.pierceCount = 0;
        break;
      case 'sniper':
        this.armorPiercing = 0;
        break;
      case 'laser':
        this.penetration = 0;
        this.rampUpDamage = 0;
        this.currentRampUp = 0;
        break;
      case 'tesla':
        this.stunDuration = 0;
        this.dotDamage = 0;
        break;
      case 'flamethrower':
        this.spreadRadius = 0;
        this.spreadChance = 0;
        break;
      case 'missile':
        this.trackingStrength = 0;
        this.multiHit = 0;
        break;
      case 'poison':
        this.armorReduction = 0;
        this.speedReduction = 0;
        break;
      case 'vortex':
        this.damagePerSecond = 0;
        this.vortexSlowFactor = 0;
        break;
      case 'archangel':
        this.buffedTowers = [];
        this.lastBuffTime = 0;
        this.buffInterval = 1000; // Apply buffs every second
        this.projectileType = 'divine';
        this.buffRadius = 250; // Radius for buffing nearby towers
        this.buffDamage = 0.4; // 40% damage buff
        this.buffRange = 0.3; // 30% range buff
        this.aoeRadius = 100; // Area damage radius
        this.pierceCount = 6; // Pierces through multiple enemies
        this.chainCount = 5; // Can chain to nearby enemies
        this.chainRange = 350; // Chain range
        this.lastSpecialAbilityTime = 0;
        this.specialAbilityCooldown = 10000; // 10 seconds cooldown
        break;
      case 'seraphim':
        this.buffedTowers = [];
        this.lastBuffTime = 0;
        this.buffInterval = 1000; // Apply buffs every second
        this.projectileType = 'light';
        this.buffRadius = 200; // Radius for buffing nearby towers
        this.buffDamage = 0.3; // 30% damage buff
        this.aoeRadius = 120; // Area damage radius
        this.pierceCount = 8; // Pierces through multiple enemies
        this.burnDamage = 200; // Damage per second
        this.burnDuration = 5000; // 5 seconds
        this.lastSpecialAbilityTime = 0;
        this.specialAbilityCooldown = 15000; // 15 seconds cooldown
        this.specialAbilityDamage = 300; // Damage to all enemies
        break;
      case 'demonLord':
        this.summonCount = 3; // Summons 3 demon minions
        this.summonDuration = 10000; // 10 seconds
        this.summonDamage = 200; // Damage per demon
        this.fearChance = 0.5; // 50% chance to cause fear
        this.fearDuration = 3000; // 3 seconds
        this.lastSpecialAbilityTime = 0;
        this.specialAbilityCooldown = 20000; // 20 seconds cooldown
        this.specialAbilityDamage = 500; // Damage to enemies in the pentagram
        this.specialAbilityDuration = 5000; // 5 seconds duration
        this.projectileType = 'fire';
        break;
      case 'cannon':
      case 'mortar':
        this.stunChance = 0;
        this.clusterCount = 0;
        this.clusterDamage = 0;
        break;
    }
  }

  // Apply variant-specific properties based on the tower's variant
  applyVariantProperties() {
    if (!this.variant || this.variant === this.type) return;

    // Get variant data from towerVariants.js
    const variantData = towerVariants[this.variant];
    if (variantData) {
      // Apply bonus multiplier from variant data
      if (variantData.bonusMultiplier) {
        this.damage = Math.floor(this.damage * variantData.bonusMultiplier);
        console.log(`Applied ${variantData.name} variant multiplier: ${variantData.bonusMultiplier}x damage`);
      }

      // Apply range bonus from variant data
      if (variantData.rangeBonus) {
        this.range += variantData.rangeBonus;
        console.log(`Applied ${variantData.name} variant range bonus: +${variantData.rangeBonus}`);
      }

      // Apply fire rate bonus from variant data
      if (variantData.fireRateBonus) {
        this.fireRate *= (1 + variantData.fireRateBonus);
        this.cooldown = 1000 / this.fireRate;
        console.log(`Applied ${variantData.name} variant fire rate bonus: +${variantData.fireRateBonus * 100}%`);
      }

      // Store variant display info
      this.variantName = variantData.name;
      this.variantColor = variantData.color || '#FFFFFF';
      this.variantEffect = variantData.visualEffect || 'none';
      this.variantTier = variantData.tier || 'common';
    }

    // Define variant colors and effects
    const variantColors = {
      // Basic tower variants
      gold: '#FFD700',
      crystal: '#88CCEE',
      shadow: '#444444',

      // Archer tower variants
      ice: '#29B6F6',
      fire: '#F44336',
      poison: '#4CAF50',
      dragon: '#FF5722',

      // Cannon tower variants
      double: '#795548',
      heavy: '#5D4037',
      explosive: '#D84315',

      // Sniper tower variants
      rapid: '#2196F3',
      stealth: '#37474F',
      railgun: '#0D47A1',

      // Freeze tower variants
      cryo: '#00BCD4',
      blizzard: '#B3E5FC',
      temporal: '#4FC3F7',

      // Other tower variants
      magma: '#E91E63',
      plasma: '#9C27B0',
      quantum: '#673AB7',
      storm: '#FFC107',
      inferno: '#FF9800',
      guided: '#607D8B',
      toxic: '#8BC34A',

      // Special tower-specific variants
      poisonCloud: '#8BC34A',

      // Elemental variants from towerVariants.js
      lightning: '#FFC107',
      earth: '#795548',

      // Special variants from towerVariants.js
      rainbow: '#E91E63',
      cosmic: '#3F51B5',
      void: '#311B92'
    };

    // Apply variant color
    if (variantColors[this.variant]) {
      this.variantColor = variantColors[this.variant];
    }

    // Apply variant-specific stat boosts
    switch (this.variant) {
      // Basic tower variants
      case 'gold':
        this.damage *= 1.2; // 20% more damage
        this.projectileType = 'gold';
        break;
      case 'crystal':
        this.range *= 1.15; // 15% more range
        this.projectileType = 'crystal';
        this.critChance = (this.critChance || 0) + 0.1; // 10% crit chance
        break;
      case 'shadow':
        this.fireRate *= 1.2; // 20% faster firing
        this.cooldown = 1000 / this.fireRate;
        this.projectileType = 'shadow';
        this.canTargetShadow = true;
        break;

      // Archer tower variants
      case 'ice':
        this.projectileType = 'ice';
        this.slowFactor = 0.2;
        this.slowDuration = 1000;
        break;
      case 'fire':
        this.projectileType = 'fire';
        this.burnDamage = 5;
        this.burnDuration = 2000;
        break;
      case 'poison':
        this.projectileType = 'poison';
        this.poisonDamage = 3;
        this.poisonDuration = 3000;
        break;
      case 'dragon':
        this.extraShots += 1; // One more arrow
        this.projectileType = 'dragon';
        this.burnDamage = 3;
        this.burnDuration = 1500;
        break;

      // Cannon tower variants
      case 'double':
        this.extraShots = 1; // Fires two cannonballs
        this.projectileType = 'double';
        break;
      case 'heavy':
        this.damage *= 1.5; // 50% more damage
        this.fireRate *= 0.8; // 20% slower firing
        this.cooldown = 1000 / this.fireRate;
        this.projectileType = 'heavy';
        this.stunChance = 0.15; // 15% chance to stun
        this.stunDuration = 500; // 0.5 second stun
        break;
      case 'explosive':
        this.aoeRadius *= 1.3; // 30% larger explosion radius
        this.projectileType = 'explosive';
        break;

      // Sniper tower variants
      case 'rapid':
        this.fireRate *= 1.5; // 50% faster firing
        this.cooldown = 1000 / this.fireRate;
        this.damage *= 0.8; // 20% less damage
        this.projectileType = 'rapid';
        break;
      case 'stealth':
        this.critChance = (this.critChance || 0) + 0.2; // +20% crit chance
        this.projectileType = 'stealth';
        break;
      case 'railgun':
        this.damage *= 1.8; // 80% more damage
        this.fireRate *= 0.6; // 40% slower firing
        this.cooldown = 1000 / this.fireRate;
        this.projectileSpeed *= 2; // Much faster projectiles
        this.projectileType = 'railgun';
        this.pierceCount = 2; // Pierce through 2 enemies
        break;

      // Special tower-specific variants
      case 'poisonCloud':
        this.projectileType = 'poisonCloud';
        this.aoeRadius = (this.aoeRadius || 40) * 1.3; // 30% larger poison radius
        this.poisonDamage = (this.poisonDamage || 0) + 8; // +8 poison damage
        this.poisonDuration = (this.poisonDuration || 0) + 4000; // +4s poison duration
        break;

      // Elemental variants from towerVariants.js
      case 'fire':
        this.projectileType = 'fire';
        this.burnDamage = (this.burnDamage || 0) + 5;
        this.burnDuration = (this.burnDuration || 0) + 2000;
        break;
      case 'ice':
        this.projectileType = 'ice';
        this.slowFactor = (this.slowFactor || 0) + 0.2;
        this.slowDuration = (this.slowDuration || 0) + 1500;
        break;
      case 'lightning':
        this.projectileType = 'lightning';
        this.chainChance = (this.chainChance || 0) + 0.2;
        this.chainCount = (this.chainCount || 0) + 2;
        this.chainRange = (this.chainRange || 0) + 80;
        break;
      case 'earth':
        this.projectileType = 'earth';
        this.stunChance = (this.stunChance || 0) + 0.15;
        this.stunDuration = (this.stunDuration || 0) + 500;
        break;

      // Special variants from towerVariants.js
      case 'rainbow':
        this.projectileType = 'rainbow';
        this.randomEffectChance = 0.3; // 30% chance for random effect
        this.damage *= 1.4; // 40% more damage
        break;
      case 'cosmic':
        this.projectileType = 'cosmic';
        this.pierceCount = 2;
        this.aoeRadius = (this.aoeRadius || 0) + 30;
        this.damage *= 1.6; // 60% more damage
        break;
      case 'void':
        this.projectileType = 'void';
        this.armorPiercing = 0.5; // 50% armor piercing
        this.damage *= 1.2; // 20% more damage
        break;
    }

    console.log(`Applied ${this.variant} variant to ${this.type} tower`);
  }

  // Upgrade the tower along a specific path
  upgrade(path, level) {
    // Get upgrade data from towerUpgrades
    if (!towerUpgrades[this.type]) {
      console.error(`No upgrade data found for tower type: ${this.type}`);
      return false;
    }

    const pathData = path === 'a' ? towerUpgrades[this.type].pathA : towerUpgrades[this.type].pathB;
    if (!pathData) {
      console.error(`No path ${path} found for tower type: ${this.type}`);
      return false;
    }

    // Check if the requested level is valid
    if (level < 1 || level > 4) {
      console.error(`Invalid upgrade level: ${level}`);
      return false;
    }

    // Check if we're trying to upgrade to the correct next level
    const currentPathLevel = path === 'a' ? this.pathALevel : this.pathBLevel;
    if (level !== currentPathLevel + 1) {
      console.error(`Cannot skip levels. Current: ${currentPathLevel}, Requested: ${level}`);
      return false;
    }

    // Get the upgrade data for this level
    const upgradeData = pathData.upgrades[level - 1];
    if (!upgradeData) {
      console.error(`No upgrade data found for level ${level} on path ${path}`);
      return false;
    }

    // Apply the upgrade
    this.applyUpgrade(path, level, upgradeData);

    // Update the path level
    if (path === 'a') {
      this.pathALevel = level;
    } else {
      this.pathBLevel = level;
    }

    // Increment overall tower level
    this.level++;

    return true;
  }

  // Apply upgrade effects based on the upgrade data
  applyUpgrade(path, level, upgradeData) {
    console.log(`Applying ${this.type} tower upgrade: Path ${path}, Level ${level}`);

    // Apply common upgrades
    if (upgradeData.damageBonus) {
      const bonus = upgradeData.damageBonus / 100; // Convert percentage to multiplier
      this.damage += Math.floor(this.damage * bonus);
      console.log(`Damage increased to ${this.damage}`);
    }

    if (upgradeData.rangeBonus) {
      this.range += upgradeData.rangeBonus;
      console.log(`Range increased to ${this.range}`);
    }

    if (upgradeData.fireRateBonus) {
      const bonus = upgradeData.fireRateBonus / 100; // Convert percentage to multiplier
      this.fireRate *= (1 + bonus);
      this.cooldown = 1000 / this.fireRate;
      console.log(`Fire rate increased to ${this.fireRate.toFixed(2)} shots/sec`);
    }

    // Apply special upgrades based on tower type
    switch (this.type) {
      case 'basic':
        // Basic tower upgrades handled by common upgrades
        break;

      case 'archer':
        if (upgradeData.extraShots) {
          this.extraShots += upgradeData.extraShots;
          console.log(`Extra shots increased to ${this.extraShots}`);
        }
        if (upgradeData.pierceCount) {
          this.pierceCount += upgradeData.pierceCount;
          console.log(`Pierce count increased to ${this.pierceCount}`);
        }
        break;

      case 'cannon':
      case 'mortar':
        if (upgradeData.radiusBonus) {
          const bonus = upgradeData.radiusBonus / 100; // Convert percentage to multiplier
          this.aoeRadius += Math.floor(this.aoeRadius * bonus);
          console.log(`AOE radius increased to ${this.aoeRadius}`);
        }
        if (upgradeData.stunChance) {
          this.stunChance += upgradeData.stunChance;
          console.log(`Stun chance increased to ${this.stunChance * 100}%`);
        }
        if (upgradeData.clusterCount) {
          this.clusterCount = upgradeData.clusterCount;
          this.clusterDamage = upgradeData.clusterDamage;
          console.log(`Cluster bombs: ${this.clusterCount} at ${this.clusterDamage * 100}% damage`);
        }
        break;

      case 'sniper':
        if (upgradeData.critChanceBonus) {
          this.critChance += upgradeData.critChanceBonus;
          console.log(`Crit chance increased to ${this.critChance * 100}%`);
        }
        if (upgradeData.critMultiplierBonus) {
          this.critMultiplier += upgradeData.critMultiplierBonus;
          console.log(`Crit multiplier increased to ${this.critMultiplier}x`);
        }
        if (upgradeData.armorPiercing) {
          this.armorPiercing += upgradeData.armorPiercing;
          console.log(`Armor piercing increased to ${this.armorPiercing * 100}%`);
        }
        break;

      case 'freeze':
        if (upgradeData.slowFactorBonus) {
          this.slowFactor += upgradeData.slowFactorBonus;
          console.log(`Slow factor increased to ${this.slowFactor * 100}%`);
        }
        if (upgradeData.durationBonus) {
          this.slowDuration += upgradeData.durationBonus;
          console.log(`Slow duration increased to ${this.slowDuration}ms`);
        }
        if (upgradeData.splashRadius) {
          this.splashRadius = upgradeData.splashRadius;
          console.log(`Ice splash radius set to ${this.splashRadius}`);
        }
        break;

      case 'laser':
        if (upgradeData.penetration) {
          this.penetration += upgradeData.penetration;
          console.log(`Penetration increased to ${this.penetration}`);
        }
        if (upgradeData.rampUpRate) {
          this.rampUpRate = upgradeData.rampUpRate;
          this.maxRampUp = upgradeData.maxRampUp;
          console.log(`Ramp up: ${this.rampUpRate * 100}% per second, max ${this.maxRampUp * 100}%`);
        }
        break;

      case 'tesla':
        if (upgradeData.chainBonus) {
          this.chainCount += upgradeData.chainBonus;
          console.log(`Chain count increased to ${this.chainCount}`);
        }
        if (upgradeData.chainRangeBonus) {
          this.chainRange += upgradeData.chainRangeBonus;
          console.log(`Chain range increased to ${this.chainRange}`);
        }
        if (upgradeData.stunDuration) {
          this.stunDuration += upgradeData.stunDuration;
          console.log(`Stun duration increased to ${this.stunDuration}ms`);
        }
        if (upgradeData.dotDamage) {
          this.dotDamage += upgradeData.dotDamage;
          console.log(`DOT damage increased to ${this.dotDamage}`);
        }
        break;

      case 'flamethrower':
        if (upgradeData.burnDamageBonus) {
          this.burnDamage += upgradeData.burnDamageBonus;
          console.log(`Burn damage increased to ${this.burnDamage}`);
        }
        if (upgradeData.burnDurationBonus) {
          this.burnDuration += upgradeData.burnDurationBonus;
          console.log(`Burn duration increased to ${this.burnDuration}ms`);
        }
        if (upgradeData.spreadRadius) {
          this.spreadRadius = upgradeData.spreadRadius;
          this.spreadChance = upgradeData.spreadChance;
          console.log(`Spread: ${this.spreadChance * 100}% chance within ${this.spreadRadius} range`);
        }
        break;

      case 'missile':
        if (upgradeData.trackingStrength) {
          this.trackingStrength = upgradeData.trackingStrength;
          console.log(`Tracking strength increased to ${this.trackingStrength * 100}%`);
        }
        if (upgradeData.multiHit) {
          this.multiHit = upgradeData.multiHit;
          console.log(`Multi-hit increased to ${this.multiHit + 1} hits`);
        }
        break;

      case 'poison':
        if (upgradeData.radiusBonus) {
          this.aoeRadius += upgradeData.radiusBonus;
          console.log(`Poison radius increased to ${this.aoeRadius}`);
        }
        if (upgradeData.durationBonus) {
          this.poisonDuration += upgradeData.durationBonus;
          console.log(`Poison duration increased to ${this.poisonDuration}ms`);
        }
        if (upgradeData.armorReduction) {
          this.armorReduction = upgradeData.armorReduction;
          this.speedReduction = upgradeData.speedReduction;
          console.log(`Reductions: ${this.armorReduction * 100}% armor, ${this.speedReduction * 100}% speed`);
        }
        break;

      case 'vortex':
        if (upgradeData.pullStrengthBonus) {
          this.pullStrength += upgradeData.pullStrengthBonus;
          console.log(`Pull strength increased to ${this.pullStrength}`);
        }
        if (upgradeData.damagePerSecond) {
          this.damagePerSecond = upgradeData.damagePerSecond;
          this.vortexSlowFactor = upgradeData.slowFactor;
          console.log(`Vortex: ${this.damagePerSecond} DPS, ${this.vortexSlowFactor * 100}% slow`);
        }
        break;
    }
  }

  // Get the upgrade cost for a specific path and level
  getUpgradeCost(path, level) {
    if (!towerUpgrades[this.type]) return Infinity;

    const pathData = path === 'a' ? towerUpgrades[this.type].pathA : towerUpgrades[this.type].pathB;
    if (!pathData) return Infinity;

    const upgradeData = pathData.upgrades[level - 1];
    if (!upgradeData) return Infinity;

    return upgradeData.cost;
  }

  // Get the sell value of the tower
  getSellValue() {
    // Base cost
    let value = Math.floor(this.cost * 0.7); // 70% of the original cost

    // Add value from path A upgrades
    for (let i = 0; i < this.pathALevel; i++) {
      const upgradeCost = towerUpgrades[this.type]?.pathA?.upgrades[i]?.cost || 0;
      value += Math.floor(upgradeCost * 0.5); // 50% of upgrade costs
    }

    // Add value from path B upgrades
    for (let i = 0; i < this.pathBLevel; i++) {
      const upgradeCost = towerUpgrades[this.type]?.pathB?.upgrades[i]?.cost || 0;
      value += Math.floor(upgradeCost * 0.5); // 50% of upgrade costs
    }

    return value;
  }

  // Update tower state
  update(currentTime, enemies, projectiles, effects) {
    // Update special abilities based on tower type
    switch (this.type) {
      case 'archangel':
        // Update buff effect for nearby towers
        if (currentTime - this.lastBuffTime >= this.buffInterval) {
          this.applyBuffToNearbyTowers();
          this.lastBuffTime = currentTime;
        }

        // Check if special ability is ready
        if (this.lastSpecialAbilityTime === 0 || currentTime - this.lastSpecialAbilityTime >= this.specialAbilityCooldown) {
          // Divine Judgment - Damage all enemies on screen
          if (enemies && enemies.length > 0) {
            // Create divine light effect
            if (effects) {
              effects.push({
                type: 'divineJudgment',
                x: this.x,
                y: this.y,
                radius: 0,
                maxRadius: 1000,
                duration: 1000,
                startTime: currentTime,
                color: '#FFEB3B'
              });
            }

            // Apply damage to all enemies
            enemies.forEach(enemy => {
              if (enemy.alive) {
                enemy.takeDamage(this.damage * 0.5); // 50% of normal damage to all enemies
              }
            });

            this.lastSpecialAbilityTime = currentTime;
          }
        }
        break;

      case 'seraphim':
        // Update buff effect for nearby towers
        if (currentTime - this.lastBuffTime >= this.buffInterval) {
          this.applyBuffToNearbyTowers();
          this.lastBuffTime = currentTime;
        }

        // Check if special ability is ready
        if (this.lastSpecialAbilityTime === 0 || currentTime - this.lastSpecialAbilityTime >= this.specialAbilityCooldown) {
          // Divine Radiance - Damage all enemies on screen
          if (enemies && enemies.length > 0) {
            // Create divine light effect
            if (effects) {
              effects.push({
                type: 'divineRadiance',
                x: this.x,
                y: this.y,
                radius: 0,
                maxRadius: 1000,
                duration: 1500,
                startTime: currentTime,
                color: '#FFFFFF'
              });
            }

            // Apply damage to all enemies
            enemies.forEach(enemy => {
              if (enemy.alive) {
                enemy.takeDamage(this.specialAbilityDamage);

                // Apply burn effect
                if (this.burnDamage && this.burnDuration) {
                  enemy.applyBurn(this.burnDamage, this.burnDuration);
                }
              }
            });

            this.lastSpecialAbilityTime = currentTime;
          }
        }
        break;

      case 'demonLord':
        // Check if special ability is ready
        if (this.lastSpecialAbilityTime === 0 || currentTime - this.lastSpecialAbilityTime >= this.specialAbilityCooldown) {
          // Hellfire - Create a pentagram that damages enemies
          if (enemies && enemies.length > 0) {
            // Create pentagram effect
            if (effects) {
              effects.push({
                type: 'hellfire',
                x: this.x,
                y: this.y,
                radius: this.range * 0.8,
                duration: this.specialAbilityDuration,
                startTime: currentTime,
                endTime: currentTime + this.specialAbilityDuration,
                damage: this.specialAbilityDamage / (this.specialAbilityDuration / 1000), // Damage per second
                color: '#FF5722'
              });
            }

            this.lastSpecialAbilityTime = currentTime;
          }
        }
        break;
    }
  }

  // Apply buffs to nearby towers
  applyBuffToNearbyTowers() {
    // Get all towers from the game
    const towers = window.game?.towers || [];

    // Find towers in range
    towers.forEach(tower => {
      if (tower !== this) { // Don't buff self
        const dist = distance(this.x, this.y, tower.x, tower.y);
        if (dist <= this.buffRadius) {
          // Apply damage buff
          if (this.buffDamage) {
            tower.buffedDamage = tower.damage * (1 + this.buffDamage);
          }

          // Apply range buff
          if (this.buffRange) {
            tower.buffedRange = tower.range * (1 + this.buffRange);
          }

          // Add to buffed towers list
          if (!this.buffedTowers.includes(tower)) {
            this.buffedTowers.push(tower);
          }
        }
      }
    });
  }

  // Find a target among the enemies
  findTarget(enemies, currentTime) {
    // Check if there are any enemies
    if (!enemies || enemies.length === 0) {
      this.target = null;
      return null;
    }

    // Get the game speed multiplier from the game instance
    const gameSpeedMultiplier = window.game ? window.game.speedMultiplier : 1;

    // Check if cooldown has passed, adjusting for game speed
    const adjustedCooldown = this.cooldown / gameSpeedMultiplier;
    if (this.lastShot > 0 && currentTime - this.lastShot < adjustedCooldown) {
      // Keep the current target if it's still valid
      if (this.target && this.target.alive) {
        const dist = distance(this.x, this.y, this.target.x, this.target.y);
        // Archangel tower can hit all enemy types
        if (dist <= this.range && (this.type === 'archangel' || (!this.target.flying || this.canTargetFlying))) {
          return this.target;
        }
      }
      return null;
    }

    // Filter enemies that are in range and can be targeted
    const validTargets = enemies.filter(enemy => {
      if (!enemy.alive) return false;

      // Archangel tower can target all enemy types
      if (this.type === 'archangel') {
        const dist = distance(this.x, this.y, enemy.x, enemy.y);
        return dist <= this.range;
      }

      // Normal targeting rules for other towers
      if (enemy.flying && !this.canTargetFlying) return false;

      // Check if this is a shadow enemy and if the tower can target it
      if (enemy.type === 'shadow' && !this.canTargetShadow()) return false;

      const dist = distance(this.x, this.y, enemy.x, enemy.y);
      return dist <= this.range;
    });

    if (validTargets.length === 0) {
      this.target = null;
      return null;
    }

    // Target selection strategy based on tower type
    let selectedTarget;

    switch (this.type) {
      case 'sniper':
        // Target enemy with highest health
        selectedTarget = validTargets.reduce((prev, current) =>
          (current.health > prev.health) ? current : prev
        );
        break;
      case 'slow':
        // Target fastest enemy
        selectedTarget = validTargets.reduce((prev, current) =>
          (current.speed > prev.speed) ? current : prev
        );
        break;
      case 'aoe':
        // Target enemy with most neighbors in AOE radius
        selectedTarget = validTargets.reduce((prev, current) => {
          const neighborsCount = validTargets.filter(e =>
            distance(current.x, current.y, e.x, e.y) <= this.aoeRadius
          ).length;

          const prevNeighborsCount = validTargets.filter(e =>
            distance(prev.x, prev.y, e.x, e.y) <= this.aoeRadius
          ).length;

          return (neighborsCount > prevNeighborsCount) ? current : prev;
        });
        break;
      case 'basic':
      default:
        // Target enemy furthest along the path
        selectedTarget = validTargets.reduce((prev, current) =>
          (current.pathIndex > prev.pathIndex) ? current : prev
        );
        break;
    }

    this.target = selectedTarget;
    return selectedTarget;
  }

  // Create a projectile towards the target
  shoot(currentTime, projectiles) {
    // Ensure we have a valid target and projectiles array
    if (!this.target || !this.target.alive || !projectiles) return false;

    // Double-check the target is in range
    const dist = distance(this.x, this.y, this.target.x, this.target.y);
    if (dist > this.range) return false;

    // Calculate angle to target
    this.angle = getAngle(this.x, this.y, this.target.x, this.target.y);

    // Create visual effect for shooting
    this.createShootEffect();

    try {
      // Use the tower's base damage without scaling
      // Game speed is now controlled by running multiple update cycles

      // Handle special tower abilities based on tower type
      switch (this.type) {
        case 'archangel':
          // Archangel shoots divine projectiles
          const divineProjectile = new Projectile(
            this.x,
            this.y,
            this.angle,
            this.projectileSpeed,
            this.damage,
            'divine', // Use divine projectile type
            this.target,
            this.type
          );

          // Add pierce property
          if (this.pierceCount) {
            divineProjectile.pierceCount = this.pierceCount;
            divineProjectile.pierceRemaining = this.pierceCount;
          }

          // Add area effect
          if (this.aoeRadius) {
            divineProjectile.aoeRadius = this.aoeRadius;
          }

          // Add chain effect
          if (this.chainCount && this.chainRange) {
            divineProjectile.chainCount = this.chainCount;
            divineProjectile.chainRange = this.chainRange;
            divineProjectile.chainRemaining = this.chainCount;
          }

          projectiles.push(divineProjectile);
          break;

        case 'seraphim':
          // Seraphim shoots light projectiles
          const lightProjectile = new Projectile(
            this.x,
            this.y,
            this.angle,
            this.projectileSpeed,
            this.damage,
            'light', // Use light projectile type
            this.target,
            this.type
          );

          // Add pierce property
          if (this.pierceCount) {
            lightProjectile.pierceCount = this.pierceCount;
            lightProjectile.pierceRemaining = this.pierceCount;
          }

          // Add area effect
          if (this.aoeRadius) {
            lightProjectile.aoeRadius = this.aoeRadius;
          }

          // Add burn effect
          if (this.burnDamage && this.burnDuration) {
            lightProjectile.burnDamage = this.burnDamage;
            lightProjectile.burnDuration = this.burnDuration;
          }

          projectiles.push(lightProjectile);
          break;

        case 'demonLord':
          // Demon Lord shoots fire projectiles
          const fireProjectile = new Projectile(
            this.x,
            this.y,
            this.angle,
            this.projectileSpeed,
            this.damage,
            'fire', // Use fire projectile type
            this.target,
            this.type
          );

          // Add fear effect
          if (this.fearChance && this.fearDuration) {
            fireProjectile.fearChance = this.fearChance;
            fireProjectile.fearDuration = this.fearDuration;
          }

          // Add area effect
          if (this.aoeRadius) {
            fireProjectile.aoeRadius = this.aoeRadius;
          }

          projectiles.push(fireProjectile);

          // Summon demon minions
          if (this.summonCount && Math.random() < 0.3) { // 30% chance to summon on hit
            for (let i = 0; i < this.summonCount; i++) {
              const angle = Math.random() * Math.PI * 2;
              const distance = 30 + Math.random() * 20;

              const demonProjectile = new Projectile(
                this.x + Math.cos(angle) * distance,
                this.y + Math.sin(angle) * distance,
                Math.random() * Math.PI * 2, // Random direction
                this.projectileSpeed * 0.8,
                this.summonDamage,
                'demon', // Demon projectile type
                null, // No specific target, will find closest
                this.type
              );

              demonProjectile.lifespan = this.summonDuration;
              demonProjectile.isSummon = true;

              projectiles.push(demonProjectile);
            }
          }
          break;

        case 'archer':
          // Archer shoots multiple arrows based on upgrades
          const arrowCount = 1 + (this.extraShots || 0);
          for (let i = 0; i < arrowCount; i++) {
            // Add slight angle variation for multiple arrows
            const angleOffset = (i - (arrowCount - 1) / 2) * 0.1;

            const arrowProjectile = new Projectile(
              this.x,
              this.y,
              this.angle + angleOffset,
              this.projectileSpeed,
              this.damage,
              this.type,
              this.target,
              this.type
            );

            // Add pierce property if upgraded
            if (this.pierceCount) {
              arrowProjectile.pierceCount = this.pierceCount;
              arrowProjectile.pierceRemaining = this.pierceCount;
            }

            projectiles.push(arrowProjectile);
          }
          break;

        case 'cannon':
          // Create explosive projectile
          const explosiveProjectile = new Projectile(
            this.x,
            this.y,
            this.angle,
            this.projectileSpeed,
            this.damage,
            this.type,
            this.target,
            this.type
          );

          // Add AOE properties
          explosiveProjectile.aoeRadius = this.aoeRadius || 40;

          // Add stun chance if upgraded
          if (this.stunChance) {
            explosiveProjectile.stunChance = this.stunChance;
            explosiveProjectile.stunDuration = 1000; // 1 second stun
          }

          projectiles.push(explosiveProjectile);
          break;

        case 'freeze':
          // Create freeze projectile
          const freezeProjectile = new Projectile(
            this.x,
            this.y,
            this.angle,
            this.projectileSpeed,
            this.damage,
            this.type,
            this.target,
            this.type
          );

          // Add slow effect properties
          freezeProjectile.slowFactor = this.slowFactor || 0.5;
          freezeProjectile.slowDuration = this.slowDuration || 2000;

          // Add splash radius if ice shards upgrade is active
          if (this.splashRadius) {
            freezeProjectile.aoeRadius = this.splashRadius;
          }

          projectiles.push(freezeProjectile);
          break;

        case 'sniper':
          // Create high-damage projectile
          const sniperProjectile = new Projectile(
            this.x,
            this.y,
            this.angle,
            this.projectileSpeed * 1.5, // Faster projectile
            this.damage,
            this.type,
            this.target,
            this.type
          );

          // Add critical hit chance
          if (this.critChance && Math.random() < this.critChance) {
            sniperProjectile.damage *= (this.critMultiplier || 2.5);
            sniperProjectile.isCritical = true;
          }

          // Add armor piercing if available
          if (this.armorPiercing) {
            sniperProjectile.armorPiercing = this.armorPiercing;
          }

          projectiles.push(sniperProjectile);
          break;

        default:
          // Default tower behavior - single projectile
          const projectile = new Projectile(
            this.x,
            this.y,
            this.angle,
            this.projectileSpeed,
            this.damage,
            this.type,
            this.target,
            this.type
          );

          projectiles.push(projectile);
          break;
      }

      this.lastShot = currentTime;
      return true;
    } catch (error) {
      console.error('Error creating projectile:', error);
      return false;
    }
  }

  // Create visual effect when tower shoots
  createShootEffect() {
    // Get the canvas context from the game
    const canvas = document.getElementById('gameCanvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Save context state
    ctx.save();

    // Draw effect based on tower type
    switch (this.type) {
      case 'archangel':
        // Divine light burst effect
        ctx.fillStyle = '#FFEB3B';
        ctx.globalAlpha = 0.9;
        ctx.beginPath();
        ctx.arc(this.x, this.y - 25, 15, 0, Math.PI * 2);
        ctx.fill();

        // Light rays
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.8;

        for (let i = 0; i < 8; i++) {
          const angle = Math.PI * 2 * (i / 8) + this.angle;
          ctx.beginPath();
          ctx.moveTo(this.x, this.y - 25);
          ctx.lineTo(
            this.x + Math.cos(angle) * 30,
            this.y - 25 + Math.sin(angle) * 30
          );
          ctx.stroke();
        }

        // Add glow effect
        ctx.fillStyle = '#FFFFFF';
        ctx.globalAlpha = 0.5;
        ctx.beginPath();
        ctx.arc(this.x, this.y - 25, 25, 0, Math.PI * 2);
        ctx.fill();
        break;

      case 'seraphim':
        // Heavenly fire effect
        ctx.fillStyle = '#FF9800';
        ctx.globalAlpha = 0.9;
        ctx.beginPath();
        ctx.arc(this.x, this.y - 25, 18, 0, Math.PI * 2);
        ctx.fill();

        // Fire rays
        const colors = ['#FFEB3B', '#FF9800', '#FF5722'];

        for (let i = 0; i < 12; i++) {
          const angle = Math.PI * 2 * (i / 12) + this.angle;
          const length = 25 + Math.random() * 15;

          ctx.strokeStyle = colors[Math.floor(Math.random() * colors.length)];
          ctx.lineWidth = 2 + Math.random() * 2;
          ctx.globalAlpha = 0.7 + Math.random() * 0.3;

          ctx.beginPath();
          ctx.moveTo(this.x, this.y - 25);
          ctx.lineTo(
            this.x + Math.cos(angle) * length,
            this.y - 25 + Math.sin(angle) * length
          );
          ctx.stroke();
        }

        // Add glow effect
        ctx.fillStyle = '#FFEB3B';
        ctx.globalAlpha = 0.4;
        ctx.beginPath();
        ctx.arc(this.x, this.y - 25, 30, 0, Math.PI * 2);
        ctx.fill();
        break;

      case 'demonLord':
        // Hellfire effect
        ctx.fillStyle = '#F44336';
        ctx.globalAlpha = 0.9;
        ctx.beginPath();
        ctx.arc(this.x, this.y - 25, 15, 0, Math.PI * 2);
        ctx.fill();

        // Flame effect
        for (let i = 0; i < 10; i++) {
          const angle = Math.PI * 2 * (i / 10) + this.angle;
          const length = 20 + Math.random() * 15;

          ctx.fillStyle = i % 2 === 0 ? '#FF5722' : '#F44336';
          ctx.globalAlpha = 0.7 + Math.random() * 0.3;

          ctx.beginPath();
          ctx.moveTo(this.x, this.y - 25);
          ctx.lineTo(
            this.x + Math.cos(angle - 0.2) * length * 0.7,
            this.y - 25 + Math.sin(angle - 0.2) * length * 0.7
          );
          ctx.lineTo(
            this.x + Math.cos(angle) * length,
            this.y - 25 + Math.sin(angle) * length
          );
          ctx.lineTo(
            this.x + Math.cos(angle + 0.2) * length * 0.7,
            this.y - 25 + Math.sin(angle + 0.2) * length * 0.7
          );
          ctx.closePath();
          ctx.fill();
        }

        // Add smoke effect
        ctx.fillStyle = '#212121';
        ctx.globalAlpha = 0.4;
        for (let i = 0; i < 5; i++) {
          const angle = Math.random() * Math.PI * 2;
          const distance = 10 + Math.random() * 15;
          const size = 5 + Math.random() * 5;

          ctx.beginPath();
          ctx.arc(
            this.x + Math.cos(angle) * distance,
            this.y - 25 + Math.sin(angle) * distance,
            size,
            0,
            Math.PI * 2
          );
          ctx.fill();
        }
        break;

      case 'freeze':
        // Enhanced ice burst effect
        // Main burst
        ctx.fillStyle = '#B3E5FC';
        ctx.globalAlpha = 0.7;
        ctx.beginPath();
        ctx.arc(this.x, this.y - 25, 12, 0, Math.PI * 2);
        ctx.fill();

        // Ice crystals
        ctx.strokeStyle = '#E1F5FE';
        ctx.lineWidth = 1;
        ctx.globalAlpha = 0.8;
        for (let i = 0; i < 6; i++) {
          const angle = Math.PI * 2 * (i / 6);
          ctx.beginPath();
          ctx.moveTo(this.x, this.y - 25);
          ctx.lineTo(
            this.x + Math.cos(angle) * 18,
            this.y - 25 + Math.sin(angle) * 18
          );
          ctx.stroke();
        }
        break;

      case 'cannon':
        // Enhanced cannon firing effect
        // Muzzle flash
        ctx.fillStyle = '#FF9800';
        ctx.globalAlpha = 0.9;
        ctx.beginPath();
        ctx.arc(this.x, this.y - 25, 10, 0, Math.PI * 2);
        ctx.fill();

        // Smoke effect
        ctx.fillStyle = '#9E9E9E';
        ctx.globalAlpha = 0.7;
        for (let i = 0; i < 5; i++) {
          const offset = i * 3;
          const size = 8 - i * 1.2;
          ctx.beginPath();
          ctx.arc(
            this.x + Math.cos(this.angle) * offset,
            this.y - 25 + Math.sin(this.angle) * offset,
            size,
            0,
            Math.PI * 2
          );
          ctx.fill();
        }

        // Recoil animation (handled in draw method)
        this.recoilAnimation = 5; // Set recoil frames
        break;

      case 'tesla':
        // Tesla electricity effect
        ctx.strokeStyle = '#FFEB3B';
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.8;

        // Draw lightning bolts
        for (let i = 0; i < 4; i++) {
          const angle = this.angle + (Math.random() - 0.5) * 0.8;
          const length = 30 + Math.random() * 20;

          ctx.beginPath();
          ctx.moveTo(this.x, this.y - 25);

          // Create zigzag lightning path
          let x = this.x;
          let y = this.y - 25;
          const segments = 4 + Math.floor(Math.random() * 3);

          for (let j = 0; j < segments; j++) {
            const segLength = length / segments;
            const jitter = 8 - j * 1.5; // Less jitter toward the end

            x += Math.cos(angle) * segLength + (Math.random() - 0.5) * jitter;
            y += Math.sin(angle) * segLength + (Math.random() - 0.5) * jitter;

            ctx.lineTo(x, y);
          }

          ctx.stroke();
        }

        // Glow effect
        ctx.fillStyle = '#FFEB3B';
        ctx.globalAlpha = 0.4;
        ctx.beginPath();
        ctx.arc(this.x, this.y - 25, 15, 0, Math.PI * 2);
        ctx.fill();
        break;

      case 'sniper':
        // Enhanced muzzle flash
        ctx.fillStyle = '#FFEB3B';
        ctx.globalAlpha = 0.9;
        ctx.beginPath();
        ctx.arc(this.x, this.y - 25, 8, 0, Math.PI * 2);
        ctx.fill();

        // Directional flash
        ctx.beginPath();
        ctx.moveTo(this.x, this.y - 25);
        ctx.lineTo(
          this.x + Math.cos(this.angle) * 15,
          this.y - 25 + Math.sin(this.angle) * 15
        );
        ctx.lineTo(
          this.x + Math.cos(this.angle + 0.3) * 10,
          this.y - 25 + Math.sin(this.angle + 0.3) * 10
        );
        ctx.lineTo(
          this.x + Math.cos(this.angle - 0.3) * 10,
          this.y - 25 + Math.sin(this.angle - 0.3) * 10
        );
        ctx.closePath();
        ctx.fill();

        // Recoil animation
        this.recoilAnimation = 3;
        break;

      case 'archer':
        // Enhanced string vibration effect
        ctx.strokeStyle = '#8D6E63';
        ctx.lineWidth = 1;
        ctx.globalAlpha = 0.8;

        // Vibrating bowstring
        for (let i = 0; i < 3; i++) {
          const offset = (i - 1) * 2;
          ctx.beginPath();
          ctx.moveTo(this.x - 8, this.y - 25 + offset);
          ctx.lineTo(this.x + 8, this.y - 25 - offset);
          ctx.stroke();
        }

        // Arrow release effect
        ctx.fillStyle = '#F5F5F5';
        ctx.globalAlpha = 0.5;
        ctx.beginPath();
        ctx.moveTo(this.x, this.y - 25);
        ctx.lineTo(
          this.x + Math.cos(this.angle) * 20,
          this.y - 25 + Math.sin(this.angle) * 20
        );
        ctx.lineTo(
          this.x + Math.cos(this.angle + 0.2) * 15,
          this.y - 25 + Math.sin(this.angle + 0.2) * 15
        );
        ctx.lineTo(
          this.x + Math.cos(this.angle - 0.2) * 15,
          this.y - 25 + Math.sin(this.angle - 0.2) * 15
        );
        ctx.closePath();
        ctx.fill();
        break;

      case 'laser':
        // Laser beam effect
        ctx.strokeStyle = '#F44336';
        ctx.lineWidth = 3;
        ctx.globalAlpha = 0.8;
        ctx.beginPath();
        ctx.moveTo(this.x, this.y - 25);
        ctx.lineTo(
          this.x + Math.cos(this.angle) * 50,
          this.y - 25 + Math.sin(this.angle) * 50
        );
        ctx.stroke();

        // Laser glow
        ctx.strokeStyle = '#FFCDD2';
        ctx.lineWidth = 1;
        ctx.globalAlpha = 0.5;
        ctx.beginPath();
        ctx.moveTo(this.x, this.y - 25);
        ctx.lineTo(
          this.x + Math.cos(this.angle) * 60,
          this.y - 25 + Math.sin(this.angle) * 60
        );
        ctx.stroke();
        break;

      default:
        // Generic enhanced flash
        ctx.fillStyle = '#FFFFFF';
        ctx.globalAlpha = 0.7;
        ctx.beginPath();
        ctx.arc(this.x, this.y - 25, 8, 0, Math.PI * 2);
        ctx.fill();

        // Small directional flash
        ctx.beginPath();
        ctx.moveTo(this.x, this.y - 25);
        ctx.lineTo(
          this.x + Math.cos(this.angle) * 12,
          this.y - 25 + Math.sin(this.angle) * 12
        );
        ctx.lineTo(
          this.x + Math.cos(this.angle + 0.3) * 8,
          this.y - 25 + Math.sin(this.angle + 0.3) * 8
        );
        ctx.lineTo(
          this.x + Math.cos(this.angle - 0.3) * 8,
          this.y - 25 + Math.sin(this.angle - 0.3) * 8
        );
        ctx.closePath();
        ctx.fill();
        break;
    }

    // Restore context state
    ctx.restore();
  }

  // Check if this tower can target shadow enemies
  canTargetShadow() {
    // Only certain tower types can target shadow enemies
    const shadowTargetingTowers = ['tesla', 'laser', 'flame', 'archangel'];
    return shadowTargetingTowers.includes(this.type);
  }

  // Draw the tower
  draw(ctx, showRange = false, currentTime = Date.now()) {
    // Update tile size in case it changed
    this.tileSize = window.game?.map?.tileSize || 40;

    // Define scale factor at the class level if not already defined
    if (!this.scaleFactor) {
      this.scaleFactor = 1;
    }

    // Calculate scale factor based on tile size (40 is the reference size)
    this.scaleFactor = this.tileSize / 40;

    // Define a global scaleFactor for use throughout the method
    const scaleFactor = this.scaleFactor;
    
    // Calculate time in seconds for animations
    const timeInSec = currentTime / 1000;

    // Draw variant indicator above tower if it has a variant
    if (this.variant && this.variant !== 'normal') {
      // Get variant data
      const variantData = towerVariants[this.variant];
      if (variantData) {
        // Draw variant icon based on tier
        const tierColors = {
          'common': '#AAAAAA',
          'rare': '#4CAF50',
          'epic': '#3F51B5',
          'legendary': '#FFC107',
          'divine': '#E91E63'
        };

        const tierIcons = {
          'common': '★',
          'rare': '★★',
          'epic': '★★★',
          'legendary': '✦',
          'divine': '✧'
        };

        // Draw variant background
        ctx.fillStyle = variantData.color || '#FFFFFF';
        ctx.globalAlpha = 0.7;
        ctx.beginPath();
        ctx.arc(this.x, this.y - 45 * this.scaleFactor, 10 * this.scaleFactor, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;

        // Draw variant border
        ctx.strokeStyle = tierColors[variantData.tier] || '#FFFFFF';
        ctx.lineWidth = 2 * this.scaleFactor;
        ctx.beginPath();
        ctx.arc(this.x, this.y - 45 * this.scaleFactor, 10 * this.scaleFactor, 0, Math.PI * 2);
        ctx.stroke();

        // Draw variant icon
        ctx.fillStyle = '#FFFFFF';
        ctx.font = `${12 * this.scaleFactor}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(tierIcons[variantData.tier] || '★', this.x, this.y - 45 * this.scaleFactor);

        // Add pulsing effect for legendary and divine variants
        if (variantData.tier === 'legendary' || variantData.tier === 'divine') {
          const pulseIntensity = 0.3 + Math.sin(currentTime / 500) * 0.2;
          ctx.fillStyle = tierColors[variantData.tier];
          ctx.globalAlpha = pulseIntensity;
          ctx.beginPath();
          ctx.arc(this.x, this.y - 45 * this.scaleFactor, 15 * this.scaleFactor, 0, Math.PI * 2);
          ctx.fill();
          ctx.globalAlpha = 1.0;
        }
      }
    }

    // Draw range indicator if requested
    if (showRange) {
      // Scale the range based on the tile size
      const scaledRange = this.range * this.scaleFactor;

      ctx.beginPath();
      ctx.arc(this.x, this.y, scaledRange, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(100, 100, 255, 0.1)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(100, 100, 255, 0.3)';
      ctx.stroke();
    }

    // Draw 2D futuristic tower base (flat hexagonal)
    const baseSize = 20 * this.scaleFactor;
    const hexPoints = [];

    // Create hexagon points
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i;
      hexPoints.push({
        x: this.x + Math.cos(angle) * baseSize,
        y: this.y + Math.sin(angle) * baseSize
      });
    }

    // Draw base with lighter gradient
    const baseGradient = ctx.createLinearGradient(
      this.x - baseSize, this.y - baseSize,
      this.x + baseSize, this.y + baseSize
    );
    baseGradient.addColorStop(0, '#ecf0f1'); // Very light gray
    baseGradient.addColorStop(1, '#bdc3c7'); // Light gray

    ctx.fillStyle = baseGradient;
    ctx.beginPath();
    ctx.moveTo(hexPoints[0].x, hexPoints[0].y);
    for (let i = 1; i < hexPoints.length; i++) {
      ctx.lineTo(hexPoints[i].x, hexPoints[i].y);
    }
    ctx.closePath();
    ctx.fill();

    // Add tech-inspired details to base
    ctx.strokeStyle = '#95a5a6'; // Light gray border
    ctx.lineWidth = 1;
    ctx.stroke();

    // Add inner hexagon for detail - more 2D look
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i + Math.PI / 6;
      const innerSize = baseSize * 0.6;
      const x = this.x + Math.cos(angle) * innerSize;
      const y = this.y + Math.sin(angle) * innerSize;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.strokeStyle = '#3498db'; // Blue accent
    ctx.stroke();

    // Add flat colored center instead of glow for more 2D look
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, 6 * this.scaleFactor, 0, Math.PI * 2);
    ctx.fill();

    // Add tech circuit pattern
    ctx.strokeStyle = '#3498db'; // Blue accent
    ctx.lineWidth = 1 * this.scaleFactor;
    ctx.beginPath();
    ctx.moveTo(this.x - 10 * this.scaleFactor, this.y);
    ctx.lineTo(this.x - 5 * this.scaleFactor, this.y);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(this.x + 5 * this.scaleFactor, this.y);
    ctx.lineTo(this.x + 10 * this.scaleFactor, this.y);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(this.x, this.y - 10 * this.scaleFactor);
    ctx.lineTo(this.x, this.y - 5 * this.scaleFactor);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(this.x, this.y + 5 * this.scaleFactor);
    ctx.lineTo(this.x, this.y + 10 * this.scaleFactor);
    ctx.stroke();

    // Draw tower body based on type and upgrades - more 2D and futuristic style
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);

    // Apply recoil animation if active
    let recoilOffset = 0;
    if (this.recoilAnimation > 0) {
      // Calculate recoil offset based on remaining animation frames
      const scaleFactor = this.tileSize / 40; // Calculate scale factor based on tile size
      recoilOffset = Math.sin(Math.PI * (this.recoilAnimation / 5)) * 5 * scaleFactor;
      this.recoilAnimation--;
    }

    // Determine if tower has upgrades
    const hasPathAUpgrades = this.pathALevel > 0;
    const hasPathBUpgrades = this.pathBLevel > 0;

    // Use variant color if available
    const towerColor = this.variantColor || this.color;

    // Add a pulsing glow effect for upgraded towers
    if (hasPathAUpgrades || hasPathBUpgrades) {
      const timeInSec = currentTime / 1000;
      const pulseIntensity = 0.4 + Math.sin(timeInSec * 3) * 0.2;
      ctx.fillStyle = hasPathAUpgrades ? '#FFA000' : '#9C27B0';
      ctx.globalAlpha = pulseIntensity;
      const scaleFactor = this.tileSize / 40; // Calculate scale factor based on tile size
      ctx.beginPath();
      ctx.arc(0, -15 * scaleFactor, 12 * scaleFactor, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1.0;
    }

    // Draw tower based on type and upgrades
    switch (this.type) {
      case 'basic':
        // Basic tower - flat 2D futuristic design with lighter colors

        // Draw a flat rectangular tower body
        ctx.fillStyle = '#ecf0f1'; // Light gray base
        ctx.fillRect(-8 * scaleFactor, -25 * scaleFactor, 16 * scaleFactor, 25 * scaleFactor);

        // Add colored accent based on tower color
        ctx.fillStyle = towerColor;
        ctx.fillRect(-8 * scaleFactor, -25 * scaleFactor, 3 * scaleFactor, 25 * scaleFactor); // Left stripe

        // Add tech details - circuit pattern
        ctx.strokeStyle = '#3498db'; // Blue accent
        ctx.lineWidth = 1 * scaleFactor;

        // Horizontal lines
        for (let i = 1; i <= 3; i++) {
          ctx.beginPath();
          ctx.moveTo(-5 * scaleFactor, -5 * i * scaleFactor);
          ctx.lineTo(8 * scaleFactor, -5 * i * scaleFactor);
          ctx.stroke();
        }

        // Vertical line
        ctx.beginPath();
        ctx.moveTo(0, -5 * scaleFactor);
        ctx.lineTo(0, -20 * scaleFactor);
        ctx.stroke();

        // Draw flat circular tower head
        ctx.fillStyle = '#bdc3c7'; // Light gray
        ctx.beginPath();
        ctx.arc(0, -25 * scaleFactor, 8 * scaleFactor, 0, Math.PI * 2);
        ctx.fill();

        // Add colored center to tower head
        ctx.fillStyle = towerColor;
        ctx.beginPath();
        ctx.arc(0, -25 * scaleFactor, 4 * scaleFactor, 0, Math.PI * 2);
        ctx.fill();

        // Add tech ring
        ctx.strokeStyle = '#3498db'; // Blue accent
        ctx.lineWidth = 1 * scaleFactor;
        ctx.beginPath();
        ctx.arc(0, -25 * scaleFactor, 6 * scaleFactor, 0, Math.PI * 2);
        ctx.stroke();

        // Add variant-specific effects if a variant is applied
        if (this.variant && this.variant !== this.type) {
          switch (this.variant) {
            case 'gold':
              // Add gold trim with tech pattern
              ctx.strokeStyle = '#FFD700';
              ctx.lineWidth = 1.5 * scaleFactor;
              ctx.beginPath();
              ctx.moveTo(-10 * scaleFactor, 0);
              ctx.lineTo(10 * scaleFactor, 0);
              ctx.lineTo(8 * scaleFactor, -25 * scaleFactor);
              ctx.lineTo(-8 * scaleFactor, -25 * scaleFactor);
              ctx.closePath();
              ctx.stroke();

              // Add gold circuit pattern
              ctx.beginPath();
              ctx.moveTo(-5 * scaleFactor, 0);
              ctx.lineTo(-5 * scaleFactor, -15 * scaleFactor);
              ctx.lineTo(0, -15 * scaleFactor);
              ctx.lineTo(0, -25 * scaleFactor);
              ctx.stroke();

              ctx.beginPath();
              ctx.moveTo(5 * scaleFactor, 0);
              ctx.lineTo(5 * scaleFactor, -10 * scaleFactor);
              ctx.lineTo(0, -10 * scaleFactor);
              ctx.stroke();

              // Add gold glow
              ctx.fillStyle = '#FFD700';
              ctx.globalAlpha = 0.3;
              ctx.beginPath();
              ctx.arc(0, -25 * scaleFactor, 10 * scaleFactor, 0, Math.PI * 2);
              ctx.fill();
              ctx.globalAlpha = 1.0;
              break;

            case 'crystal':
              // Add crystal effect with geometric pattern
              ctx.strokeStyle = '#88CCEE';
              ctx.lineWidth = 1 * scaleFactor;

              // Draw crystal facets as geometric pattern
              for (let i = 0; i < 3; i++) {
                const y = -25 * scaleFactor + i * 8 * scaleFactor;
                ctx.beginPath();
                ctx.moveTo((-8 + i) * scaleFactor, y);
                ctx.lineTo((8 - i) * scaleFactor, y);
                ctx.stroke();
              }

              // Add diagonal lines for crystal effect
              ctx.beginPath();
              ctx.moveTo(-8 * scaleFactor, -25 * scaleFactor);
              ctx.lineTo(0, 0);
              ctx.lineTo(8 * scaleFactor, -25 * scaleFactor);
              ctx.stroke();

              // Add crystal glow with pulsing effect
              const crystalPulse = 0.2 + Math.sin(currentTime / 1000 * 2) * 0.1;
              ctx.fillStyle = '#88CCEE';
              ctx.globalAlpha = crystalPulse;
              ctx.beginPath();
              ctx.arc(0, -25 * scaleFactor, 10 * scaleFactor, 0, Math.PI * 2);
              ctx.fill();
              ctx.globalAlpha = 1.0;
              break;

            case 'shadow':
              // Add shadow effect with dark energy visualization
              ctx.fillStyle = '#000000';
              ctx.globalAlpha = 0.5;
              ctx.beginPath();
              ctx.arc(0, -25 * scaleFactor, 10 * scaleFactor, 0, Math.PI * 2);
              ctx.fill();

              // Add smoky particles with more tech feel
              ctx.fillStyle = '#444444';
              ctx.globalAlpha = 0.7;

              const timeInSec = currentTime / 1000;

              for (let i = 0; i < 5; i++) {
                const angle = timeInSec + i * Math.PI * 2 / 5;
                const distance = (6 + Math.sin(timeInSec * 3 + i) * 3) * scaleFactor;
                const x = Math.cos(angle) * distance;
                const y = Math.sin(angle) * distance - 15 * scaleFactor;
                const size = (1.5 + Math.sin(timeInSec * 2 + i) * 0.5) * scaleFactor;

                // Draw square particles instead of circles for tech feel
                ctx.fillRect(x - size, y - size, size * 2, size * 2);
              }

              ctx.globalAlpha = 1.0;
              break;
          }
        }

        // Path A upgrades - Enhanced power
        if (hasPathAUpgrades) {
          ctx.fillStyle = '#FFA000';
          ctx.fillRect(-8 * scaleFactor, -25 * scaleFactor, 16 * scaleFactor, 25 * scaleFactor);

          // Add power indicators
          ctx.fillStyle = '#FFECB3';
          for (let i = 0; i < this.pathALevel; i++) {
            ctx.beginPath();
            ctx.arc(0, (-15 - i * 5) * scaleFactor, 3 * scaleFactor, 0, Math.PI * 2);
            ctx.fill();
          }
        }

        // Path B upgrades - Rapid fire
        if (hasPathBUpgrades) {
          ctx.fillStyle = '#7B1FA2';
          ctx.fillRect(-8 * scaleFactor, -25 * scaleFactor, 16 * scaleFactor, 25 * scaleFactor);

          // Add speed indicators
          ctx.strokeStyle = '#E1BEE7';
          ctx.lineWidth = 1 * scaleFactor;
          for (let i = 0; i < this.pathBLevel; i++) {
            const offset = (5 + i * 3) * scaleFactor;
            ctx.beginPath();
            ctx.moveTo(-offset, -15 * scaleFactor);
            ctx.lineTo(offset, -15 * scaleFactor);
            ctx.stroke();
          }
        }
        break;

      case 'freeze':
        // Create a cool ice-themed tower with glowing effects

        // Base tower body with gradient
        const freezeGradient = ctx.createLinearGradient(-8, -25, 8, 0);
        freezeGradient.addColorStop(0, '#81D4FA'); // Light blue
        freezeGradient.addColorStop(1, '#0288D1'); // Darker blue

        ctx.fillStyle = freezeGradient;

        // Draw a more interesting hexagonal shape for the freeze tower
        ctx.beginPath();
        ctx.moveTo(-10, -25); // Top left
        ctx.lineTo(10, -25);  // Top right
        ctx.lineTo(15, -10);  // Middle right
        ctx.lineTo(10, 5);    // Bottom right
        ctx.lineTo(-10, 5);   // Bottom left
        ctx.lineTo(-15, -10); // Middle left
        ctx.closePath();
        ctx.fill();

        // Add frost patterns
        ctx.strokeStyle = '#E1F5FE';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(-8, -20);
        ctx.lineTo(8, -20);
        ctx.moveTo(-10, -15);
        ctx.lineTo(10, -15);
        ctx.moveTo(-12, -10);
        ctx.lineTo(12, -10);
        ctx.moveTo(-10, -5);
        ctx.lineTo(10, -5);
        ctx.moveTo(-8, 0);
        ctx.lineTo(8, 0);
        ctx.stroke();

        // Path A: Deep Freeze - Blue with ice crystals and glow
        if (hasPathAUpgrades) {
          // Add glow effect
          ctx.shadowColor = '#29B6F6';
          ctx.shadowBlur = 10 + this.pathALevel * 2;

          // Darker blue for deep freeze with gradient
          const deepFreezeGradient = ctx.createLinearGradient(-10, -25, 10, 5);
          deepFreezeGradient.addColorStop(0, '#0288D1'); // Darker blue
          deepFreezeGradient.addColorStop(1, '#01579B'); // Even darker blue

          ctx.fillStyle = deepFreezeGradient;

          // Draw hexagonal shape
          ctx.beginPath();
          ctx.moveTo(-10, -25); // Top left
          ctx.lineTo(10, -25);  // Top right
          ctx.lineTo(15, -10);  // Middle right
          ctx.lineTo(10, 5);    // Bottom right
          ctx.lineTo(-10, 5);   // Bottom left
          ctx.lineTo(-15, -10); // Middle left
          ctx.closePath();
          ctx.fill();

          // Reset shadow
          ctx.shadowColor = 'transparent';
          ctx.shadowBlur = 0;

          // Add ice crystals based on upgrade level
          ctx.fillStyle = '#B3E5FC';
          for (let i = 0; i < this.pathALevel + 2; i++) {
            const angle = Math.PI * 2 * (i / (this.pathALevel + 2));
            const length = 8 + this.pathALevel * 3;

            // Draw crystal
            ctx.beginPath();
            ctx.moveTo(0, -25);
            ctx.lineTo(
              Math.cos(angle) * length,
              -25 + Math.sin(angle) * length
            );
            ctx.lineTo(
              Math.cos(angle + 0.2) * (length - 3),
              -25 + Math.sin(angle + 0.2) * (length - 3)
            );
            ctx.closePath();
            ctx.fill();

            // Add crystal glow
            ctx.strokeStyle = '#E1F5FE';
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }

        // Path B: Ice Shards - White with sharp edges and particles
        if (hasPathBUpgrades) {
          // Add glow effect
          ctx.shadowColor = '#4FC3F7';
          ctx.shadowBlur = 8 + this.pathBLevel * 2;

          // Light blue for ice shards with gradient
          const iceShardGradient = ctx.createLinearGradient(-10, -25, 10, 5);
          iceShardGradient.addColorStop(0, '#4FC3F7'); // Light blue
          iceShardGradient.addColorStop(1, '#29B6F6'); // Medium blue

          ctx.fillStyle = iceShardGradient;

          // Draw hexagonal shape
          ctx.beginPath();
          ctx.moveTo(-10, -25); // Top left
          ctx.lineTo(10, -25);  // Top right
          ctx.lineTo(15, -10);  // Middle right
          ctx.lineTo(10, 5);    // Bottom right
          ctx.lineTo(-10, 5);   // Bottom left
          ctx.lineTo(-15, -10); // Middle left
          ctx.closePath();
          ctx.fill();

          // Reset shadow
          ctx.shadowColor = 'transparent';
          ctx.shadowBlur = 0;

          // Add ice shards based on upgrade level
          ctx.fillStyle = '#E1F5FE';
          for (let i = 0; i < this.pathBLevel * 3; i++) {
            const angle = Math.PI * 2 * (i / (this.pathBLevel * 3));
            const radius = 12 + Math.random() * 8;

            // Draw shard
            ctx.beginPath();
            ctx.moveTo(-8 + Math.cos(angle) * 8, -15 + Math.sin(angle) * 10);
            ctx.lineTo(-8 + Math.cos(angle) * radius, -15 + Math.sin(angle) * (radius * 1.2));
            ctx.lineTo(-8 + Math.cos(angle + 0.3) * (radius - 5), -15 + Math.sin(angle + 0.3) * (radius - 5));
            ctx.closePath();
            ctx.fill();

            // Add shard outline
            ctx.strokeStyle = '#B3E5FC';
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }

          // Add small floating ice particles
          ctx.fillStyle = 'rgba(225, 245, 254, 0.7)';
          for (let i = 0; i < this.pathBLevel * 5; i++) {
            const angle = Math.random() * Math.PI * 2;
            const dist = 5 + Math.random() * 20;
            const size = 1 + Math.random() * 2;

            ctx.beginPath();
            ctx.arc(
              Math.cos(angle) * dist,
              -15 + Math.sin(angle) * dist,
              size,
              0,
              Math.PI * 2
            );
            ctx.fill();
          }
        }
        break;

      case 'archer':
        // Create a cool archer tower with bow design

        // Base tower body with gradient
        const archerGradient = ctx.createLinearGradient(-8, -25, 8, 0);
        archerGradient.addColorStop(0, '#8BC34A'); // Light green
        archerGradient.addColorStop(1, '#558B2F'); // Darker green

        ctx.fillStyle = archerGradient;

        // Draw a more interesting shape for the archer tower
        ctx.beginPath();
        ctx.moveTo(-8, -25); // Top left
        ctx.lineTo(8, -25);  // Top right
        ctx.lineTo(10, -10); // Middle right
        ctx.lineTo(8, 5);    // Bottom right
        ctx.lineTo(-8, 5);   // Bottom left
        ctx.lineTo(-10, -10); // Middle left
        ctx.closePath();
        ctx.fill();

        // Draw bow
        ctx.strokeStyle = '#795548'; // Brown
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, -15, 12, Math.PI * 0.25, Math.PI * 0.75, false);
        ctx.stroke();

        // Draw bowstring
        ctx.strokeStyle = '#E0E0E0';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(-8.5, -22);
        ctx.lineTo(8.5, -22);
        ctx.stroke();

        // Draw arrow
        ctx.strokeStyle = '#795548';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(-10, -15);
        ctx.lineTo(10, -15);
        ctx.stroke();

        // Arrow tip
        ctx.fillStyle = '#9E9E9E';
        ctx.beginPath();
        ctx.moveTo(10, -15);
        ctx.lineTo(15, -13);
        ctx.lineTo(15, -17);
        ctx.closePath();
        ctx.fill();

        // Arrow fletching
        ctx.fillStyle = '#F44336';
        ctx.beginPath();
        ctx.moveTo(-10, -15);
        ctx.lineTo(-15, -12);
        ctx.lineTo(-13, -15);
        ctx.lineTo(-15, -18);
        ctx.closePath();
        ctx.fill();

        // Path A: Multi-shot - Multiple arrow tips and glowing effect
        if (hasPathAUpgrades) {
          // Add glow effect
          ctx.shadowColor = '#AED581';
          ctx.shadowBlur = 8 + this.pathALevel * 2;

          // Green gradient for multi-shot
          const multiShotGradient = ctx.createLinearGradient(-8, -25, 8, 5);
          multiShotGradient.addColorStop(0, '#689F38'); // Medium green
          multiShotGradient.addColorStop(1, '#33691E'); // Dark green

          ctx.fillStyle = multiShotGradient;

          // Draw tower body
          ctx.beginPath();
          ctx.moveTo(-8, -25); // Top left
          ctx.lineTo(8, -25);  // Top right
          ctx.lineTo(10, -10); // Middle right
          ctx.lineTo(8, 5);    // Bottom right
          ctx.lineTo(-8, 5);   // Bottom left
          ctx.lineTo(-10, -10); // Middle left
          ctx.closePath();
          ctx.fill();

          // Reset shadow
          ctx.shadowColor = 'transparent';
          ctx.shadowBlur = 0;

          // Draw enhanced bow
          ctx.strokeStyle = '#5D4037'; // Darker brown
          ctx.lineWidth = 2 + this.pathALevel * 0.5;
          ctx.beginPath();
          ctx.arc(0, -15, 12, Math.PI * 0.2, Math.PI * 0.8, false);
          ctx.stroke();

          // Draw multiple bowstrings
          ctx.strokeStyle = '#E0E0E0';
          ctx.lineWidth = 1;
          for (let i = 0; i < this.pathALevel; i++) {
            const offset = i * 2;
            ctx.beginPath();
            ctx.moveTo(-8.5, -22 + offset);
            ctx.lineTo(8.5, -22 + offset);
            ctx.stroke();
          }

          // Draw multiple arrow tips
          ctx.fillStyle = '#DCEDC8';
          const spread = this.pathALevel * 3;
          for (let i = -this.pathALevel; i <= this.pathALevel; i++) {
            if (i === 0) continue; // Skip center arrow

            // Arrow shaft
            ctx.strokeStyle = '#795548';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(0, -15);
            ctx.lineTo(i * spread, -30);
            ctx.stroke();

            // Arrow tip
            ctx.fillStyle = '#9E9E9E';
            ctx.beginPath();
            ctx.moveTo(i * spread, -30);
            ctx.lineTo(i * spread + 2, -35);
            ctx.lineTo(i * spread - 2, -35);
            ctx.closePath();
            ctx.fill();

            // Add glow to tips
            ctx.strokeStyle = '#F0F4C3';
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }

        // Path B: Piercing - Sharp, pointed design with metallic effect
        if (hasPathBUpgrades) {
          // Add glow effect
          ctx.shadowColor = '#558B2F';
          ctx.shadowBlur = 8 + this.pathBLevel * 2;

          // Dark green gradient for piercing
          const piercingGradient = ctx.createLinearGradient(-8, -25, 8, 5);
          piercingGradient.addColorStop(0, '#33691E'); // Dark green
          piercingGradient.addColorStop(1, '#1B5E20'); // Even darker green

          ctx.fillStyle = piercingGradient;

          // Draw tower body
          ctx.beginPath();
          ctx.moveTo(-8, -25); // Top left
          ctx.lineTo(8, -25);  // Top right
          ctx.lineTo(10, -10); // Middle right
          ctx.lineTo(8, 5);    // Bottom right
          ctx.lineTo(-8, 5);   // Bottom left
          ctx.lineTo(-10, -10); // Middle left
          ctx.closePath();
          ctx.fill();

          // Reset shadow
          ctx.shadowColor = 'transparent';
          ctx.shadowBlur = 0;

          // Draw reinforced bow
          ctx.strokeStyle = '#3E2723'; // Very dark brown
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(0, -15, 14, Math.PI * 0.2, Math.PI * 0.8, false);
          ctx.stroke();

          // Add metal reinforcements
          ctx.fillStyle = '#9E9E9E';
          ctx.beginPath();
          ctx.arc(0, -15, 5, 0, Math.PI * 2);
          ctx.fill();

          // Draw piercing arrow with metallic effect
          // Arrow shaft
          const arrowGradient = ctx.createLinearGradient(0, -15, 0, -40);
          arrowGradient.addColorStop(0, '#795548');
          arrowGradient.addColorStop(1, '#5D4037');

          ctx.strokeStyle = arrowGradient;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(0, -15);
          ctx.lineTo(0, -40);
          ctx.stroke();

          // Piercing arrowhead
          const arrowheadGradient = ctx.createLinearGradient(0, -40, 0, -25);
          arrowheadGradient.addColorStop(0, '#E0E0E0'); // Light gray
          arrowheadGradient.addColorStop(1, '#9E9E9E'); // Darker gray

          ctx.fillStyle = arrowheadGradient;
          ctx.beginPath();
          ctx.moveTo(0, -45 - this.pathBLevel * 2);
          ctx.lineTo(5 + this.pathBLevel, -35);
          ctx.lineTo(0, -30);
          ctx.lineTo(-5 - this.pathBLevel, -35);
          ctx.closePath();
          ctx.fill();

          // Add metallic shine
          ctx.strokeStyle = '#F5F5F5';
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
        break;

      case 'cannon':
        // Apply recoil to cannon position
        const cannonRecoil = recoilOffset;

        // Flat 2D futuristic cannon design with lighter colors
        // Base tower body
        ctx.fillStyle = '#ecf0f1'; // Light gray base
        ctx.fillRect(-10, -25 + cannonRecoil, 20, 30);

        // Add colored accent based on tower color
        ctx.fillStyle = towerColor;
        ctx.fillRect(-10, -25 + cannonRecoil, 4, 30); // Left stripe
        ctx.fillRect(6, -25 + cannonRecoil, 4, 30); // Right stripe

        // Draw cannon barrel (rectangular for 2D look)
        ctx.fillStyle = '#bdc3c7'; // Light gray
        ctx.fillRect(-8, -30 + cannonRecoil, 16, 10); // Barrel

        // Draw cannon opening
        ctx.fillStyle = '#34495e'; // Dark blue-gray
        ctx.beginPath();
        ctx.arc(0, -25 + cannonRecoil, 5, 0, Math.PI * 2);
        ctx.fill();

        // Add tech details - circuit pattern
        ctx.strokeStyle = '#3498db'; // Blue accent
        ctx.lineWidth = 1;

        // Horizontal lines
        for (let i = 1; i <= 2; i++) {
          ctx.beginPath();
          ctx.moveTo(-10, -10 * i + cannonRecoil);
          ctx.lineTo(10, -10 * i + cannonRecoil);
          ctx.stroke();
        }

        // Add animated firing effect when recoil is active
        if (recoilOffset > 0) {
          ctx.fillStyle = '#e74c3c'; // Red glow
          ctx.globalAlpha = recoilOffset / 5; // Fade based on recoil
          ctx.beginPath();
          ctx.arc(0, -25 + cannonRecoil, 3, 0, Math.PI * 2);
          ctx.fill();
          ctx.globalAlpha = 1.0;
        }

        // Path A: Blast Radius - Wider cannon
        if (hasPathAUpgrades) {
          // Enhanced cannon with wider barrel
          const blastGradient = ctx.createLinearGradient(-12, -25 + cannonRecoil, 12, 0);
          blastGradient.addColorStop(0, '#5D4037'); // Darker brown
          blastGradient.addColorStop(1, '#4E342E'); // Even darker brown

          ctx.fillStyle = blastGradient;

          const width = 10 + this.pathALevel * 2;

          // Draw enhanced barrel
          ctx.beginPath();
          ctx.moveTo(-width, -25 + cannonRecoil); // Top left with recoil
          ctx.lineTo(width, -25 + cannonRecoil);  // Top right with recoil
          ctx.lineTo(width + 2, -10); // Middle right
          ctx.lineTo(width, 5);   // Bottom right
          ctx.lineTo(-width, 5);  // Bottom left
          ctx.lineTo(-width - 2, -10); // Middle left
          ctx.closePath();
          ctx.fill();

          // Draw wider cannon opening with glow
          ctx.fillStyle = '#3E2723';
          ctx.beginPath();
          ctx.arc(0, -25 + cannonRecoil, 6 + this.pathALevel, 0, Math.PI * 2);
          ctx.fill();

          // Add inner glow to opening
          ctx.fillStyle = '#FF9800';
          ctx.globalAlpha = 0.3;
          ctx.beginPath();
          ctx.arc(0, -25 + cannonRecoil, 4 + this.pathALevel, 0, Math.PI * 2);
          ctx.fill();
          ctx.globalAlpha = 1.0;
        }

        // Path B: Heavy Impact - Reinforced cannon
        if (hasPathBUpgrades) {
          // Enhanced reinforced cannon
          const heavyGradient = ctx.createLinearGradient(-10, -25 + cannonRecoil, 10, 0);
          heavyGradient.addColorStop(0, '#8D6E63'); // Light brown
          heavyGradient.addColorStop(1, '#6D4C41'); // Medium brown

          ctx.fillStyle = heavyGradient;

          // Draw reinforced barrel
          ctx.beginPath();
          ctx.moveTo(-10, -25 + cannonRecoil); // Top left with recoil
          ctx.lineTo(10, -25 + cannonRecoil);  // Top right with recoil
          ctx.lineTo(12, -10); // Middle right
          ctx.lineTo(10, 5);   // Bottom right
          ctx.lineTo(-10, 5);  // Bottom left
          ctx.lineTo(-12, -10); // Middle left
          ctx.closePath();
          ctx.fill();

          // Draw reinforcement bands
          ctx.strokeStyle = '#4E342E';
          ctx.lineWidth = 2;
          for (let i = 0; i < this.pathBLevel; i++) {
            ctx.beginPath();
            ctx.moveTo(-12, -20 + i * 10 + (i === 0 ? cannonRecoil : 0));
            ctx.lineTo(12, -20 + i * 10 + (i === 0 ? cannonRecoil : 0));
            ctx.stroke();
          }

          // Add metal rivets
          ctx.fillStyle = '#BDBDBD';
          for (let i = 0; i < this.pathBLevel * 2; i++) {
            const angle = Math.PI * 2 * (i / (this.pathBLevel * 2));
            const x = Math.cos(angle) * 8;
            const y = Math.sin(angle) * 8 - 10;

            ctx.beginPath();
            ctx.arc(x, y, 1.5, 0, Math.PI * 2);
            ctx.fill();
          }
        }
        break;

      case 'sniper':
        // Apply recoil to sniper position
        const sniperRecoil = recoilOffset * 0.6;

        // Base tower body with enhanced design
        const sniperGradient = ctx.createLinearGradient(-6, -30 + sniperRecoil, 6, 0);
        sniperGradient.addColorStop(0, '#2196F3'); // Blue
        sniperGradient.addColorStop(1, '#1976D2'); // Darker blue

        ctx.fillStyle = sniperGradient;

        // Draw sniper barrel with better shape
        ctx.beginPath();
        ctx.moveTo(-6, -30 + sniperRecoil); // Top left with recoil
        ctx.lineTo(6, -30 + sniperRecoil);  // Top right with recoil
        ctx.lineTo(8, -15); // Middle right
        ctx.lineTo(6, 5);   // Bottom right
        ctx.lineTo(-6, 5);  // Bottom left
        ctx.lineTo(-8, -15); // Middle left
        ctx.closePath();
        ctx.fill();

        // Add barrel details
        ctx.strokeStyle = '#0D47A1';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(-6, -20 + sniperRecoil);
        ctx.lineTo(6, -20 + sniperRecoil);
        ctx.stroke();

        // Path A: Precision - Longer, thinner barrel
        if (hasPathAUpgrades) {
          // Enhanced precision barrel
          const precisionGradient = ctx.createLinearGradient(-4, -35 - this.pathALevel * 5 + sniperRecoil, 4, 0);
          precisionGradient.addColorStop(0, '#1565C0'); // Medium blue
          precisionGradient.addColorStop(1, '#0D47A1'); // Dark blue

          ctx.fillStyle = precisionGradient;
          ctx.fillRect(-4, -35 - this.pathALevel * 5 + sniperRecoil, 8, 35 + this.pathALevel * 5);

          // Draw enhanced scope
          const scopeGradient = ctx.createRadialGradient(0, -15, 1, 0, -15, 5);
          scopeGradient.addColorStop(0, '#0D47A1'); // Dark blue
          scopeGradient.addColorStop(1, '#01579B'); // Very dark blue

          ctx.fillStyle = scopeGradient;
          ctx.beginPath();
          ctx.arc(0, -15, 5, 0, Math.PI * 2);
          ctx.fill();

          // Draw enhanced crosshairs
          ctx.strokeStyle = '#E3F2FD';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(-4, -15);
          ctx.lineTo(4, -15);
          ctx.moveTo(0, -19);
          ctx.lineTo(0, -11);
          ctx.stroke();

          // Add scope lens reflection
          ctx.fillStyle = '#FFFFFF';
          ctx.globalAlpha = 0.4;
          ctx.beginPath();
          ctx.arc(-1, -16, 2, 0, Math.PI * 2);
          ctx.fill();
          ctx.globalAlpha = 1.0;
        }

        // Path B: Long Range - Stabilized platform
        if (hasPathBUpgrades) {
          // Enhanced stabilized platform
          const stabilizedGradient = ctx.createLinearGradient(-6, -30 + sniperRecoil, 6, 0);
          stabilizedGradient.addColorStop(0, '#0277BD'); // Medium blue
          stabilizedGradient.addColorStop(1, '#01579B'); // Dark blue

          ctx.fillStyle = stabilizedGradient;
          ctx.fillRect(-6, -30 + sniperRecoil, 12, 30);

          // Draw enhanced stabilizers
          const stabilizerGradient = ctx.createRadialGradient(0, 0, 5, 0, 0, 15);
          stabilizerGradient.addColorStop(0, '#01579B'); // Dark blue
          stabilizerGradient.addColorStop(1, '#0D47A1'); // Darker blue

          ctx.fillStyle = stabilizerGradient;

          for (let i = 0; i < this.pathBLevel; i++) {
            const angle = Math.PI / 4 + (Math.PI / 2) * i;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(
              Math.cos(angle) * 15,
              Math.sin(angle) * 15
            );
            ctx.lineTo(
              Math.cos(angle) * 15 + Math.cos(angle + Math.PI/2) * 5,
              Math.sin(angle) * 15 + Math.sin(angle + Math.PI/2) * 5
            );
            ctx.closePath();
            ctx.fill();

            // Add metallic highlights
            ctx.strokeStyle = '#64B5F6';
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }

          // Add targeting computer
          if (this.pathBLevel >= 2) {
            ctx.fillStyle = '#E3F2FD';
            ctx.fillRect(-3, -10, 6, 5);

            // Add blinking light
            const blinkState = Math.floor(currentTime / 500) % 2 === 0;
            ctx.fillStyle = blinkState ? '#F44336' : '#4CAF50';
            ctx.beginPath();
            ctx.arc(0, -7, 1, 0, Math.PI * 2);
            ctx.fill();
          }
        }
        break;

      case 'archangel':
        // Archangel tower with divine effects
        // Use the existing scaleFactor from the class

        // Base tower body with enhanced design
        const archangelGradient = ctx.createLinearGradient(
          -8 * scaleFactor, -25 * scaleFactor,
          8 * scaleFactor, 0
        );
        archangelGradient.addColorStop(0, '#FFEB3B'); // Yellow
        archangelGradient.addColorStop(1, '#FFC107'); // Amber

        ctx.fillStyle = archangelGradient;

        // Draw archangel tower base
        ctx.beginPath();
        ctx.moveTo(-12 * scaleFactor, -5 * scaleFactor);
        ctx.lineTo(-10 * scaleFactor, -25 * scaleFactor);
        ctx.lineTo(10 * scaleFactor, -25 * scaleFactor);
        ctx.lineTo(12 * scaleFactor, -5 * scaleFactor);
        ctx.closePath();
        ctx.fill();

        // Draw wings
        ctx.fillStyle = '#FFFFFF';

        // Left wing
        ctx.beginPath();
        ctx.moveTo(-5 * scaleFactor, -25 * scaleFactor);
        ctx.quadraticCurveTo(
          -20 * scaleFactor, -35 * scaleFactor,
          -25 * scaleFactor, -15 * scaleFactor
        );
        ctx.quadraticCurveTo(
          -15 * scaleFactor, -20 * scaleFactor,
          -10 * scaleFactor, -15 * scaleFactor
        );
        ctx.closePath();
        ctx.fill();

        // Right wing
        ctx.beginPath();
        ctx.moveTo(5 * scaleFactor, -25 * scaleFactor);
        ctx.quadraticCurveTo(
          20 * scaleFactor, -35 * scaleFactor,
          25 * scaleFactor, -15 * scaleFactor
        );
        ctx.quadraticCurveTo(
          15 * scaleFactor, -20 * scaleFactor,
          10 * scaleFactor, -15 * scaleFactor
        );
        ctx.closePath();
        ctx.fill();

        // Draw halo
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 2 * scaleFactor;
        ctx.beginPath();
        ctx.arc(0, -35 * scaleFactor, 8 * scaleFactor, 0, Math.PI * 2);
        ctx.stroke();

        // Add glow effect
        const timeInSec = currentTime / 1000;
        const glowIntensity = 0.3 + Math.sin(timeInSec * 2) * 0.2;

        ctx.fillStyle = '#FFEB3B';
        ctx.globalAlpha = glowIntensity;
        ctx.beginPath();
        ctx.arc(0, -25 * scaleFactor, 15 * scaleFactor, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;

        // Add pulsing effect
        const pulseSize = (10 + Math.sin(timeInSec * 0.5) * 2) * scaleFactor;
        ctx.globalAlpha = 0.2;
        ctx.beginPath();
        ctx.arc(0, -25 * scaleFactor, pulseSize, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;

        // Draw divine light rays
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = scaleFactor;

        for (let i = 0; i < 12; i++) { // Increased from 8 to 12 rays
          const angle = Math.PI * 2 * (i / 12) + timeInSec % (Math.PI * 2);
          const length = (20 + Math.sin(timeInSec * 3 + i) * 5) * scaleFactor;

          ctx.beginPath();
          ctx.moveTo(0, -25 * scaleFactor);
          ctx.lineTo(
            Math.cos(angle) * length,
            -25 * scaleFactor + Math.sin(angle) * length
          );
          ctx.stroke();
        }
        break;

      case 'seraphim':
        // Seraphim tower with six wings and heavenly fire
        // Use the existing scaleFactor from the class

        // Base tower body with enhanced design
        const seraphimGradient = ctx.createLinearGradient(
          -8 * scaleFactor, -25 * scaleFactor,
          8 * scaleFactor, 0
        );
        seraphimGradient.addColorStop(0, '#FF9800'); // Orange
        seraphimGradient.addColorStop(1, '#F57C00'); // Dark orange

        ctx.fillStyle = seraphimGradient;

        // Draw seraphim tower base
        ctx.beginPath();
        ctx.moveTo(-12 * scaleFactor, -5 * scaleFactor);
        ctx.lineTo(-10 * scaleFactor, -25 * scaleFactor);
        ctx.lineTo(10 * scaleFactor, -25 * scaleFactor);
        ctx.lineTo(12 * scaleFactor, -5 * scaleFactor);
        ctx.closePath();
        ctx.fill();

        // Draw six wings (three pairs)
        ctx.fillStyle = '#FFFFFF';

        // Top wing pair
        // Left top wing
        ctx.beginPath();
        ctx.moveTo(-5 * scaleFactor, -25 * scaleFactor);
        ctx.quadraticCurveTo(
          -25 * scaleFactor, -45 * scaleFactor,
          -30 * scaleFactor, -25 * scaleFactor
        );
        ctx.quadraticCurveTo(
          -20 * scaleFactor, -30 * scaleFactor,
          -10 * scaleFactor, -25 * scaleFactor
        );
        ctx.closePath();
        ctx.fill();

        // Right top wing
        ctx.beginPath();
        ctx.moveTo(5 * scaleFactor, -25 * scaleFactor);
        ctx.quadraticCurveTo(
          25 * scaleFactor, -45 * scaleFactor,
          30 * scaleFactor, -25 * scaleFactor
        );
        ctx.quadraticCurveTo(
          20 * scaleFactor, -30 * scaleFactor,
          10 * scaleFactor, -25 * scaleFactor
        );
        ctx.closePath();
        ctx.fill();

        // Middle wing pair
        // Left middle wing
        ctx.beginPath();
        ctx.moveTo(-5 * scaleFactor, -20 * scaleFactor);
        ctx.quadraticCurveTo(
          -30 * scaleFactor, -30 * scaleFactor,
          -35 * scaleFactor, -10 * scaleFactor
        );
        ctx.quadraticCurveTo(
          -25 * scaleFactor, -15 * scaleFactor,
          -15 * scaleFactor, -10 * scaleFactor
        );
        ctx.closePath();
        ctx.fill();

        // Right middle wing
        ctx.beginPath();
        ctx.moveTo(5 * scaleFactor, -20 * scaleFactor);
        ctx.quadraticCurveTo(
          30 * scaleFactor, -30 * scaleFactor,
          35 * scaleFactor, -10 * scaleFactor
        );
        ctx.quadraticCurveTo(
          25 * scaleFactor, -15 * scaleFactor,
          15 * scaleFactor, -10 * scaleFactor
        );
        ctx.closePath();
        ctx.fill();

        // Bottom wing pair
        // Left bottom wing
        ctx.beginPath();
        ctx.moveTo(-5 * scaleFactor, -15 * scaleFactor);
        ctx.quadraticCurveTo(
          -25 * scaleFactor, -10 * scaleFactor,
          -30 * scaleFactor, 5 * scaleFactor
        );
        ctx.quadraticCurveTo(
          -20 * scaleFactor, 0 * scaleFactor,
          -10 * scaleFactor, 0 * scaleFactor
        );
        ctx.closePath();
        ctx.fill();

        // Right bottom wing
        ctx.beginPath();
        ctx.moveTo(5 * scaleFactor, -15 * scaleFactor);
        ctx.quadraticCurveTo(
          25 * scaleFactor, -10 * scaleFactor,
          30 * scaleFactor, 5 * scaleFactor
        );
        ctx.quadraticCurveTo(
          20 * scaleFactor, 0 * scaleFactor,
          10 * scaleFactor, 0 * scaleFactor
        );
        ctx.closePath();
        ctx.fill();

        // Draw halo
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 2 * scaleFactor;
        ctx.beginPath();
        ctx.arc(0, -35 * scaleFactor, 10 * scaleFactor, 0, Math.PI * 2);
        ctx.stroke();

        // Add heavenly fire effect
        const fireColors = ['#FF9800', '#FFEB3B', '#FFFFFF'];

        for (let i = 0; i < 15; i++) {
          const angle = Math.PI * 2 * (i / 15) + (timeInSec * 0.5) % (Math.PI * 2);
          const length = (15 + Math.sin(timeInSec * 2 + i) * 5) * scaleFactor;
          const colorIndex = i % fireColors.length;

          ctx.strokeStyle = fireColors[colorIndex];
          ctx.lineWidth = (1 + Math.random()) * scaleFactor;
          ctx.globalAlpha = 0.7 + Math.random() * 0.3;

          ctx.beginPath();
          ctx.moveTo(0, -25 * scaleFactor);

          // Create flame-like path
          let x = 0;
          let y = -25 * scaleFactor;
          const segments = 3;

          for (let j = 0; j < segments; j++) {
            const segLength = length / segments;
            const jitter = 5 - j * 1.5;

            x += Math.cos(angle + j * 0.2) * segLength + (Math.sin(timeInSec * 5 + i) - 0.5) * jitter;
            y += Math.sin(angle + j * 0.2) * segLength + (Math.cos(timeInSec * 5 + i) - 0.5) * jitter;

            ctx.lineTo(x, y);
          }

          ctx.stroke();
        }
        ctx.globalAlpha = 1.0;

        // Add glow effect
        ctx.fillStyle = '#FF9800';
        ctx.globalAlpha = 0.3 + Math.sin(timeInSec) * 0.1;
        ctx.beginPath();
        ctx.arc(0, -25 * scaleFactor, 20 * scaleFactor, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;
        break;

      case 'demonLord':
        // Demon Lord tower with horns and hellfire
        // Use the existing scaleFactor from the class
        
        // Calculate time in seconds for animations

        // Base tower body with enhanced design
        const demonLordGradient = ctx.createLinearGradient(
          -8 * scaleFactor, -25 * scaleFactor,
          8 * scaleFactor, 0
        );
        demonLordGradient.addColorStop(0, '#F44336'); // Red
        demonLordGradient.addColorStop(1, '#D32F2F'); // Dark red

        ctx.fillStyle = demonLordGradient;

        // Draw demon lord tower base
        ctx.beginPath();
        ctx.moveTo(-12 * scaleFactor, -5 * scaleFactor);
        ctx.lineTo(-10 * scaleFactor, -25 * scaleFactor);
        ctx.lineTo(10 * scaleFactor, -25 * scaleFactor);
        ctx.lineTo(12 * scaleFactor, -5 * scaleFactor);
        ctx.closePath();
        ctx.fill();

        // Draw horns
        ctx.fillStyle = '#212121'; // Dark gray

        // Left horn
        ctx.beginPath();
        ctx.moveTo(-5 * scaleFactor, -25 * scaleFactor);
        ctx.quadraticCurveTo(
          -10 * scaleFactor, -40 * scaleFactor,
          -15 * scaleFactor, -45 * scaleFactor
        );
        ctx.quadraticCurveTo(
          -12 * scaleFactor, -35 * scaleFactor,
          -8 * scaleFactor, -25 * scaleFactor
        );
        ctx.closePath();
        ctx.fill();

        // Right horn
        ctx.beginPath();
        ctx.moveTo(5 * scaleFactor, -25 * scaleFactor);
        ctx.quadraticCurveTo(
          10 * scaleFactor, -40 * scaleFactor,
          15 * scaleFactor, -45 * scaleFactor
        );
        ctx.quadraticCurveTo(
          12 * scaleFactor, -35 * scaleFactor,
          8 * scaleFactor, -25 * scaleFactor
        );
        ctx.closePath();
        ctx.fill();

        // Draw demonic eyes
        ctx.fillStyle = '#FF5722'; // Orange

        // Left eye
        ctx.beginPath();
        ctx.arc(-5 * scaleFactor, -20 * scaleFactor, 2 * scaleFactor, 0, Math.PI * 2);
        ctx.fill();

        // Right eye
        ctx.beginPath();
        ctx.arc(5 * scaleFactor, -20 * scaleFactor, 2 * scaleFactor, 0, Math.PI * 2);
        ctx.fill();

        // Add hellfire effect
        const hellColors = ['#F44336', '#FF5722', '#FF9800'];

        for (let i = 0; i < 12; i++) {
          const angle = Math.PI * 2 * (i / 12) + (timeInSec * 0.7) % (Math.PI * 2);
          const length = (12 + Math.sin(timeInSec * 3 + i) * 4) * scaleFactor;
          const colorIndex = i % hellColors.length;

          ctx.fillStyle = hellColors[colorIndex];
          ctx.globalAlpha = 0.6 + Math.random() * 0.4;

          // Create flame shape
          ctx.beginPath();
          ctx.moveTo(0, -15 * scaleFactor);
          ctx.lineTo(
            Math.cos(angle - 0.2) * length * 0.5,
            -15 * scaleFactor + Math.sin(angle - 0.2) * length * 0.5
          );
          ctx.lineTo(
            Math.cos(angle) * length,
            -15 * scaleFactor + Math.sin(angle) * length
          );
          ctx.lineTo(
            Math.cos(angle + 0.2) * length * 0.5,
            -15 * scaleFactor + Math.sin(angle + 0.2) * length * 0.5
          );
          ctx.closePath();
          ctx.fill();
        }
        ctx.globalAlpha = 1.0;

        // Add pentagram effect
        if (this.lastSpecialAbilityTime > 0 && currentTime - this.lastSpecialAbilityTime < 2000) {
          const progress = (currentTime - this.lastSpecialAbilityTime) / 2000;

          ctx.strokeStyle = '#F44336';
          ctx.lineWidth = 1 * scaleFactor;
          ctx.globalAlpha = 1 - progress;

          // Draw pentagram
          ctx.beginPath();
          const pentaRadius = (20 + progress * 10) * scaleFactor;
          for (let i = 0; i < 5; i++) {
            const angle1 = Math.PI * 2 * (i / 5) - Math.PI / 2;
            const angle2 = Math.PI * 2 * ((i + 2) % 5 / 5) - Math.PI / 2;

            if (i === 0) {
              ctx.moveTo(
                Math.cos(angle1) * pentaRadius,
                -15 * scaleFactor + Math.sin(angle1) * pentaRadius
              );
            }

            ctx.lineTo(
              Math.cos(angle2) * pentaRadius,
              -15 * scaleFactor + Math.sin(angle2) * pentaRadius
            );
          }
          ctx.closePath();
          ctx.stroke();
          ctx.globalAlpha = 1.0;
        }

        // Path A: Divine Wrath - More offensive appearance
        if (hasPathAUpgrades) {
          // Enhanced divine appearance
          ctx.fillStyle = '#FFD700'; // Gold

          // Draw enhanced wings
          // Left wing
          ctx.beginPath();
          ctx.moveTo(-5 * scaleFactor, -25 * scaleFactor);
          ctx.quadraticCurveTo(
            -25 * scaleFactor, -40 * scaleFactor,
            -30 * scaleFactor, -15 * scaleFactor
          );
          ctx.quadraticCurveTo(
            -20 * scaleFactor, -20 * scaleFactor,
            -10 * scaleFactor, -15 * scaleFactor
          );
          ctx.closePath();
          ctx.fill();

          // Right wing
          ctx.beginPath();
          ctx.moveTo(5 * scaleFactor, -25 * scaleFactor);
          ctx.quadraticCurveTo(
            25 * scaleFactor, -40 * scaleFactor,
            30 * scaleFactor, -15 * scaleFactor
          );
          ctx.quadraticCurveTo(
            20 * scaleFactor, -20 * scaleFactor,
            10 * scaleFactor, -15 * scaleFactor
          );
          ctx.closePath();
          ctx.fill();

          // Draw divine sword
          ctx.fillStyle = '#FFFFFF';
          ctx.beginPath();
          ctx.moveTo(0, -40 * scaleFactor);
          ctx.lineTo(-3 * scaleFactor, -25 * scaleFactor);
          ctx.lineTo(0, -10 * scaleFactor);
          ctx.lineTo(3 * scaleFactor, -25 * scaleFactor);
          ctx.closePath();
          ctx.fill();

          // Add sword glow
          ctx.strokeStyle = '#FFD700';
          ctx.lineWidth = scaleFactor;
          ctx.stroke();

          // Add energy particles
          for (let i = 0; i < 5; i++) {
            const angle = Math.random() * Math.PI * 2;
            const distance = Math.random() * 15 * scaleFactor;

            ctx.fillStyle = '#FFFFFF';
            ctx.globalAlpha = 0.7 * Math.random();
            ctx.beginPath();
            ctx.arc(
              Math.cos(angle) * distance,
              -25 * scaleFactor + Math.sin(angle) * distance,
              scaleFactor * Math.random() * 2,
              0,
              Math.PI * 2
            );
            ctx.fill();
          }
          ctx.globalAlpha = 1.0;
        }

        // Path B: Blessing Aura - More supportive appearance
        if (hasPathBUpgrades) {
          // Calculate time in seconds for animations
          const timeInSec = currentTime / 1000;
          
          // Calculate scaled buff radius
          const scaledBuffRadius = (20 + this.pathBLevel * 5) * scaleFactor;

          // Enhanced supportive appearance
          ctx.fillStyle = '#E3F2FD'; // Light blue

          // Draw aura circle
          ctx.globalAlpha = 0.3;
          ctx.beginPath();
          ctx.arc(0, -15 * scaleFactor, scaledBuffRadius, 0, Math.PI * 2);
          ctx.fill();
          ctx.globalAlpha = 1.0;

          // Draw blessing symbols
          ctx.strokeStyle = '#2196F3';
          ctx.lineWidth = scaleFactor;

          for (let i = 0; i < this.pathBLevel; i++) {
            const angle = Math.PI * 2 * (i / this.pathBLevel) + timeInSec % (Math.PI * 2);
            const distance = 15 * scaleFactor;
            const x = Math.cos(angle) * distance;
            const y = -15 * scaleFactor + Math.sin(angle) * distance;

            // Draw small cross
            ctx.beginPath();
            ctx.moveTo(x - 3 * scaleFactor, y);
            ctx.lineTo(x + 3 * scaleFactor, y);
            ctx.moveTo(x, y - 3 * scaleFactor);
            ctx.lineTo(x, y + 3 * scaleFactor);
            ctx.stroke();
          }

          // Add pulsing aura effect
          const auraSize = (15 + Math.sin(timeInSec * 0.5) * 3 + this.pathBLevel * 3) * scaleFactor;
          ctx.globalAlpha = 0.1 + Math.sin(timeInSec * 0.5) * 0.05;
          ctx.fillStyle = '#E3F2FD';
          ctx.beginPath();
          ctx.arc(0, -15 * scaleFactor, auraSize, 0, Math.PI * 2);
          ctx.fill();
          ctx.globalAlpha = 1.0;
        }
        break;

      case 'tesla':
        // Tesla tower with electricity effects
        // Base tower body with enhanced design
        const teslaGradient = ctx.createLinearGradient(-8, -25, 8, 0);
        teslaGradient.addColorStop(0, '#FFC107'); // Yellow
        teslaGradient.addColorStop(1, '#FFA000'); // Amber

        ctx.fillStyle = teslaGradient;

        // Draw tesla coil base
        ctx.beginPath();
        ctx.moveTo(-10, -5);
        ctx.lineTo(-8, -25);
        ctx.lineTo(8, -25);
        ctx.lineTo(10, -5);
        ctx.closePath();
        ctx.fill();

        // Draw tesla coil top
        ctx.fillStyle = '#F57F17';
        ctx.beginPath();
        ctx.arc(0, -25, 6, 0, Math.PI * 2);
        ctx.fill();

        // Draw metal bands
        ctx.strokeStyle = '#BDBDBD';
        ctx.lineWidth = 1;
        for (let i = 0; i < 3; i++) {
          ctx.beginPath();
          ctx.moveTo(-10 + i * 2, -5 - i * 6);
          ctx.lineTo(10 - i * 2, -5 - i * 6);
          ctx.stroke();
        }

        // Add electricity effects - animated based on time
        if (this.recoilAnimation > 0 || Math.random() < 0.1) {
          ctx.strokeStyle = '#FFEB3B';
          ctx.lineWidth = 1;
          ctx.globalAlpha = 0.7;

          const timeInSec = currentTime / 1000;
          const boltCount = this.recoilAnimation > 0 ? 4 : 1;

          for (let i = 0; i < boltCount; i++) {
            const angle = (timeInSec * 5 + i * Math.PI/2) % (Math.PI * 2);
            const length = 8 + Math.sin(timeInSec * 3) * 4;

            ctx.beginPath();
            ctx.moveTo(0, -25);

            // Create zigzag lightning path
            let x = 0;
            let y = -25;
            const segments = 3;

            for (let j = 0; j < segments; j++) {
              const segLength = length / segments;
              const jitter = 3 - j * 0.5;

              x += Math.cos(angle + j * 0.5) * segLength + (Math.sin(timeInSec * 10 + i) - 0.5) * jitter;
              y += Math.sin(angle + j * 0.5) * segLength + (Math.cos(timeInSec * 10 + i) - 0.5) * jitter;

              ctx.lineTo(x, y);
            }

            ctx.stroke();
          }

          ctx.globalAlpha = 1.0;
        }

        // Path A: Chain Lightning
        if (hasPathAUpgrades) {
          // Enhanced tesla coil with more electricity
          const chainGradient = ctx.createLinearGradient(-8, -25, 8, 0);
          chainGradient.addColorStop(0, '#FFEB3B'); // Yellow
          chainGradient.addColorStop(1, '#FFC107'); // Amber

          ctx.fillStyle = chainGradient;

          // Draw enhanced tesla coil base
          ctx.beginPath();
          ctx.moveTo(-10, -5);
          ctx.lineTo(-8, -25);
          ctx.lineTo(8, -25);
          ctx.lineTo(10, -5);
          ctx.closePath();
          ctx.fill();

          // Draw enhanced tesla coil top
          ctx.fillStyle = '#F57F17';
          ctx.beginPath();
          ctx.arc(0, -25, 6, 0, Math.PI * 2);
          ctx.fill();

          // Add glow effect
          ctx.fillStyle = '#FFEB3B';
          ctx.globalAlpha = 0.3;
          ctx.beginPath();
          ctx.arc(0, -25, 10, 0, Math.PI * 2);
          ctx.fill();
          ctx.globalAlpha = 1.0;

          // Add chain lightning indicators
          ctx.strokeStyle = '#FFEB3B';
          ctx.lineWidth = 1;

          for (let i = 0; i < this.pathALevel; i++) {
            const angle = Math.PI * 2 * (i / this.pathALevel);
            const timeInSec = currentTime / 1000;

            ctx.beginPath();
            ctx.moveTo(0, -25);

            // Create zigzag lightning path
            let x = 0;
            let y = -25;
            const segments = 3;
            const length = 12 + this.pathALevel * 2;

            for (let j = 0; j < segments; j++) {
              const segLength = length / segments;
              const jitter = 3 - j * 0.5;

              x += Math.cos(angle + timeInSec % 1) * segLength + (Math.sin(timeInSec * 5 + i) - 0.5) * jitter;
              y += Math.sin(angle + timeInSec % 1) * segLength + (Math.cos(timeInSec * 5 + i) - 0.5) * jitter;

              ctx.lineTo(x, y);
            }

            ctx.stroke();
          }
        }

        // Path B: Overcharge
        if (hasPathBUpgrades) {
          // Enhanced overcharged tesla coil
          const overchargeGradient = ctx.createLinearGradient(-8, -25, 8, 0);
          overchargeGradient.addColorStop(0, '#FFC107'); // Amber
          overchargeGradient.addColorStop(1, '#FF9800'); // Orange

          ctx.fillStyle = overchargeGradient;

          // Draw enhanced tesla coil base
          ctx.beginPath();
          ctx.moveTo(-12, -5);
          ctx.lineTo(-10, -25);
          ctx.lineTo(10, -25);
          ctx.lineTo(12, -5);
          ctx.closePath();
          ctx.fill();

          // Draw enhanced tesla coil top
          const coilGradient = ctx.createRadialGradient(0, -25, 2, 0, -25, 8);
          coilGradient.addColorStop(0, '#FFEB3B'); // Yellow
          coilGradient.addColorStop(1, '#F57F17'); // Dark amber

          ctx.fillStyle = coilGradient;
          ctx.beginPath();
          ctx.arc(0, -25, 8, 0, Math.PI * 2);
          ctx.fill();

          // Add pulsing glow effect based on time
          const timeInSec = currentTime / 1000;
          const pulseSize = 8 + Math.sin(timeInSec * 4) * 3;

          ctx.fillStyle = '#FFEB3B';
          ctx.globalAlpha = 0.3 + Math.sin(timeInSec * 4) * 0.2;
          ctx.beginPath();
          ctx.arc(0, -25, pulseSize, 0, Math.PI * 2);
          ctx.fill();
          ctx.globalAlpha = 1.0;

          // Add capacitor banks based on upgrade level
          for (let i = 0; i < this.pathBLevel; i++) {
            const angle = Math.PI / 2 + Math.PI * (i / this.pathBLevel);
            const x = Math.cos(angle) * 12;
            const y = Math.sin(angle) * 12 - 5;

            // Draw capacitor
            ctx.fillStyle = '#BDBDBD';
            ctx.fillRect(x - 2, y - 4, 4, 8);

            // Add blinking light
            const blinkState = Math.floor((timeInSec * 3 + i) % 2);
            ctx.fillStyle = blinkState ? '#4CAF50' : '#FFEB3B';
            ctx.beginPath();
            ctx.arc(x, y - 4, 1, 0, Math.PI * 2);
            ctx.fill();
          }
        }
        break;

      default:
        // Default tower body
        ctx.fillStyle = this.color;
        ctx.fillRect(-8, -25, 16, 25);

        // Draw upgrades if any
        if (hasPathAUpgrades || hasPathBUpgrades) {
          // Add a glow effect for upgraded towers
          ctx.fillStyle = hasPathAUpgrades ? '#FFA000' : '#7B1FA2';
          ctx.globalAlpha = 0.6;
          ctx.beginPath();
          ctx.arc(0, -25, 10, 0, Math.PI * 2);
          ctx.fill();
          ctx.globalAlpha = 1.0;
        }
        break;
    }

    // Tower head (common for all types)
    ctx.fillStyle = hasPathAUpgrades ? '#FFB300' : (hasPathBUpgrades ? '#9C27B0' : this.color);
    ctx.beginPath();
    ctx.arc(0, -25, 8, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    // Draw upgrade path indicators
    if (this.pathALevel > 0) {
      for (let i = 0; i < this.pathALevel; i++) {
        ctx.fillStyle = '#FFC107'; // Yellow for path A
        ctx.beginPath();
        ctx.arc(
          this.x + 15 * Math.cos(Math.PI * 2 * (i / 4) - Math.PI / 4),
          this.y + 15 * Math.sin(Math.PI * 2 * (i / 4) - Math.PI / 4),
          4,
          0,
          Math.PI * 2
        );
        ctx.fill();
      }
    }

    if (this.pathBLevel > 0) {
      for (let i = 0; i < this.pathBLevel; i++) {
        ctx.fillStyle = '#9C27B0'; // Purple for path B
        ctx.beginPath();
        ctx.arc(
          this.x + 15 * Math.cos(Math.PI * 2 * (i / 4) + Math.PI / 4),
          this.y + 15 * Math.sin(Math.PI * 2 * (i / 4) + Math.PI / 4),
          4,
          0,
          Math.PI * 2
        );
        ctx.fill();
      }
    }

    // Draw tower type indicator
    ctx.fillStyle = '#fff';
    ctx.font = '10px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    let typeIndicator;
    switch (this.type) {
      case 'sniper': typeIndicator = 'S'; break;
      case 'archer': typeIndicator = 'A'; break;
      case 'cannon': typeIndicator = 'C'; break;
      case 'freeze': typeIndicator = 'F'; break;
      case 'mortar': typeIndicator = 'M'; break;
      case 'laser': typeIndicator = 'L'; break;
      case 'tesla': typeIndicator = 'T'; break;
      case 'flame': typeIndicator = 'F'; break;
      case 'missile': typeIndicator = 'M'; break;
      case 'poison': typeIndicator = 'P'; break;
      case 'vortex': typeIndicator = 'V'; break;
      case 'archangel': typeIndicator = 'AA'; break;
      case 'basic': typeIndicator = 'B'; break;
      default: typeIndicator = this.type.charAt(0).toUpperCase(); break;
    }

    ctx.fillText(typeIndicator, this.x, this.y);

    // Draw buff indicator if tower is buffed
    if (this.buffed) {
      // Calculate buff percentages
      let buffText = '';

      if (this.originalDamage) {
        const damageBoost = Math.round((this.damage / this.originalDamage - 1) * 100);
        if (damageBoost > 0) {
          buffText += `+${damageBoost}% DMG`;
        }
      }

      if (this.originalRange) {
        const rangeBoost = Math.round((this.range / this.originalRange - 1) * 100);
        if (rangeBoost > 0) {
          if (buffText) buffText += '\n';
          buffText += `+${rangeBoost}% RNG`;
        }
      }

      if (buffText) {
        // Draw buff text with golden glow
        ctx.save();

        // Draw glow around tower
        ctx.globalAlpha = 0.3;
        ctx.fillStyle = '#FFEB3B';
        ctx.beginPath();
        ctx.arc(this.x, this.y, 25, 0, Math.PI * 2);
        ctx.fill();

        // Draw buff text
        ctx.globalAlpha = 1.0;
        ctx.fillStyle = '#FFEB3B';
        ctx.font = '9px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';

        // Split text into lines
        const lines = buffText.split('\n');
        lines.forEach((line, index) => {
          ctx.fillText(line, this.x, this.y + 10 + index * 10);
        });

        ctx.restore();
      }
    }
  }

  // Update the tower state
  update(currentTime, enemies, projectiles, towers = []) {
    // Find a target if we don't have one or if it's dead
    if (!this.target || !this.target.alive) {
      this.findTarget(enemies, currentTime);
    }

    // Check if target is still in range
    if (this.target && this.target.alive) {
      const dist = distance(this.x, this.y, this.target.x, this.target.y);
      if (dist > this.range) {
        this.target = null;
        this.findTarget(enemies, currentTime);
      }
    }

    // Special handling for Archangel tower - apply buffs to nearby towers
    if (this.type === 'archangel' && currentTime - this.lastBuffTime >= this.buffInterval) {
      this.applyBuffsToNearbyTowers(towers);
      this.lastBuffTime = currentTime;
    }

    // Shoot if we have a target and cooldown has passed
    if (this.target && this.target.alive && currentTime - this.lastShot >= this.cooldown) {
      this.shoot(currentTime, projectiles);
      this.lastShot = currentTime;

      // Start recoil animation
      this.recoilAnimation = 1;
    }

    // Update recoil animation
    if (this.recoilAnimation > 0) {
      this.recoilAnimation -= 0.1;
      if (this.recoilAnimation < 0) this.recoilAnimation = 0;
    }

    // Update animation time
    this.animationTime = currentTime;
  }

  // Apply buffs to nearby towers (Archangel special ability)
  applyBuffsToNearbyTowers(towers) {
    if (this.type !== 'archangel' || !this.buffRadius) return;

    // Reset buffs on previously buffed towers that are no longer in range
    if (this.buffedTowers && this.buffedTowers.length > 0) {
      for (const tower of this.buffedTowers) {
        const dist = distance(this.x, this.y, tower.x, tower.y);
        if (dist > this.buffRadius) {
          this.resetBuffs(tower);
        }
      }
    }

    // Reset buffed towers list
    this.buffedTowers = [];

    // Find towers within buff radius
    for (const tower of towers) {
      // Don't buff self
      if (tower === this) continue;

      const dist = distance(this.x, this.y, tower.x, tower.y);
      if (dist <= this.buffRadius) {
        // Apply buffs
        this.buffTower(tower);
        this.buffedTowers.push(tower);
      }
    }
  }

  // Reset buffs on a tower
  resetBuffs(tower) {
    // Reset damage
    if (tower.originalDamage) {
      tower.damage = tower.originalDamage;
      tower.originalDamage = null;
    }

    // Reset range
    if (tower.originalRange) {
      tower.range = tower.originalRange;
      tower.originalRange = null;
    }

    // Reset buffed flag
    tower.buffed = false;
  }

  // Apply buff to a specific tower
  buffTower(tower) {
    // Set the buffed flag
    tower.buffed = true;

    // Apply damage buff
    if (this.buffDamage) {
      // Store original damage if not already stored
      if (!tower.originalDamage) {
        tower.originalDamage = tower.damage;
      }

      // Apply buff
      tower.damage = Math.floor(tower.originalDamage * (1 + this.buffDamage));
    }

    // Apply range buff
    if (this.buffRange) {
      // Store original range if not already stored
      if (!tower.originalRange) {
        tower.originalRange = tower.range;
      }

      // Apply buff
      tower.range = Math.floor(tower.originalRange * (1 + this.buffRange));
    }

    // Tower is now buffed
  }
}

// Make Tower class available globally
window.Tower = Tower;