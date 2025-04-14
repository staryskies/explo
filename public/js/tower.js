/**
 * Tower class for the tower defense game
 */
// Log that tower.js is loaded
console.log('Tower class loaded');

class Tower {
  constructor(x, y, type = 'basic', gridX, gridY) {
    this.x = x;
    this.y = y;
    this.gridX = gridX; // Store grid coordinates for tower removal
    this.gridY = gridY;
    this.type = type;
    this.level = 1;
    this.target = null;
    this.angle = 0;
    this.lastShot = 0;

    // Upgrade paths
    this.pathALevel = 0;
    this.pathBLevel = 0;

    // Set properties based on tower type
    this.setPropertiesByType();

    // Initialize special properties
    this.initializeSpecialProperties();
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
        // Ice burst effect
        ctx.fillStyle = '#B3E5FC';
        ctx.globalAlpha = 0.7;
        ctx.beginPath();
        ctx.arc(this.x, this.y - 25, 10, 0, Math.PI * 2);
        ctx.fill();
        break;

      case 'cannon':
        // Smoke effect
        ctx.fillStyle = '#9E9E9E';
        ctx.globalAlpha = 0.5;
        ctx.beginPath();
        ctx.arc(this.x, this.y - 25, 8, 0, Math.PI * 2);
        ctx.fill();
        break;

      case 'sniper':
        // Muzzle flash
        ctx.fillStyle = '#FFEB3B';
        ctx.globalAlpha = 0.8;
        ctx.beginPath();
        ctx.arc(this.x, this.y - 25, 6, 0, Math.PI * 2);
        ctx.fill();
        break;

      case 'archer':
        // String vibration effect
        ctx.strokeStyle = '#8D6E63';
        ctx.lineWidth = 1;
        ctx.globalAlpha = 0.6;
        ctx.beginPath();
        ctx.moveTo(this.x - 5, this.y - 25);
        ctx.lineTo(this.x + 5, this.y - 25);
        ctx.stroke();
        break;

      default:
        // Generic flash
        ctx.fillStyle = '#FFFFFF';
        ctx.globalAlpha = 0.5;
        ctx.beginPath();
        ctx.arc(this.x, this.y - 25, 5, 0, Math.PI * 2);
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
      ctx.fillStyle = `${this.color}33`; // 20% opacity
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.range, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = `${this.color}88`; // 50% opacity
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // Draw tower base
    ctx.fillStyle = '#555';
    ctx.beginPath();
    ctx.arc(this.x, this.y, 20, 0, Math.PI * 2);
    ctx.fill();

    // Draw tower body based on type and upgrades
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);

    // Determine if tower has upgrades
    const hasPathAUpgrades = this.pathALevel > 0;
    const hasPathBUpgrades = this.pathBLevel > 0;

    // Draw tower based on type and upgrades
    switch (this.type) {
      case 'basic':
        // Basic tower - simple design
        ctx.fillStyle = this.color;
        ctx.fillRect(-8, -25, 16, 25);

        // Tower head
        ctx.beginPath();
        ctx.arc(0, -25, 8, 0, Math.PI * 2);
        ctx.fill();

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
        // Base tower body
        ctx.fillStyle = this.color;
        ctx.fillRect(-8, -25, 16, 25);

        // Path A: Deep Freeze - Blue with ice crystals
        if (hasPathAUpgrades) {
          // Darker blue for deep freeze
          ctx.fillStyle = '#0288D1';
          ctx.fillRect(-8, -25, 16, 25);

          // Add ice crystals based on upgrade level
          ctx.fillStyle = '#B3E5FC';
          for (let i = 0; i < this.pathALevel; i++) {
            const angle = Math.PI * 2 * (i / 4);
            const length = 5 + this.pathALevel * 2;

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
          }
        }

        // Path B: Ice Shards - White with sharp edges
        if (hasPathBUpgrades) {
          // Light blue for ice shards
          ctx.fillStyle = '#4FC3F7';
          ctx.fillRect(-8, -25, 16, 25);

          // Add ice shards based on upgrade level
          ctx.fillStyle = '#E1F5FE';
          for (let i = 0; i < this.pathBLevel * 2; i++) {
            const angle = Math.PI * 2 * (i / (this.pathBLevel * 2));
            ctx.beginPath();
            ctx.moveTo(-8 + Math.cos(angle) * 8, -15 + Math.sin(angle) * 10);
            ctx.lineTo(-8 + Math.cos(angle) * 16, -15 + Math.sin(angle) * 20);
            ctx.lineTo(-8 + Math.cos(angle + 0.3) * 12, -15 + Math.sin(angle + 0.3) * 15);
            ctx.closePath();
            ctx.fill();
          }
        }
        break;

      case 'archer':
        // Base tower body
        ctx.fillStyle = this.color;
        ctx.fillRect(-8, -25, 16, 25);

        // Path A: Multi-shot - Multiple arrow tips
        if (hasPathAUpgrades) {
          ctx.fillStyle = '#689F38';
          ctx.fillRect(-8, -25, 16, 25);

          // Draw multiple arrow tips
          ctx.fillStyle = '#DCEDC8';
          const arrowSpread = this.pathALevel * 5;
          for (let i = -this.pathALevel; i <= this.pathALevel; i++) {
            if (i === 0) continue; // Skip center arrow

            ctx.beginPath();
            ctx.moveTo(i * 3, -30);
            ctx.lineTo(i * 3 + 2, -35);
            ctx.lineTo(i * 3 - 2, -35);
            ctx.closePath();
            ctx.fill();
          }
        }

        // Path B: Piercing - Sharp, pointed design
        if (hasPathBUpgrades) {
          ctx.fillStyle = '#33691E';
          ctx.fillRect(-8, -25, 16, 25);

          // Draw piercing arrow
          ctx.fillStyle = '#F1F8E9';
          ctx.beginPath();
          ctx.moveTo(0, -35);
          ctx.lineTo(4, -25);
          ctx.lineTo(0, -20);
          ctx.lineTo(-4, -25);
          ctx.closePath();
          ctx.fill();
        }
        break;

      case 'cannon':
        // Base tower body
        ctx.fillStyle = this.color;
        ctx.fillRect(-10, -25, 20, 25);

        // Path A: Blast Radius - Wider cannon
        if (hasPathAUpgrades) {
          ctx.fillStyle = '#5D4037';
          const width = 10 + this.pathALevel * 2;
          ctx.fillRect(-width, -25, width * 2, 25);

          // Draw wider cannon opening
          ctx.fillStyle = '#3E2723';
          ctx.beginPath();
          ctx.arc(0, -25, 6 + this.pathALevel, 0, Math.PI * 2);
          ctx.fill();
        }

        // Path B: Heavy Impact - Reinforced cannon
        if (hasPathBUpgrades) {
          ctx.fillStyle = '#8D6E63';
          ctx.fillRect(-10, -25, 20, 25);

          // Draw reinforcement bands
          ctx.strokeStyle = '#4E342E';
          ctx.lineWidth = 2;
          for (let i = 0; i < this.pathBLevel; i++) {
            ctx.beginPath();
            ctx.moveTo(-12, -20 + i * 10);
            ctx.lineTo(12, -20 + i * 10);
            ctx.stroke();
          }
        }
        break;

      case 'sniper':
        // Base tower body
        ctx.fillStyle = this.color;
        ctx.fillRect(-6, -30, 12, 30);

        // Path A: Precision - Longer, thinner barrel
        if (hasPathAUpgrades) {
          ctx.fillStyle = '#1565C0';
          ctx.fillRect(-4, -35 - this.pathALevel * 5, 8, 35 + this.pathALevel * 5);

          // Draw scope
          ctx.fillStyle = '#0D47A1';
          ctx.beginPath();
          ctx.arc(0, -15, 5, 0, Math.PI * 2);
          ctx.fill();

          // Draw crosshairs
          ctx.strokeStyle = '#E3F2FD';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(-4, -15);
          ctx.lineTo(4, -15);
          ctx.moveTo(0, -19);
          ctx.lineTo(0, -11);
          ctx.stroke();
        }

        // Path B: Long Range - Stabilized platform
        if (hasPathBUpgrades) {
          ctx.fillStyle = '#0277BD';
          ctx.fillRect(-6, -30, 12, 30);

          // Draw stabilizers
          ctx.fillStyle = '#01579B';
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
      case 'aoe': typeIndicator = 'A'; break;
      case 'slow': typeIndicator = 'F'; break; // F for Freeze
      case 'basic': typeIndicator = 'B'; break;
    }

    ctx.fillText(typeIndicator, this.x, this.y);
  }
}
