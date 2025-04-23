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
    },
    // Premium costs (gems)
    premium: {
      tower: {
        single: 15,
        ten: 135,
        hundred: 1200
      },
      variant: {
        single: 20,
        ten: 180,
        hundred: 1600
      }
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
      mythic: 0.003,   // 0.3%
      divine: 0.0      // 0% - Only available through premium rolls
    },
    variant: {
      common: 0.649,   // 64.9%
      rare: 0.25,      // 25%
      epic: 0.08,      // 8%
      legendary: 0.021, // 2.1%
      divine: 0.0      // 0% - Only available through premium rolls
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

  // Roll a single tower with variant (combined format)
  rollTowerWithVariant: function(isPremium = false) {
    // Sync pity counters with playerData if available
    if (window.playerData && window.playerData.towerPity) {
      this.pityCounter.tower = { ...window.playerData.towerPity };
    }

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

      // Update playerData pity counters
      if (window.playerData && window.playerData.towerPity) {
        window.playerData.towerPity = { ...this.pityCounter.tower };
        if (window.savePlayerData) window.savePlayerData();
      }

      // Determine tier based on random chance
      const rand = Math.random();
      let rates = { ...this.dropRates.tower };

      // Apply premium bonus (1.5x for rare+ tiers and add divine chance)
      if (isPremium) {
        // Increase rates for rare+ tiers
        rates.rare *= 1.5;
        rates.epic *= 1.5;
        rates.legendary *= 1.5;
        rates.mythic *= 1.5;
        rates.divine = 0.005; // 0.5% chance for divine tier (only available in premium rolls)

        // Adjust common rate to ensure total is still 1.0
        const totalRarePlus = rates.rare + rates.epic + rates.legendary + rates.mythic + rates.divine;
        rates.common = Math.max(0, 1.0 - totalRarePlus);
      }

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
      return this.rollTowerWithVariant(); // Try again
    }

    // Special case for divine tier - select a random divine tower
    if (tier === 'divine') {
      // Only available through premium rolls
      if (!isPremium) {
        // Fallback to mythic for non-premium rolls
        tier = 'mythic';
      } else {
        // Get all divine towers
        const divineTowers = Object.keys(towerStats).filter(tower => towerStats[tower].tier === 'divine');

        // Randomly select one
        const randomIndex = Math.floor(Math.random() * divineTowers.length);
        const selectedTower = divineTowers[randomIndex];

        // Now roll a variant for this tower
        const variantTier = this.rollVariantTier(isPremium);
        const selectedVariant = this.selectVariantOfTier(variantTier);

        // Create the combined key
        const combinedKey = `${selectedTower}_${selectedVariant}`;

        // Add to inventory
        if (window.addTowerToInventory) {
          window.addTowerToInventory(selectedTower, selectedVariant);
        }

        // Unlock the tower if not already unlocked
        if (!playerData.unlockedTowers.includes(selectedTower)) {
          playerData.unlockedTowers.push(selectedTower);
          savePlayerData();
        }

        return {
          towerType: selectedTower,
          variant: selectedVariant,
          combinedKey: combinedKey,
          towerTier: tier,
          variantTier: variantTier
        };
      }
    }

    // Randomly select one tower from the tier
    const randomIndex = Math.floor(Math.random() * towersOfTier.length);
    const selectedTower = towersOfTier[randomIndex];

    // Now roll a variant for this tower
    const variantTier = this.rollVariantTier(isPremium);
    const selectedVariant = this.selectVariantOfTier(variantTier);

    // Create the combined key
    const combinedKey = `${selectedTower}_${selectedVariant}`;

    // Add to inventory
    if (window.addTowerToInventory) {
      window.addTowerToInventory(selectedTower, selectedVariant);
    }

    // Unlock the tower if not already unlocked
    if (!playerData.unlockedTowers.includes(selectedTower)) {
      playerData.unlockedTowers.push(selectedTower);
      savePlayerData();
    }

    return {
      towerType: selectedTower,
      variant: selectedVariant,
      combinedKey: combinedKey,
      towerTier: tier,
      variantTier: variantTier
    };
  },

  // Roll a variant tier
  rollVariantTier: function(isPremium = false) {
    // Sync pity counters with playerData if available
    if (window.playerData && window.playerData.variantPity) {
      this.pityCounter.variant = { ...window.playerData.variantPity };
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

      // Update playerData pity counters
      if (window.playerData && window.playerData.variantPity) {
        window.playerData.variantPity = { ...this.pityCounter.variant };
        if (window.savePlayerData) window.savePlayerData();
      }

      // Determine tier based on random chance
      const rand = Math.random();
      let rates = { ...this.dropRates.variant };

      // Apply premium bonus (1.5x for rare+ tiers and add divine chance)
      if (isPremium) {
        // Increase rates for rare+ tiers
        rates.rare *= 1.5;
        rates.epic *= 1.5;
        rates.legendary *= 1.5;
        rates.divine = 0.005; // 0.5% chance for divine tier (only available in premium rolls)

        // Adjust common rate to ensure total is still 1.0
        const totalRarePlus = rates.rare + rates.epic + rates.legendary + rates.divine;
        rates.common = Math.max(0, 1.0 - totalRarePlus);
      }

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

    return tier;
  },

  // Select a variant of a specific tier
  selectVariantOfTier: function(tier) {
    // Get all variants of this tier
    const variantsOfTier = Object.keys(towerVariants).filter(variant => towerVariants[variant].tier === tier);

    // If no variants of this tier exist, fallback to normal
    if (variantsOfTier.length === 0) {
      console.error(`No variants found for tier: ${tier}, falling back to normal`);
      return 'normal';
    }

    // Randomly select one variant from the tier
    const randomIndex = Math.floor(Math.random() * variantsOfTier.length);
    return variantsOfTier[randomIndex];
  },

  // Roll multiple towers with variants
  rollTowers: function(count, isPremium = false) {
    const results = [];

    for (let i = 0; i < count; i++) {
      results.push(this.rollTowerWithVariant(isPremium));
    }

    return results;
  },

  // Roll a single variant
  rollVariant: function(towerType, isPremium = false) {
    // Check if the tower is unlocked
    if (!playerData.unlockedTowers.includes(towerType)) {
      console.error(`Tower ${towerType} is not unlocked`);
      return null;
    }

    // Sync pity counters with playerData if available
    if (window.playerData && window.playerData.variantPity) {
      this.pityCounter.variant = { ...window.playerData.variantPity };
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

      // Update playerData pity counters
      if (window.playerData && window.playerData.variantPity) {
        window.playerData.variantPity = { ...this.pityCounter.variant };
        if (window.savePlayerData) window.savePlayerData();
      }

      // Determine tier based on random chance
      const rand = Math.random();
      let rates = { ...this.dropRates.variant };

      // Apply premium bonus (1.5x for rare+ tiers and add divine chance)
      if (isPremium) {
        // Increase rates for rare+ tiers
        rates.rare *= 1.5;
        rates.epic *= 1.5;
        rates.legendary *= 1.5;
        rates.divine = 0.005; // 0.5% chance for divine tier (only available in premium rolls)

        // Adjust common rate to ensure total is still 1.0
        const totalRarePlus = rates.rare + rates.epic + rates.legendary + rates.divine;
        rates.common = Math.max(0, 1.0 - totalRarePlus);
      }

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

    return {
      towerType: towerType,
      variant: selectedVariant,
      tier: tier
    };
  },

  // Roll multiple variants
  rollVariants: function(count, towerType, isPremium = false) {
    // Check if the tower is unlocked
    if (!playerData.unlockedTowers.includes(towerType)) {
      alert(`You need to unlock the ${towerStats[towerType]?.name || towerType} tower first!`);
      return [];
    }

    const results = [];

    for (let i = 0; i < count; i++) {
      const variant = this.rollVariant(towerType, isPremium);
      if (variant) {
        results.push(variant);
      }
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

    // Update playerData pity counters
    if (window.playerData) {
      if (type === 'tower' && window.playerData.towerPity) {
        window.playerData.towerPity = { ...pityCounters };
      } else if (type === 'variant' && window.playerData.variantPity) {
        window.playerData.variantPity = { ...pityCounters };
      }

      if (window.savePlayerData) window.savePlayerData();
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

    // Check if this is a divine variant (holy, satanic, or hell)
    const isDivineHoly = tier === 'divine' && variant === 'holy';
    const isDivineSatanic = tier === 'divine' && variant === 'satanic';
    const isDivineHell = tier === 'divine' && variant === 'hell';
    const isDivine = isDivineHoly || isDivineSatanic || isDivineHell;

    // Create animation container
    const animationContainer = document.createElement('div');
    animationContainer.className = 'gacha-animation-container';

    // For divine variants, create a special cutscene first
    if (isDivine) {
      // Create the divine cutscene
      let divineType;
      if (isDivineHoly) {
        divineType = 'holy';
      } else if (isDivineSatanic) {
        divineType = 'satanic';
      } else if (isDivineHell) {
        divineType = 'hell';
      }

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

    // Add words around the circle based on divine type
    let words;
    if (divineType === 'holy') {
      words = ['Serene', 'Purity', 'Divine', 'Blessed', 'Sacred', 'Radiant', 'Celestial', 'Eternal', 'Heavenly', 'Glorious', 'Righteous', 'Virtuous'];
    } else if (divineType === 'satanic') {
      words = ['Infernal', 'Darkness', 'Abyss', 'Torment', 'Wicked', 'Unholy', 'Demonic', 'Cursed', 'Malevolent', 'Sinister', 'Corrupt', 'Fallen'];
    } else if (divineType === 'hell') {
      words = ['Inferno', 'Hellfire', 'Brimstone', 'Damnation', 'Suffering', 'Agony', 'Punishment', 'Flames', 'Burning', 'Chaos', 'Destruction', 'Doom'];
    } else {
      words = ['Divine', 'Powerful', 'Mystical', 'Ancient', 'Eternal', 'Magical', 'Legendary', 'Mythical', 'Enchanted', 'Arcane', 'Mystic', 'Supernatural'];
    }

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

    // Set icon based on divine type
    if (divineType === 'holy') {
      centerIcon.innerHTML = '✝';
    } else if (divineType === 'satanic') {
      centerIcon.innerHTML = '⛧';
    } else if (divineType === 'hell') {
      centerIcon.innerHTML = '🔥';
    } else {
      centerIcon.innerHTML = '✨';
    }

    // Create light/fire effect based on divine type
    if (divineType === 'holy') {
      const light = document.createElement('div');
      light.className = 'divine-light holy';
      cutscene.appendChild(light);
    } else if (divineType === 'satanic') {
      const fire = document.createElement('div');
      fire.className = 'divine-fire';
      cutscene.appendChild(fire);
    } else if (divineType === 'hell') {
      const hellfire = document.createElement('div');
      hellfire.className = 'divine-hellfire';
      cutscene.appendChild(hellfire);
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
    if (tier === 'divine' && (variant === 'holy' || variant === 'satanic' || variant === 'hell')) {
      bg.classList.add(variant);
    }

    animation.appendChild(bg);

    // Create rings
    if (tier !== 'common') {
      const ring = document.createElement('div');
      ring.className = `gacha-animation-ring ${tier}`;

      // Add variant class if it's a divine variant
      if (tier === 'divine' && (variant === 'holy' || variant === 'satanic' || variant === 'hell')) {
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
        if (tier === 'divine' && (variant === 'holy' || variant === 'satanic' || variant === 'hell')) {
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
  },
  // Reroll variant for a tower
  rerollVariant: function(towerType, currentVariant, isPremium = false) {
    // Check if the tower is unlocked
    if (!playerData.unlockedTowers.includes(towerType)) {
      alert(`You need to unlock the ${towerStats[towerType]?.name || towerType} tower first!`);
      return null;
    }

    // Check if player has the tower+variant in inventory
    const combinedKey = `${towerType}_${currentVariant}`;
    if (!playerData.towerInventory[combinedKey] || playerData.towerInventory[combinedKey] <= 0) {
      alert(`You don't have a ${towerType} tower with ${currentVariant} variant in your inventory!`);
      return null;
    }

    // Roll a new variant tier
    const newVariantTier = this.rollVariantTier(isPremium);

    // Select a variant of this tier
    const newVariant = this.selectVariantOfTier(newVariantTier);

    // Make sure we don't get the same variant
    if (newVariant === currentVariant) {
      // Try again up to 3 times
      for (let i = 0; i < 3; i++) {
        const alternativeVariant = this.selectVariantOfTier(newVariantTier);
        if (alternativeVariant !== currentVariant) {
          return this.completeVariantReroll(towerType, currentVariant, alternativeVariant, newVariantTier);
        }
      }

      // If we still got the same variant after 3 tries, try a different tier
      const tiers = ['common', 'rare', 'epic', 'legendary', 'divine'];
      const currentTierIndex = tiers.indexOf(newVariantTier);

      // Try a higher tier if possible
      if (currentTierIndex < tiers.length - 1) {
        const higherTier = tiers[currentTierIndex + 1];
        const higherVariant = this.selectVariantOfTier(higherTier);
        return this.completeVariantReroll(towerType, currentVariant, higherVariant, higherTier);
      }

      // Try a lower tier if possible
      if (currentTierIndex > 0) {
        const lowerTier = tiers[currentTierIndex - 1];
        const lowerVariant = this.selectVariantOfTier(lowerTier);
        return this.completeVariantReroll(towerType, currentVariant, lowerVariant, lowerTier);
      }
    }

    return this.completeVariantReroll(towerType, currentVariant, newVariant, newVariantTier);
  },

  // Complete the variant reroll process
  completeVariantReroll: function(towerType, oldVariant, newVariant, newVariantTier) {
    // Remove the old tower+variant from inventory
    const oldCombinedKey = `${towerType}_${oldVariant}`;
    playerData.towerInventory[oldCombinedKey]--;

    // Add the new tower+variant to inventory
    const newCombinedKey = `${towerType}_${newVariant}`;
    playerData.towerInventory[newCombinedKey] = (playerData.towerInventory[newCombinedKey] || 0) + 1;

    // Save player data
    if (window.savePlayerData) {
      window.savePlayerData();
    }

    return {
      towerType: towerType,
      oldVariant: oldVariant,
      newVariant: newVariant,
      variantTier: newVariantTier,
      combinedKey: newCombinedKey
    };
  },

  // Roll until a specific tier or variant is obtained
  rollUntil: function(type, targetTier, targetVariant = null, isPremium = false, maxRolls = 1000) {
    // Validate parameters
    if (!type || (type !== 'tower' && type !== 'variant')) {
      console.error('Invalid roll type. Must be "tower" or "variant"');
      return { success: false, reason: 'Invalid roll type', rolls: 0, result: null };
    }

    if (!targetTier && !targetVariant) {
      console.error('Must specify either targetTier or targetVariant');
      return { success: false, reason: 'No target specified', rolls: 0, result: null };
    }

    // For variant rolls, we need a tower type
    let towerType = null;
    if (type === 'variant') {
      towerType = document.getElementById('variant-tower-select')?.value;
      if (!towerType) {
        console.error('No tower selected for variant roll');
        return { success: false, reason: 'No tower selected', rolls: 0, result: null };
      }

      // Check if tower is unlocked
      if (!playerData.unlockedTowers.includes(towerType)) {
        console.error(`Tower ${towerType} is not unlocked`);
        return { success: false, reason: 'Tower not unlocked', rolls: 0, result: null };
      }
    }

    // Calculate cost per roll
    const costPerRoll = isPremium ?
      this.costs.premium[type].single :
      this.costs[type].single;

    // Check if player has enough currency
    const requiredCurrency = costPerRoll * maxRolls;
    const currencyType = isPremium ? 'gems' : 'silver';

    if (playerData[currencyType] < costPerRoll) {
      console.error(`Not enough ${currencyType} for even one roll`);
      return {
        success: false,
        reason: `Not enough ${currencyType}`,
        rolls: 0,
        result: null,
        cost: {
          type: currencyType,
          amount: 0
        }
      };
    }

    // Start rolling
    let result = null;
    let rolls = 0;
    let totalCost = 0;

    while (rolls < maxRolls) {
      // Check if we have enough currency for another roll
      if (playerData[currencyType] < costPerRoll) {
        console.log(`Ran out of ${currencyType} after ${rolls} rolls`);
        return {
          success: false,
          reason: `Ran out of ${currencyType}`,
          rolls: rolls,
          result: null,
          cost: {
            type: currencyType,
            amount: totalCost
          }
        };
      }

      // Spend currency
      if (isPremium) {
        spendGems(costPerRoll);
      } else {
        spendSilver(costPerRoll);
      }

      totalCost += costPerRoll;
      rolls++;

      // Perform the roll
      let rollResult;
      if (type === 'tower') {
        rollResult = this.rollTowerWithVariant(isPremium);
      } else { // variant
        const variantResult = this.rollVariant(towerType, isPremium);
        if (!variantResult) continue; // Skip if roll failed

        rollResult = {
          variant: variantResult,
          variantTier: towerVariants[variantResult]?.tier || 'common'
        };
      }

      // Check if we got what we wanted
      let success = false;

      if (targetTier) {
        // Check tier
        const resultTier = type === 'tower' ?
          rollResult.towerTier :
          rollResult.variantTier;

        if (resultTier === targetTier) {
          success = true;
          result = rollResult;
        }
      }

      if (targetVariant && !success) {
        // Check variant
        const resultVariant = type === 'tower' ?
          rollResult.variant :
          rollResult.variant;

        if (resultVariant === targetVariant) {
          success = true;
          result = rollResult;
        }
      }

      if (success) {
        console.log(`Found target after ${rolls} rolls`);
        return {
          success: true,
          rolls: rolls,
          result: result,
          cost: {
            type: currencyType,
            amount: totalCost
          }
        };
      }
    }

    // If we get here, we hit the max rolls limit
    console.log(`Hit max rolls limit (${maxRolls}) without finding target`);
    return {
      success: false,
      reason: 'Max rolls reached',
      rolls: rolls,
      result: null,
      cost: {
        type: currencyType,
        amount: totalCost
      }
    };
  },

  // Reroll a variant for a specific tower
  rerollVariant: function(towerType, currentVariant) {
    // Check if the tower is unlocked
    if (!playerData.unlockedTowers.includes(towerType)) {
      console.error(`Tower ${towerType} is not unlocked`);
      return null;
    }

    // Check if the tower has the current variant
    if (!playerData.towerVariants[towerType].includes(currentVariant)) {
      console.error(`Tower ${towerType} does not have variant ${currentVariant}`);
      return null;
    }

    // Roll a new variant
    const result = this.rollVariant(towerType, false);
    if (!result) return null;

    // Remove the old variant if it's not the new one
    if (result.variant !== currentVariant) {
      const index = playerData.towerVariants[towerType].indexOf(currentVariant);
      if (index !== -1) {
        playerData.towerVariants[towerType].splice(index, 1);
      }
    }

    // Save player data
    savePlayerData();

    return {
      towerType: towerType,
      oldVariant: currentVariant,
      newVariant: result.variant,
      tier: result.tier
    };
  }
};


