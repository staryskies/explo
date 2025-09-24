/**
 * Projectile class for the tower defense game
 */
// Log that projectile.js is loaded
console.log('Projectile class loaded');

class Projectile {
  constructor(x, y, angle, speed, damage, type, target, towerType) {
    this.x = x;
    this.y = y;
    this.angle = angle;
    this.speed = speed;
    this.damage = damage;
    this.type = type;
    this.target = target;
    this.towerType = towerType; // Store the tower type for damage calculations
    this.active = true;
    this.hit = false;

    // Calculate velocity based on angle
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;

    // Set properties based on projectile type
    this.setPropertiesByType();
  }

  // Set projectile properties based on type
  setPropertiesByType() {
    // Smaller bullets with different colors for each tower type - more 2D style
    switch (this.type) {
      case 'sniper':
        this.size = 2; // Smaller
        this.color = '#3498db'; // Lighter blue
        this.trailLength = 0; // No trail
        this.speed *= 4.5; // Faster
        break;
      case 'cannon':
        this.size = 3; // Smaller
        this.color = '#e67e22'; // Orange
        this.trailLength = 0;
        this.speed *= 4.2;
        break;
      case 'archer':
        this.size = 2;
        this.color = '#2ecc71'; // Brighter green
        this.trailLength = 0;
        this.speed *= 4.4;
        break;
      case 'freeze':
        this.size = 2;
        this.color = '#00BCD4'; // Cyan
        this.trailLength = 0;
        this.speed *= 4.3;
        break;
      case 'mortar':
        this.size = 3;
        this.color = '#95a5a6'; // Light gray
        this.trailLength = 0;
        this.speed *= 3.1;
        break;
      case 'laser':
        this.size = 2;
        this.color = '#e74c3c'; // Bright red
        this.trailLength = 8; // Keep trail ONLY for laser
        this.speed *= 4.6;
        break;
      case 'tesla':
        this.size = 2;
        this.color = '#f1c40f'; // Bright yellow
        this.trailLength = 0; // No trail
        this.speed *= 3.7;
        break;
      case 'flame':
        this.size = 2;
        this.color = '#e67e22'; // Orange
        this.trailLength = 0; // No trail
        this.speed *= 2.3;
        break;
      case 'missile':
        this.size = 2;
        this.color = '#7f8c8d'; // Gray
        this.trailLength = 0; // No trail
        this.speed *= 2.4;
        break;
      case 'poison':
        this.size = 2;
        this.color = '#9b59b6'; // Purple
        this.trailLength = 0;
        this.speed *= 2.3;
        break;
      case 'poisonCloud':
        this.size = 4;
        this.color = '#8BC34A'; // Light green
        this.trailLength = 0;
        this.speed *= 1.8; // Slower
        this.aoeRadius = 40; // Large area effect
        break;
      case 'divine':
        this.size = 3;
        this.color = '#FFEB3B'; // Bright yellow/gold
        this.trailLength = 10; // Long trail
        this.speed *= 5.0; // Very fast
        this.pierceCount = 3; // Pierce through multiple enemies
        this.aoeRadius = 50; // Larger area effect
        this.tracking = 0.15; // Strong tracking for divine projectiles
        break;
      case 'vortex':
        this.size = 2;
        this.color = '#1abc9c'; // Teal
        this.trailLength = 0;
        this.speed *= 4.2;
        break;
      case 'basic':
      default:
        this.size = 2;
        this.color = '#2ecc71'; // Brighter green
        this.trailLength = 0;
        this.speed *= 2.3;
        break;
    }

    // Recalculate velocity with new speed
    this.vx = Math.cos(this.angle) * this.speed;
    this.vy = Math.sin(this.angle) * this.speed;

    // Initialize trail only for towers that need it
    this.trail = [];
    for (let i = 0; i < this.trailLength; i++) {
      this.trail.push({x: this.x, y: this.y});
    }
  }

  // Update projectile position and state
  update() {
    if (!this.active) return;

    // Update trail
    this.trail.pop();
    this.trail.unshift({x: this.x, y: this.y});

    // Check if target is still valid
    if (!this.target || !this.target.alive) {
      this.active = false;
      return;
    }

    // Special handling for laser projectiles - they hit instantly
    if (this.type === 'laser') {
      // Laser beams hit instantly
      this.hit = true;

      // Keep the projectile active for one frame to draw the beam
      // then deactivate it
      if (this.frameCount === undefined) {
        this.frameCount = 0;
      } else {
        this.frameCount++;
        if (this.frameCount > 1) {
          this.active = false;
        }
      }
      return;
    }

    // Calculate distance to target
    const dist = distance(this.x, this.y, this.target.x, this.target.y);

    // If very close to target, guarantee a hit
    if (dist < this.target.size * 2) {
      this.x = this.target.x;
      this.y = this.target.y;
      this.hit = true;
      this.active = false;
      return;
    }

    // Home in on the target with slight tracking
    // This ensures projectiles hit even at high game speeds
    const targetAngle = Math.atan2(this.target.y - this.y, this.target.x - this.x);
    const currentAngle = Math.atan2(this.vy, this.vx);

    // Calculate angle difference and adjust
    let angleDiff = targetAngle - currentAngle;

    // Normalize angle difference to [-PI, PI]
    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

    // Apply tracking based on projectile type
    let trackingStrength = 0.1; // Default tracking

    // Increase tracking for certain projectile types
    if (this.type === 'missile') {
      trackingStrength = 0.3;
    } else if (this.type === 'divine') {
      trackingStrength = 0.5; // Divine projectiles have excellent tracking
    }

    // Apply tracking adjustment
    const newAngle = currentAngle + angleDiff * trackingStrength;

    // Update velocity with tracking
    const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
    this.vx = Math.cos(newAngle) * speed;
    this.vy = Math.sin(newAngle) * speed;

    // Move projectile
    this.x += this.vx;
    this.y += this.vy;

    // Check if projectile is out of bounds
    if (this.x < -50 || this.x > window.innerWidth + 50 ||
        this.y < -50 || this.y > window.innerHeight + 50) {
      this.active = false;
      return;
    }

    // Check for collision with target
    const newDist = distance(this.x, this.y, this.target.x, this.target.y);
    // Divine projectiles have a larger hit radius
    const hitRadius = this.type === 'divine' ? this.target.size + this.size * 3 : this.target.size + this.size;
    if (newDist < hitRadius) {
      this.hit = true;
      this.active = false;
    }
  }

  // Apply damage and effects to enemies
  applyDamage(enemies) {
    if (!this.hit) return [];

    const affectedEnemies = [];

    // Handle AOE projectiles (cannon, mortar, divine)
    if ((this.type === 'aoe' || this.type === 'cannon' || this.type === 'mortar' || this.type === 'divine') && this.aoeRadius) {
      // Apply AOE damage to all enemies in radius
      enemies.forEach(enemy => {
        if (enemy.alive) {
          const dist = distance(this.x, this.y, enemy.x, enemy.y);
          if (dist <= this.aoeRadius) {
            // Calculate damage falloff based on distance
            // Divine projectiles have less falloff
            const falloff = this.type === 'divine' ?
              1 - (dist / this.aoeRadius) * 0.3 : // Only 30% falloff for divine
              1 - (dist / this.aoeRadius) * 0.7;  // 70% falloff for others

            // Divine projectiles do more damage
            let actualDamage = Math.floor(this.damage * falloff);

            // Apply critical hit for divine projectiles
            if (this.type === 'divine' && this.towerType === 'archangel') {
              // Check for critical hit
              if (Math.random() < (this.critChance || 0.5)) {
                actualDamage = Math.floor(actualDamage * (this.critMultiplier || 4.0));
                this.isCritical = true;

                // Add critical hit effect to the game if available
                if (window.game && window.game.addEffect) {
                  window.game.addEffect({
                    type: 'critical',
                    x: enemy.x,
                    y: enemy.y,
                    duration: 500
                  });
                }
              }
            }

            // Apply stun effect if this projectile has stun chance
            if (this.stunChance && Math.random() < this.stunChance) {
              enemy.applyStunEffect(this.stunDuration || 1000);
            }

            const killed = enemy.takeDamage(actualDamage, this.towerType);
            affectedEnemies.push({enemy, killed, damage: actualDamage});
          }
        }
      });
    }
    // Handle freeze tower projectiles
    else if ((this.type === 'slow' || this.type === 'freeze') && this.target && this.target.alive) {
      // Apply slow effect to target
      this.target.applySlowEffect(this.slowFactor || 0.5, this.slowDuration || 2000);

      // Apply splash slow if this projectile has splash radius
      if (this.aoeRadius) {
        enemies.forEach(enemy => {
          if (enemy.alive && enemy !== this.target) {
            const dist = distance(this.x, this.y, enemy.x, enemy.y);
            if (dist <= this.aoeRadius) {
              enemy.applySlowEffect(this.slowFactor || 0.5, this.slowDuration || 2000);
            }
          }
        });
      }

      const killed = this.target.takeDamage(this.damage, this.towerType);
      affectedEnemies.push({enemy: this.target, killed, damage: this.damage});
    }
    // Handle flame tower projectiles
    else if (this.type === 'flame' && this.target && this.target.alive) {
      // Apply burn effect to target
      this.target.applyBurnEffect(this.damage * 0.2, 3000); // 20% of damage per second for 3 seconds

      const killed = this.target.takeDamage(this.damage, this.towerType);
      affectedEnemies.push({enemy: this.target, killed, damage: this.damage});
    }
    // Handle poison tower projectiles
    else if (this.type === 'poison' && this.target && this.target.alive) {
      // Apply poison effect to target
      this.target.applyPoisonEffect(this.damage * 0.15, 5000); // 15% of damage per second for 5 seconds

      const killed = this.target.takeDamage(this.damage, this.towerType);
      affectedEnemies.push({enemy: this.target, killed, damage: this.damage});
    }
    // Handle poison cloud projectiles (AOE poison)
    else if (this.type === 'poisonCloud' && this.target && this.target.alive) {
      // Apply poison effect to all enemies in radius
      enemies.forEach(enemy => {
        if (enemy.alive) {
          const dist = distance(this.x, this.y, enemy.x, enemy.y);
          if (dist <= (this.aoeRadius || 40)) {
            // Apply poison effect with stronger damage over time
            enemy.applyPoisonEffect(this.damage * 0.2, 4000); // 20% of damage per second for 4 seconds

            // Calculate damage falloff based on distance
            const falloff = 1 - (dist / (this.aoeRadius || 40)) * 0.5;
            const actualDamage = Math.floor(this.damage * falloff);

            const killed = enemy.takeDamage(actualDamage, this.towerType);
            affectedEnemies.push({enemy, killed, damage: actualDamage});
          }
        }
      });
    }
    // Handle tesla tower projectiles
    else if (this.type === 'tesla' && this.target && this.target.alive) {
      // Apply stun effect to target
      this.target.applyStunEffect(1000); // 1 second stun

      // Chain lightning to nearby enemies
      if (this.chainCount && this.chainCount > 0) {
        let remainingChains = this.chainCount;
        let lastTarget = this.target;
        let chainDamage = this.damage * 0.7; // 70% damage for chained targets

        while (remainingChains > 0) {
          // Find the closest enemy to the last target
          let closestEnemy = null;
          let closestDist = this.chainRange || 150;

          enemies.forEach(enemy => {
            if (enemy.alive && enemy !== lastTarget && enemy !== this.target) {
              const dist = distance(lastTarget.x, lastTarget.y, enemy.x, enemy.y);
              if (dist < closestDist) {
                closestDist = dist;
                closestEnemy = enemy;
              }
            }
          });

          if (closestEnemy) {
            // Apply chain lightning effect
            closestEnemy.applyStunEffect(500); // 0.5 second stun for chained targets
            const killed = closestEnemy.takeDamage(chainDamage, this.towerType);
            affectedEnemies.push({enemy: closestEnemy, killed, damage: chainDamage});

            // Set up for next chain
            lastTarget = closestEnemy;
            chainDamage *= 0.7; // Reduce damage for each chain
          } else {
            // No more targets in range
            break;
          }

          remainingChains--;
        }
      }

      const killed = this.target.takeDamage(this.damage, this.towerType);
      affectedEnemies.push({enemy: this.target, killed, damage: this.damage});
    }
    // Handle acid projectiles (special variant of poison)
    else if (this.towerType === 'acid' && this.target && this.target.alive) {
      // Apply acid effect to target (reduces armor)
      this.target.applyAcidEffect(0.5, 4000); // Reduce armor by 50% for 4 seconds

      const killed = this.target.takeDamage(this.damage, this.towerType);
      affectedEnemies.push({enemy: this.target, killed, damage: this.damage});
    }
    // Handle all other projectile types
    else if (this.target && this.target.alive) {
      // Apply direct damage to target
      const killed = this.target.takeDamage(this.damage, this.towerType);
      affectedEnemies.push({enemy: this.target, killed, damage: this.damage});

      // Apply armor piercing for sniper towers
      if (this.towerType === 'sniper' && this.armorPiercing && this.target.armor) {
        // Bypass a percentage of armor
        const armorPiercingDamage = this.damage * this.armorPiercing * this.target.armor;
        const piercingKilled = this.target.takeDamage(armorPiercingDamage, this.towerType);

        if (piercingKilled && !killed) {
          affectedEnemies[0].killed = true;
        }

        affectedEnemies[0].damage += armorPiercingDamage;
      }

      // Apply critical hit visual effect
      if (this.isCritical) {
        // Add critical hit effect to the game if available
        if (window.game && window.game.addEffect) {
          window.game.addEffect({
            type: 'critical',
            x: this.target.x,
            y: this.target.y,
            duration: 500
          });
        }
      }
    }

    return affectedEnemies;
  }

  // Draw the projectile with enhanced effects
  draw(ctx) {
    if (!this.active) return;

    ctx.save();

    // Draw based on projectile type
    switch(this.type) {
      case 'laser':
        this.drawLaserProjectile(ctx);
        break;
      case 'sniper':
        this.drawSniperProjectile(ctx);
        break;
      case 'cannon':
        this.drawCannonProjectile(ctx);
        break;
      case 'aoe':
      case 'mortar':
        this.drawAOEProjectile(ctx);
        break;
      case 'freeze':
      case 'slow':
        this.drawFreezeProjectile(ctx);
        break;
      case 'tesla':
        this.drawTeslaProjectile(ctx);
        break;
      case 'flame':
        this.drawFlameProjectile(ctx);
        break;
      case 'missile':
        this.drawMissileProjectile(ctx);
        break;
      case 'poison':
        this.drawPoisonProjectile(ctx);
        break;
      case 'poisonCloud':
        this.drawPoisonCloudProjectile(ctx);
        break;
      case 'divine':
        this.drawDivineProjectile(ctx);
        break;
      case 'vortex':
        this.drawVortexProjectile(ctx);
        break;
      case 'basic':
      case 'archer':
      default:
        this.drawBasicProjectile(ctx);
        break;
    }

    ctx.restore();
  }

  // Draw methods for different projectile types
  drawBasicProjectile(ctx) {
    // Draw a simple arrow
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);

    // Arrow body
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.moveTo(this.size * 2, 0);
    ctx.lineTo(-this.size * 2, this.size);
    ctx.lineTo(-this.size, 0);
    ctx.lineTo(-this.size * 2, -this.size);
    ctx.closePath();
    ctx.fill();

    // Arrow outline
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 0.5;
    ctx.stroke();
  }

  drawLaserProjectile(ctx) {
    // Draw laser beam as a straight line from tower to target
    if (!this.target || !this.target.alive) return;

    // Get the tower position (this.x and this.y are the starting points)
    const startX = this.x;
    const startY = this.y;
    const endX = this.target.x;
    const endY = this.target.y;

    // Create a gradient for the laser beam
    const gradient = ctx.createLinearGradient(startX, startY, endX, endY);
    gradient.addColorStop(0, '#ffffff');
    gradient.addColorStop(0.2, this.color);
    gradient.addColorStop(0.8, this.color);
    gradient.addColorStop(1, '#ffffff');

    // Draw outer glow
    ctx.globalAlpha = 0.3;
    ctx.lineWidth = this.size * 5;
    ctx.strokeStyle = this.color;
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.stroke();

    // Draw medium glow
    ctx.globalAlpha = 0.6;
    ctx.lineWidth = this.size * 3;
    ctx.strokeStyle = this.color;
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.stroke();

    // Draw main beam - straight line
    ctx.globalAlpha = 1.0;
    ctx.lineWidth = this.size * 1.5;
    ctx.strokeStyle = gradient;
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.stroke();

    // Draw bright core at both ends
    ctx.fillStyle = '#fff';

    // Start point glow
    ctx.beginPath();
    ctx.arc(startX, startY, this.size * 1.5, 0, Math.PI * 2);
    ctx.fill();

    // End point impact with pulsing effect
    const pulseSize = this.size * 2 * (1 + 0.3 * Math.sin(performance.now() / 50));
    ctx.beginPath();
    ctx.arc(endX, endY, pulseSize, 0, Math.PI * 2);
    ctx.fill();

    // Add impact particles at the target
    if (Math.random() < 0.3) { // Only add particles occasionally for performance
      for (let i = 0; i < 3; i++) {
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.random() * this.size * 3;
        const particleX = endX + Math.cos(angle) * distance;
        const particleY = endY + Math.sin(angle) * distance;
        const particleSize = Math.random() * this.size + this.size / 2;

        ctx.fillStyle = this.color;
        ctx.globalAlpha = Math.random() * 0.5 + 0.5;
        ctx.beginPath();
        ctx.arc(particleX, particleY, particleSize, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Reset alpha
    ctx.globalAlpha = 1.0;
  }

  drawSniperProjectile(ctx) {
    // Draw laser sight
    ctx.globalAlpha = 0.3;
    ctx.strokeStyle = this.color;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(this.x, this.y);
    ctx.lineTo(
      this.x + Math.cos(this.angle) * 1000,
      this.y + Math.sin(this.angle) * 1000
    );
    ctx.stroke();

    // Draw bullet
    ctx.globalAlpha = 1.0;
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);

    // Bullet body
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.moveTo(this.size * 3, 0);
    ctx.lineTo(-this.size, this.size);
    ctx.lineTo(-this.size, -this.size);
    ctx.closePath();
    ctx.fill();

    // Bullet outline
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 0.5;
    ctx.stroke();
  }

  drawCannonProjectile(ctx) {
    // Draw cannonball
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size * 1.5, 0, Math.PI * 2);
    ctx.fill();

    // Draw highlight
    ctx.fillStyle = '#fff';
    ctx.globalAlpha = 0.5;
    ctx.beginPath();
    ctx.arc(this.x - this.size/2, this.y - this.size/2, this.size/2, 0, Math.PI * 2);
    ctx.fill();

    // Draw shadow
    ctx.fillStyle = '#000';
    ctx.globalAlpha = 0.3;
    ctx.beginPath();
    ctx.arc(this.x + this.size/3, this.y + this.size/3, this.size/2, 0, Math.PI * 2);
    ctx.fill();
  }

  drawAOEProjectile(ctx) {
    // Draw mortar shell
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);

    // Shell body
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.ellipse(0, 0, this.size * 2, this.size, 0, 0, Math.PI * 2);
    ctx.fill();

    // Shell outline
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 0.5;
    ctx.stroke();

    // Draw fins
    ctx.fillStyle = '#555';
    for (let i = 0; i < 4; i++) {
      const angle = (Math.PI / 2) * i;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(angle) * this.size * 1.5, Math.sin(angle) * this.size * 1.5);
      ctx.lineTo(Math.cos(angle + 0.2) * this.size * 2, Math.sin(angle + 0.2) * this.size * 2);
      ctx.lineTo(Math.cos(angle - 0.2) * this.size * 2, Math.sin(angle - 0.2) * this.size * 2);
      ctx.closePath();
      ctx.fill();
    }

    // Draw explosion radius indicator
    ctx.resetTransform();
    ctx.globalAlpha = 0.1;
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.aoeRadius || 50, 0, Math.PI * 2);
    ctx.fill();
  }

  drawFreezeProjectile(ctx) {
    // Draw ice crystal
    ctx.translate(this.x, this.y);

    // Snowflake pattern
    ctx.fillStyle = this.color;
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i;
      ctx.save();
      ctx.rotate(angle);

      // Draw spike
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(this.size * 2, 0);
      ctx.lineTo(this.size * 1.5, this.size);
      ctx.closePath();
      ctx.fill();

      // Draw smaller spikes
      ctx.beginPath();
      ctx.moveTo(this.size, 0);
      ctx.lineTo(this.size * 1.5, this.size/2);
      ctx.lineTo(this.size * 1.2, this.size/2);
      ctx.closePath();
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(this.size, 0);
      ctx.lineTo(this.size * 1.5, -this.size/2);
      ctx.lineTo(this.size * 1.2, -this.size/2);
      ctx.closePath();
      ctx.fill();

      ctx.restore();
    }

    // Center circle
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(0, 0, this.size/2, 0, Math.PI * 2);
    ctx.fill();
  }

  drawTeslaProjectile(ctx) {
    // Draw lightning bolt with more dramatic effect
    ctx.save();

    // If we have a target, draw a lightning arc to it
    if (this.target && this.target.alive) {
      // Get start and end points
      const startX = this.x;
      const startY = this.y;
      const endX = this.target.x;
      const endY = this.target.y;

      // Calculate distance
      const dx = endX - startX;
      const dy = endY - startY;
      const distance = Math.sqrt(dx * dx + dy * dy);

      // Draw lightning arc with multiple branches
      this.drawLightningArc(ctx, startX, startY, endX, endY, distance, 0.3, 3);

      // Draw impact point
      ctx.globalAlpha = 0.8;
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(endX, endY, this.size * 2, 0, Math.PI * 2);
      ctx.fill();

      // Draw electric field around impact
      const time = performance.now() / 100;
      const pulseSize = this.size * 3 * (1 + 0.2 * Math.sin(time));

      ctx.globalAlpha = 0.3;
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.arc(endX, endY, pulseSize, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Fallback to old style if no target
      ctx.translate(this.x, this.y);
      ctx.rotate(this.angle);

      // Lightning path
      ctx.strokeStyle = this.color;
      ctx.lineWidth = this.size;
      ctx.beginPath();

      // Create zigzag pattern
      ctx.moveTo(0, 0);
      const segments = 4;
      const length = this.size * 10;
      const segmentLength = length / segments;

      for (let i = 1; i <= segments; i++) {
        const jitter = this.size * (Math.random() * 2 - 1);
        ctx.lineTo(i * segmentLength, jitter);
      }

      ctx.stroke();

      // Glow effect
      ctx.globalAlpha = 0.5;
      ctx.lineWidth = this.size * 2;
      ctx.stroke();

      // Bright core
      ctx.globalAlpha = 1.0;
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(0, 0, this.size, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  // Helper method to draw a lightning arc with branches
  drawLightningArc(ctx, x1, y1, x2, y2, distance, displacementFactor, iterations) {
    if (iterations <= 0) {
      // Base case: draw a straight line
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = this.size * 0.8;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();

      // Draw glow
      ctx.globalAlpha = 0.4;
      ctx.strokeStyle = this.color;
      ctx.lineWidth = this.size * 2;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
      ctx.globalAlpha = 1.0;
      return;
    }

    // Calculate midpoint
    const midX = (x1 + x2) / 2;
    const midY = (y1 + y2) / 2;

    // Add random displacement to midpoint
    const displacement = (Math.random() * 2 - 1) * displacementFactor * distance;
    const perpX = -(y2 - y1);
    const perpY = x2 - x1;
    const perpLength = Math.sqrt(perpX * perpX + perpY * perpY);

    const displacedMidX = midX + (perpX / perpLength) * displacement;
    const displacedMidY = midY + (perpY / perpLength) * displacement;

    // Recursively draw the two halves
    this.drawLightningArc(ctx, x1, y1, displacedMidX, displacedMidY, distance / 2, displacementFactor, iterations - 1);
    this.drawLightningArc(ctx, displacedMidX, displacedMidY, x2, y2, distance / 2, displacementFactor, iterations - 1);

    // Add branches with some probability
    if (iterations > 1 && Math.random() < 0.4) {
      // Calculate branch endpoint
      const branchLength = distance * 0.3;
      const branchAngle = Math.atan2(y2 - y1, x2 - x1) + (Math.random() * 0.5 + 0.5) * (Math.random() < 0.5 ? -1 : 1);
      const branchEndX = displacedMidX + Math.cos(branchAngle) * branchLength;
      const branchEndY = displacedMidY + Math.sin(branchAngle) * branchLength;

      // Draw the branch with fewer iterations
      this.drawLightningArc(ctx, displacedMidX, displacedMidY, branchEndX, branchEndY, branchLength, displacementFactor, iterations - 2);
    }
  }

  drawFlameProjectile(ctx) {
    // Draw flame particle
    const time = Date.now() / 200;
    const flicker = Math.sin(time) * 0.3 + 0.7;

    // Flame glow
    ctx.fillStyle = '#FF9800';
    ctx.globalAlpha = 0.5 * flicker;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size * 3, 0, Math.PI * 2);
    ctx.fill();

    // Flame core
    ctx.fillStyle = '#FF5722';
    ctx.globalAlpha = 0.8 * flicker;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size * 2, 0, Math.PI * 2);
    ctx.fill();

    // Bright center
    ctx.fillStyle = '#FFEB3B';
    ctx.globalAlpha = 1.0 * flicker;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
  }

  drawMissileProjectile(ctx) {
    // Draw a single larger missile
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);

    // Missile body - larger
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.ellipse(0, 0, this.size * 5, this.size * 2, 0, 0, Math.PI * 2);
    ctx.fill();

    // Missile nose - larger
    ctx.fillStyle = '#C62828';
    ctx.beginPath();
    ctx.moveTo(this.size * 5, 0);
    ctx.lineTo(this.size * 2, this.size * 2);
    ctx.lineTo(this.size * 2, -this.size * 2);
    ctx.closePath();
    ctx.fill();

    // Missile fins - larger
    ctx.fillStyle = '#555';
    for (let i = 0; i < 4; i++) {
      const angle = (Math.PI / 2) * i;
      ctx.save();
      ctx.rotate(angle);
      ctx.beginPath();
      ctx.moveTo(-this.size * 3, 0);
      ctx.lineTo(-this.size * 5, this.size * 2);
      ctx.lineTo(-this.size * 4, this.size * 2);
      ctx.lineTo(-this.size * 2, 0);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    // Exhaust flame - larger
    const time = Date.now() / 100;
    const flicker = Math.sin(time) * 0.3 + 0.7;

    ctx.fillStyle = '#FF9800';
    ctx.globalAlpha = 0.7 * flicker;
    ctx.beginPath();
    ctx.moveTo(-this.size * 4, 0);
    ctx.lineTo(-this.size * 8, this.size * 2);
    ctx.lineTo(-this.size * 10, 0);
    ctx.lineTo(-this.size * 8, -this.size * 2);
    ctx.closePath();
    ctx.fill();

    // Add glowing effect
    ctx.globalAlpha = 0.3 * flicker;
    ctx.fillStyle = '#FFEB3B';
    ctx.beginPath();
    ctx.arc(0, 0, this.size * 3, 0, Math.PI * 2);
    ctx.fill();
  }

  drawPoisonProjectile(ctx) {
    // Draw poison blob
    const time = Date.now() / 300;
    const pulse = Math.sin(time) * 0.2 + 0.8;

    // Outer glow
    ctx.fillStyle = '#4CAF50';
    ctx.globalAlpha = 0.3 * pulse;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size * 3, 0, Math.PI * 2);
    ctx.fill();

    // Poison blob
    ctx.fillStyle = this.color;
    ctx.globalAlpha = 0.8 * pulse;
    ctx.beginPath();

    // Create a blob shape with wavy edges
    ctx.moveTo(this.x + this.size * 2, this.y);
    for (let i = 0; i < 8; i++) {
      const angle = (Math.PI / 4) * i;
      const radius = this.size * (1.5 + Math.sin(time + i) * 0.5);
      ctx.lineTo(
        this.x + Math.cos(angle) * radius,
        this.y + Math.sin(angle) * radius
      );
    }
    ctx.closePath();
    ctx.fill();

    // Toxic bubbles
    ctx.fillStyle = '#81C784';
    ctx.globalAlpha = 0.9 * pulse;
    for (let i = 0; i < 3; i++) {
      const angle = time + (Math.PI * 2 / 3) * i;
      const distance = this.size * 0.8;
      ctx.beginPath();
      ctx.arc(
        this.x + Math.cos(angle) * distance,
        this.y + Math.sin(angle) * distance,
        this.size / 2,
        0,
        Math.PI * 2
      );
      ctx.fill();
    }
  }

  drawPoisonCloudProjectile(ctx) {
    // Draw a larger poison cloud with more dramatic effects
    const time = Date.now() / 200;
    const pulse = Math.sin(time) * 0.3 + 0.7;

    // Draw cloud area effect indicator
    if (this.aoeRadius) {
      ctx.globalAlpha = 0.15 * pulse;
      ctx.fillStyle = '#8BC34A';
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.aoeRadius, 0, Math.PI * 2);
      ctx.fill();

      // Draw pulsing ring around the area
      ctx.globalAlpha = 0.2 * pulse;
      ctx.strokeStyle = '#689F38';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.aoeRadius * (0.9 + 0.1 * Math.sin(time * 2)), 0, Math.PI * 2);
      ctx.stroke();
    }

    // Draw main cloud
    ctx.globalAlpha = 0.7 * pulse;

    // Create a more complex cloud shape
    const cloudSize = this.size * 3;
    ctx.fillStyle = this.color;

    // Draw multiple overlapping circles for cloud effect
    for (let i = 0; i < 5; i++) {
      const angle = time * 0.5 + (Math.PI * 2 / 5) * i;
      const distance = cloudSize * 0.5;
      const offsetX = Math.cos(angle) * distance;
      const offsetY = Math.sin(angle) * distance;
      const size = cloudSize * (0.7 + 0.3 * Math.sin(time + i));

      ctx.beginPath();
      ctx.arc(this.x + offsetX, this.y + offsetY, size, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw toxic particles
    ctx.fillStyle = '#AED581';
    ctx.globalAlpha = 0.9 * pulse;

    for (let i = 0; i < 8; i++) {
      const angle = time * 2 + (Math.PI * 2 / 8) * i;
      const distance = cloudSize * (0.8 + 0.2 * Math.sin(time * 3 + i));
      const particleSize = this.size * (0.5 + 0.5 * Math.random());

      ctx.beginPath();
      ctx.arc(
        this.x + Math.cos(angle) * distance,
        this.y + Math.sin(angle) * distance,
        particleSize,
        0,
        Math.PI * 2
      );
      ctx.fill();
    }

    // Draw center of the cloud
    ctx.fillStyle = '#DCEDC8';
    ctx.globalAlpha = 0.6 * pulse;
    ctx.beginPath();
    ctx.arc(this.x, this.y, cloudSize * 0.5, 0, Math.PI * 2);
    ctx.fill();
  }

  drawDivineProjectile(ctx) {
    // Draw divine projectile with spectacular holy light effects
    const time = Date.now() / 100;

    // Get base unit for scaling
    const baseUnit = window.getBaseUnit ? window.getBaseUnit() : 5;
    const scaledSize = this.size * baseUnit / 2; // Larger scaled size

    // Draw trail
    if (this.trailLength > 0) {
      // Scale trail length based on screen size
      const scaledTrailLength = window.toPixels ? window.toPixels(this.trailLength / 3) : this.trailLength * 1.5;

      // Create gradient for trail
      const trailGradient = ctx.createLinearGradient(
        this.x - Math.cos(this.angle) * scaledTrailLength,
        this.y - Math.sin(this.angle) * scaledTrailLength,
        this.x,
        this.y
      );

      trailGradient.addColorStop(0, 'rgba(255, 255, 255, 0)');
      trailGradient.addColorStop(0.3, 'rgba(255, 255, 255, 0.2)');
      trailGradient.addColorStop(0.6, 'rgba(255, 235, 59, 0.5)');
      trailGradient.addColorStop(1, 'rgba(255, 235, 59, 0.9)');

      // Draw trail with gradient
      ctx.globalAlpha = 0.8;
      ctx.strokeStyle = trailGradient;
      ctx.lineWidth = scaledSize * 3;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(
        this.x - Math.cos(this.angle) * scaledTrailLength,
        this.y - Math.sin(this.angle) * scaledTrailLength
      );
      ctx.lineTo(this.x, this.y);
      ctx.stroke();

      // Draw particles along the trail
      ctx.fillStyle = '#FFFFFF';
      for (let i = 0; i < 12; i++) { // More particles
        const distance = Math.random() * scaledTrailLength;
        const offset = Math.random() * scaledSize - scaledSize / 2;
        const perpX = -Math.sin(this.angle) * offset;
        const perpY = Math.cos(this.angle) * offset;
        const x = this.x - Math.cos(this.angle) * distance + perpX;
        const y = this.y - Math.sin(this.angle) * distance + perpY;
        const particleSize = scaledSize * (0.3 + Math.random() * 0.5);

        ctx.globalAlpha = 0.7 * Math.random();
        ctx.beginPath();
        ctx.arc(x, y, particleSize, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Draw area effect indicator if applicable
    if (this.aoeRadius) {
      const pulse = Math.sin(time * 0.1) * 0.2 + 0.8;
      // Scale AOE radius based on screen size
      const scaledAoeRadius = window.toPixels ? window.toPixels(this.aoeRadius / 8) : this.aoeRadius / 1.5;

      // Draw outer ring
      ctx.globalAlpha = 0.3 * pulse;
      ctx.strokeStyle = '#FFEB3B';
      ctx.lineWidth = scaledSize / 2;
      ctx.beginPath();
      ctx.arc(this.x, this.y, scaledAoeRadius * pulse, 0, Math.PI * 2);
      ctx.stroke();

      // Draw inner area
      ctx.globalAlpha = 0.15 * pulse;
      ctx.fillStyle = '#FFEB3B';
      ctx.beginPath();
      ctx.arc(this.x, this.y, scaledAoeRadius * pulse, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw main projectile
    ctx.globalAlpha = 1.0;

    // Draw outer glow with scaled size
    const glowSize = scaledSize * 3 * (1 + 0.3 * Math.sin(time * 0.2));
    const glowGradient = ctx.createRadialGradient(
      this.x, this.y, 0,
      this.x, this.y, glowSize
    );
    glowGradient.addColorStop(0, 'rgba(255, 255, 255, 1.0)');
    glowGradient.addColorStop(0.3, 'rgba(255, 255, 255, 0.9)');
    glowGradient.addColorStop(0.6, 'rgba(255, 235, 59, 0.7)');
    glowGradient.addColorStop(1, 'rgba(255, 235, 59, 0)');

    ctx.fillStyle = glowGradient;
    ctx.beginPath();
    ctx.arc(this.x, this.y, glowSize, 0, Math.PI * 2);
    ctx.fill();

    // Draw secondary glow
    const innerGlowSize = scaledSize * 2 * (1 + 0.2 * Math.sin(time * 0.3));
    const innerGlowGradient = ctx.createRadialGradient(
      this.x, this.y, 0,
      this.x, this.y, innerGlowSize
    );
    innerGlowGradient.addColorStop(0, 'rgba(255, 255, 255, 1.0)');
    innerGlowGradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.8)');
    innerGlowGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

    ctx.fillStyle = innerGlowGradient;
    ctx.beginPath();
    ctx.arc(this.x, this.y, innerGlowSize, 0, Math.PI * 2);
    ctx.fill();

    // Draw core
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(this.x, this.y, scaledSize * 1.2, 0, Math.PI * 2);
    ctx.fill();

    // Draw light rays
    ctx.globalAlpha = 0.7;
    ctx.strokeStyle = '#FFEB3B';
    ctx.lineWidth = scaledSize / 2;

    for (let i = 0; i < 16; i++) { // More rays
      const rayAngle = this.angle + (Math.PI / 8) * i;
      const rayLength = scaledSize * 5 * (0.7 + 0.3 * Math.sin(time * 0.1 + i));

      ctx.beginPath();
      ctx.moveTo(this.x, this.y);
      ctx.lineTo(
        this.x + Math.cos(rayAngle) * rayLength,
        this.y + Math.sin(rayAngle) * rayLength
      );
      ctx.stroke();
    }

    // Draw cross symbol in the center
    ctx.globalAlpha = 0.9;
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = scaledSize / 1.5;

    // Vertical line
    ctx.beginPath();
    ctx.moveTo(this.x, this.y - scaledSize * 0.8);
    ctx.lineTo(this.x, this.y + scaledSize * 0.8);
    ctx.stroke();

    // Horizontal line
    ctx.beginPath();
    ctx.moveTo(this.x - scaledSize * 0.8, this.y);
    ctx.lineTo(this.x + scaledSize * 0.8, this.y);
    ctx.stroke();

    // Add small particles around the projectile
    ctx.fillStyle = '#FFFFFF';
    for (let i = 0; i < 8; i++) {
      const angle = Math.random() * Math.PI * 2;
      const distance = scaledSize * 2 * Math.random();
      const x = this.x + Math.cos(angle) * distance;
      const y = this.y + Math.sin(angle) * distance;
      const particleSize = scaledSize * 0.3 * Math.random();

      ctx.globalAlpha = 0.8 * Math.random();
      ctx.beginPath();
      ctx.arc(x, y, particleSize, 0, Math.PI * 2);
      ctx.fill();
    }

    // Add a pulsing halo effect
    const haloSize = scaledSize * 6 * (0.8 + 0.2 * Math.sin(time * 0.05));
    const haloGradient = ctx.createRadialGradient(
      this.x, this.y, scaledSize * 2,
      this.x, this.y, haloSize
    );

    haloGradient.addColorStop(0, 'rgba(255, 235, 59, 0.4)');
    haloGradient.addColorStop(1, 'rgba(255, 235, 59, 0)');

    ctx.globalAlpha = 0.6 * (0.7 + 0.3 * Math.sin(time * 0.05));
    ctx.fillStyle = haloGradient;
    ctx.beginPath();
    ctx.arc(this.x, this.y, haloSize, 0, Math.PI * 2);
    ctx.fill();

    // Reset alpha
    ctx.globalAlpha = 1.0;
  }

  drawVortexProjectile(ctx) {
    // Draw vortex
    const time = Date.now() / 200;

    ctx.translate(this.x, this.y);
    ctx.rotate(time % (Math.PI * 2));

    // Spiral effect
    ctx.strokeStyle = this.color;
    ctx.lineWidth = this.size;

    for (let i = 0; i < 3; i++) {
      const rotation = (Math.PI * 2 / 3) * i + time * 2;
      ctx.save();
      ctx.rotate(rotation);

      ctx.beginPath();
      for (let r = 0; r < 3; r += 0.1) {
        const x = Math.cos(r * 5) * r * this.size;
        const y = Math.sin(r * 5) * r * this.size;
        if (r === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();

      ctx.restore();
    }

    // Center
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(0, 0, this.size, 0, Math.PI * 2);
    ctx.fill();
  }

  // Draw explosion effect when projectile hits
  drawExplosion(ctx) {
    if (this.active || !this.hit) return;

    ctx.save();

    // Draw explosion based on projectile type
    switch(this.type) {
      case 'aoe':
      case 'mortar':
        this.drawAOEExplosion(ctx);
        break;
      case 'freeze':
      case 'slow':
        this.drawFreezeExplosion(ctx);
        break;
      case 'laser':
        this.drawLaserExplosion(ctx);
        break;
      case 'tesla':
        this.drawTeslaExplosion(ctx);
        break;
      case 'flame':
        this.drawFlameExplosion(ctx);
        break;
      case 'missile':
        this.drawMissileExplosion(ctx);
        break;
      case 'poison':
        this.drawPoisonExplosion(ctx);
        break;
      case 'poisonCloud':
        this.drawPoisonCloudExplosion(ctx);
        break;
      case 'vortex':
        this.drawVortexExplosion(ctx);
        break;
      case 'divine':
        this.drawDivineExplosion(ctx);
        break;
      case 'sniper':
        this.drawSniperExplosion(ctx);
        break;
      case 'cannon':
        this.drawCannonExplosion(ctx);
        break;
      case 'basic':
      case 'archer':
      default:
        this.drawBasicExplosion(ctx);
        break;
    }

    ctx.restore();
  }

  // Explosion methods for different projectile types
  drawBasicExplosion(ctx) {
    // Draw simple hit effect
    ctx.globalAlpha = 0.7;
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size * 2, 0, Math.PI * 2);
    ctx.fill();

    // Draw impact lines
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1;
    for (let i = 0; i < 4; i++) {
      const angle = (Math.PI / 4) * i;
      ctx.beginPath();
      ctx.moveTo(this.x, this.y);
      ctx.lineTo(
        this.x + Math.cos(angle) * this.size * 3,
        this.y + Math.sin(angle) * this.size * 3
      );
      ctx.stroke();
    }
  }

  drawAOEExplosion(ctx) {
    // Draw AOE explosion
    ctx.globalAlpha = 0.7;
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.aoeRadius || 50, 0, Math.PI * 2);
    ctx.fill();

    // Draw explosion rings
    for (let i = 0; i < 3; i++) {
      ctx.globalAlpha = 0.5 - i * 0.15;
      ctx.strokeStyle = '#FFF';
      ctx.lineWidth = 3 - i;
      ctx.beginPath();
      ctx.arc(this.x, this.y, (this.aoeRadius || 50) * (0.4 + i * 0.3), 0, Math.PI * 2);
      ctx.stroke();
    }

    // Draw debris particles
    ctx.fillStyle = '#FF9800';
    for (let i = 0; i < 12; i++) {
      const angle = (Math.PI / 6) * i;
      const distance = (this.aoeRadius || 50) * 0.7 * Math.random();
      const size = this.size * (0.5 + Math.random());

      ctx.globalAlpha = 0.7 * Math.random();
      ctx.beginPath();
      ctx.arc(
        this.x + Math.cos(angle) * distance,
        this.y + Math.sin(angle) * distance,
        size,
        0,
        Math.PI * 2
      );
      ctx.fill();
    }
  }

  drawFreezeExplosion(ctx) {
    // Draw freeze effect
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size * 5, 0, Math.PI * 2);
    ctx.fill();

    // Draw snowflake pattern
    ctx.strokeStyle = '#FFF';
    ctx.lineWidth = 1;
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i;

      // Main line
      ctx.beginPath();
      ctx.moveTo(this.x, this.y);
      ctx.lineTo(
        this.x + Math.cos(angle) * this.size * 6,
        this.y + Math.sin(angle) * this.size * 6
      );
      ctx.stroke();

      // Branch lines
      const branchLength = this.size * 2;
      const branchStart = this.size * 3;

      ctx.beginPath();
      ctx.moveTo(
        this.x + Math.cos(angle) * branchStart,
        this.y + Math.sin(angle) * branchStart
      );
      ctx.lineTo(
        this.x + Math.cos(angle) * branchStart + Math.cos(angle + Math.PI/3) * branchLength,
        this.y + Math.sin(angle) * branchStart + Math.sin(angle + Math.PI/3) * branchLength
      );
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(
        this.x + Math.cos(angle) * branchStart,
        this.y + Math.sin(angle) * branchStart
      );
      ctx.lineTo(
        this.x + Math.cos(angle) * branchStart + Math.cos(angle - Math.PI/3) * branchLength,
        this.y + Math.sin(angle) * branchStart + Math.sin(angle - Math.PI/3) * branchLength
      );
      ctx.stroke();
    }

    // Draw ice crystals
    ctx.fillStyle = '#B3E5FC';
    for (let i = 0; i < 8; i++) {
      const angle = Math.random() * Math.PI * 2;
      const distance = this.size * 4 * Math.random();

      ctx.globalAlpha = 0.7;
      ctx.beginPath();
      ctx.moveTo(
        this.x + Math.cos(angle) * distance,
        this.y + Math.sin(angle) * distance
      );

      for (let j = 0; j < 6; j++) {
        const spikeAngle = angle + (Math.PI / 3) * j;
        const spikeLength = this.size * (0.5 + Math.random() * 0.5);

        ctx.lineTo(
          this.x + Math.cos(angle) * distance + Math.cos(spikeAngle) * spikeLength,
          this.y + Math.sin(angle) * distance + Math.sin(spikeAngle) * spikeLength
        );
        ctx.lineTo(
          this.x + Math.cos(angle) * distance,
          this.y + Math.sin(angle) * distance
        );
      }

      ctx.fill();
    }
  }

  drawLaserExplosion(ctx) {
    // Draw laser impact
    ctx.globalAlpha = 0.8;
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size * 2, 0, Math.PI * 2);
    ctx.fill();

    // Draw outer glow
    const gradient = ctx.createRadialGradient(
      this.x, this.y, 0,
      this.x, this.y, this.size * 5
    );
    gradient.addColorStop(0, 'rgba(255, 0, 0, 0.8)');
    gradient.addColorStop(0.5, 'rgba(255, 0, 0, 0.3)');
    gradient.addColorStop(1, 'rgba(255, 0, 0, 0)');

    ctx.globalAlpha = 0.7;
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size * 5, 0, Math.PI * 2);
    ctx.fill();

    // Draw energy rays
    ctx.strokeStyle = this.color;
    ctx.lineWidth = 2;

    for (let i = 0; i < 8; i++) {
      const angle = (Math.PI / 4) * i;
      const length = this.size * (4 + Math.random() * 3);

      ctx.globalAlpha = 0.7 * Math.random();
      ctx.beginPath();
      ctx.moveTo(this.x, this.y);
      ctx.lineTo(
        this.x + Math.cos(angle) * length,
        this.y + Math.sin(angle) * length
      );
      ctx.stroke();
    }
  }

  drawTeslaExplosion(ctx) {
    // Draw electrical discharge
    ctx.globalAlpha = 0.7;
    ctx.strokeStyle = this.color;

    // Draw lightning bolts
    for (let i = 0; i < 8; i++) {
      const angle = (Math.PI / 4) * i;
      const length = this.size * 8;

      ctx.lineWidth = 1 + Math.random() * 2;
      ctx.beginPath();
      ctx.moveTo(this.x, this.y);

      // Create zigzag pattern
      let x = this.x;
      let y = this.y;
      const segments = 4;
      const segmentLength = length / segments;

      for (let j = 0; j < segments; j++) {
        const jitter = this.size * 2 * (Math.random() * 2 - 1);
        const perpX = Math.cos(angle + Math.PI/2) * jitter;
        const perpY = Math.sin(angle + Math.PI/2) * jitter;

        x += Math.cos(angle) * segmentLength;
        y += Math.sin(angle) * segmentLength;

        ctx.lineTo(x + perpX, y + perpY);
      }

      ctx.stroke();
    }

    // Draw central glow
    const gradient = ctx.createRadialGradient(
      this.x, this.y, 0,
      this.x, this.y, this.size * 3
    );
    gradient.addColorStop(0, 'rgba(255, 255, 0, 0.8)');
    gradient.addColorStop(0.5, 'rgba(255, 255, 0, 0.3)');
    gradient.addColorStop(1, 'rgba(255, 255, 0, 0)');

    ctx.globalAlpha = 0.7;
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size * 3, 0, Math.PI * 2);
    ctx.fill();
  }

  drawFlameExplosion(ctx) {
    // Draw flame burst
    const gradient = ctx.createRadialGradient(
      this.x, this.y, 0,
      this.x, this.y, this.size * 6
    );
    gradient.addColorStop(0, 'rgba(255, 235, 59, 0.8)');
    gradient.addColorStop(0.3, 'rgba(255, 87, 34, 0.7)');
    gradient.addColorStop(0.7, 'rgba(255, 87, 34, 0.3)');
    gradient.addColorStop(1, 'rgba(255, 87, 34, 0)');

    ctx.globalAlpha = 0.8;
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size * 6, 0, Math.PI * 2);
    ctx.fill();

    // Draw flame particles
    ctx.fillStyle = '#FFEB3B';

    for (let i = 0; i < 15; i++) {
      const angle = Math.random() * Math.PI * 2;
      const distance = this.size * 4 * Math.random();
      const size = this.size * (0.5 + Math.random());

      ctx.globalAlpha = 0.7 * Math.random();
      ctx.beginPath();
      ctx.arc(
        this.x + Math.cos(angle) * distance,
        this.y + Math.sin(angle) * distance,
        size,
        0,
        Math.PI * 2
      );
      ctx.fill();
    }
  }

  drawMissileExplosion(ctx) {
    // Draw larger explosion for the bigger missile
    const gradient = ctx.createRadialGradient(
      this.x, this.y, 0,
      this.x, this.y, this.size * 15
    );
    gradient.addColorStop(0, 'rgba(255, 235, 59, 0.9)');
    gradient.addColorStop(0.2, 'rgba(255, 152, 0, 0.8)');
    gradient.addColorStop(0.5, 'rgba(244, 67, 54, 0.6)');
    gradient.addColorStop(0.8, 'rgba(244, 67, 54, 0.3)');
    gradient.addColorStop(1, 'rgba(244, 67, 54, 0)');

    ctx.globalAlpha = 0.9;
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size * 15, 0, Math.PI * 2);
    ctx.fill();

    // Draw explosion rings - more and larger
    ctx.strokeStyle = '#FFF';
    for (let i = 0; i < 5; i++) {
      ctx.globalAlpha = 0.7 - i * 0.12;
      ctx.lineWidth = 4 - i * 0.5;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size * (5 + i * 3), 0, Math.PI * 2);
      ctx.stroke();
    }

    // Add shockwave effect
    ctx.globalAlpha = 0.3;
    ctx.strokeStyle = '#FFEB3B';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size * 18, 0, Math.PI * 2);
    ctx.stroke();

    // Draw debris
    ctx.fillStyle = '#795548';
    for (let i = 0; i < 20; i++) {
      const angle = Math.random() * Math.PI * 2;
      const distance = this.size * 6 * Math.random();
      const size = this.size * 0.5 * Math.random();

      ctx.globalAlpha = 0.7 * Math.random();
      ctx.beginPath();
      ctx.arc(
        this.x + Math.cos(angle) * distance,
        this.y + Math.sin(angle) * distance,
        size,
        0,
        Math.PI * 2
      );
      ctx.fill();
    }
  }

  drawPoisonExplosion(ctx) {
    // Draw poison splash
    const gradient = ctx.createRadialGradient(
      this.x, this.y, 0,
      this.x, this.y, this.size * 6
    );
    gradient.addColorStop(0, 'rgba(156, 39, 176, 0.8)');
    gradient.addColorStop(0.5, 'rgba(156, 39, 176, 0.3)');
    gradient.addColorStop(1, 'rgba(156, 39, 176, 0)');

    ctx.globalAlpha = 0.7;
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size * 6, 0, Math.PI * 2);
    ctx.fill();

    // Draw poison droplets
    ctx.fillStyle = this.color;

    for (let i = 0; i < 12; i++) {
      const angle = Math.random() * Math.PI * 2;
      const distance = this.size * 5 * Math.random();

      // Draw droplet shape
      ctx.globalAlpha = 0.7 * Math.random();
      ctx.save();
      ctx.translate(
        this.x + Math.cos(angle) * distance,
        this.y + Math.sin(angle) * distance
      );
      ctx.rotate(angle);

      ctx.beginPath();
      ctx.moveTo(0, -this.size);
      ctx.bezierCurveTo(
        this.size, -this.size,
        this.size, this.size,
        0, this.size
      );
      ctx.bezierCurveTo(
        -this.size, this.size,
        -this.size, -this.size,
        0, -this.size
      );
      ctx.fill();

      ctx.restore();
    }
  }

  drawPoisonCloudExplosion(ctx) {
    // Draw a large poison cloud explosion
    const radius = this.aoeRadius || 40;

    // Draw area effect
    const gradient = ctx.createRadialGradient(
      this.x, this.y, 0,
      this.x, this.y, radius
    );
    gradient.addColorStop(0, 'rgba(139, 195, 74, 0.7)');
    gradient.addColorStop(0.6, 'rgba(139, 195, 74, 0.3)');
    gradient.addColorStop(1, 'rgba(139, 195, 74, 0)');

    ctx.globalAlpha = 0.6;
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(this.x, this.y, radius, 0, Math.PI * 2);
    ctx.fill();

    // Draw pulsing ring
    ctx.globalAlpha = 0.4;
    ctx.strokeStyle = '#8BC34A';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(this.x, this.y, radius * 0.8, 0, Math.PI * 2);
    ctx.stroke();

    // Draw toxic particles
    ctx.fillStyle = '#AED581';

    // Create multiple cloud puffs
    for (let i = 0; i < 8; i++) {
      const angle = (Math.PI * 2 / 8) * i;
      const distance = radius * 0.6 * Math.random();
      const cloudX = this.x + Math.cos(angle) * distance;
      const cloudY = this.y + Math.sin(angle) * distance;
      const cloudSize = this.size * 3 * (0.5 + 0.5 * Math.random());

      // Draw cloud puff
      ctx.globalAlpha = 0.5 + 0.3 * Math.random();
      ctx.beginPath();
      ctx.arc(cloudX, cloudY, cloudSize, 0, Math.PI * 2);
      ctx.fill();

      // Add smaller particles around each puff
      for (let j = 0; j < 5; j++) {
        const particleAngle = Math.random() * Math.PI * 2;
        const particleDistance = cloudSize * 0.8 * Math.random();
        const particleX = cloudX + Math.cos(particleAngle) * particleDistance;
        const particleY = cloudY + Math.sin(particleAngle) * particleDistance;
        const particleSize = this.size * (0.5 + 0.5 * Math.random());

        ctx.globalAlpha = 0.4 * Math.random();
        ctx.fillStyle = '#DCEDC8';
        ctx.beginPath();
        ctx.arc(particleX, particleY, particleSize, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Draw toxic symbols
    ctx.globalAlpha = 0.7;
    ctx.fillStyle = '#33691E';

    for (let i = 0; i < 3; i++) {
      const angle = (Math.PI * 2 / 3) * i;
      const distance = radius * 0.4;
      const symbolX = this.x + Math.cos(angle) * distance;
      const symbolY = this.y + Math.sin(angle) * distance;
      const symbolSize = this.size * 2;

      // Draw toxic symbol (biohazard-like)
      ctx.save();
      ctx.translate(symbolX, symbolY);
      ctx.rotate(angle);

      // Draw three circles in a triangle pattern
      for (let j = 0; j < 3; j++) {
        const circleAngle = (Math.PI * 2 / 3) * j;
        const circleX = Math.cos(circleAngle) * symbolSize;
        const circleY = Math.sin(circleAngle) * symbolSize;

        ctx.beginPath();
        ctx.arc(circleX, circleY, symbolSize / 2, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }
  }

  drawVortexExplosion(ctx) {
    // Draw vortex implosion
    ctx.globalAlpha = 0.7;

    // Draw spiral effect
    ctx.strokeStyle = this.color;
    ctx.lineWidth = this.size;

    for (let i = 0; i < 3; i++) {
      const rotation = (Math.PI * 2 / 3) * i;
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(rotation);

      ctx.beginPath();
      for (let r = 0; r < 5; r += 0.1) {
        const x = Math.cos(r * 5) * r * this.size;
        const y = Math.sin(r * 5) * r * this.size;
        if (r === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();

      ctx.restore();
    }

    // Draw center implosion
    const gradient = ctx.createRadialGradient(
      this.x, this.y, 0,
      this.x, this.y, this.size * 4
    );
    gradient.addColorStop(0, 'rgba(0, 188, 212, 0.8)');
    gradient.addColorStop(0.5, 'rgba(0, 188, 212, 0.3)');
    gradient.addColorStop(1, 'rgba(0, 188, 212, 0)');

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size * 4, 0, Math.PI * 2);
    ctx.fill();
  }

  drawSniperExplosion(ctx) {
    // Draw impact
    ctx.globalAlpha = 0.7;
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size * 2, 0, Math.PI * 2);
    ctx.fill();

    // Draw impact lines
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1;

    for (let i = 0; i < 8; i++) {
      const angle = (Math.PI / 4) * i;
      ctx.beginPath();
      ctx.moveTo(this.x, this.y);
      ctx.lineTo(
        this.x + Math.cos(angle) * this.size * 4,
        this.y + Math.sin(angle) * this.size * 4
      );
      ctx.stroke();
    }

    // Draw bullet fragments
    ctx.fillStyle = '#FFC107';
    for (let i = 0; i < 5; i++) {
      const angle = Math.random() * Math.PI * 2;
      const distance = this.size * 3 * Math.random();
      const size = this.size * 0.5 * Math.random();

      ctx.globalAlpha = 0.7 * Math.random();
      ctx.beginPath();
      ctx.arc(
        this.x + Math.cos(angle) * distance,
        this.y + Math.sin(angle) * distance,
        size,
        0,
        Math.PI * 2
      );
      ctx.fill();
    }
  }

  drawCannonExplosion(ctx) {
    // Draw impact
    ctx.globalAlpha = 0.7;
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size * 3, 0, Math.PI * 2);
    ctx.fill();

    // Draw shockwave
    ctx.strokeStyle = '#FFF';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size * 4, 0, Math.PI * 2);
    ctx.stroke();

    // Draw fragments
    ctx.fillStyle = '#795548';
    for (let i = 0; i < 8; i++) {
      const angle = (Math.PI / 4) * i;
      const distance = this.size * 2;
      const size = this.size * 0.7;

      ctx.globalAlpha = 0.8;
      ctx.beginPath();
      ctx.arc(
        this.x + Math.cos(angle) * distance,
        this.y + Math.sin(angle) * distance,
        size,
        0,
        Math.PI * 2
      );
      ctx.fill();
    }
  }

  drawDivineExplosion(ctx) {
    // Draw divine explosion with spectacular holy light effects
    const time = Date.now() / 100;

    // Get base unit for scaling
    const baseUnit = window.getBaseUnit ? window.getBaseUnit() : 5;
    const scaledSize = this.size * baseUnit / 3; // Scale size based on screen dimensions
    const radius = this.aoeRadius ? (window.toPixels ? window.toPixels(this.aoeRadius / 10) : this.aoeRadius / 2) : scaledSize * 10;

    // Create a pulsing effect
    const pulse = 0.8 + Math.sin(time * 0.1) * 0.2;

    // Draw main explosion area
    const gradient = ctx.createRadialGradient(
      this.x, this.y, 0,
      this.x, this.y, radius * pulse
    );

    gradient.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
    gradient.addColorStop(0.3, 'rgba(255, 235, 59, 0.7)');
    gradient.addColorStop(0.6, 'rgba(255, 235, 59, 0.4)');
    gradient.addColorStop(1, 'rgba(255, 235, 59, 0)');

    ctx.globalAlpha = 0.9;
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(this.x, this.y, radius * pulse, 0, Math.PI * 2);
    ctx.fill();

    // Draw multiple concentric rings
    for (let i = 0; i < 4; i++) {
      const ringRadius = radius * (0.4 + i * 0.2) * pulse;
      const opacity = 0.8 - i * 0.15;

      ctx.globalAlpha = opacity;
      ctx.strokeStyle = '#FFEB3B';
      ctx.lineWidth = baseUnit / 10 * (3 - i * 0.5);
      ctx.beginPath();
      ctx.arc(this.x, this.y, ringRadius, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Draw light rays emanating from center
    ctx.globalAlpha = 0.7;
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = baseUnit / 10;

    for (let i = 0; i < 16; i++) {
      const angle = (Math.PI * 2 / 16) * i + time * 0.01;
      const length = radius * 1.2 * (0.8 + Math.sin(time * 0.05 + i) * 0.2);

      ctx.globalAlpha = 0.5 + Math.sin(time * 0.1 + i) * 0.3;
      ctx.beginPath();
      ctx.moveTo(this.x, this.y);
      ctx.lineTo(
        this.x + Math.cos(angle) * length,
        this.y + Math.sin(angle) * length
      );
      ctx.stroke();
    }

    // Draw light particles
    ctx.fillStyle = '#FFFFFF';

    for (let i = 0; i < 30; i++) {
      const angle = Math.random() * Math.PI * 2;
      const distance = radius * Math.random();
      const size = scaledSize * (0.5 + Math.random() * 0.5);

      ctx.globalAlpha = 0.6 * Math.random();
      ctx.beginPath();
      ctx.arc(
        this.x + Math.cos(angle) * distance,
        this.y + Math.sin(angle) * distance,
        size,
        0,
        Math.PI * 2
      );
      ctx.fill();
    }

    // Draw central burst
    const burstGradient = ctx.createRadialGradient(
      this.x, this.y, 0,
      this.x, this.y, scaledSize * 5 * pulse
    );

    burstGradient.addColorStop(0, 'rgba(255, 255, 255, 1.0)');
    burstGradient.addColorStop(0.5, 'rgba(255, 235, 59, 0.8)');
    burstGradient.addColorStop(1, 'rgba(255, 235, 59, 0)');

    ctx.globalAlpha = 0.9;
    ctx.fillStyle = burstGradient;
    ctx.beginPath();
    ctx.arc(this.x, this.y, scaledSize * 5 * pulse, 0, Math.PI * 2);
    ctx.fill();

    // Draw cross symbol in the center
    ctx.globalAlpha = 0.9;
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = baseUnit / 5;

    // Vertical line
    ctx.beginPath();
    ctx.moveTo(this.x, this.y - scaledSize * 3);
    ctx.lineTo(this.x, this.y + scaledSize * 3);
    ctx.stroke();

    // Horizontal line
    ctx.beginPath();
    ctx.moveTo(this.x - scaledSize * 2, this.y);
    ctx.lineTo(this.x + scaledSize * 2, this.y);
    ctx.stroke();

    // Add a shockwave effect
    ctx.globalAlpha = 0.3 * (1 - pulse);
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = baseUnit / 20;
    ctx.beginPath();
    ctx.arc(this.x, this.y, radius * 1.5 * pulse, 0, Math.PI * 2);
    ctx.stroke();
  }
}
