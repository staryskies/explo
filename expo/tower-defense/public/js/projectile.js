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
        this.trailLength = 20;
        break;
      case 'aoe':
        this.size = 8;
        this.color = '#F44336';
        this.trailLength = 10;
        break;
      case 'slow':
        this.size = 6;
        this.color = '#00BCD4';
        this.trailLength = 15;
        break;
      case 'basic':
      default:
        this.size = 5;
        this.color = '#4CAF50';
        this.trailLength = 12;
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
    
    // Update trail
    this.trail.pop();
    this.trail.unshift({x: this.x, y: this.y});
    
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
    if (this.target && this.target.alive) {
      const dist = distance(this.x, this.y, this.target.x, this.target.y);
      if (dist < this.target.size + this.size) {
        this.hit = true;
        this.active = false;
      }
    } else {
      // Target is no longer valid
      this.active = false;
    }
  }
  
  // Apply damage and effects to enemies
  applyDamage(enemies) {
    if (!this.hit) return [];
    
    const affectedEnemies = [];
    
    if (this.type === 'aoe' && this.aoeRadius) {
      // Apply AOE damage to all enemies in radius
      enemies.forEach(enemy => {
        if (enemy.alive) {
          const dist = distance(this.x, this.y, enemy.x, enemy.y);
          if (dist <= this.aoeRadius) {
            // Calculate damage falloff based on distance
            const falloff = 1 - (dist / this.aoeRadius) * 0.7;
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
    
    // Draw trail
    ctx.save();
    for (let i = 0; i < this.trail.length; i++) {
      const point = this.trail[i];
      const alpha = 1 - (i / this.trail.length);
      const size = this.size * (1 - i / this.trail.length * 0.8);
      
      ctx.globalAlpha = alpha * 0.7;
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.arc(point.x, point.y, size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
    
    // Draw projectile
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw glow effect
    ctx.save();
    ctx.globalAlpha = 0.5;
    ctx.filter = `blur(${this.size}px)`;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size * 1.5, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.fill();
    ctx.restore();
    
    // Draw special effects based on type
    if (this.type === 'sniper') {
      // Draw laser sight
      ctx.save();
      ctx.globalAlpha = 0.2;
      ctx.strokeStyle = this.color;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(this.x, this.y);
      ctx.lineTo(
        this.x + Math.cos(this.angle) * 1000,
        this.y + Math.sin(this.angle) * 1000
      );
      ctx.stroke();
      ctx.restore();
    } else if (this.type === 'aoe') {
      // Draw explosion radius indicator
      ctx.save();
      ctx.globalAlpha = 0.1;
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.aoeRadius || 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }
  
  // Draw explosion effect when projectile hits
  drawExplosion(ctx) {
    if (this.active || !this.hit) return;
    
    if (this.type === 'aoe' && this.aoeRadius) {
      // Draw AOE explosion
      ctx.save();
      ctx.globalAlpha = 0.7;
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.aoeRadius, 0, Math.PI * 2);
      ctx.fill();
      
      // Draw explosion rings
      for (let i = 0; i < 3; i++) {
        ctx.globalAlpha = 0.5 - i * 0.15;
        ctx.strokeStyle = '#FFF';
        ctx.lineWidth = 3 - i;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.aoeRadius * (0.4 + i * 0.3), 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();
    } else if (this.type === 'slow') {
      // Draw freeze effect
      ctx.save();
      ctx.globalAlpha = 0.5;
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size * 3, 0, Math.PI * 2);
      ctx.fill();
      
      // Draw snowflake pattern
      ctx.strokeStyle = '#FFF';
      ctx.lineWidth = 1;
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i;
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(
          this.x + Math.cos(angle) * this.size * 4,
          this.y + Math.sin(angle) * this.size * 4
        );
        ctx.stroke();
      }
      ctx.restore();
    } else {
      // Draw simple hit effect
      ctx.save();
      ctx.globalAlpha = 0.7;
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size * 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }
}
