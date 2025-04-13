/**
 * Tower class for the tower defense game
 */
class Tower {
  constructor(x, y, type = 'basic') {
    this.x = x;
    this.y = y;
    this.type = type;
    this.level = 1;
    this.target = null;
    this.angle = 0;
    this.lastShot = 0;

    // Set properties based on tower type
    this.setPropertiesByType();
  }

  // Set tower properties based on type
  setPropertiesByType() {
    switch (this.type) {
      case 'sniper':
        this.range = 300;
        this.damage = 50;
        this.fireRate = 1.5; // Shots per second
        this.projectileSpeed = 15;
        this.cost = 100;
        this.upgradeMultiplier = 1.8;
        this.color = '#2196F3';
        this.canTargetFlying = true;
        break;
      case 'aoe':
        this.range = 150;
        this.damage = 20;
        this.fireRate = 0.8;
        this.projectileSpeed = 8;
        this.cost = 150;
        this.upgradeMultiplier = 1.7;
        this.color = '#F44336';
        this.canTargetFlying = true;
        this.aoeRadius = 60;
        break;
      case 'slow':
        this.range = 180;
        this.damage = 5;
        this.fireRate = 1.2;
        this.projectileSpeed = 10;
        this.cost = 75;
        this.upgradeMultiplier = 1.5;
        this.color = '#00BCD4';
        this.canTargetFlying = true;
        this.slowFactor = 0.5;
        this.slowDuration = 2000; // ms
        break;
      case 'basic':
      default:
        this.range = 200;
        this.damage = 25;
        this.fireRate = 1; // Shots per second
        this.projectileSpeed = 12;
        this.cost = 50;
        this.upgradeMultiplier = 1.5;
        this.color = '#4CAF50';
        this.canTargetFlying = false;
        break;
    }

    // Calculate cooldown in milliseconds
    this.cooldown = 1000 / this.fireRate;
  }

  // Upgrade the tower
  upgrade() {
    if (this.level < 3) { // Max level is 3
      this.level++;

      // Increase stats based on level and type
      this.damage = Math.floor(this.damage * this.upgradeMultiplier);
      this.range += 30;
      this.fireRate *= 1.2;
      this.cooldown = 1000 / this.fireRate;

      // Special upgrades based on type
      if (this.type === 'aoe') {
        this.aoeRadius += 15;
      } else if (this.type === 'slow') {
        this.slowFactor -= 0.1;
        this.slowDuration += 500;
      }

      return true;
    }
    return false;
  }

  // Get the upgrade cost
  getUpgradeCost() {
    if (this.level < 3) {
      return Math.floor(this.cost * Math.pow(2, this.level));
    }
    return Infinity;
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

    try {
      // Create a new projectile
      const projectile = new Projectile(
        this.x,
        this.y,
        this.angle,
        this.projectileSpeed,
        this.damage,
        this.type,
        this.target
      );

      // Add special properties based on tower type
      if (this.type === 'aoe') {
        projectile.aoeRadius = this.aoeRadius;
      } else if (this.type === 'slow') {
        projectile.slowFactor = this.slowFactor;
        projectile.slowDuration = this.slowDuration;
      }

      projectiles.push(projectile);
      this.lastShot = currentTime;

      return true;
    } catch (error) {
      console.error('Error creating projectile:', error);
      return false;
    }
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

    // Draw tower body
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);

    // Tower body
    ctx.fillStyle = this.color;
    ctx.fillRect(-8, -25, 16, 25);

    // Tower head
    ctx.beginPath();
    ctx.arc(0, -25, 8, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    // Draw level indicators
    for (let i = 0; i < this.level; i++) {
      ctx.fillStyle = '#FFEB3B';
      ctx.beginPath();
      ctx.arc(
        this.x + 15 * Math.cos(Math.PI * 2 * (i / 3) - Math.PI / 2),
        this.y + 15 * Math.sin(Math.PI * 2 * (i / 3) - Math.PI / 2),
        4,
        0,
        Math.PI * 2
      );
      ctx.fill();
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
