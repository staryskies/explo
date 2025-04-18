/**
 * Tower class for the tower defense game
 */
// Log that tower.js is loaded
console.log('Tower class loaded');

class Tower {
  constructor(x, y, type = 'basic', gridX, gridY, variant = null) {
    this.x = x;
    this.y = y;
    this.gridX = gridX; // Store grid coordinates for tower removal
    this.gridY = gridY;
    this.type = type;
    this.variant = variant; // Store the tower skin variant
    this.level = 1;
    this.target = null;
    this.angle = 0;
    this.lastShot = 0;

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
      toxic: '#8BC34A'
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
        break;
      case 'crystal':
        this.range *= 1.15; // 15% more range
        break;
      case 'shadow':
        this.fireRate *= 1.2; // 20% faster firing
        this.cooldown = 1000 / this.fireRate;
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
        break;

      // Cannon tower variants
      case 'double':
        this.extraShots = 1; // Fires two cannonballs
        break;
      case 'heavy':
        this.damage *= 1.5; // 50% more damage
        this.fireRate *= 0.8; // 20% slower firing
        this.cooldown = 1000 / this.fireRate;
        break;
      case 'explosive':
        this.aoeRadius *= 1.3; // 30% larger explosion radius
        break;

      // Sniper tower variants
      case 'rapid':
        this.fireRate *= 1.5; // 50% faster firing
        this.cooldown = 1000 / this.fireRate;
        this.damage *= 0.8; // 20% less damage
        break;
      case 'stealth':
        this.critChance += 0.2; // +20% crit chance
        break;
      case 'railgun':
        this.damage *= 1.8; // 80% more damage
        this.fireRate *= 0.6; // 40% slower firing
        this.cooldown = 1000 / this.fireRate;
        this.projectileSpeed *= 2; // Much faster projectiles
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

  // Find a target among the enemies
  findTarget(enemies, currentTime) {
    // Check if there are any enemies
    if (!enemies || enemies.length === 0) {
      this.target = null;
      return null;
    }

    // Check if cooldown has passed
    if (this.lastShot > 0 && currentTime - this.lastShot < this.cooldown) {
      // Keep the current target if it's still valid
      if (this.target && this.target.alive) {
        const dist = distance(this.x, this.y, this.target.x, this.target.y);
        if (dist <= this.range && (!this.target.flying || this.canTargetFlying)) {
          return this.target;
        }
      }
      return null;
    }

    // Filter enemies that are in range and can be targeted
    const validTargets = enemies.filter(enemy => {
      if (!enemy.alive) return false;
      if (enemy.flying && !this.canTargetFlying) return false;

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
      // Handle special tower abilities based on tower type
      switch (this.type) {
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

  // Draw the tower
  draw(ctx, showRange = false) {
    // Draw range indicator if requested
    if (showRange) {
      // Create a more futuristic range indicator with pulsing effect
      const time = Date.now() / 1000;
      const pulseSize = Math.sin(time * 2) * 5;

      // Outer glow
      ctx.fillStyle = `${this.color}22`; // 13% opacity
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.range + pulseSize, 0, Math.PI * 2);
      ctx.fill();

      // Inner circle
      ctx.strokeStyle = `${this.color}88`; // 53% opacity
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]); // Dashed line for futuristic look
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.range - 5, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]); // Reset line dash
    }

    // Draw 2D futuristic tower base (flat hexagonal)
    const baseSize = 20;
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
    ctx.arc(this.x, this.y, 6, 0, Math.PI * 2);
    ctx.fill();

    // Add tech circuit pattern
    ctx.strokeStyle = '#3498db'; // Blue accent
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(this.x - 10, this.y);
    ctx.lineTo(this.x - 5, this.y);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(this.x + 5, this.y);
    ctx.lineTo(this.x + 10, this.y);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(this.x, this.y - 10);
    ctx.lineTo(this.x, this.y - 5);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(this.x, this.y + 5);
    ctx.lineTo(this.x, this.y + 10);
    ctx.stroke();

    // Draw tower body based on type and upgrades - more 2D and futuristic style
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);

    // Apply recoil animation if active
    let recoilOffset = 0;
    if (this.recoilAnimation > 0) {
      // Calculate recoil offset based on remaining animation frames
      recoilOffset = Math.sin(Math.PI * (this.recoilAnimation / 5)) * 5;
      this.recoilAnimation--;
    }

    // Determine if tower has upgrades
    const hasPathAUpgrades = this.pathALevel > 0;
    const hasPathBUpgrades = this.pathBLevel > 0;

    // Use variant color if available
    const towerColor = this.variantColor || this.color;

    // Add a pulsing glow effect for upgraded towers
    if (hasPathAUpgrades || hasPathBUpgrades) {
      const time = Date.now() / 1000;
      const pulseIntensity = 0.4 + Math.sin(time * 3) * 0.2;
      ctx.fillStyle = hasPathAUpgrades ? '#FFA000' : '#9C27B0';
      ctx.globalAlpha = pulseIntensity;
      ctx.beginPath();
      ctx.arc(0, -15, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1.0;
    }

    // Draw tower based on type and upgrades
    switch (this.type) {
      case 'basic':
        // Basic tower - flat 2D futuristic design with lighter colors

        // Draw a flat rectangular tower body
        ctx.fillStyle = '#ecf0f1'; // Light gray base
        ctx.fillRect(-8, -25, 16, 25);

        // Add colored accent based on tower color
        ctx.fillStyle = towerColor;
        ctx.fillRect(-8, -25, 3, 25); // Left stripe

        // Add tech details - circuit pattern
        ctx.strokeStyle = '#3498db'; // Blue accent
        ctx.lineWidth = 1;

        // Horizontal lines
        for (let i = 1; i <= 3; i++) {
          ctx.beginPath();
          ctx.moveTo(-5, -5 * i);
          ctx.lineTo(8, -5 * i);
          ctx.stroke();
        }

        // Vertical line
        ctx.beginPath();
        ctx.moveTo(0, -5);
        ctx.lineTo(0, -20);
        ctx.stroke();

        // Draw flat circular tower head
        ctx.fillStyle = '#bdc3c7'; // Light gray
        ctx.beginPath();
        ctx.arc(0, -25, 8, 0, Math.PI * 2);
        ctx.fill();

        // Add colored center to tower head
        ctx.fillStyle = towerColor;
        ctx.beginPath();
        ctx.arc(0, -25, 4, 0, Math.PI * 2);
        ctx.fill();

        // Add tech ring
        ctx.strokeStyle = '#3498db'; // Blue accent
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(0, -25, 6, 0, Math.PI * 2);
        ctx.stroke();

        // Add variant-specific effects if a variant is applied
        if (this.variant && this.variant !== this.type) {
          switch (this.variant) {
            case 'gold':
              // Add gold trim with tech pattern
              ctx.strokeStyle = '#FFD700';
              ctx.lineWidth = 1.5;
              ctx.beginPath();
              ctx.moveTo(-10, 0);
              ctx.lineTo(10, 0);
              ctx.lineTo(8, -25);
              ctx.lineTo(-8, -25);
              ctx.closePath();
              ctx.stroke();

              // Add gold circuit pattern
              ctx.beginPath();
              ctx.moveTo(-5, 0);
              ctx.lineTo(-5, -15);
              ctx.lineTo(0, -15);
              ctx.lineTo(0, -25);
              ctx.stroke();

              ctx.beginPath();
              ctx.moveTo(5, 0);
              ctx.lineTo(5, -10);
              ctx.lineTo(0, -10);
              ctx.stroke();

              // Add gold glow
              ctx.fillStyle = '#FFD700';
              ctx.globalAlpha = 0.3;
              ctx.beginPath();
              ctx.arc(0, -25, 10, 0, Math.PI * 2);
              ctx.fill();
              ctx.globalAlpha = 1.0;
              break;

            case 'crystal':
              // Add crystal effect with geometric pattern
              ctx.strokeStyle = '#88CCEE';
              ctx.lineWidth = 1;

              // Draw crystal facets as geometric pattern
              for (let i = 0; i < 3; i++) {
                const y = -25 + i * 8;
                ctx.beginPath();
                ctx.moveTo(-8 + i, y);
                ctx.lineTo(8 - i, y);
                ctx.stroke();
              }

              // Add diagonal lines for crystal effect
              ctx.beginPath();
              ctx.moveTo(-8, -25);
              ctx.lineTo(0, 0);
              ctx.lineTo(8, -25);
              ctx.stroke();

              // Add crystal glow with pulsing effect
              const crystalPulse = 0.2 + Math.sin(time * 2) * 0.1;
              ctx.fillStyle = '#88CCEE';
              ctx.globalAlpha = crystalPulse;
              ctx.beginPath();
              ctx.arc(0, -25, 10, 0, Math.PI * 2);
              ctx.fill();
              ctx.globalAlpha = 1.0;
              break;

            case 'shadow':
              // Add shadow effect with dark energy visualization
              ctx.fillStyle = '#000000';
              ctx.globalAlpha = 0.5;
              ctx.beginPath();
              ctx.arc(0, -25, 10, 0, Math.PI * 2);
              ctx.fill();

              // Add smoky particles with more tech feel
              ctx.fillStyle = '#444444';
              ctx.globalAlpha = 0.7;

              for (let i = 0; i < 5; i++) {
                const angle = time + i * Math.PI * 2 / 5;
                const distance = 6 + Math.sin(time * 3 + i) * 3;
                const x = Math.cos(angle) * distance;
                const y = Math.sin(angle) * distance - 15;
                const size = 1.5 + Math.sin(time * 2 + i) * 0.5;

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
          ctx.fillRect(-8, -25, 16, 25);

          // Add power indicators
          ctx.fillStyle = '#FFECB3';
          for (let i = 0; i < this.pathALevel; i++) {
            ctx.beginPath();
            ctx.arc(0, -15 - i * 5, 3, 0, Math.PI * 2);
            ctx.fill();
          }
        }

        // Path B upgrades - Rapid fire
        if (hasPathBUpgrades) {
          ctx.fillStyle = '#7B1FA2';
          ctx.fillRect(-8, -25, 16, 25);

          // Add speed indicators
          ctx.strokeStyle = '#E1BEE7';
          ctx.lineWidth = 1;
          for (let i = 0; i < this.pathBLevel; i++) {
            const offset = 5 + i * 3;
            ctx.beginPath();
            ctx.moveTo(-offset, -15);
            ctx.lineTo(offset, -15);
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
            const blinkState = Math.floor(Date.now() / 500) % 2 === 0;
            ctx.fillStyle = blinkState ? '#F44336' : '#4CAF50';
            ctx.beginPath();
            ctx.arc(0, -7, 1, 0, Math.PI * 2);
            ctx.fill();
          }
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

          const time = Date.now() / 1000;
          const boltCount = this.recoilAnimation > 0 ? 4 : 1;

          for (let i = 0; i < boltCount; i++) {
            const angle = (time * 5 + i * Math.PI/2) % (Math.PI * 2);
            const length = 8 + Math.sin(time * 3) * 4;

            ctx.beginPath();
            ctx.moveTo(0, -25);

            // Create zigzag lightning path
            let x = 0;
            let y = -25;
            const segments = 3;

            for (let j = 0; j < segments; j++) {
              const segLength = length / segments;
              const jitter = 3 - j * 0.5;

              x += Math.cos(angle + j * 0.5) * segLength + (Math.sin(time * 10 + i) - 0.5) * jitter;
              y += Math.sin(angle + j * 0.5) * segLength + (Math.cos(time * 10 + i) - 0.5) * jitter;

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
            const time = Date.now() / 1000;

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

              x += Math.cos(angle + time % 1) * segLength + (Math.sin(time * 5 + i) - 0.5) * jitter;
              y += Math.sin(angle + time % 1) * segLength + (Math.cos(time * 5 + i) - 0.5) * jitter;

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
          const time = Date.now() / 1000;
          const pulseSize = 8 + Math.sin(time * 4) * 3;

          ctx.fillStyle = '#FFEB3B';
          ctx.globalAlpha = 0.3 + Math.sin(time * 4) * 0.2;
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
            const blinkState = Math.floor((time * 3 + i) % 2);
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
      case 'basic': typeIndicator = 'B'; break;
      default: typeIndicator = this.type.charAt(0).toUpperCase(); break;
    }

    ctx.fillText(typeIndicator, this.x, this.y);
  }
}
