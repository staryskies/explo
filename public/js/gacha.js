/**
 * Advanced gacha system for tower defense game
 */

// Log that gacha.js is loaded
console.log('Gacha system loaded');

// Advanced gacha system
const gachaSystem = {
  // Initialize cooldowns from localStorage
  initCooldowns: function() {
    // Check for existing cooldowns in localStorage
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key.startsWith('cooldown_')) {
        try {
          const cooldownData = JSON.parse(localStorage.getItem(key));
          const { type, amount, endTime } = cooldownData;

          // Check if cooldown is still active
          const now = Date.now();
          const timeLeft = Math.max(0, endTime - now);

          if (timeLeft > 0) {
            // Restart the cooldown with the remaining time
            const button = document.getElementById(`roll-${type}-${amount}`);
            if (button) {
              // Add cooldown class and set data attribute
              button.classList.add('cooldown');
              button.disabled = true;

              // Calculate remaining seconds
              const remaining = Math.ceil(timeLeft / 1000);
              button.setAttribute('data-cooldown', `${remaining}s`);

              // Set interval to update countdown
              const timerKey = amount === 1 ? 'single' : amount === 10 ? 'ten' : 'hundred';
              this.cooldownTimers[type][timerKey] = setInterval(() => {
                const currentTime = Date.now();
                const currentTimeLeft = Math.max(0, endTime - currentTime);
                const currentRemaining = Math.ceil(currentTimeLeft / 1000);

                if (currentRemaining <= 0) {
                  // End cooldown
                  clearInterval(this.cooldownTimers[type][timerKey]);
                  this.cooldownTimers[type][timerKey] = null;
                  button.classList.remove('cooldown');
                  button.disabled = false;
                  button.removeAttribute('data-cooldown');

                  // Remove from localStorage
                  localStorage.removeItem(key);
                } else {
                  // Update countdown
                  button.setAttribute('data-cooldown', `${currentRemaining}s`);
                }
              }, 1000);
            }
          } else {
            // Cooldown has expired, remove it
            localStorage.removeItem(key);
          }
        } catch (error) {
          console.error('Error parsing cooldown data:', error);
          localStorage.removeItem(key);
        }
      }
    }
  },
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
    divine: 12000,    // 12 seconds
    mythic: 8000,     // 8 seconds
    legendary: 6000,  // 6 seconds
    epic: 4000,       // 4 seconds
    rare: 3000,       // 3 seconds
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
      common: 0.699,    // 69.9%
      rare: 0.20,      // 20%
      epic: 0.08,      // 8%
      legendary: 0.018, // 1.8%
      mythic: 0.002,   // 0.2%
      divine: 0.001    // 0.1%
    },
    variant: {
      common: 0.649,   // 64.9%
      rare: 0.25,      // 25%
      epic: 0.08,      // 8%
      legendary: 0.02,  // 2%
      divine: 0.001    // 0.1%
    }
  },

  // Pity system thresholds
  pity: {
    tower: {
      rare: 15,        // Guaranteed rare after 15 rolls
      epic: 60,        // Guaranteed epic after 60 rolls
      legendary: 150,  // Guaranteed legendary after 150 rolls
      mythic: 500,     // Guaranteed mythic after 500 rolls
      divine: 1000     // Guaranteed divine after 1000 rolls
    },
    variant: {
      rare: 10,        // Guaranteed rare after 10 rolls
      epic: 50,        // Guaranteed epic after 50 rolls
      legendary: 100,  // Guaranteed legendary after 100 rolls
      divine: 1000     // Guaranteed divine after 1000 rolls
    }
  },

  // Current pity counters
  pityCounter: {
    tower: {
      rare: 0,
      epic: 0,
      legendary: 0,
      mythic: 0,
      divine: 0
    },
    variant: {
      rare: 0,
      epic: 0,
      legendary: 0,
      divine: 0
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
      this.pityCounter.tower.divine++;

      // Determine tier based on random chance
      const rand = Math.random();
      const rates = this.dropRates.tower;

      if (rand < rates.divine) {
        tier = 'divine';
      } else if (rand < rates.divine + rates.mythic) {
        tier = 'mythic';
      } else if (rand < rates.divine + rates.mythic + rates.legendary) {
        tier = 'legendary';
      } else if (rand < rates.divine + rates.mythic + rates.legendary + rates.epic) {
        tier = 'epic';
      } else if (rand < rates.divine + rates.mythic + rates.legendary + rates.epic + rates.rare) {
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

    // Special case for divine tier - always return Archangel
    if (tier === 'divine') {
      const divineTower = 'archangel';

      // Unlock the tower if not already unlocked
      if (!playerData.unlockedTowers.includes(divineTower)) {
        playerData.unlockedTowers.push(divineTower);
        savePlayerData();
      }

      return divineTower;
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
      this.pityCounter.variant.divine++;

      // Determine tier based on random chance
      const rand = Math.random();
      const rates = this.dropRates.variant;

      if (rand < rates.divine) {
        tier = 'divine';
      } else if (rand < rates.divine + rates.legendary) {
        tier = 'legendary';
      } else if (rand < rates.divine + rates.legendary + rates.epic) {
        tier = 'epic';
      } else if (rand < rates.divine + rates.legendary + rates.epic + rates.rare) {
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

    }

    return results;
  },

  // Check if pity system should trigger
  checkPity: function(type) {
    const pityCounters = this.pityCounter[type];
    const pityThresholds = this.pity[type];

    // Check from highest to lowest tier
    if (pityCounters.divine >= pityThresholds.divine) {
      return 'divine';
    }

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
      case 'divine':
        pityCounters.divine = 0;
        // Fall through to reset lower tiers
      case 'mythic':
        if (type === 'tower') pityCounters.mythic = 0;
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

    // Calculate end time
    const endTime = Date.now() + duration;

    // Store cooldown in localStorage
    const cooldownData = {
      endTime: endTime,
      type: type,
      amount: amount
    };

    // Use a unique key for each button
    const cooldownKey = `cooldown_${type}_${amount}`;
    localStorage.setItem(cooldownKey, JSON.stringify(cooldownData));

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
      const now = Date.now();
      const timeLeft = Math.max(0, endTime - now);
      remaining = Math.ceil(timeLeft / 1000);

      if (remaining <= 0) {
        // End cooldown
        clearInterval(this.cooldownTimers[type][timerKey]);
        this.cooldownTimers[type][timerKey] = null;
        button.classList.remove('cooldown');
        button.disabled = false;
        button.removeAttribute('data-cooldown');

        // Remove from localStorage
        localStorage.removeItem(cooldownKey);
      } else {
        // Update countdown
        button.setAttribute('data-cooldown', `${remaining}s`);
      }
    }, 1000);
  },

  // Play animation for a gacha result
  playAnimation: function(tier, resultElement, variant) {
    if (!resultElement) return;

    // Only play animation for rare and above
    if (tier === 'common') return;

    // Check if this is a divine variant (holy or satanic)
    const isDivineHoly = tier === 'divine' && variant === 'holy';
    const isDisvineSatanic = tier === 'divine' && variant === 'satanic';
    const isDivine = isDivineHoly || isDisvineSatanic;

    // Create animation container
    const animationContainer = document.createElement('div');
    animationContainer.className = 'gacha-animation-container';

    // For divine variants, create a special cutscene first
    if (isDivine) {
      // Create the divine cutscene
      const divineType = isDivineHoly ? 'holy' : 'satanic';
      this.createDivineCutscene(divineType);

      // Delay the regular animation
      setTimeout(() => {
        this.createRegularAnimation(tier, divineType, animationContainer, resultElement);
      }, 6000); // 6 seconds for the cutscene
    } else {
      // Create regular animation immediately
      this.createRegularAnimation(tier, variant, animationContainer, resultElement);
    }

    // Return animation duration
    return this.animationDurations[tier];
  },

  // Create the special divine cutscene
  createDivineCutscene: function(divineType) {
    // Create cutscene container
    const cutscene = document.createElement('div');
    cutscene.className = `divine-cutscene ${divineType}`;
    cutscene.style.zIndex = '8000'; // Behind the regular animation

    // Create words circle
    const wordsCircle = document.createElement('div');
    wordsCircle.className = `divine-words-circle ${divineType}`;

    // Add words around the circle
    const words = divineType === 'holy' ?
      ['Serene', 'Purity', 'Divine', 'Blessed', 'Sacred', 'Radiant', 'Celestial', 'Eternal', 'Heavenly', 'Glorious', 'Righteous', 'Virtuous'] :
      ['Infernal', 'Darkness', 'Abyss', 'Torment', 'Wicked', 'Unholy', 'Demonic', 'Cursed', 'Malevolent', 'Sinister', 'Corrupt', 'Fallen'];

    words.forEach((word, index) => {
      const wordElement = document.createElement('div');
      wordElement.className = `divine-word ${divineType}`;
      wordElement.textContent = word;

      // Calculate position around the circle
      const angle = index * (360 / words.length);
      const radius = 220; // Distance from center

      // Position words in a circle
      wordElement.style.position = 'absolute';
      wordElement.style.transformOrigin = 'center';
      wordElement.style.transform = `rotate(${angle}deg) translateY(-${radius}px) rotate(-${angle}deg)`;
      wordElement.style.animationDelay = `${index * 0.3}s`;

      wordsCircle.appendChild(wordElement);
    });

    // Create center icon
    const centerIcon = document.createElement('div');
    centerIcon.className = `divine-center-icon ${divineType}`;
    centerIcon.innerHTML = divineType === 'holy' ? '✝' : '⛧';

    // Create light/fire effect
    if (divineType === 'holy') {
      const light = document.createElement('div');
      light.className = 'divine-light holy';
      cutscene.appendChild(light);
    } else {
      const fire = document.createElement('div');
      fire.className = 'divine-fire';
      cutscene.appendChild(fire);
    }

    // Add elements to cutscene
    cutscene.appendChild(wordsCircle);
    cutscene.appendChild(centerIcon);

    // Add cutscene to document body (not inside any container)
    document.body.appendChild(cutscene);

    // Remove cutscene after duration
    setTimeout(() => {
      if (cutscene.parentNode === document.body) {
        document.body.removeChild(cutscene);
      }
    }, 6000); // 6 seconds for the cutscene
  },

  // Create the regular animation
  createRegularAnimation: function(tier, variant, animationContainer, _resultElement) {
    // Create animation
    const animation = document.createElement('div');
    animation.className = `gacha-animation ${tier}`;
    animation.style.zIndex = '9000'; // High z-index but below the divine cutscene

    // Create background
    const bg = document.createElement('div');
    bg.className = `gacha-animation-bg ${tier}`;

    // Add variant class if it's a divine variant
    if (tier === 'divine' && (variant === 'holy' || variant === 'satanic')) {
      bg.classList.add(variant);
    }

    animation.appendChild(bg);

    // Create rings
    if (tier !== 'common') {
      const ring = document.createElement('div');
      ring.className = `gacha-animation-ring ${tier}`;

      // Add variant class if it's a divine variant
      if (tier === 'divine' && (variant === 'holy' || variant === 'satanic')) {
        ring.classList.add(variant);
      }

      animation.appendChild(ring);
    }

    // Create sparkles for epic and above
    if (tier === 'divine' || tier === 'mythic' || tier === 'legendary' || tier === 'epic') {
      // More sparkles for higher tiers
      const sparkleCount = tier === 'divine' ? 12 : (tier === 'mythic' ? 8 : (tier === 'legendary' ? 6 : 4));

      for (let i = 1; i <= sparkleCount; i++) {
        const sparkle = document.createElement('div');
        sparkle.className = `gacha-animation-sparkle ${tier} s${i % 8 + 1}`;

        // Add variant class if it's a divine variant
        if (tier === 'divine' && (variant === 'holy' || variant === 'satanic')) {
          sparkle.classList.add(variant);
        }

        animation.appendChild(sparkle);
      }
    }

    // Add animation to container
    animationContainer.appendChild(animation);

    // Add container to document body instead of result element
    // Position it in the center of the screen
    animationContainer.style.position = 'fixed';
    animationContainer.style.top = '50%';
    animationContainer.style.left = '50%';
    animationContainer.style.transform = 'translate(-50%, -50%)';
    animationContainer.style.zIndex = '9000';
    animationContainer.style.pointerEvents = 'none';
    document.body.appendChild(animationContainer);

    // Remove animation after duration
    setTimeout(() => {
      if (animationContainer.parentNode === document.body) {
        document.body.removeChild(animationContainer);
      }
    }, this.animationDurations[tier]);
  }
};


