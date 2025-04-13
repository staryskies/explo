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

    // Set properties based on enemy type
    this.setPropertiesByType();

    // Calculate direction to the next point
    this.calculateDirection();
  }

  // Set enemy properties based on type
  setPropertiesByType() {
    switch (this.type) {
      case 'fast':
        this.maxHealth = 50;
        this.health = this.maxHealth;
        this.speed = 2.5;
        this.size = 20;
        this.color = '#FF5722';
        this.reward = 15;
        break;
      case 'tank':
        this.maxHealth = 300;
        this.health = this.maxHealth;
        this.speed = 0.8;
        this.size = 30;
        this.color = '#607D8B';
        this.reward = 30;
        break;
      case 'flying':
        this.maxHealth = 80;
        this.health = this.maxHealth;
        this.speed = 1.8;
        this.size = 22;
        this.color = '#9C27B0';
        this.reward = 25;
        this.flying = true;
        break;
      case 'boss':
        this.maxHealth = 1000;
        this.health = this.maxHealth;
        this.speed = 0.6;
        this.size = 40;
        this.color = '#F44336';
        this.reward = 100;
        break;
      case 'normal':
      default:
        this.maxHealth = 100;
        this.health = this.maxHealth;
        this.speed = 1.2;
        this.size = 24;
        this.color = '#FFC107';
        this.reward = 20;
        break;
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
    const actualSpeed = this.speed * this.slowEffect * deltaTime * 60; // Scale for 60fps

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

    // Draw enemy body
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();

    // Draw border
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.stroke();

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

    // Health color based on percentage
    let healthColor;
    if (healthPercentage > 0.6) {
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

    // Draw enemy type indicator
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

    // Draw special indicator for boss enemies
    if (this.type === 'boss') {
      ctx.fillStyle = '#FFEB3B';
      ctx.beginPath();
      ctx.moveTo(this.x, this.y - this.size - 15);
      ctx.lineTo(this.x - 10, this.y - this.size);
      ctx.lineTo(this.x + 10, this.y - this.size);
      ctx.closePath();
      ctx.fill();
    }
  }
}
