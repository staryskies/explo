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

    // Draw enemy body
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();

    // Draw border
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Add enemy type indicator
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Show first letter of enemy type
    const typeIndicator = this.type.charAt(0).toUpperCase();
    ctx.fillText(typeIndicator, this.x, this.y);

    // Draw health bar
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

    // Health color based on enemy type - directly use colors instead of classes
    // We'll determine the color directly in the code

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

    // Draw enemy type indicators
    if (this.flying) {
      // Draw wings for flying enemies
      ctx.fillStyle = '#E1BEE7';
      ctx.beginPath();
      ctx.ellipse(
        this.x - this.size / 2,
        this.y - this.size / 3,
        this.size / 2,
        this.size / 4,
        Math.PI / 4,
        0,
        Math.PI * 2
      );
      ctx.fill();

      ctx.beginPath();
      ctx.ellipse(
        this.x + this.size / 2,
        this.y - this.size / 3,
        this.size / 2,
        this.size / 4,
        -Math.PI / 4,
        0,
        Math.PI * 2
      );
      ctx.fill();
    }

    // Draw special indicators based on enemy type
    switch (this.type) {
      case 'healing':
        // Draw healing aura
        ctx.fillStyle = 'rgba(76, 175, 80, 0.2)';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.healRadius || 100, 0, Math.PI * 2);
        ctx.fill();

        // Draw cross symbol
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(this.x, this.y - this.size / 2);
        ctx.lineTo(this.x, this.y + this.size / 2);
        ctx.moveTo(this.x - this.size / 2, this.y);
        ctx.lineTo(this.x + this.size / 2, this.y);
        ctx.stroke();
        break;

      case 'spawner':
        // Draw spawner indicator
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        for (let i = 0; i < 8; i++) {
          const angle = (Math.PI / 4) * i;
          const x1 = this.x + Math.cos(angle) * (this.size - 5);
          const y1 = this.y + Math.sin(angle) * (this.size - 5);
          const x2 = this.x + Math.cos(angle) * (this.size + 5);
          const y2 = this.y + Math.sin(angle) * (this.size + 5);

          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
        }
        ctx.stroke();
        break;

      case 'armored':
        // Draw armor plates
        ctx.fillStyle = '#455A64';
        for (let i = 0; i < 4; i++) {
          const angle = (Math.PI / 2) * i;
          ctx.beginPath();
          ctx.arc(
            this.x + Math.cos(angle) * (this.size / 2),
            this.y + Math.sin(angle) * (this.size / 2),
            this.size / 3,
            0,
            Math.PI * 2
          );
          ctx.fill();
        }
        break;

      case 'explosive':
        // Draw explosive indicator
        ctx.fillStyle = '#FFEB3B';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size / 2, 0, Math.PI * 2);
        ctx.fill();

        // Draw explosion radius
        ctx.strokeStyle = 'rgba(244, 67, 54, 0.3)';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.explosionRadius || 100, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
        break;
    }

    // Draw boss crown
    if (this.isBoss) {
      ctx.fillStyle = '#FFEB3B';
      ctx.beginPath();
      ctx.moveTo(this.x, this.y - this.size - 15);
      ctx.lineTo(this.x - 15, this.y - this.size);
      ctx.lineTo(this.x + 15, this.y - this.size);
      ctx.closePath();
      ctx.fill();

      // Draw boss name
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 14px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(this.name || 'Boss', this.x, this.y - this.size - 20);
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
