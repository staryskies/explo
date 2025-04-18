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
    this.isBoss = false;
    this.bossType = null;
    this.isInvulnerable = false;
    this.speedBoost = 1;

    // Set properties based on enemy type
    this.setPropertiesByType();

    // Initialize special abilities if applicable
    if (typeof this.initializeSpecialAbilities === 'function') {
      this.initializeSpecialAbilities();
    }

    // Calculate direction to the next point
    this.calculateDirection();
  }

  // Set enemy properties based on type
  setPropertiesByType() {
    // If this is a boss, properties are set elsewhere
    if (this.isBoss) return;

    // Get properties from enemyTypes if available
    if (typeof enemyTypes !== 'undefined' && enemyTypes[this.type]) {
      const typeData = enemyTypes[this.type];
      this.maxHealth = typeData.health;
      this.health = this.maxHealth;
      this.speed = typeData.speed;
      this.reward = typeData.reward;
      this.color = typeData.color;
      this.size = typeData.size;
      this.flying = typeData.flying;
      this.damage = typeData.damage || 1;

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

  // Take damage from towers
  takeDamage(amount) {
    this.health -= amount;
    if (this.health <= 0) {
      this.health = 0;
      this.alive = false;
      return true; // Enemy died
    }
    return false; // Enemy still alive
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

    // Apply invisibility effect
    if (this.type === 'invisible') {
      ctx.globalAlpha = 0.3;
    }

    // Draw shield effect for invulnerable enemies
    if (this.isInvulnerable) {
      ctx.fillStyle = 'rgba(255, 215, 0, 0.3)';
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size + 8, 0, Math.PI * 2);
      ctx.fill();
    }

    // Save context for rotation
    ctx.save();
    ctx.translate(this.x, this.y);

    // Calculate rotation based on direction
    if (this.dirX !== 0 || this.dirY !== 0) {
      const angle = Math.atan2(this.dirY, this.dirX);
      ctx.rotate(angle);
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
    let healthBarClass = 'health-bar-normal';
    if (this.isBoss) {
      healthBarClass = 'health-bar-boss';
    } else if (this.type && enemyTypes && enemyTypes[this.type]) {
      healthBarClass = `health-bar-${this.type}`;
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

    // Draw slow effect indicator if slowed
    if (this.slowEffect < 1) {
      ctx.fillStyle = 'rgba(0, 149, 255, 0.5)';
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size + 5, 0, Math.PI * 2);
      ctx.fill();
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
    // Draw enemy body
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(0, 0, this.size, 0, Math.PI * 2);
    ctx.fill();

    // Draw border
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw eyes
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(-this.size/3, -this.size/3, this.size/4, 0, Math.PI * 2);
    ctx.arc(this.size/3, -this.size/3, this.size/4, 0, Math.PI * 2);
    ctx.fill();

    // Draw pupils
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(-this.size/3, -this.size/3, this.size/8, 0, Math.PI * 2);
    ctx.arc(this.size/3, -this.size/3, this.size/8, 0, Math.PI * 2);
    ctx.fill();

    // Draw mouth
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, this.size/4, this.size/3, 0.1 * Math.PI, 0.9 * Math.PI);
    ctx.stroke();
  }

  drawFastEnemy(ctx) {
    // Draw streamlined body
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.moveTo(this.size, 0);
    ctx.lineTo(-this.size, this.size/2);
    ctx.lineTo(-this.size, -this.size/2);
    ctx.closePath();
    ctx.fill();

    // Draw border
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw speed lines
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1;
    for (let i = 1; i <= 3; i++) {
      ctx.beginPath();
      ctx.moveTo(-this.size - i * 5, 0);
      ctx.lineTo(-this.size - i * 5 - 10, this.size/3);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(-this.size - i * 5, 0);
      ctx.lineTo(-this.size - i * 5 - 10, -this.size/3);
      ctx.stroke();
    }

    // Draw eye
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(this.size/2, 0, this.size/4, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(this.size/2, 0, this.size/8, 0, Math.PI * 2);
    ctx.fill();
  }

  drawTankEnemy(ctx) {
    // Draw tank body
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.rect(-this.size, -this.size/1.5, this.size*2, this.size*1.2);
    ctx.fill();

    // Draw tank treads
    ctx.fillStyle = '#333';
    ctx.beginPath();
    ctx.rect(-this.size, -this.size/1.5, this.size*2, this.size/4);
    ctx.rect(-this.size, this.size/2, this.size*2, this.size/4);
    ctx.fill();

    // Draw tank turret
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(0, 0, this.size/2, 0, Math.PI * 2);
    ctx.fill();

    // Draw cannon
    ctx.fillStyle = '#333';
    ctx.beginPath();
    ctx.rect(0, -this.size/6, this.size, this.size/3);
    ctx.fill();

    // Draw border
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.rect(-this.size, -this.size/1.5, this.size*2, this.size*1.2);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(0, 0, this.size/2, 0, Math.PI * 2);
    ctx.stroke();
  }

  drawFlyingEnemy(ctx) {
    // Draw body
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.ellipse(0, 0, this.size, this.size/2, 0, 0, Math.PI * 2);
    ctx.fill();

    // Draw wings
    const wingOffset = Math.sin(Date.now() / 200) * 5; // Wing flapping animation

    ctx.fillStyle = '#E1BEE7';
    ctx.beginPath();
    ctx.ellipse(-this.size/2, -wingOffset, this.size/1.5, this.size/3, Math.PI/4, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.ellipse(this.size/2, -wingOffset, this.size/1.5, this.size/3, -Math.PI/4, 0, Math.PI * 2);
    ctx.fill();

    // Draw border
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(0, 0, this.size, this.size/2, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Draw eyes
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(-this.size/3, -this.size/6, this.size/5, 0, Math.PI * 2);
    ctx.arc(this.size/3, -this.size/6, this.size/5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(-this.size/3, -this.size/6, this.size/10, 0, Math.PI * 2);
    ctx.arc(this.size/3, -this.size/6, this.size/10, 0, Math.PI * 2);
    ctx.fill();
  }

  drawHealingEnemy(ctx) {
    // Draw body
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(0, 0, this.size, 0, Math.PI * 2);
    ctx.fill();

    // Draw border
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw healing cross
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(0, -this.size/2);
    ctx.lineTo(0, this.size/2);
    ctx.moveTo(-this.size/2, 0);
    ctx.lineTo(this.size/2, 0);
    ctx.stroke();

    // Draw healing aura
    const pulseSize = Math.sin(Date.now() / 500) * 5;
    ctx.fillStyle = 'rgba(76, 175, 80, 0.2)';
    ctx.beginPath();
    ctx.arc(0, 0, this.healRadius/2 + pulseSize, 0, Math.PI * 2);
    ctx.fill();

    // Draw eyes
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(-this.size/3, -this.size/3, this.size/5, 0, Math.PI * 2);
    ctx.arc(this.size/3, -this.size/3, this.size/5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(-this.size/3, -this.size/3, this.size/10, 0, Math.PI * 2);
    ctx.arc(this.size/3, -this.size/3, this.size/10, 0, Math.PI * 2);
    ctx.fill();
  }

  drawSpawnerEnemy(ctx) {
    // Draw body
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(0, 0, this.size, 0, Math.PI * 2);
    ctx.fill();

    // Draw border
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw spawner indicators
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;

    const time = Date.now() / 1000;
    for (let i = 0; i < 8; i++) {
      const angle = (Math.PI / 4) * i + time % (Math.PI * 2);
      const innerRadius = this.size - 5;
      const outerRadius = this.size + 5;

      ctx.beginPath();
      ctx.moveTo(Math.cos(angle) * innerRadius, Math.sin(angle) * innerRadius);
      ctx.lineTo(Math.cos(angle) * outerRadius, Math.sin(angle) * outerRadius);
      ctx.stroke();
    }

    // Draw inner circle
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(0, 0, this.size/2, 0, Math.PI * 2);
    ctx.fill();

    // Draw eyes
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(-this.size/5, -this.size/5, this.size/10, 0, Math.PI * 2);
    ctx.arc(this.size/5, -this.size/5, this.size/10, 0, Math.PI * 2);
    ctx.fill();

    // Draw mouth
    ctx.beginPath();
    ctx.arc(0, this.size/6, this.size/6, 0, Math.PI);
    ctx.stroke();
  }

  drawArmoredEnemy(ctx) {
    // Draw body
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(0, 0, this.size * 0.8, 0, Math.PI * 2);
    ctx.fill();

    // Draw armor plates
    ctx.fillStyle = '#455A64';
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i;
      ctx.beginPath();
      ctx.arc(Math.cos(angle) * (this.size * 0.6), Math.sin(angle) * (this.size * 0.6), this.size/3, 0, Math.PI * 2);
      ctx.fill();

      // Draw rivets
      ctx.fillStyle = '#78909C';
      ctx.beginPath();
      ctx.arc(Math.cos(angle) * (this.size * 0.6), Math.sin(angle) * (this.size * 0.6), this.size/10, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#455A64';
    }

    // Draw border
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, this.size, 0, Math.PI * 2);
    ctx.stroke();

    // Draw eyes
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(-this.size/4, -this.size/4, this.size/6, 0, Math.PI * 2);
    ctx.arc(this.size/4, -this.size/4, this.size/6, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(-this.size/4, -this.size/4, this.size/12, 0, Math.PI * 2);
    ctx.arc(this.size/4, -this.size/4, this.size/12, 0, Math.PI * 2);
    ctx.fill();
  }

  drawInvisibleEnemy(ctx) {
    // Draw ghostly body
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.beginPath();

    // Wavy bottom
    ctx.moveTo(-this.size, this.size/2);

    for (let i = 0; i < 5; i++) {
      const waveHeight = this.size/4;
      const waveWidth = this.size/2;
      ctx.quadraticCurveTo(
        -this.size + waveWidth/2 + i*waveWidth,
        this.size/2 + waveHeight,
        -this.size + waveWidth + i*waveWidth,
        this.size/2
      );
    }

    ctx.lineTo(this.size, -this.size/2);
    ctx.lineTo(-this.size, -this.size/2);
    ctx.closePath();
    ctx.fill();

    // Draw border
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw eyes
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.beginPath();
    ctx.arc(-this.size/3, -this.size/4, this.size/6, 0, Math.PI * 2);
    ctx.arc(this.size/3, -this.size/4, this.size/6, 0, Math.PI * 2);
    ctx.fill();
  }

  drawExplosiveEnemy(ctx) {
    // Draw body
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(0, 0, this.size, 0, Math.PI * 2);
    ctx.fill();

    // Draw border
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw bomb fuse
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, -this.size);

    // Wavy fuse
    for (let i = 0; i < 3; i++) {
      ctx.quadraticCurveTo(
        5, -this.size - 5 - i*5,
        0, -this.size - 10 - i*5
      );
      ctx.quadraticCurveTo(
        -5, -this.size - 15 - i*5,
        0, -this.size - 20 - i*5
      );
    }
    ctx.stroke();

    // Draw fuse spark
    const sparkSize = Math.sin(Date.now() / 200) * 2 + 4;
    ctx.fillStyle = '#FFEB3B';
    ctx.beginPath();
    ctx.arc(0, -this.size - 20 - 3*5, sparkSize, 0, Math.PI * 2);
    ctx.fill();

    // Draw explosive core
    ctx.fillStyle = '#FFEB3B';
    ctx.beginPath();
    ctx.arc(0, 0, this.size/2, 0, Math.PI * 2);
    ctx.fill();

    // Draw explosion radius indicator
    ctx.strokeStyle = 'rgba(244, 67, 54, 0.3)';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.arc(0, 0, this.explosionRadius/2, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw angry eyes
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(-this.size/3, -this.size/4, this.size/6, 0, Math.PI * 2);
    ctx.arc(this.size/3, -this.size/4, this.size/6, 0, Math.PI * 2);
    ctx.fill();

    // Draw angry eyebrows
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-this.size/2, -this.size/2);
    ctx.lineTo(-this.size/6, -this.size/3);
    ctx.moveTo(this.size/6, -this.size/3);
    ctx.lineTo(this.size/2, -this.size/2);
    ctx.stroke();

    // Draw angry mouth
    ctx.beginPath();
    ctx.arc(0, this.size/4, this.size/3, 0, Math.PI, true);
    ctx.stroke();
  }

  drawBossEnemy(ctx) {
    // Draw body
    const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, this.size);
    gradient.addColorStop(0, '#F44336');
    gradient.addColorStop(0.5, '#D32F2F');
    gradient.addColorStop(1, '#B71C1C');

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(0, 0, this.size, 0, Math.PI * 2);
    ctx.fill();

    // Draw spikes
    ctx.fillStyle = '#B71C1C';
    for (let i = 0; i < 12; i++) {
      const angle = (Math.PI / 6) * i;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(angle) * (this.size + 10), Math.sin(angle) * (this.size + 10));
      ctx.lineTo(Math.cos(angle + 0.2) * this.size, Math.sin(angle + 0.2) * this.size);
      ctx.closePath();
      ctx.fill();
    }

    // Draw border
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, this.size, 0, Math.PI * 2);
    ctx.stroke();

    // Draw crown
    ctx.fillStyle = '#FFEB3B';
    ctx.beginPath();
    ctx.moveTo(0, -this.size - 5);
    ctx.lineTo(-this.size/2, -this.size + 5);
    ctx.lineTo(-this.size/4, -this.size - 10);
    ctx.lineTo(0, -this.size + 5);
    ctx.lineTo(this.size/4, -this.size - 10);
    ctx.lineTo(this.size/2, -this.size + 5);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = '#FFC107';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw eyes
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(-this.size/3, -this.size/4, this.size/5, 0, Math.PI * 2);
    ctx.arc(this.size/3, -this.size/4, this.size/5, 0, Math.PI * 2);
    ctx.fill();

    // Draw glowing pupils
    const glowIntensity = 0.5 + Math.sin(Date.now() / 500) * 0.5;
    ctx.fillStyle = `rgba(255, 0, 0, ${glowIntensity})`;
    ctx.beginPath();
    ctx.arc(-this.size/3, -this.size/4, this.size/10, 0, Math.PI * 2);
    ctx.arc(this.size/3, -this.size/4, this.size/10, 0, Math.PI * 2);
    ctx.fill();

    // Draw mouth
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(0, this.size/4, this.size/3, 0, Math.PI);
    ctx.fill();

    // Draw teeth
    ctx.fillStyle = '#fff';
    const teethCount = 6;
    const teethWidth = (this.size/3 * 2) / teethCount;

    for (let i = 0; i < teethCount; i++) {
      ctx.beginPath();
      ctx.moveTo(-this.size/3 + i * teethWidth, this.size/4);
      ctx.lineTo(-this.size/3 + (i+0.5) * teethWidth, this.size/4 + this.size/6);
      ctx.lineTo(-this.size/3 + (i+1) * teethWidth, this.size/4);
      ctx.fill();
    }
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
