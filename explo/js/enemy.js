/**
 * Enemy class for the tower defense game
 */
// Log that enemy.js is loaded
console.log('Enemy class loaded');

class Enemy {
  constructor(path, type = 'normal') {
    this.path = path;
    this.pathIndex = 0;
    this.x = path[0].x;
    this.y = path[0].y;
    this.type = type;
    this.alive = true;
    this.reachedEnd = false;
    this.slowEffect = 1; // 1 = normal speed, < 1 = slowed
    this.slowDuration = 0;
    this.speedBoost = 1;

    // Status effects
    this.isInvulnerable = false;
    this.isSlowed = false;
    this.isBurning = false;
    this.isPoisoned = false;
    this.isStunned = false;
    this.isAcidified = false; // Acid effect reduces armor

    // Status effect durations (in milliseconds)
    this.burnDuration = 0;
    this.poisonDuration = 0;
    this.stunDuration = 0;
    this.acidDuration = 0;

    // Status effect values
    this.burnDamage = 0;
    this.poisonDamage = 0;
    this.acidArmorReduction = 0;

    // Special effects
    this.specialEffect = null;
    this.specialEffectTimer = 0;

    // Check if this is a boss type
    this.isBoss = type.includes('Boss') || type === 'boss';
    this.bossType = this.isBoss ? type : null;

    // Boss abilities
    this.abilities = [];
    this.abilityCooldowns = {};

    // Set properties based on enemy type
    this.setPropertiesByType();

    // Initialize special abilities for bosses
    if (this.isBoss) {
      this.initializeBossAbilities();
    }

    // Calculate direction to the next point
    this.calculateDirection();
  }

  // Set enemy properties based on type
  setPropertiesByType() {
    // For boss types, get properties from bossTypes
    if (this.isBoss && typeof bossTypes !== 'undefined' && bossTypes[this.type]) {
      const bossData = bossTypes[this.type];
      this.maxHealth = this.applyDifficultyMultiplier(bossData.baseHealth, 'health');
      this.health = this.maxHealth;
      this.speed = this.applyDifficultyMultiplier(bossData.speed, 'speed');
      this.reward = bossData.reward;
      this.color = bossData.color;
      this.secondaryColor = bossData.secondaryColor; // For void bosses
      this.size = bossData.size;
      this.flying = bossData.flying || false;
      this.damage = this.applyDifficultyMultiplier(bossData.damage || 5, 'damage');
      this.armor = this.applyDifficultyMultiplier(bossData.armor || 0, 'armor');
      this.abilities = bossData.abilities || [];
      this.specialEffect = bossData.specialEffect;
      this.name = bossData.name || 'Boss';
      return;
    }

    // If this is a regular boss but not in bossTypes
    if (this.isBoss) {
      this.maxHealth = this.applyDifficultyMultiplier(1000, 'health');
      this.health = this.maxHealth;
      this.speed = this.applyDifficultyMultiplier(0.6, 'speed');
      this.size = 40;
      this.color = '#F44336';
      this.reward = 200;
      this.damage = this.applyDifficultyMultiplier(5, 'damage');
      this.armor = this.applyDifficultyMultiplier(0.3, 'armor');
      return;
    }

    // Get properties from enemyTypes if available
    if (typeof enemyTypes !== 'undefined' && enemyTypes[this.type]) {
      const typeData = enemyTypes[this.type];
      this.maxHealth = this.applyDifficultyMultiplier(typeData.health, 'health');
      this.health = this.maxHealth;
      this.speed = this.applyDifficultyMultiplier(typeData.speed, 'speed');
      this.reward = typeData.reward;
      this.color = typeData.color;
      this.size = typeData.size;
      this.flying = typeData.flying;
      this.damage = this.applyDifficultyMultiplier(typeData.damage || 1, 'damage');

      // Copy any special properties
      if (typeData.healRadius) this.healRadius = typeData.healRadius;
      if (typeData.healAmount) this.healAmount = typeData.healAmount;
      if (typeData.healInterval) this.healInterval = typeData.healInterval;
      if (typeData.spawnType) this.spawnType = typeData.spawnType;
      if (typeData.spawnInterval) this.spawnInterval = typeData.spawnInterval;
      if (typeData.maxSpawns) this.maxSpawns = typeData.maxSpawns;
      if (typeData.armor) this.armor = typeData.armor;
      if (typeData.invisibility) this.invisibility = typeData.invisibility;
      if (typeData.visibleToSpecialTowers) this.visibleToSpecialTowers = typeData.visibleToSpecialTowers;
      if (typeData.explosionRadius) this.explosionRadius = typeData.explosionRadius;
      if (typeData.explosionDamage) this.explosionDamage = typeData.explosionDamage;
    } else {
      // Fallback to hardcoded values if enemyTypes is not available
      switch (this.type) {
        case 'fast':
          this.maxHealth = 50;
          this.health = this.maxHealth;
          this.speed = 2.5;
          this.size = 20;
          this.color = '#FF5722';
          this.reward = 15;
          this.damage = 1;
          break;
        case 'tank':
          this.maxHealth = 300;
          this.health = this.maxHealth;
          this.speed = 0.8;
          this.size = 30;
          this.color = '#607D8B';
          this.reward = 30;
          this.damage = 2;
          break;
        case 'flying':
          this.maxHealth = 80;
          this.health = this.maxHealth;
          this.speed = 1.8;
          this.size = 22;
          this.color = '#9C27B0';
          this.reward = 25;
          this.flying = true;
          this.damage = 1;
          break;
        case 'healing':
          this.maxHealth = 120;
          this.health = this.maxHealth;
          this.speed = 1.0;
          this.size = 26;
          this.color = '#4CAF50';
          this.reward = 35;
          this.damage = 1;
          this.healRadius = 100;
          this.healAmount = 5;
          this.healInterval = 2;
          break;
        case 'spawner':
          this.maxHealth = 150;
          this.health = this.maxHealth;
          this.speed = 0.9;
          this.size = 28;
          this.color = '#FF9800';
          this.reward = 40;
          this.damage = 1;
          this.spawnType = 'normal';
          this.spawnInterval = 5;
          this.maxSpawns = 3;
          break;
        case 'armored':
          this.maxHealth = 200;
          this.health = this.maxHealth;
          this.speed = 1.0;
          this.size = 26;
          this.color = '#795548';
          this.reward = 30;
          this.damage = 1;
          this.armor = 0.5;
          break;
        case 'invisible':
          this.maxHealth = 70;
          this.health = this.maxHealth;
          this.speed = 1.5;
          this.size = 22;
          this.color = 'rgba(255, 255, 255, 0.3)';
          this.reward = 35;
          this.damage = 1;
          this.invisibility = 0.8;
          this.visibleToSpecialTowers = ['tesla', 'sniper'];
          break;
        case 'explosive':
          this.maxHealth = 120;
          this.health = this.maxHealth;
          this.speed = 1.1;
          this.size = 25;
          this.color = '#F44336';
          this.reward = 35;
          this.damage = 2;
          this.explosionRadius = 100;
          this.explosionDamage = 30;
          break;
        case 'boss':
          this.maxHealth = 1000;
          this.health = this.maxHealth;
          this.speed = 0.6;
          this.size = 40;
          this.color = '#F44336';
          this.reward = 200;
          this.damage = 5;
          break;
        case 'normal':
        default:
          this.maxHealth = 100;
          this.health = this.maxHealth;
          this.speed = 1.2;
          this.size = 24;
          this.color = '#FFC107';
          this.reward = 20;
          this.damage = 1;
          break;
      }
    }
  }

  // Calculate direction to the next point in the path
  calculateDirection() {
    if (this.pathIndex < this.path.length - 1) {
      const nextPoint = this.path[this.pathIndex + 1];
      const dx = nextPoint.x - this.x;
      const dy = nextPoint.y - this.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      this.dirX = dx / distance;
      this.dirY = dy / distance;
    } else {
      this.dirX = 0;
      this.dirY = 0;
    }
  }

  // Initialize boss abilities
  initializeBossAbilities() {
    // If this boss has abilities defined in bossTypes
    if (typeof bossTypes !== 'undefined' && bossTypes[this.type] && bossTypes[this.type].abilities) {
      const abilities = bossTypes[this.type].abilities;

      // Initialize cooldowns for each ability
      abilities.forEach(ability => {
        if (ability.name) {
          this.abilityCooldowns[ability.name] = 0;
        }
      });

      console.log(`Initialized boss ${this.type} with abilities:`, abilities);
    }
  }

  // Use boss ability
  useAbility(game) {
    if (!this.isBoss || !game) return;

    // Get abilities from bossTypes
    const abilities = bossTypes[this.type]?.abilities || [];

    // Try to use each ability if off cooldown
    abilities.forEach(ability => {
      if (!ability.name || !ability.interval) return;

      // Check if ability is off cooldown
      if (this.abilityCooldowns[ability.name] <= 0) {
        // Use the ability based on its type
        switch(ability.name) {
          case 'Regeneration':
          case 'Nature\'s Blessing':
          case 'Corrupted Blessing':
            // Heal self
            this.health = Math.min(this.maxHealth, this.health + (ability.healAmount || 10));
            console.log(`${this.type} used ${ability.name} and healed for ${ability.healAmount}`);
            break;

          case 'Summon Minions':
          case 'Summon Nightmares':
          case 'Void Spawn':
          case 'Summon Void Flames':
          case 'Summon Void Nightmares':
            // Spawn minions
            const spawnCount = ability.spawnCount || 2;
            const spawnType = ability.spawnType || 'normal';

            for (let i = 0; i < spawnCount; i++) {
              // Create a new enemy at the boss's position
              const minion = new Enemy(this.path, spawnType);
              minion.pathIndex = this.pathIndex;
              minion.x = this.x;
              minion.y = this.y;

              // Add to game's enemies array
              if (game.enemies) {
                game.enemies.push(minion);
                console.log(`${this.type} spawned a ${spawnType} minion`);
              }
            }
            break;

          case 'Phase Shift':
          case 'Dimensional Shift':
            // Become invulnerable
            this.isInvulnerable = true;
            setTimeout(() => {
              this.isInvulnerable = false;
            }, (ability.duration || 2) * 1000);
            console.log(`${this.type} used ${ability.name} and became invulnerable for ${ability.duration}s`);
            break;

          case 'Flame Dash':
          case 'Shadow Step':
          case 'Reality Warp':
          case 'Void Step':
            // Teleport forward on the path
            const teleportDistance = ability.distance || 200;
            let distanceMoved = 0;
            let originalPathIndex = this.pathIndex;

            // Move forward along the path
            while (distanceMoved < teleportDistance && this.pathIndex < this.path.length - 1) {
              const nextPoint = this.path[this.pathIndex + 1];
              const segmentDistance = distance(this.x, this.y, nextPoint.x, nextPoint.y);

              if (distanceMoved + segmentDistance <= teleportDistance) {
                // Move to next point
                this.pathIndex++;
                this.x = nextPoint.x;
                this.y = nextPoint.y;
                distanceMoved += segmentDistance;
              } else {
                // Move partially along segment
                const ratio = (teleportDistance - distanceMoved) / segmentDistance;
                this.x += (nextPoint.x - this.x) * ratio;
                this.y += (nextPoint.y - this.y) * ratio;
                distanceMoved = teleportDistance;
              }
            }

            // Recalculate direction
            this.calculateDirection();
            console.log(`${this.type} used ${ability.name} and teleported from path index ${originalPathIndex} to ${this.pathIndex}`);
            break;

          case 'Freezing Aura':
          case 'Void Freeze':
            // Slow nearby towers
            if (game.towers) {
              const radius = ability.radius || 150;
              const slowFactor = ability.slowFactor || 0.5;
              const duration = ability.duration || 3;

              game.towers.forEach(tower => {
                const dist = distance(this.x, this.y, tower.x, tower.y);
                if (dist <= radius) {
                  // Apply slow effect to tower
                  tower.slowEffect = slowFactor;
                  tower.slowDuration = duration * 1000;
                }
              });
              console.log(`${this.type} used ${ability.name} and slowed nearby towers`);
            }
            break;

          case 'Heat Wave':
          case 'Void Flame':
            // Damage nearby towers
            if (game.towers) {
              const radius = ability.radius || 120;
              const damage = ability.damage || 20;

              game.towers.forEach(tower => {
                const dist = distance(this.x, this.y, tower.x, tower.y);
                if (dist <= radius) {
                  // Damage tower
                  if (tower.takeDamage) {
                    tower.takeDamage(damage);
                  }
                }
              });
              console.log(`${this.type} used ${ability.name} and damaged nearby towers`);
            }
            break;

          case 'Life Drain':
          case 'Energy Absorption':
          case 'Void Drain':
            // Disable towers and heal
            if (game.towers) {
              const radius = ability.radius || 150;
              const healAmount = ability.healAmount || 100;
              const disableDuration = ability.disableDuration || 2;

              let towersAffected = 0;
              game.towers.forEach(tower => {
                const dist = distance(this.x, this.y, tower.x, tower.y);
                if (dist <= radius) {
                  // Disable tower
                  tower.disabled = true;
                  setTimeout(() => {
                    tower.disabled = false;
                  }, disableDuration * 1000);
                  towersAffected++;
                }
              });

              // Heal based on towers affected
              if (towersAffected > 0) {
                this.health = Math.min(this.maxHealth, this.health + healAmount);
                console.log(`${this.type} used ${ability.name}, disabled ${towersAffected} towers and healed for ${healAmount}`);
              }
            }
            break;
        }

        // Set cooldown
        this.abilityCooldowns[ability.name] = ability.interval;
      }
    });
  }

  // Update enemy position and state
  update(deltaTime) {
    if (!this.alive) return;

    // Update slow effect duration (deltaTime is now in seconds)
    if (this.slowDuration > 0) {
      this.slowDuration -= deltaTime * 1000; // Convert seconds to milliseconds for duration
      if (this.slowDuration <= 0) {
        this.slowEffect = 1; // Reset to normal speed
      }
    }

    // Update status effects
    this.updateStatusEffects(deltaTime);

    // Update boss ability cooldowns
    if (this.isBoss) {
      Object.keys(this.abilityCooldowns).forEach(ability => {
        if (this.abilityCooldowns[ability] > 0) {
          this.abilityCooldowns[ability] -= deltaTime;
        }
      });

      // Try to use abilities if this is a boss
      if (window.game) {
        this.useAbility(window.game);
      }
    }

    // Don't move if stunned
    if (this.isStunned) return;

    // Calculate actual speed based on deltaTime
    // deltaTime is already in seconds
    // Apply speed boost for boss abilities
    const actualSpeed = this.speed * this.slowEffect * this.speedBoost * deltaTime * 60; // Scale for 60fps

    // Move along the path
    this.x += this.dirX * actualSpeed;
    this.y += this.dirY * actualSpeed;

    // Check if reached the next point in the path
    if (this.pathIndex < this.path.length - 1) {
      const nextPoint = this.path[this.pathIndex + 1];
      const distanceToNext = distance(this.x, this.y, nextPoint.x, nextPoint.y);

      if (distanceToNext < actualSpeed) {
        // Reached the next point
        this.x = nextPoint.x;
        this.y = nextPoint.y;
        this.pathIndex++;

        // Calculate new direction if not at the end
        if (this.pathIndex < this.path.length - 1) {
          this.calculateDirection();
        } else {
          // Reached the end of the path
          this.reachedEnd = true;
          this.alive = false;
        }
      }
    }
  }

  // Update status effects
  updateStatusEffects(deltaTime) {
    // Convert deltaTime to milliseconds for duration tracking
    const dtMs = deltaTime * 1000;

    // Update burn effect
    if (this.isBurning && this.burnDuration > 0) {
      // Apply burn damage over time
      this.health -= this.burnDamage * deltaTime;
      this.burnDuration -= dtMs;

      if (this.burnDuration <= 0) {
        this.isBurning = false;
      }
    }

    // Update poison effect
    if (this.isPoisoned && this.poisonDuration > 0) {
      // Apply poison damage over time
      this.health -= this.poisonDamage * deltaTime;
      this.poisonDuration -= dtMs;

      if (this.poisonDuration <= 0) {
        this.isPoisoned = false;
      }
    }

    // Update stun effect
    if (this.isStunned && this.stunDuration > 0) {
      this.stunDuration -= dtMs;

      if (this.stunDuration <= 0) {
        this.isStunned = false;
      }
    }

    // Update acid effect
    if (this.isAcidified && this.acidDuration > 0) {
      this.acidDuration -= dtMs;

      if (this.acidDuration <= 0) {
        this.isAcidified = false;
        // Restore armor when acid effect ends
        if (this.originalArmor !== undefined) {
          this.armor = this.originalArmor;
          delete this.originalArmor;
        }
      }
    }

    // Check if enemy died from status effects
    if (this.health <= 0) {
      this.health = 0;
      this.alive = false;
    }
  }

  // Take damage from towers
  takeDamage(amount) {
    // If invulnerable, take no damage
    if (this.isInvulnerable) return false;

    // Apply armor reduction if applicable
    let actualDamage = amount;
    if (this.armor && !this.isAcidified) {
      actualDamage *= (1 - this.armor);
    } else if (this.armor && this.isAcidified) {
      // Acid effect reduces armor effectiveness
      actualDamage *= (1 - this.armor * (1 - this.acidArmorReduction));
    }

    this.health -= actualDamage;
    if (this.health <= 0) {
      this.health = 0;
      this.alive = false;
      return true; // Enemy died
    }
    return false; // Enemy still alive
  }

  // Apply burn effect (flame towers)
  applyBurnEffect(damage, duration) {
    this.isBurning = true;
    this.burnDamage = damage;
    this.burnDuration = duration;
  }

  // Apply poison effect (poison towers)
  applyPoisonEffect(damage, duration) {
    this.isPoisoned = true;
    this.poisonDamage = damage;
    this.poisonDuration = duration;
  }

  // Apply stun effect (tesla towers)
  applyStunEffect(duration) {
    this.isStunned = true;
    this.stunDuration = duration;
  }

  // Apply acid effect (acid towers) - reduces armor
  applyAcidEffect(armorReduction, duration) {
    this.isAcidified = true;
    this.acidArmorReduction = armorReduction;
    this.acidDuration = duration;

    // Store original armor value if not already stored
    if (this.originalArmor === undefined && this.armor) {
      this.originalArmor = this.armor;
    }
  }

  // Apply difficulty multiplier to enemy stats
  applyDifficultyMultiplier(value, statType) {
    // Get the game difficulty from the global game object
    const difficulty = window.game?.difficulty || 'easy';

    // Define multipliers for each difficulty and stat type - much harder scaling
    const multipliers = {
      health: {
        easy: 1.5,      // 50% more health
        medium: 2.5,    // 150% more health
        hard: 3.5,      // 250% more health
        nightmare: 5.0, // 400% more health
        void: 7.0       // 600% more health
      },
      speed: {
        easy: 1.1,      // 10% faster
        medium: 1.2,    // 20% faster
        hard: 1.3,      // 30% faster
        nightmare: 1.5, // 50% faster
        void: 1.7       // 70% faster
      },
      damage: {
        easy: 1.3,      // 30% more damage
        medium: 1.5,    // 50% more damage
        hard: 2.0,      // 100% more damage
        nightmare: 3.0, // 200% more damage
        void: 4.0       // 300% more damage
      },
      armor: {
        easy: 1.2,      // 20% more armor
        medium: 1.4,    // 40% more armor
        hard: 1.6,      // 60% more armor
        nightmare: 1.8, // 80% more armor
        void: 2.0       // 100% more armor
      }
    };

    // Get the multiplier for the current difficulty and stat type
    const multiplier = multipliers[statType]?.[difficulty] || 1.0;

    // Apply the multiplier
    return value * multiplier;
  }

  // Apply slow effect
  applySlowEffect(slowFactor, duration) {
    // Only apply if the new slow is stronger or extends the duration
    if (slowFactor < this.slowEffect || this.slowDuration < duration) {
      this.slowEffect = slowFactor;
      this.slowDuration = duration;
    }
  }

  // Draw the enemy
  draw(ctx) {
    if (!this.alive) return;

    // Apply darkness effect for Nightmare and Void difficulties
    if (window.game?.difficulty === 'nightmare' || window.game?.difficulty === 'void') {
      // Make enemies darker and more ominous in Nightmare/Void mode
      ctx.globalAlpha = 0.7; // Reduce visibility of enemies

      // Store original color to restore later
      this.originalColor = this.color;

      // Darken the enemy color
      if (this.color && this.color.startsWith('#')) {
        // Convert hex to RGB and darken
        const r = parseInt(this.color.slice(1, 3), 16);
        const g = parseInt(this.color.slice(3, 5), 16);
        const b = parseInt(this.color.slice(5, 7), 16);

        // Darken the color
        const darkenFactor = 0.6; // 60% darker
        this.color = `rgb(${Math.floor(r * darkenFactor)}, ${Math.floor(g * darkenFactor)}, ${Math.floor(b * darkenFactor)})`;
      }
    }

    // Apply invisibility effect
    if (this.type === 'invisible') {
      ctx.globalAlpha = 0.3;
    }

    // Apply shadow effect
    if (this.type === 'shadow') {
      ctx.globalAlpha = 0.6;
      ctx.shadowColor = '#000';
      ctx.shadowBlur = 15;
      ctx.shadowOffsetX = 3;
      ctx.shadowOffsetY = 3;
    }

    // Draw shield effect for invulnerable enemies
    if (this.isInvulnerable) {
      ctx.fillStyle = 'rgba(255, 215, 0, 0.3)';
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size + 8, 0, Math.PI * 2);
      ctx.fill();
    }

    // Special drawing for flying enemies
    if (this.flying) {
      // Calculate hover effect
      const hoverHeight = Math.sin(Date.now() / 200) * 5; // Hovering effect

      // Draw shadow on the ground
      ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.beginPath();
      ctx.ellipse(this.x, this.y + this.size/3, this.size/3, this.size/6, 0, 0, Math.PI * 2);
      ctx.fill();

      // Save context for rotation
      ctx.save();
      ctx.translate(this.x, this.y - 10 + hoverHeight);

      // Calculate rotation based on direction
      if (this.dirX !== 0 || this.dirY !== 0) {
        const angle = Math.atan2(this.dirY, this.dirX);
        ctx.rotate(angle);
      }
    } else {
      // Regular enemy drawing
      // Save context for rotation
      ctx.save();
      ctx.translate(this.x, this.y);

      // Calculate rotation based on direction
      if (this.dirX !== 0 || this.dirY !== 0) {
        const angle = Math.atan2(this.dirY, this.dirX);
        ctx.rotate(angle);
      }
    }

    // Draw enemy based on type
    switch(this.type) {
      case 'fast':
        this.drawFastEnemy(ctx);
        break;
      case 'tank':
        this.drawTankEnemy(ctx);
        break;
      case 'flying':
        this.drawFlyingEnemy(ctx);
        break;
      case 'healing':
        this.drawHealingEnemy(ctx);
        break;
      case 'spawner':
        this.drawSpawnerEnemy(ctx);
        break;
      case 'armored':
        this.drawArmoredEnemy(ctx);
        break;
      case 'invisible':
        this.drawInvisibleEnemy(ctx);
        break;
      case 'explosive':
        this.drawExplosiveEnemy(ctx);
        break;
      case 'shadow':
        this.drawShadowEnemy(ctx);
        break;
      case 'boss':
        this.drawBossEnemy(ctx);
        break;
      case 'normal':
      default:
        this.drawNormalEnemy(ctx);
        break;
    }

    // Restore context
    ctx.restore();

    // Reset global alpha
    ctx.globalAlpha = 1.0;

    // Restore original color if it was changed for Nightmare/Void mode
    if (this.originalColor) {
      this.color = this.originalColor;
      this.originalColor = null;
    }

    // Draw health bar (after restoring context)
    const healthBarWidth = this.size * 2;
    const healthBarHeight = 6;
    const healthPercentage = this.health / this.maxHealth;

    ctx.fillStyle = '#333';
    ctx.fillRect(
      this.x - healthBarWidth / 2,
      this.y - this.size - 10,
      healthBarWidth,
      healthBarHeight
    );

    // Health color based on enemy type
    // Note: We're using direct color assignment instead of CSS classes
    if (this.isBoss) {
      // Boss health bar colors are handled with gradient
    } else if (this.type && enemyTypes && enemyTypes[this.type]) {
      // Type-specific colors are handled in the fallback colors
    }

    // Fallback colors based on health percentage
    let healthColor;
    if (this.isBoss) {
      // Rainbow effect for bosses
      const gradient = ctx.createLinearGradient(
        this.x - healthBarWidth / 2,
        this.y - this.size - 10,
        this.x + healthBarWidth / 2,
        this.y - this.size - 10
      );
      gradient.addColorStop(0, '#F44336');
      gradient.addColorStop(0.5, '#9C27B0');
      gradient.addColorStop(1, '#3F51B5');
      healthColor = gradient;
    } else if (healthPercentage > 0.6) {
      healthColor = '#4CAF50'; // Green
    } else if (healthPercentage > 0.3) {
      healthColor = '#FFC107'; // Yellow
    } else {
      healthColor = '#F44336'; // Red
    }

    ctx.fillStyle = healthColor;
    ctx.fillRect(
      this.x - healthBarWidth / 2,
      this.y - this.size - 10,
      healthBarWidth * healthPercentage,
      healthBarHeight
    );

    // Draw status effect indicators

    // Status effect icons positioning
    const iconSize = this.size * 0.5;
    const iconPositions = [
      { x: this.x - this.size - iconSize, y: this.y - this.size - iconSize }, // Top left
      { x: this.x + this.size + iconSize, y: this.y - this.size - iconSize }, // Top right
      { x: this.x - this.size - iconSize, y: this.y + this.size + iconSize }, // Bottom left
      { x: this.x + this.size + iconSize, y: this.y + this.size + iconSize }  // Bottom right
    ];

    // Track which positions are used
    let usedPositions = 0;

    // Slow effect
    if (this.slowEffect < 1) {
      // Draw slow effect aura
      ctx.fillStyle = 'rgba(0, 149, 255, 0.5)';
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size + 5, 0, Math.PI * 2);
      ctx.fill();

      // Draw snowflake icon
      if (usedPositions < iconPositions.length) {
        const pos = iconPositions[usedPositions++];
        ctx.fillStyle = '#2196F3';
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 1;

        // Draw snowflake
        for (let i = 0; i < 6; i++) {
          const angle = Math.PI * i / 3;
          ctx.beginPath();
          ctx.moveTo(pos.x, pos.y);
          ctx.lineTo(pos.x + Math.cos(angle) * iconSize, pos.y + Math.sin(angle) * iconSize);
          ctx.stroke();

          // Draw small lines on each arm
          const midX = pos.x + Math.cos(angle) * iconSize * 0.5;
          const midY = pos.y + Math.sin(angle) * iconSize * 0.5;
          const perpAngle1 = angle + Math.PI / 2;
          const perpAngle2 = angle - Math.PI / 2;

          ctx.beginPath();
          ctx.moveTo(midX, midY);
          ctx.lineTo(midX + Math.cos(perpAngle1) * iconSize * 0.3, midY + Math.sin(perpAngle1) * iconSize * 0.3);
          ctx.stroke();

          ctx.beginPath();
          ctx.moveTo(midX, midY);
          ctx.lineTo(midX + Math.cos(perpAngle2) * iconSize * 0.3, midY + Math.sin(perpAngle2) * iconSize * 0.3);
          ctx.stroke();
        }

        // Draw center circle
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, iconSize * 0.2, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Burn effect
    if (this.isBurning) {
      // Draw burn effect aura
      ctx.fillStyle = 'rgba(255, 87, 34, 0.5)';
      ctx.beginPath();
      for (let i = 0; i < 8; i++) {
        const angle = Math.PI * 2 * i / 8;
        const x = this.x + Math.cos(angle) * (this.size + 8);
        const y = this.y + Math.sin(angle) * (this.size + 8);
        const flameHeight = 10 + Math.random() * 5;

        ctx.moveTo(this.x, this.y);
        ctx.lineTo(x, y);
        ctx.lineTo(x + Math.cos(angle) * flameHeight, y + Math.sin(angle) * flameHeight);
      }
      ctx.fill();

      // Draw flame icon
      if (usedPositions < iconPositions.length) {
        const pos = iconPositions[usedPositions++];

        // Draw flame
        ctx.fillStyle = '#FF5722';
        ctx.beginPath();
        ctx.moveTo(pos.x, pos.y + iconSize);
        ctx.quadraticCurveTo(
          pos.x - iconSize * 0.6, pos.y,
          pos.x, pos.y - iconSize
        );
        ctx.quadraticCurveTo(
          pos.x + iconSize * 0.6, pos.y,
          pos.x, pos.y + iconSize
        );
        ctx.fill();

        // Draw inner flame
        ctx.fillStyle = '#FFEB3B';
        ctx.beginPath();
        ctx.moveTo(pos.x, pos.y + iconSize * 0.7);
        ctx.quadraticCurveTo(
          pos.x - iconSize * 0.4, pos.y,
          pos.x, pos.y - iconSize * 0.6
        );
        ctx.quadraticCurveTo(
          pos.x + iconSize * 0.4, pos.y,
          pos.x, pos.y + iconSize * 0.7
        );
        ctx.fill();
      }
    }

    // Poison effect
    if (this.isPoisoned) {
      // Draw poison effect aura
      ctx.fillStyle = 'rgba(76, 175, 80, 0.5)';
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size + 7, 0, Math.PI * 2);
      ctx.fill();

      // Add poison bubbles
      for (let i = 0; i < 5; i++) {
        const angle = Math.PI * 2 * Math.random();
        const distance = this.size * 0.8 * Math.random();
        const x = this.x + Math.cos(angle) * distance;
        const y = this.y + Math.sin(angle) * distance;

        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(76, 175, 80, 0.8)';
        ctx.fill();
      }

      // Draw poison icon
      if (usedPositions < iconPositions.length) {
        const pos = iconPositions[usedPositions++];

        // Draw poison flask
        ctx.fillStyle = '#4CAF50';
        ctx.beginPath();
        ctx.moveTo(pos.x - iconSize * 0.5, pos.y + iconSize * 0.5);
        ctx.lineTo(pos.x - iconSize * 0.3, pos.y - iconSize * 0.5);
        ctx.lineTo(pos.x + iconSize * 0.3, pos.y - iconSize * 0.5);
        ctx.lineTo(pos.x + iconSize * 0.5, pos.y + iconSize * 0.5);
        ctx.closePath();
        ctx.fill();

        // Draw skull on flask
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, iconSize * 0.25, 0, Math.PI * 2);
        ctx.fill();

        // Draw skull eyes
        ctx.fillStyle = '#4CAF50';
        ctx.beginPath();
        ctx.arc(pos.x - iconSize * 0.1, pos.y - iconSize * 0.05, iconSize * 0.05, 0, Math.PI * 2);
        ctx.arc(pos.x + iconSize * 0.1, pos.y - iconSize * 0.05, iconSize * 0.05, 0, Math.PI * 2);
        ctx.fill();

        // Draw skull mouth
        ctx.beginPath();
        ctx.moveTo(pos.x - iconSize * 0.15, pos.y + iconSize * 0.1);
        ctx.lineTo(pos.x + iconSize * 0.15, pos.y + iconSize * 0.1);
        ctx.stroke();
      }
    }

    // Stun effect
    if (this.isStunned) {
      // Draw stun effect aura
      ctx.fillStyle = 'rgba(255, 235, 59, 0.5)';
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size + 10, 0, Math.PI * 2);
      ctx.fill();

      // Add stars
      for (let i = 0; i < 3; i++) {
        const angle = Math.PI * 2 * i / 3;
        const x = this.x + Math.cos(angle) * (this.size + 15);
        const y = this.y + Math.sin(angle) * (this.size + 15);

        // Draw star
        ctx.fillStyle = 'rgba(255, 235, 59, 0.9)';
        ctx.beginPath();
        for (let j = 0; j < 5; j++) {
          const starAngle = Math.PI * 2 * j / 5 - Math.PI / 2;
          const radius = j % 2 === 0 ? 5 : 2;
          const starX = x + Math.cos(starAngle) * radius;
          const starY = y + Math.sin(starAngle) * radius;

          if (j === 0) {
            ctx.moveTo(starX, starY);
          } else {
            ctx.lineTo(starX, starY);
          }
        }
        ctx.closePath();
        ctx.fill();
      }

      // Draw lightning bolt icon
      if (usedPositions < iconPositions.length) {
        const pos = iconPositions[usedPositions++];

        // Draw lightning bolt
        ctx.fillStyle = '#FFC107';
        ctx.beginPath();
        ctx.moveTo(pos.x, pos.y - iconSize);
        ctx.lineTo(pos.x + iconSize * 0.4, pos.y - iconSize * 0.2);
        ctx.lineTo(pos.x, pos.y + iconSize * 0.2);
        ctx.lineTo(pos.x, pos.y + iconSize);
        ctx.lineTo(pos.x - iconSize * 0.4, pos.y + iconSize * 0.2);
        ctx.lineTo(pos.x, pos.y - iconSize * 0.2);
        ctx.closePath();
        ctx.fill();

        // Add highlight
        ctx.fillStyle = '#FFFFFF';
        ctx.globalAlpha = 0.5;
        ctx.beginPath();
        ctx.moveTo(pos.x - iconSize * 0.1, pos.y - iconSize * 0.8);
        ctx.lineTo(pos.x + iconSize * 0.2, pos.y - iconSize * 0.3);
        ctx.lineTo(pos.x - iconSize * 0.1, pos.y);
        ctx.closePath();
        ctx.fill();
        ctx.globalAlpha = 1.0;
      }
    }

    // Acid effect
    if (this.isAcidified) {
      // Draw acid effect aura
      ctx.fillStyle = 'rgba(156, 39, 176, 0.5)';
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size + 6, 0, Math.PI * 2);
      ctx.fill();

      // Add acid drips
      ctx.strokeStyle = 'rgba(156, 39, 176, 0.8)';
      ctx.lineWidth = 2;
      for (let i = 0; i < 6; i++) {
        const angle = Math.PI * 2 * i / 6;
        const startX = this.x + Math.cos(angle) * this.size;
        const startY = this.y + Math.sin(angle) * this.size;
        const endX = startX + Math.cos(angle) * 10;
        const endY = startY + Math.sin(angle) * 10;

        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.stroke();

        // Add drip at the end
        ctx.beginPath();
        ctx.arc(endX, endY, 3, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(156, 39, 176, 0.8)';
        ctx.fill();
      }

      // Draw acid flask icon
      if (usedPositions < iconPositions.length) {
        const pos = iconPositions[usedPositions++];

        // Draw flask
        ctx.fillStyle = '#9C27B0';
        ctx.beginPath();
        ctx.moveTo(pos.x - iconSize * 0.3, pos.y - iconSize * 0.5);
        ctx.lineTo(pos.x - iconSize * 0.5, pos.y + iconSize * 0.3);
        ctx.quadraticCurveTo(
          pos.x, pos.y + iconSize * 0.7,
          pos.x + iconSize * 0.5, pos.y + iconSize * 0.3
        );
        ctx.lineTo(pos.x + iconSize * 0.3, pos.y - iconSize * 0.5);
        ctx.closePath();
        ctx.fill();

        // Draw acid bubbles
        ctx.fillStyle = '#E040FB';
        for (let i = 0; i < 3; i++) {
          const bubbleX = pos.x + (Math.random() - 0.5) * iconSize * 0.6;
          const bubbleY = pos.y + (Math.random() * 0.3) * iconSize;
          const bubbleSize = (0.1 + Math.random() * 0.1) * iconSize;

          ctx.beginPath();
          ctx.arc(bubbleX, bubbleY, bubbleSize, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    // Special boss effects
    if (this.specialEffect) {
      switch(this.specialEffect) {
        case 'pulse':
          // Pulsing green aura for Forest Guardian
          const pulseSize = this.size + 10 + Math.sin(Date.now() / 200) * 5;
          ctx.fillStyle = 'rgba(76, 175, 80, 0.3)';
          ctx.beginPath();
          ctx.arc(this.x, this.y, pulseSize, 0, Math.PI * 2);
          ctx.fill();
          break;

        case 'ice':
          // Ice crystals for Frost Titan
          ctx.fillStyle = 'rgba(33, 150, 243, 0.4)';
          for (let i = 0; i < 6; i++) {
            const angle = Math.PI * 2 * i / 6;
            const x = this.x + Math.cos(angle) * (this.size + 15);
            const y = this.y + Math.sin(angle) * (this.size + 15);

            // Draw ice crystal
            ctx.beginPath();
            ctx.moveTo(x, y - 10);
            ctx.lineTo(x + 5, y - 5);
            ctx.lineTo(x + 10, y);
            ctx.lineTo(x + 5, y + 5);
            ctx.lineTo(x, y + 10);
            ctx.lineTo(x - 5, y + 5);
            ctx.lineTo(x - 10, y);
            ctx.lineTo(x - 5, y - 5);
            ctx.closePath();
            ctx.fill();
          }
          break;

        case 'fire':
          // Fire aura for Inferno Colossus
          for (let i = 0; i < 12; i++) {
            const angle = Math.PI * 2 * i / 12;
            const x = this.x + Math.cos(angle) * (this.size + 10);
            const y = this.y + Math.sin(angle) * (this.size + 10);
            const flameHeight = 15 + Math.random() * 10;

            ctx.fillStyle = `rgba(255, ${Math.floor(87 + Math.random() * 100)}, 34, ${0.5 + Math.random() * 0.5})`;
            ctx.beginPath();
            ctx.moveTo(this.x, this.y);
            ctx.quadraticCurveTo(
              x, y,
              x + Math.cos(angle) * flameHeight, y + Math.sin(angle) * flameHeight
            );
            ctx.quadraticCurveTo(
              x + Math.cos(angle + 0.2) * (flameHeight/2), y + Math.sin(angle + 0.2) * (flameHeight/2),
              this.x, this.y
            );
            ctx.fill();
          }
          break;

        case 'shadow':
          // Shadow aura for Nightmare Devourer
          ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
          ctx.beginPath();
          ctx.arc(this.x, this.y, this.size + 15, 0, Math.PI * 2);
          ctx.fill();

          // Add shadow tendrils
          ctx.strokeStyle = 'rgba(0, 0, 0, 0.8)';
          ctx.lineWidth = 3;
          for (let i = 0; i < 8; i++) {
            const angle = Math.PI * 2 * i / 8;
            const startX = this.x + Math.cos(angle) * this.size;
            const startY = this.y + Math.sin(angle) * this.size;

            // Create wavy tendril
            ctx.beginPath();
            ctx.moveTo(startX, startY);

            const length = 30 + Math.random() * 20;
            const segments = 5;

            for (let j = 1; j <= segments; j++) {
              const segmentLength = length / segments;
              const segmentAngle = angle + Math.sin(Date.now() / 500 + i) * 0.5;
              const endX = startX + Math.cos(segmentAngle) * segmentLength * j;
              const endY = startY + Math.sin(segmentAngle) * segmentLength * j;

              ctx.lineTo(endX, endY);
            }

            ctx.stroke();
          }
          break;

        case 'void':
          // Void aura for Void Entity and corrupted bosses
          // Create a gradient for the void effect
          const gradient = ctx.createRadialGradient(
            this.x, this.y, this.size,
            this.x, this.y, this.size + 20
          );

          // Use secondary color for glow if available (for corrupted bosses)
          const glowColor = this.secondaryColor || '#9C27B0';

          gradient.addColorStop(0, 'rgba(0, 0, 0, 0.8)');
          gradient.addColorStop(1, `${glowColor}80`); // 50% opacity

          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.arc(this.x, this.y, this.size + 20, 0, Math.PI * 2);
          ctx.fill();

          // Add void particles
          for (let i = 0; i < 15; i++) {
            const angle = Math.PI * 2 * Math.random();
            const distance = (this.size + 5 + Math.random() * 15);
            const x = this.x + Math.cos(angle) * distance;
            const y = this.y + Math.sin(angle) * distance;
            const particleSize = 1 + Math.random() * 3;

            ctx.beginPath();
            ctx.arc(x, y, particleSize, 0, Math.PI * 2);
            ctx.fillStyle = Math.random() > 0.5 ? 'rgba(0, 0, 0, 0.8)' : `${glowColor}CC`; // 80% opacity
            ctx.fill();
          }
          break;
      }
    }

    // Reset alpha if it was changed
    if (this.type === 'invisible') {
      ctx.globalAlpha = 1.0;
    }
  }

  // Apply slow effect
  applySlowEffect(slowFactor, duration) {
    // Only apply if the new slow is stronger
    if (slowFactor < this.slowEffect) {
      this.slowEffect = slowFactor;
      this.slowDuration = duration;
    }
  }

  // Draw methods for different enemy types
  drawNormalEnemy(ctx) {
    // Draw enemy body - hexagonal shape for futuristic look
    ctx.fillStyle = this.color;
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i;
      const x = Math.cos(angle) * this.size;
      const y = Math.sin(angle) * this.size;
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.closePath();
    ctx.fill();

    // Draw border
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw tech pattern - central core
    ctx.fillStyle = '#4FC3F7';
    ctx.beginPath();
    ctx.arc(0, 0, this.size/2.5, 0, Math.PI * 2);
    ctx.fill();

    // Draw sensor lights
    ctx.fillStyle = '#fff';
    for (let i = 0; i < 3; i++) {
      const angle = (Math.PI * 2 / 3) * i + Math.PI/6;
      const x = Math.cos(angle) * (this.size/1.8);
      const y = Math.sin(angle) * (this.size/1.8);

      ctx.beginPath();
      ctx.arc(x, y, this.size/6, 0, Math.PI * 2);
      ctx.fill();

      // Sensor glow
      ctx.fillStyle = '#4FC3F7';
      ctx.globalAlpha = 0.5;
      ctx.beginPath();
      ctx.arc(x, y, this.size/4, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1.0;
      ctx.fillStyle = '#fff';
    }

    // Draw tech lines
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;
    for (let i = 0; i < 3; i++) {
      const angle = (Math.PI * 2 / 3) * i + Math.PI/6;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(angle) * (this.size * 0.9), Math.sin(angle) * (this.size * 0.9));
      ctx.stroke();
    }
  }

  drawFastEnemy(ctx) {
    // Draw aerodynamic body - sleek teardrop shape
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.moveTo(this.size * 1.5, 0);

    // Create curved teardrop shape
    ctx.quadraticCurveTo(
      this.size/2, this.size,
      -this.size, 0
    );
    ctx.quadraticCurveTo(
      this.size/2, -this.size,
      this.size * 1.5, 0
    );

    ctx.closePath();
    ctx.fill();

    // Draw border
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw tech fins
    ctx.fillStyle = '#455A64';
    ctx.beginPath();
    ctx.moveTo(-this.size/2, 0);
    ctx.lineTo(-this.size, -this.size);
    ctx.lineTo(0, -this.size/3);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(-this.size/2, 0);
    ctx.lineTo(-this.size, this.size);
    ctx.lineTo(0, this.size/3);
    ctx.closePath();
    ctx.fill();

    // Draw speed lines/energy trail
    ctx.strokeStyle = '#4FC3F7';
    ctx.lineWidth = 1;
    for (let i = 1; i <= 5; i++) {
      const offset = i * 4;
      const alpha = 1 - (i / 6);
      ctx.globalAlpha = alpha;

      ctx.beginPath();
      ctx.moveTo(-this.size - offset, 0);
      ctx.lineTo(-this.size - offset - 10, this.size/3);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(-this.size - offset, 0);
      ctx.lineTo(-this.size - offset - 10, -this.size/3);
      ctx.stroke();
    }
    ctx.globalAlpha = 1.0;

    // Draw tech sensor/scanner
    ctx.fillStyle = '#E91E63';
    ctx.beginPath();
    ctx.arc(this.size/2, 0, this.size/3, 0, Math.PI * 2);
    ctx.fill();

    // Scanner lines
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(this.size/2 - this.size/4, -this.size/4);
    ctx.lineTo(this.size/2 + this.size/4, this.size/4);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(this.size/2 - this.size/4, this.size/4);
    ctx.lineTo(this.size/2 + this.size/4, -this.size/4);
    ctx.stroke();
  }

  drawTankEnemy(ctx) {
    // Draw futuristic tank body - angular armored shape
    ctx.fillStyle = this.color;

    // Main body - octagonal shape
    ctx.beginPath();
    const bodyWidth = this.size * 2.2;
    const bodyHeight = this.size * 1.4;
    const cornerSize = this.size * 0.3;

    // Top left corner
    ctx.moveTo(-bodyWidth/2 + cornerSize, -bodyHeight/2);
    // Top edge
    ctx.lineTo(bodyWidth/2 - cornerSize, -bodyHeight/2);
    // Top right corner
    ctx.lineTo(bodyWidth/2, -bodyHeight/2 + cornerSize);
    // Right edge
    ctx.lineTo(bodyWidth/2, bodyHeight/2 - cornerSize);
    // Bottom right corner
    ctx.lineTo(bodyWidth/2 - cornerSize, bodyHeight/2);
    // Bottom edge
    ctx.lineTo(-bodyWidth/2 + cornerSize, bodyHeight/2);
    // Bottom left corner
    ctx.lineTo(-bodyWidth/2, bodyHeight/2 - cornerSize);
    // Left edge
    ctx.lineTo(-bodyWidth/2, -bodyHeight/2 + cornerSize);

    ctx.closePath();
    ctx.fill();

    // Draw armor plates
    ctx.fillStyle = '#455A64';

    // Front armor plate
    ctx.beginPath();
    ctx.moveTo(-bodyWidth/2 + cornerSize, -bodyHeight/2 + this.size*0.2);
    ctx.lineTo(bodyWidth/2 - cornerSize, -bodyHeight/2 + this.size*0.2);
    ctx.lineTo(bodyWidth/2 - cornerSize - this.size*0.2, -bodyHeight/2 + this.size*0.5);
    ctx.lineTo(-bodyWidth/2 + cornerSize + this.size*0.2, -bodyHeight/2 + this.size*0.5);
    ctx.closePath();
    ctx.fill();

    // Rear armor plate
    ctx.beginPath();
    ctx.moveTo(-bodyWidth/2 + cornerSize, bodyHeight/2 - this.size*0.2);
    ctx.lineTo(bodyWidth/2 - cornerSize, bodyHeight/2 - this.size*0.2);
    ctx.lineTo(bodyWidth/2 - cornerSize - this.size*0.2, bodyHeight/2 - this.size*0.5);
    ctx.lineTo(-bodyWidth/2 + cornerSize + this.size*0.2, bodyHeight/2 - this.size*0.5);
    ctx.closePath();
    ctx.fill();

    // Draw hover jets
    ctx.fillStyle = '#03A9F4';
    for (let i = -2; i <= 2; i++) {
      const x = i * (this.size * 0.4);

      // Top hover jet
      ctx.beginPath();
      ctx.rect(x - this.size*0.15, -bodyHeight/2 - this.size*0.2, this.size*0.3, this.size*0.2);
      ctx.fill();

      // Bottom hover jet
      ctx.beginPath();
      ctx.rect(x - this.size*0.15, bodyHeight/2, this.size*0.3, this.size*0.2);
      ctx.fill();

      // Jet glow
      const glowGradient = ctx.createLinearGradient(
        x, bodyHeight/2 + this.size*0.2,
        x, bodyHeight/2 + this.size*0.4
      );
      glowGradient.addColorStop(0, '#03A9F4');
      glowGradient.addColorStop(1, 'rgba(3, 169, 244, 0)');

      ctx.fillStyle = glowGradient;
      ctx.globalAlpha = 0.7;
      ctx.beginPath();
      ctx.rect(x - this.size*0.15, bodyHeight/2 + this.size*0.2, this.size*0.3, this.size*0.2);
      ctx.fill();
      ctx.globalAlpha = 1.0;
      ctx.fillStyle = '#03A9F4';
    }

    // Draw turret - hexagonal
    ctx.fillStyle = '#546E7A';
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i - Math.PI/6;
      const x = Math.cos(angle) * (this.size * 0.6);
      const y = Math.sin(angle) * (this.size * 0.6);
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.closePath();
    ctx.fill();

    // Draw cannon
    ctx.fillStyle = '#37474F';
    ctx.beginPath();
    ctx.rect(0, -this.size/6, this.size*1.2, this.size/3);
    ctx.fill();

    // Draw tech details - sensor array
    ctx.fillStyle = '#F44336';
    ctx.beginPath();
    ctx.arc(0, 0, this.size/4, 0, Math.PI * 2);
    ctx.fill();

    // Scanner lines
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(0, 0, this.size/3, 0, Math.PI * 2);
    ctx.stroke();

    // Draw border
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.beginPath();

    // Top left corner
    ctx.moveTo(-bodyWidth/2 + cornerSize, -bodyHeight/2);
    // Top edge
    ctx.lineTo(bodyWidth/2 - cornerSize, -bodyHeight/2);
    // Top right corner
    ctx.lineTo(bodyWidth/2, -bodyHeight/2 + cornerSize);
    // Right edge
    ctx.lineTo(bodyWidth/2, bodyHeight/2 - cornerSize);
    // Bottom right corner
    ctx.lineTo(bodyWidth/2 - cornerSize, bodyHeight/2);
    // Bottom edge
    ctx.lineTo(-bodyWidth/2 + cornerSize, bodyHeight/2);
    // Bottom left corner
    ctx.lineTo(-bodyWidth/2, bodyHeight/2 - cornerSize);
    // Left edge
    ctx.lineTo(-bodyWidth/2, -bodyHeight/2 + cornerSize);

    ctx.closePath();
    ctx.stroke();
  }

  drawFlyingEnemy(ctx) {
    // Draw futuristic drone/UFO body
    const time = Date.now() / 1000;
    // Hovering effect is now handled in the main draw method

    // Draw shadow on the ground (this is drawn in the main draw method now)

    // Main body - saucer shape
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.ellipse(0, 0, this.size * 1.2, this.size * 0.4, 0, 0, Math.PI * 2);
    ctx.fill();

    // Draw dome
    const domeGradient = ctx.createRadialGradient(
      0, -this.size * 0.1, 0,
      0, -this.size * 0.1, this.size * 0.8
    );
    domeGradient.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
    domeGradient.addColorStop(0.7, 'rgba(200, 230, 255, 0.7)');
    domeGradient.addColorStop(1, 'rgba(100, 181, 246, 0.5)');

    ctx.fillStyle = domeGradient;
    ctx.beginPath();
    ctx.ellipse(0, -this.size * 0.1, this.size * 0.7, this.size * 0.5, 0, Math.PI, 0, true);
    ctx.fill();

    // Draw tech details - antigravity rings
    const ringPulse = Math.sin(time * 3) * 0.2 + 0.8; // Pulsing animation

    // Outer ring with rotation
    ctx.save();
    ctx.rotate(time % (Math.PI * 2));
    ctx.strokeStyle = '#4FC3F7';
    ctx.lineWidth = 2;
    ctx.globalAlpha = ringPulse;
    ctx.beginPath();
    ctx.ellipse(0, 0, this.size * 1.4, this.size * 0.5, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // Inner ring with opposite rotation
    ctx.save();
    ctx.rotate(-(time % (Math.PI * 2)));
    ctx.strokeStyle = '#29B6F6';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(0, 0, this.size * 0.9, this.size * 0.3, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    ctx.globalAlpha = 1.0;

    // Draw hover jets with more dynamic effects
    ctx.fillStyle = '#03A9F4';
    const jetCount = 5;
    for (let i = 0; i < jetCount; i++) {
      const angle = (Math.PI * 2 / jetCount) * i + time % (Math.PI/4); // Slight rotation
      const x = Math.cos(angle) * this.size * 0.8;
      const y = Math.sin(angle) * this.size * 0.3;

      // Jet nozzle
      ctx.beginPath();
      ctx.arc(x, y, this.size * 0.15, 0, Math.PI * 2);
      ctx.fill();

      // Jet glow with more dynamic pulsing
      const pulseRate = 2 + i * 0.5; // Different pulse rate for each jet
      const glowSize = this.size * 0.3 * (0.7 + Math.sin(time * pulseRate) * 0.3);
      const glowGradient = ctx.createRadialGradient(
        x, y, 0,
        x, y, glowSize
      );
      glowGradient.addColorStop(0, 'rgba(3, 169, 244, 0.8)');
      glowGradient.addColorStop(1, 'rgba(3, 169, 244, 0)');

      ctx.fillStyle = glowGradient;
      ctx.globalAlpha = 0.7;
      ctx.beginPath();
      ctx.arc(x, y, glowSize, 0, Math.PI * 2);
      ctx.fill();

      // Add jet trail/exhaust
      const trailGradient = ctx.createLinearGradient(
        x, y,
        x + Math.cos(angle + Math.PI) * this.size * 0.6,
        y + Math.sin(angle + Math.PI) * this.size * 0.6
      );
      trailGradient.addColorStop(0, 'rgba(3, 169, 244, 0.7)');
      trailGradient.addColorStop(1, 'rgba(3, 169, 244, 0)');

      ctx.fillStyle = trailGradient;
      ctx.beginPath();
      ctx.moveTo(x, y);

      // Create wavy trail
      const trailLength = this.size * (0.4 + Math.sin(time * 3 + i) * 0.2);
      const waveAmplitude = this.size * 0.1;
      const waveFrequency = 10;

      for (let t = 0; t <= 1; t += 0.1) {
        const trailX = x + Math.cos(angle + Math.PI) * trailLength * t;
        const trailY = y + Math.sin(angle + Math.PI) * trailLength * t;
        const waveOffset = Math.sin(t * waveFrequency + time * 5) * waveAmplitude * t;

        const perpAngle = angle + Math.PI/2;
        const offsetX = trailX + Math.cos(perpAngle) * waveOffset;
        const offsetY = trailY + Math.sin(perpAngle) * waveOffset;

        ctx.lineTo(offsetX, offsetY);
      }

      ctx.closePath();
      ctx.fill();

      ctx.globalAlpha = 1.0;
      ctx.fillStyle = '#03A9F4';
    }

    // Draw sensor array with pulsing effect
    const sensorPulse = 0.8 + Math.sin(time * 4) * 0.2;
    ctx.fillStyle = '#F44336';
    ctx.beginPath();
    ctx.arc(0, -this.size * 0.3, this.size * 0.15 * sensorPulse, 0, Math.PI * 2);
    ctx.fill();

    // Add sensor glow
    const sensorGlow = ctx.createRadialGradient(
      0, -this.size * 0.3, 0,
      0, -this.size * 0.3, this.size * 0.25
    );
    sensorGlow.addColorStop(0, 'rgba(244, 67, 54, 0.8)');
    sensorGlow.addColorStop(1, 'rgba(244, 67, 54, 0)');

    ctx.fillStyle = sensorGlow;
    ctx.globalAlpha = 0.6 * sensorPulse;
    ctx.beginPath();
    ctx.arc(0, -this.size * 0.3, this.size * 0.25, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1.0;

    // Scanner beam with more dynamic effect
    const beamHeight = this.size * (0.5 + Math.sin(time * 1.5) * 0.3);
    const beamWidth = this.size * (0.4 + Math.sin(time * 2) * 0.1);
    const beamGradient = ctx.createLinearGradient(
      0, 0,
      0, beamHeight
    );
    beamGradient.addColorStop(0, 'rgba(244, 67, 54, 0.8)');
    beamGradient.addColorStop(1, 'rgba(244, 67, 54, 0)');

    ctx.fillStyle = beamGradient;
    ctx.globalAlpha = 0.6 + Math.sin(time * 3) * 0.2;
    ctx.beginPath();
    ctx.moveTo(-beamWidth/2, 0);
    ctx.lineTo(beamWidth/2, 0);
    ctx.lineTo(beamWidth/2 + beamWidth/4, beamHeight);
    ctx.lineTo(-beamWidth/2 - beamWidth/4, beamHeight);
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = 1.0;

    // Draw border
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(0, 0, this.size * 1.2, this.size * 0.4, 0, 0, Math.PI * 2);
    ctx.stroke();
  }

  drawHealingEnemy(ctx) {
    // Draw futuristic medical drone

    // Main body - octagonal shape
    ctx.fillStyle = this.color;
    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
      const angle = (Math.PI / 4) * i;
      const x = Math.cos(angle) * this.size;
      const y = Math.sin(angle) * this.size;
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.closePath();
    ctx.fill();

    // Draw border
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw medical symbol - caduceus-inspired design
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;

    // Central staff
    ctx.beginPath();
    ctx.moveTo(0, -this.size * 0.7);
    ctx.lineTo(0, this.size * 0.7);
    ctx.stroke();

    // Wings
    const wingSize = this.size * 0.5;
    ctx.beginPath();
    ctx.ellipse(-wingSize/2, 0, wingSize/2, wingSize, 0, 0, Math.PI * 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.ellipse(wingSize/2, 0, wingSize/2, wingSize, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Snakes
    const time = Date.now() / 1000;
    // Wave effect is applied directly in the snake drawing

    // First snake
    ctx.strokeStyle = '#B3E5FC';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, -this.size * 0.6);

    for (let t = 0; t <= 1; t += 0.1) {
      const x = Math.sin(t * Math.PI * 2 + time) * this.size * 0.4;
      const y = -this.size * 0.6 + t * this.size * 1.2;
      ctx.lineTo(x, y);
    }

    ctx.stroke();

    // Second snake
    ctx.strokeStyle = '#81C784';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, -this.size * 0.6);

    for (let t = 0; t <= 1; t += 0.1) {
      const x = Math.sin(t * Math.PI * 2 + time + Math.PI) * this.size * 0.4;
      const y = -this.size * 0.6 + t * this.size * 1.2;
      ctx.lineTo(x, y);
    }

    ctx.stroke();

    // Draw healing aura
    const pulseSize = Math.sin(Date.now() / 500) * 5;
    const auraGradient = ctx.createRadialGradient(
      0, 0, this.size,
      0, 0, this.healRadius/2 + pulseSize
    );
    auraGradient.addColorStop(0, 'rgba(76, 175, 80, 0.5)');
    auraGradient.addColorStop(0.7, 'rgba(76, 175, 80, 0.2)');
    auraGradient.addColorStop(1, 'rgba(76, 175, 80, 0)');

    ctx.fillStyle = auraGradient;
    ctx.beginPath();
    ctx.arc(0, 0, this.healRadius/2 + pulseSize, 0, Math.PI * 2);
    ctx.fill();

    // Draw tech core
    ctx.fillStyle = '#E8F5E9';
    ctx.beginPath();
    ctx.arc(0, 0, this.size * 0.4, 0, Math.PI * 2);
    ctx.fill();

    // Draw healing symbol
    ctx.strokeStyle = '#4CAF50';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(0, -this.size * 0.2);
    ctx.lineTo(0, this.size * 0.2);
    ctx.moveTo(-this.size * 0.2, 0);
    ctx.lineTo(this.size * 0.2, 0);
    ctx.stroke();

    // Draw energy particles
    ctx.fillStyle = '#81C784';
    for (let i = 0; i < 8; i++) {
      const angle = (Math.PI / 4) * i + time % (Math.PI * 2);
      const distance = this.size * 0.8;
      const particleSize = this.size * 0.1 * (0.7 + Math.sin(time * 3 + i) * 0.3);

      ctx.beginPath();
      ctx.arc(
        Math.cos(angle) * distance,
        Math.sin(angle) * distance,
        particleSize,
        0,
        Math.PI * 2
      );
      ctx.fill();
    }
  }

  drawSpawnerEnemy(ctx) {
    // Draw futuristic replicator/factory unit
    const time = Date.now() / 1000;

    // Main body - hexagonal with rotating parts
    ctx.fillStyle = this.color;

    // Outer shell
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i;
      const x = Math.cos(angle) * this.size * 1.1;
      const y = Math.sin(angle) * this.size * 1.1;
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.closePath();
    ctx.fill();

    // Draw border
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw inner rotating mechanism
    ctx.save();
    ctx.rotate(time % (Math.PI * 2));

    // Inner gear
    ctx.fillStyle = '#455A64';
    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
      const angle = (Math.PI / 4) * i;
      const innerRadius = this.size * 0.5;
      const outerRadius = this.size * 0.8;

      ctx.lineTo(Math.cos(angle) * outerRadius, Math.sin(angle) * outerRadius);
      ctx.lineTo(Math.cos(angle + Math.PI/8) * innerRadius, Math.sin(angle + Math.PI/8) * innerRadius);
    }
    ctx.closePath();
    ctx.fill();

    // Draw gear teeth
    ctx.strokeStyle = '#263238';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();

    // Draw spawner indicators - energy beams
    const beamCount = 3;
    for (let i = 0; i < beamCount; i++) {
      const angle = (Math.PI * 2 / beamCount) * i + time % (Math.PI * 2);
      const startRadius = this.size * 0.4;
      const endRadius = this.size * 1.3;

      // Beam gradient
      const beamGradient = ctx.createLinearGradient(
        Math.cos(angle) * startRadius, Math.sin(angle) * startRadius,
        Math.cos(angle) * endRadius, Math.sin(angle) * endRadius
      );
      beamGradient.addColorStop(0, 'rgba(255, 152, 0, 0.8)');
      beamGradient.addColorStop(1, 'rgba(255, 152, 0, 0)');

      // Draw beam
      ctx.strokeStyle = beamGradient;
      ctx.lineWidth = 8;
      ctx.globalAlpha = 0.7 + Math.sin(time * 5 + i) * 0.3;
      ctx.beginPath();
      ctx.moveTo(Math.cos(angle) * startRadius, Math.sin(angle) * startRadius);
      ctx.lineTo(Math.cos(angle) * endRadius, Math.sin(angle) * endRadius);
      ctx.stroke();
      ctx.globalAlpha = 1.0;
    }

    // Draw spawning portal
    const portalPulse = 0.8 + Math.sin(time * 3) * 0.2;
    const portalGradient = ctx.createRadialGradient(
      0, 0, 0,
      0, 0, this.size * 0.4 * portalPulse
    );
    portalGradient.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
    portalGradient.addColorStop(0.5, 'rgba(255, 152, 0, 0.7)');
    portalGradient.addColorStop(1, 'rgba(255, 87, 34, 0.5)');

    ctx.fillStyle = portalGradient;
    ctx.beginPath();
    ctx.arc(0, 0, this.size * 0.4 * portalPulse, 0, Math.PI * 2);
    ctx.fill();

    // Draw tech details - energy nodes
    ctx.fillStyle = '#FF9800';
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i;
      const x = Math.cos(angle) * this.size * 0.7;
      const y = Math.sin(angle) * this.size * 0.7;
      const nodeSize = this.size * 0.15 * (0.8 + Math.sin(time * 4 + i) * 0.2);

      ctx.beginPath();
      ctx.arc(x, y, nodeSize, 0, Math.PI * 2);
      ctx.fill();

      // Node glow
      const glowGradient = ctx.createRadialGradient(
        x, y, 0,
        x, y, nodeSize * 1.5
      );
      glowGradient.addColorStop(0, 'rgba(255, 152, 0, 0.7)');
      glowGradient.addColorStop(1, 'rgba(255, 152, 0, 0)');

      ctx.fillStyle = glowGradient;
      ctx.globalAlpha = 0.6;
      ctx.beginPath();
      ctx.arc(x, y, nodeSize * 1.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1.0;
      ctx.fillStyle = '#FF9800';
    }
  }

  drawArmoredEnemy(ctx) {
    // Draw futuristic armored mech

    // Draw base body
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(0, 0, this.size * 0.7, 0, Math.PI * 2);
    ctx.fill();

    // Draw armor plating - segmented hexagonal plates
    const plateCount = 6;
    const plateSize = this.size * 0.6;
    const plateDistance = this.size * 0.8;

    for (let i = 0; i < plateCount; i++) {
      const angle = (Math.PI * 2 / plateCount) * i;
      const centerX = Math.cos(angle) * plateDistance;
      const centerY = Math.sin(angle) * plateDistance;

      // Draw plate
      ctx.fillStyle = '#455A64';
      ctx.beginPath();
      for (let j = 0; j < 6; j++) {
        const plateAngle = (Math.PI / 3) * j + angle;
        const x = centerX + Math.cos(plateAngle) * plateSize/2;
        const y = centerY + Math.sin(plateAngle) * plateSize/2;
        if (j === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.closePath();
      ctx.fill();

      // Draw plate border
      ctx.strokeStyle = '#263238';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Draw energy core in each plate
      ctx.fillStyle = '#03A9F4';
      ctx.beginPath();
      ctx.arc(centerX, centerY, plateSize/4, 0, Math.PI * 2);
      ctx.fill();

      // Draw energy glow
      const glowGradient = ctx.createRadialGradient(
        centerX, centerY, 0,
        centerX, centerY, plateSize/3
      );
      glowGradient.addColorStop(0, 'rgba(3, 169, 244, 0.7)');
      glowGradient.addColorStop(1, 'rgba(3, 169, 244, 0)');

      ctx.fillStyle = glowGradient;
      ctx.globalAlpha = 0.6;
      ctx.beginPath();
      ctx.arc(centerX, centerY, plateSize/3, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1.0;
    }

    // Draw central core
    const coreGradient = ctx.createRadialGradient(
      0, 0, 0,
      0, 0, this.size * 0.4
    );
    coreGradient.addColorStop(0, '#B0BEC5');
    coreGradient.addColorStop(0.7, '#78909C');
    coreGradient.addColorStop(1, '#546E7A');

    ctx.fillStyle = coreGradient;
    ctx.beginPath();
    ctx.arc(0, 0, this.size * 0.4, 0, Math.PI * 2);
    ctx.fill();

    // Draw tech details - scanner array
    ctx.fillStyle = '#F44336';
    ctx.beginPath();
    ctx.arc(0, 0, this.size * 0.2, 0, Math.PI * 2);
    ctx.fill();

    // Draw scanner lines
    const time = Date.now() / 1000;
    ctx.strokeStyle = '#FFCDD2';
    ctx.lineWidth = 2;

    for (let i = 0; i < 3; i++) {
      const scanAngle = (Math.PI * 2 / 3) * i + time % (Math.PI * 2);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(scanAngle) * this.size, Math.sin(scanAngle) * this.size);
      ctx.stroke();
    }

    // Draw border
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, this.size, 0, Math.PI * 2);
    ctx.stroke();

    // Draw energy shield effect
    ctx.strokeStyle = 'rgba(3, 169, 244, 0.3)';
    ctx.lineWidth = 3;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.arc(0, 0, this.size * 1.1, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  drawInvisibleEnemy(ctx) {
    // Draw futuristic stealth/cloaking unit
    const time = Date.now() / 1000;

    // Create shimmering effect with varying opacity
    const shimmerEffect = 0.3 + Math.sin(time * 3) * 0.1;

    // Draw cloaked body - hexagonal shape with distortion effect
    ctx.fillStyle = `rgba(200, 230, 255, ${shimmerEffect})`;

    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      // Add distortion to the vertices
      const distortion = Math.sin(time * 2 + i) * this.size * 0.1;
      const angle = (Math.PI / 3) * i;
      const x = Math.cos(angle) * (this.size + distortion);
      const y = Math.sin(angle) * (this.size + distortion);

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        // Use bezier curves for a more fluid, distorted look
        const prevAngle = (Math.PI / 3) * (i - 1);
        const prevX = Math.cos(prevAngle) * (this.size + distortion);
        const prevY = Math.sin(prevAngle) * (this.size + distortion);

        const cp1x = prevX + Math.cos(prevAngle + Math.PI/6) * this.size * 0.2;
        const cp1y = prevY + Math.sin(prevAngle + Math.PI/6) * this.size * 0.2;
        const cp2x = x + Math.cos(angle - Math.PI/6) * this.size * 0.2;
        const cp2y = y + Math.sin(angle - Math.PI/6) * this.size * 0.2;

        ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x, y);
      }
    }
    ctx.closePath();
    ctx.fill();

    // Draw cloaking field effect - rippling waves
    ctx.strokeStyle = `rgba(100, 181, 246, ${shimmerEffect + 0.1})`;
    ctx.lineWidth = 1;

    const waveCount = 3;
    for (let w = 1; w <= waveCount; w++) {
      const waveRadius = this.size * (1 + w * 0.2);
      const wavePhase = time * 2 + w;

      ctx.beginPath();
      for (let i = 0; i < 360; i += 10) {
        const angle = (i * Math.PI / 180);
        const waveDistortion = Math.sin(angle * 6 + wavePhase) * this.size * 0.1;
        const x = Math.cos(angle) * (waveRadius + waveDistortion);
        const y = Math.sin(angle) * (waveRadius + waveDistortion);

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.closePath();
      ctx.stroke();
    }

    // Draw tech core - energy source for cloaking
    const coreGradient = ctx.createRadialGradient(
      0, 0, 0,
      0, 0, this.size * 0.4
    );
    coreGradient.addColorStop(0, `rgba(255, 255, 255, ${shimmerEffect + 0.3})`);
    coreGradient.addColorStop(0.5, `rgba(100, 181, 246, ${shimmerEffect + 0.2})`);
    coreGradient.addColorStop(1, `rgba(30, 136, 229, ${shimmerEffect})`);

    ctx.fillStyle = coreGradient;
    ctx.beginPath();
    ctx.arc(0, 0, this.size * 0.4, 0, Math.PI * 2);
    ctx.fill();

    // Draw energy pulses
    ctx.strokeStyle = `rgba(30, 136, 229, ${shimmerEffect + 0.2})`;
    ctx.lineWidth = 2;

    for (let i = 0; i < 8; i++) {
      const pulseAngle = (Math.PI / 4) * i + time % (Math.PI * 2);
      const pulseLength = this.size * (0.5 + Math.sin(time * 3 + i) * 0.3);

      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(
        Math.cos(pulseAngle) * pulseLength,
        Math.sin(pulseAngle) * pulseLength
      );
      ctx.stroke();
    }

    // Draw tech details - sensor array
    ctx.fillStyle = `rgba(33, 150, 243, ${shimmerEffect + 0.3})`;
    ctx.beginPath();
    ctx.arc(0, 0, this.size * 0.2, 0, Math.PI * 2);
    ctx.fill();

    // Draw scanning pattern
    ctx.strokeStyle = `rgba(255, 255, 255, ${shimmerEffect + 0.4})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(0, 0, this.size * 0.3, 0, Math.PI * 2);
    ctx.stroke();
  }

  drawExplosiveEnemy(ctx) {
    // Draw futuristic explosive drone/mine
    const time = Date.now() / 1000;

    // Draw main body - octagonal shape
    ctx.fillStyle = this.color;
    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
      const angle = (Math.PI / 4) * i + Math.PI / 8; // Rotate 22.5 degrees
      const x = Math.cos(angle) * this.size;
      const y = Math.sin(angle) * this.size;
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.closePath();
    ctx.fill();

    // Draw border
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw warning stripes
    ctx.fillStyle = '#F44336'; // Red
    for (let i = 0; i < 4; i++) {
      const angle = (Math.PI / 2) * i + Math.PI / 4; // 45-degree angles

      ctx.save();
      ctx.translate(0, 0);
      ctx.rotate(angle);

      // Draw warning stripe
      ctx.beginPath();
      ctx.rect(-this.size * 1.1, -this.size * 0.15, this.size * 2.2, this.size * 0.3);
      ctx.fill();

      ctx.restore();
    }

    // Draw explosive core - pulsing reactor
    const pulseSize = 0.8 + Math.sin(time * 3) * 0.2;
    const coreGradient = ctx.createRadialGradient(
      0, 0, 0,
      0, 0, this.size * 0.6 * pulseSize
    );
    coreGradient.addColorStop(0, '#FFEB3B'); // Yellow
    coreGradient.addColorStop(0.7, '#FF9800'); // Orange
    coreGradient.addColorStop(1, '#F44336'); // Red

    ctx.fillStyle = coreGradient;
    ctx.beginPath();
    ctx.arc(0, 0, this.size * 0.6 * pulseSize, 0, Math.PI * 2);
    ctx.fill();

    // Draw energy rings
    ctx.strokeStyle = '#FFEB3B';
    ctx.lineWidth = 3;

    for (let i = 1; i <= 3; i++) {
      const ringPulse = 0.7 + Math.sin(time * 4 + i) * 0.3;
      ctx.globalAlpha = 0.7 - (i - 1) * 0.2;

      ctx.beginPath();
      ctx.arc(0, 0, this.size * 0.3 * i * ringPulse, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.globalAlpha = 1.0;

    // Draw explosion radius indicator
    ctx.strokeStyle = 'rgba(244, 67, 54, 0.3)';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.arc(0, 0, this.explosionRadius/2, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw tech details - detonator nodes
    ctx.fillStyle = '#F44336';
    for (let i = 0; i < 4; i++) {
      const angle = (Math.PI / 2) * i;
      const x = Math.cos(angle) * this.size * 0.8;
      const y = Math.sin(angle) * this.size * 0.8;

      // Pulsing detonator
      const detPulse = 0.8 + Math.sin(time * 5 + i * 2) * 0.2;

      ctx.beginPath();
      ctx.arc(x, y, this.size * 0.15 * detPulse, 0, Math.PI * 2);
      ctx.fill();

      // Detonator glow
      const glowGradient = ctx.createRadialGradient(
        x, y, 0,
        x, y, this.size * 0.25 * detPulse
      );
      glowGradient.addColorStop(0, 'rgba(244, 67, 54, 0.7)');
      glowGradient.addColorStop(1, 'rgba(244, 67, 54, 0)');

      ctx.fillStyle = glowGradient;
      ctx.globalAlpha = 0.6;
      ctx.beginPath();
      ctx.arc(x, y, this.size * 0.25 * detPulse, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1.0;
    }

    // Draw countdown display
    ctx.fillStyle = '#FFEB3B';
    ctx.beginPath();
    ctx.arc(0, 0, this.size * 0.3, 0, Math.PI * 2);
    ctx.fill();

    // Draw countdown digits (just for visual effect)
    ctx.fillStyle = '#000';
    ctx.font = `bold ${this.size * 0.3}px monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Show a random digit that changes periodically
    const digit = Math.floor((time * 2) % 10);
    ctx.fillText(digit.toString(), 0, 0);
  }

  drawBossEnemy(ctx) {
    // Draw futuristic mega-boss battle station
    const time = Date.now() / 1000;

    // Draw main body - large mechanical structure
    const bodyGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, this.size * 1.2);
    bodyGradient.addColorStop(0, '#B71C1C'); // Dark red
    bodyGradient.addColorStop(0.7, '#D32F2F'); // Medium red
    bodyGradient.addColorStop(1, '#F44336'); // Light red

    // Draw main hull - dodecagon (12-sided)
    ctx.fillStyle = bodyGradient;
    ctx.beginPath();
    for (let i = 0; i < 12; i++) {
      const angle = (Math.PI / 6) * i;
      const x = Math.cos(angle) * this.size * 1.2;
      const y = Math.sin(angle) * this.size * 1.2;
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.closePath();
    ctx.fill();

    // Draw armor plating
    ctx.fillStyle = '#7B1FA2'; // Purple
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i;

      ctx.save();
      ctx.translate(0, 0);
      ctx.rotate(angle);

      // Draw armor plate
      ctx.beginPath();
      ctx.moveTo(this.size * 0.5, -this.size * 0.4);
      ctx.lineTo(this.size * 1.1, -this.size * 0.6);
      ctx.lineTo(this.size * 1.1, this.size * 0.6);
      ctx.lineTo(this.size * 0.5, this.size * 0.4);
      ctx.closePath();
      ctx.fill();

      // Draw tech details on armor
      ctx.fillStyle = '#9C27B0'; // Lighter purple
      ctx.beginPath();
      ctx.rect(this.size * 0.7, -this.size * 0.3, this.size * 0.3, this.size * 0.6);
      ctx.fill();

      // Draw energy conduits
      ctx.strokeStyle = '#E1BEE7'; // Very light purple
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(this.size * 0.7, -this.size * 0.2);
      ctx.lineTo(this.size * 1.0, -this.size * 0.2);
      ctx.moveTo(this.size * 0.7, 0);
      ctx.lineTo(this.size * 1.0, 0);
      ctx.moveTo(this.size * 0.7, this.size * 0.2);
      ctx.lineTo(this.size * 1.0, this.size * 0.2);
      ctx.stroke();

      ctx.fillStyle = '#7B1FA2'; // Reset to armor color
      ctx.restore();
    }

    // Draw weapon systems - rotating turrets
    ctx.save();
    ctx.rotate(time % (Math.PI * 2));

    for (let i = 0; i < 4; i++) {
      const turretAngle = (Math.PI / 2) * i;
      const turretX = Math.cos(turretAngle) * this.size * 0.8;
      const turretY = Math.sin(turretAngle) * this.size * 0.8;

      // Turret base
      ctx.fillStyle = '#455A64'; // Blue grey
      ctx.beginPath();
      ctx.arc(turretX, turretY, this.size * 0.25, 0, Math.PI * 2);
      ctx.fill();

      // Turret cannon
      ctx.fillStyle = '#263238'; // Dark blue grey
      ctx.save();
      ctx.translate(turretX, turretY);
      ctx.rotate(turretAngle);

      ctx.beginPath();
      ctx.rect(0, -this.size * 0.1, this.size * 0.4, this.size * 0.2);
      ctx.fill();

      // Cannon energy glow
      const glowGradient = ctx.createRadialGradient(
        this.size * 0.4, 0, 0,
        this.size * 0.4, 0, this.size * 0.15
      );
      glowGradient.addColorStop(0, 'rgba(244, 67, 54, 0.9)');
      glowGradient.addColorStop(1, 'rgba(244, 67, 54, 0)');

      ctx.fillStyle = glowGradient;
      ctx.globalAlpha = 0.7 + Math.sin(time * 3 + i) * 0.3;
      ctx.beginPath();
      ctx.arc(this.size * 0.4, 0, this.size * 0.15, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1.0;

      ctx.restore();
    }
    ctx.restore();

    // Draw central command module
    const coreGradient = ctx.createRadialGradient(
      0, 0, 0,
      0, 0, this.size * 0.5
    );
    coreGradient.addColorStop(0, '#FFEB3B'); // Yellow
    coreGradient.addColorStop(0.7, '#FFC107'); // Amber
    coreGradient.addColorStop(1, '#FF9800'); // Orange

    ctx.fillStyle = coreGradient;
    ctx.beginPath();
    ctx.arc(0, 0, this.size * 0.5, 0, Math.PI * 2);
    ctx.fill();

    // Draw energy shield
    ctx.strokeStyle = 'rgba(33, 150, 243, 0.3)';
    ctx.lineWidth = 5;
    ctx.setLineDash([10, 10]);

    // Pulsing shield effect
    const shieldPulse = 1 + Math.sin(time * 2) * 0.1;
    ctx.beginPath();
    ctx.arc(0, 0, this.size * 1.3 * shieldPulse, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw energy core - central reactor
    const reactorPulse = 0.7 + Math.sin(time * 5) * 0.3;
    ctx.fillStyle = '#F44336';
    ctx.beginPath();
    ctx.arc(0, 0, this.size * 0.3 * reactorPulse, 0, Math.PI * 2);
    ctx.fill();

    // Draw scanner array
    for (let i = 0; i < 3; i++) {
      const scanAngle = (Math.PI * 2 / 3) * i + time % (Math.PI * 2);
      const scanGradient = ctx.createLinearGradient(
        0, 0,
        Math.cos(scanAngle) * this.size * 1.5,
        Math.sin(scanAngle) * this.size * 1.5
      );
      scanGradient.addColorStop(0, 'rgba(244, 67, 54, 0.8)');
      scanGradient.addColorStop(1, 'rgba(244, 67, 54, 0)');

      ctx.strokeStyle = scanGradient;
      ctx.lineWidth = 3;
      ctx.globalAlpha = 0.6;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(
        Math.cos(scanAngle) * this.size * 1.5,
        Math.sin(scanAngle) * this.size * 1.5
      );
      ctx.stroke();
      ctx.globalAlpha = 1.0;
    }

    // Draw boss name
    if (this.name) {
      ctx.fillStyle = '#FFFFFF';
      ctx.font = `bold ${this.size * 0.2}px Arial`;
      ctx.textAlign = 'center';
      ctx.fillText(this.name, 0, -this.size * 1.4);
    }
  }

  drawShadowEnemy(ctx) {
    // Draw shadow entity
    const time = Date.now() / 1000;

    // Shadow effect - dark body with smoky edges
    const shadowGradient = ctx.createRadialGradient(
      0, 0, 0,
      0, 0, this.size
    );
    shadowGradient.addColorStop(0, '#000000');
    shadowGradient.addColorStop(0.6, 'rgba(33, 33, 33, 0.8)');
    shadowGradient.addColorStop(1, 'rgba(33, 33, 33, 0)');

    ctx.fillStyle = shadowGradient;
    ctx.beginPath();
    ctx.arc(0, 0, this.size, 0, Math.PI * 2);
    ctx.fill();

    // Add smoky tendrils
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.lineWidth = 2;

    const tendrilCount = 6;
    for (let i = 0; i < tendrilCount; i++) {
      const angle = (Math.PI * 2 / tendrilCount) * i + time % Math.PI;
      const length = this.size * (0.8 + Math.sin(time * 2 + i) * 0.3);

      ctx.beginPath();
      ctx.moveTo(0, 0);

      // Create wavy tendril
      for (let t = 0; t <= 1; t += 0.1) {
        const segmentLength = length * t;
        const waveOffset = Math.sin(t * Math.PI * 3 + time * 2) * this.size * 0.15;
        const x = Math.cos(angle) * segmentLength + Math.cos(angle + Math.PI/2) * waveOffset;
        const y = Math.sin(angle) * segmentLength + Math.sin(angle + Math.PI/2) * waveOffset;

        ctx.lineTo(x, y);
      }

      ctx.stroke();
    }

    // Draw glowing eyes
    const eyeSize = this.size * 0.15;
    const eyeDistance = this.size * 0.25;
    const eyeY = -this.size * 0.1;

    // Left eye
    const leftEyeGlow = ctx.createRadialGradient(
      -eyeDistance, eyeY, 0,
      -eyeDistance, eyeY, eyeSize
    );
    leftEyeGlow.addColorStop(0, '#9C27B0'); // Purple
    leftEyeGlow.addColorStop(0.5, 'rgba(156, 39, 176, 0.5)');
    leftEyeGlow.addColorStop(1, 'rgba(156, 39, 176, 0)');

    ctx.fillStyle = leftEyeGlow;
    ctx.beginPath();
    ctx.arc(-eyeDistance, eyeY, eyeSize, 0, Math.PI * 2);
    ctx.fill();

    // Right eye
    const rightEyeGlow = ctx.createRadialGradient(
      eyeDistance, eyeY, 0,
      eyeDistance, eyeY, eyeSize
    );
    rightEyeGlow.addColorStop(0, '#9C27B0'); // Purple
    rightEyeGlow.addColorStop(0.5, 'rgba(156, 39, 176, 0.5)');
    rightEyeGlow.addColorStop(1, 'rgba(156, 39, 176, 0)');

    ctx.fillStyle = rightEyeGlow;
    ctx.beginPath();
    ctx.arc(eyeDistance, eyeY, eyeSize, 0, Math.PI * 2);
    ctx.fill();

    // Add pulsing shadow aura
    const auraSize = this.size * (1.2 + Math.sin(time * 2) * 0.2);
    const auraGradient = ctx.createRadialGradient(
      0, 0, this.size * 0.8,
      0, 0, auraSize
    );
    auraGradient.addColorStop(0, 'rgba(66, 30, 77, 0.3)');
    auraGradient.addColorStop(1, 'rgba(66, 30, 77, 0)');

    ctx.fillStyle = auraGradient;
    ctx.beginPath();
    ctx.arc(0, 0, auraSize, 0, Math.PI * 2);
    ctx.fill();
  }

  // Take damage and return true if killed
  takeDamage(amount, towerType) {
    // Check for invulnerability
    if (this.isInvulnerable) return false;

    // Check for invisibility dodge
    if (this.type === 'invisible' && this.invisibility && Math.random() < this.invisibility) {
      // Check if the tower can see invisible enemies
      if (!towerType || !this.visibleToSpecialTowers || !this.visibleToSpecialTowers.includes(towerType)) {
        return false;
      }
    }

    // Check for shadow effect
    if (this.type === 'shadow') {
      // Check if the tower can target shadow enemies
      if (!towerType || !this.visibleToSpecialTowers || !this.visibleToSpecialTowers.includes(towerType)) {
        return false; // Shadow enemies can only be damaged by certain towers
      }
    }

    // Apply armor reduction
    if ((this.type === 'armored' || this.isBoss) && this.armor) {
      amount *= (1 - this.armor);
    }

    // Apply elemental resistance
    if (this.currentElement && this.elementResistance) {
      // Check if tower type is weak against current element
      if (this.isWeakAgainstElement && this.isWeakAgainstElement(towerType)) {
        amount *= (1 - this.elementResistance);
      }
    }

    // Apply damage
    this.health -= amount;

    if (this.health <= 0) {
      this.alive = false;
      return true;
    }

    return false;
  }
}

// Make Enemy class available globally
window.Enemy = Enemy;