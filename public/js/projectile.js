/**
 * Projectile class for the tower defense game
 */
class Projectile {
  constructor(x, y, angle, speed, damage, type, target) {
    this.x = x;
    this.y = y;
    this.angle = angle;
    this.speed = speed;
    this.damage = damage;
    this.type = type;
    this.target = target;
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
    switch (this.type) {
      case 'sniper':
        this.size = 4;
        this.color = '#2196F3';
        this.trailLength = 8; // Reduced from 20
        break;
      case 'aoe':
        this.size = 8;
        this.color = '#F44336';
        this.trailLength = 5; // Reduced from 10
        break;
      case 'slow':
        this.size = 6;
        this.color = '#00BCD4';
        this.trailLength = 6; // Reduced from 15
        break;
      case 'basic':
      default:
        this.size = 5;
        this.color = '#4CAF50';
        this.trailLength = 5; // Reduced from 12
        break;
    }

    // Initialize trail
    this.trail = [];
    for (let i = 0; i < this.trailLength; i++) {
      this.trail.push({x: this.x, y: this.y});
    }
  }

  // Update projectile position and state
  update() {
    if (!this.active) return;

    // Update trail (only update every other frame to save resources)
    if (Math.random() > 0.5) { // 50% chance to update trail
      this.trail.pop();
      this.trail.unshift({x: this.x, y: this.y});
    }

    // Move projectile
    this.x += this.vx;
    this.y += this.vy;

    // Check if projectile is out of bounds (simplified boundary check)
    if (this.x < -20 || this.x > window.innerWidth + 20 ||
        this.y < -20 || this.y > window.innerHeight + 20) {
      this.active = false;
      return;
    }

    // Check for collision with target
    if (this.target && this.target.alive) {
      // Use simplified distance calculation for performance
      const dx = this.x - this.target.x;
      const dy = this.y - this.target.y;
      const distSquared = dx * dx + dy * dy;
      const radiusSum = this.target.size + this.size;

      if (distSquared < radiusSum * radiusSum) {
        this.hit = true;
        this.active = false;
      }
    } else {
      // Target is no longer valid
      this.active = false;
    }
  }

  // Apply damage and effects to enemies (optimized)
  applyDamage(enemies) {
    if (!this.hit) return [];

    const affectedEnemies = [];

    if (this.type === 'aoe' && this.aoeRadius) {
      // Apply AOE damage to enemies in radius (with optimization)
      const radiusSquared = this.aoeRadius * this.aoeRadius;

      // Only process a subset of enemies for performance
      const maxEnemiesToProcess = 10; // Limit the number of enemies to process
      const enemiesToProcess = enemies.length > maxEnemiesToProcess ?
        enemies.slice(0, maxEnemiesToProcess) : enemies;

      enemiesToProcess.forEach(enemy => {
        if (enemy.alive) {
          // Use squared distance for performance
          const dx = this.x - enemy.x;
          const dy = this.y - enemy.y;
          const distSquared = dx * dx + dy * dy;

          if (distSquared <= radiusSquared) {
            // Simplified damage calculation
            const falloff = 1 - Math.sqrt(distSquared) / this.aoeRadius * 0.5; // Reduced falloff
            const actualDamage = Math.floor(this.damage * falloff);

            const killed = enemy.takeDamage(actualDamage);
            affectedEnemies.push({enemy, killed, damage: actualDamage});
          }
        }
      });
    } else if (this.type === 'slow' && this.target && this.target.alive) {
      // Apply slow effect to target
      this.target.applySlowEffect(this.slowFactor, this.slowDuration);
      const killed = this.target.takeDamage(this.damage);
      affectedEnemies.push({enemy: this.target, killed, damage: this.damage});
    } else if (this.target && this.target.alive) {
      // Apply direct damage to target
      const killed = this.target.takeDamage(this.damage);
      affectedEnemies.push({enemy: this.target, killed, damage: this.damage});
    }

    return affectedEnemies;
  }

  // Draw the projectile
  draw(ctx) {
    if (!this.active) return;

    // Draw simplified trail (only draw every other point to save resources)
    ctx.save();
    for (let i = 0; i < this.trail.length; i += 2) {
      const point = this.trail[i];
      const alpha = 0.5 - (i / this.trail.length) * 0.5; // Reduced opacity

      ctx.globalAlpha = alpha;
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.arc(point.x, point.y, this.size * 0.7, 0, Math.PI * 2); // Smaller trail points
      ctx.fill();
    }
    ctx.restore();

    // Draw projectile (simplified)
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();

    // Draw simplified special effects based on type (only for AOE)
    if (this.type === 'aoe') {
      // Draw simplified explosion radius indicator
      ctx.save();
      ctx.globalAlpha = 0.05; // Reduced opacity
      ctx.strokeStyle = this.color;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.aoeRadius || 0, 0, Math.PI * 2);
      ctx.stroke(); // Use stroke instead of fill to save resources
      ctx.restore();
    }
  }

  // Draw simplified explosion effect when projectile hits
  drawExplosion(ctx) {
    if (this.active || !this.hit) return;

    // Use a single simplified explosion effect for all projectile types
    ctx.save();

    if (this.type === 'aoe' && this.aoeRadius) {
      // Simplified AOE explosion - just a circle with stroke
      ctx.globalAlpha = 0.3; // Reduced opacity
      ctx.strokeStyle = this.color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.aoeRadius, 0, Math.PI * 2);
      ctx.stroke(); // Use stroke instead of fill
    } else {
      // Simple hit effect for all other types
      ctx.globalAlpha = 0.4; // Reduced opacity
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size * 1.5, 0, Math.PI * 2); // Smaller explosion
      ctx.fill();
    }

    ctx.restore();
  }
}
