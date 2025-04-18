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
    } else if (this.type === 'laser') {
      trackingStrength = 0.5; // Lasers track perfectly
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
    if (newDist < this.target.size + this.size) {
      this.hit = true;
      this.active = false;
    }
  }

  // Apply damage and effects to enemies
  applyDamage(enemies) {
    if (!this.hit) return [];

    const affectedEnemies = [];

    // Handle AOE projectiles (cannon, mortar)
    if ((this.type === 'aoe' || this.type === 'cannon' || this.type === 'mortar') && this.aoeRadius) {
      // Apply AOE damage to all enemies in radius
      enemies.forEach(enemy => {
        if (enemy.alive) {
          const dist = distance(this.x, this.y, enemy.x, enemy.y);
          if (dist <= this.aoeRadius) {
            // Calculate damage falloff based on distance
            const falloff = 1 - (dist / this.aoeRadius) * 0.7;
            const actualDamage = Math.floor(this.damage * falloff);

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

    // Calculate start and end points
    const startX = this.x;
    const startY = this.y;
    const endX = this.target.x;
    const endY = this.target.y;

    // Draw main beam - straight line
    ctx.strokeStyle = this.color;
    ctx.lineWidth = this.size * 1.5;
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.stroke();

    // Draw outer glow
    ctx.globalAlpha = 0.3;
    ctx.lineWidth = this.size * 3;
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.stroke();

    // Draw bright core at both ends
    ctx.globalAlpha = 1.0;
    ctx.fillStyle = '#fff';

    // Start point glow
    ctx.beginPath();
    ctx.arc(startX, startY, this.size, 0, Math.PI * 2);
    ctx.fill();

    // End point impact
    ctx.beginPath();
    ctx.arc(endX, endY, this.size * 1.5, 0, Math.PI * 2);
    ctx.fill();
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
    // Draw lightning bolt
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
      case 'vortex':
        this.drawVortexExplosion(ctx);
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
}
