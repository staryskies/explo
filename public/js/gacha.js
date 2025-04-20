/**
 * Advanced gacha system for tower defense game
 */

// Log that gacha.js is loaded
console.log('Gacha system loaded');

// Advanced gacha system
const gachaSystem = {
  // Tower costs
  costs: {
    tower: {
      single: 150,
      ten: 1350,
      hundred: 12000
    },
    variant: {
      single: 200,
      ten: 1800,
      hundred: 16000
    }
  },

  // Cooldown settings (in milliseconds)
  cooldowns: {
    tower: {
      single: 2000,   // 2 seconds
      ten: 5000,      // 5 seconds
      hundred: 10000  // 10 seconds
    },
    variant: {
      single: 2000,   // 2 seconds
      ten: 5000,      // 5 seconds
      hundred: 10000  // 10 seconds
    }
  },

  // Animation durations (in milliseconds)
  animationDurations: {
    mythic: 5000,     // 5 seconds
    legendary: 4000,  // 4 seconds
    epic: 3000,       // 3 seconds
    rare: 2000,       // 2 seconds
    common: 1000      // 1 second
  },

  // Current cooldown timers
  cooldownTimers: {
    tower: {
      single: null,
      ten: null,
      hundred: null
    },
    variant: {
      single: null,
      ten: null,
      hundred: null
    }
  },

  // Tower drop rates
  dropRates: {
    tower: {
      common: 0.70,    // 70%
      rare: 0.20,      // 20%
      epic: 0.08,      // 8%
      legendary: 0.018, // 1.8%
      mythic: 0.002    // 0.2%
    },
    variant: {
      common: 0.65,    // 65%
      rare: 0.25,      // 25%
      epic: 0.08,      // 8%
      legendary: 0.02   // 2%
    }
  },

  // Pity system thresholds
  pity: {
    tower: {
      rare: 15,        // Guaranteed rare after 15 rolls
      epic: 60,        // Guaranteed epic after 60 rolls
      legendary: 150,  // Guaranteed legendary after 150 rolls
      mythic: 500      // Guaranteed mythic after 500 rolls
    },
    variant: {
      rare: 10,        // Guaranteed rare after 10 rolls
      epic: 50,        // Guaranteed epic after 50 rolls
      legendary: 100   // Guaranteed legendary after 100 rolls
    }
  },

  // Current pity counters
  pityCounter: {
    tower: {
      rare: 0,
      epic: 0,
      legendary: 0,
      mythic: 0
    },
    variant: {
      rare: 0,
      epic: 0,
      legendary: 0
    }
  },

  // Roll a single tower
  rollTower: function() {
    // Check pity system first
    let tier = this.checkPity('tower');

    // If no pity tier was determined, use random chance
    if (!tier) {
      // Increment all pity counters
      this.pityCounter.tower.rare++;
      this.pityCounter.tower.epic++;
      this.pityCounter.tower.legendary++;
      this.pityCounter.tower.mythic++;

      // Determine tier based on random chance
      const rand = Math.random();
      const rates = this.dropRates.tower;

      if (rand < rates.mythic) {
        tier = 'mythic';
      } else if (rand < rates.mythic + rates.legendary) {
        tier = 'legendary';
      } else if (rand < rates.mythic + rates.legendary + rates.epic) {
        tier = 'epic';
      } else if (rand < rates.mythic + rates.legendary + rates.epic + rates.rare) {
        tier = 'rare';
      } else {
        tier = 'common';
      }
    }

    // Reset pity counters based on the tier obtained
    this.resetPityCounters('tower', tier);

    // Get all towers of this tier
    const towersOfTier = Object.keys(towerStats).filter(tower => towerStats[tower].tier === tier);

    // If no towers of this tier exist (shouldn't happen), fallback to common
    if (towersOfTier.length === 0) {
      console.error(`No towers found for tier: ${tier}, falling back to common`);
      return this.rollTower(); // Try again
    }

    // Randomly select one tower from the tier
    const randomIndex = Math.floor(Math.random() * towersOfTier.length);
    const selectedTower = towersOfTier[randomIndex];

    // Unlock the tower if not already unlocked
    if (!playerData.unlockedTowers.includes(selectedTower)) {
      playerData.unlockedTowers.push(selectedTower);
      savePlayerData();
    }

    return selectedTower;
  },

  // Roll multiple towers
  rollTowers: function(count) {
    const results = [];

    for (let i = 0; i < count; i++) {
      results.push(this.rollTower());
    }

    // Show the results
    alert(`You got: ${results.map(tower => towerStats[tower].name).join(', ')}`);

    return results;
  },

  // Roll a single variant
  rollVariant: function(towerType) {
    // Check if the tower is unlocked
    if (!playerData.unlockedTowers.includes(towerType)) {
      alert(`You need to unlock the ${towerStats[towerType]?.name || towerType} tower first!`);
      return null;
    }

    // Check pity system first
    let tier = this.checkPity('variant');

    // If no pity tier was determined, use random chance
    if (!tier) {
      // Increment all pity counters
      this.pityCounter.variant.rare++;
      this.pityCounter.variant.epic++;
      this.pityCounter.variant.legendary++;

      // Determine tier based on random chance
      const rand = Math.random();
      const rates = this.dropRates.variant;

      if (rand < rates.legendary) {
        tier = 'legendary';
      } else if (rand < rates.legendary + rates.epic) {
        tier = 'epic';
      } else if (rand < rates.legendary + rates.epic + rates.rare) {
        tier = 'rare';
      } else {
        tier = 'common';
      }
    }

    // Reset pity counters based on the tier obtained
    this.resetPityCounters('variant', tier);

    // Get all variants of this tier
    const variantsOfTier = Object.keys(towerVariants).filter(variant => towerVariants[variant].tier === tier);

    // If no variants of this tier exist (shouldn't happen), fallback to common
    if (variantsOfTier.length === 0) {
      console.error(`No variants found for tier: ${tier}, falling back to common`);
      return this.rollVariant(towerType); // Try again
    }

    // Randomly select one variant from the tier
    const randomIndex = Math.floor(Math.random() * variantsOfTier.length);
    const selectedVariant = variantsOfTier[randomIndex];

    // Add the variant to the tower if not already added
    if (!playerData.towerVariants[towerType].includes(selectedVariant)) {
      playerData.towerVariants[towerType].push(selectedVariant);
      savePlayerData();
    }

    return selectedVariant;
  },

  // Roll multiple variants
  rollVariants: function(count, towerType) {
    // Check if the tower is unlocked
    if (!playerData.unlockedTowers.includes(towerType)) {
      alert(`You need to unlock the ${towerStats[towerType]?.name || towerType} tower first!`);
      return [];
    }

    const results = [];

    for (let i = 0; i < count; i++) {
      const variant = this.rollVariant(towerType);
      if (variant) {
        results.push(variant);
      }
    }

    if (results.length > 0) {
      // Show the results
      alert(`You got variants: ${results.map(variant => towerVariants[variant].name).join(', ')}`);
    }

    return results;
  },

  // Check if pity system should trigger
  checkPity: function(type) {
    const pityCounters = this.pityCounter[type];
    const pityThresholds = this.pity[type];

    // Check from highest to lowest tier
    if (type === 'tower' && pityCounters.mythic >= pityThresholds.mythic) {
      return 'mythic';
    }

    if (pityCounters.legendary >= pityThresholds.legendary) {
      return 'legendary';
    }

    if (pityCounters.epic >= pityThresholds.epic) {
      return 'epic';
    }

    if (pityCounters.rare >= pityThresholds.rare) {
      return 'rare';
    }

    return null; // No pity triggered
  },

  // Reset pity counters based on obtained tier
  resetPityCounters: function(type, tier) {
    const pityCounters = this.pityCounter[type];

    // Reset all counters for tiers equal to or lower than the obtained tier
    switch (tier) {
      case 'mythic':
        pityCounters.mythic = 0;
        // Fall through to reset lower tiers
      case 'legendary':
        pityCounters.legendary = 0;
        // Fall through to reset lower tiers
      case 'epic':
        pityCounters.epic = 0;
        // Fall through to reset lower tiers
      case 'rare':
        pityCounters.rare = 0;
        break;
      default:
        // Common tier doesn't reset any pity counters
        break;
    }
  },

  // Get drop rate information for display
  getDropRateInfo: function(type) {
    const rates = this.dropRates[type];
    const result = [];

    // Format each tier's drop rate as a percentage
    for (const [tier, rate] of Object.entries(rates)) {
      result.push({
        tier: tier,
        rate: (rate * 100).toFixed(2) + '%'
      });
    }

    return result;
  },

  // Start cooldown for a button
  startCooldown: function(type, amount) {
    const button = document.getElementById(`roll-${type}-${amount}`);
    if (!button) return;

    // Get cooldown duration
    let duration;
    switch(amount) {
      case 1: duration = this.cooldowns[type].single; break;
      case 10: duration = this.cooldowns[type].ten; break;
      case 100: duration = this.cooldowns[type].hundred; break;
      default: duration = 2000; // Default 2 seconds
    }

    // Add cooldown class and set data attribute
    button.classList.add('cooldown');
    button.disabled = true;

    // Start countdown
    let remaining = Math.ceil(duration / 1000);
    button.setAttribute('data-cooldown', `${remaining}s`);

    // Clear any existing timer
    if (this.cooldownTimers[type][amount === 1 ? 'single' : amount === 10 ? 'ten' : 'hundred']) {
      clearInterval(this.cooldownTimers[type][amount === 1 ? 'single' : amount === 10 ? 'ten' : 'hundred']);
    }

    // Set interval to update countdown
    const timerKey = amount === 1 ? 'single' : amount === 10 ? 'ten' : 'hundred';
    this.cooldownTimers[type][timerKey] = setInterval(() => {
      remaining--;
      if (remaining <= 0) {
        // End cooldown
        clearInterval(this.cooldownTimers[type][timerKey]);
        this.cooldownTimers[type][timerKey] = null;
        button.classList.remove('cooldown');
        button.disabled = false;
        button.removeAttribute('data-cooldown');
      } else {
        // Update countdown
        button.setAttribute('data-cooldown', `${remaining}s`);
      }
    }, 1000);
  },

  // Play animation for a gacha result
  playAnimation: function(tier, resultElement) {
    if (!resultElement) return;

    // Only play animation for rare and above
    if (tier === 'common') return;

    // Create animation container
    const animationContainer = document.createElement('div');
    animationContainer.className = 'gacha-animation-container';

    // Create animation
    const animation = document.createElement('div');
    animation.className = `gacha-animation ${tier}`;

    // Create background
    const bg = document.createElement('div');
    bg.className = `gacha-animation-bg ${tier}`;
    animation.appendChild(bg);

    // Create rings
    if (tier !== 'common') {
      const ring = document.createElement('div');
      ring.className = `gacha-animation-ring ${tier}`;
      animation.appendChild(ring);
    }

    // Create sparkles for epic and above
    if (tier === 'mythic' || tier === 'legendary' || tier === 'epic') {
      for (let i = 1; i <= 6; i++) {
        const sparkle = document.createElement('div');
        sparkle.className = `gacha-animation-sparkle ${tier} s${i}`;
        animation.appendChild(sparkle);
      }
    }

    // Add animation to container
    animationContainer.appendChild(animation);

    // Add container to result element
    resultElement.appendChild(animationContainer);

    // Remove animation after duration
    setTimeout(() => {
      if (animationContainer.parentNode === resultElement) {
        resultElement.removeChild(animationContainer);
      }
    }, this.animationDurations[tier]);

    // Return animation duration
    return this.animationDurations[tier];
  }
};


