/**
 * Roll Until functionality for the gacha system
 */
// Log that rollUntil.js is loaded
console.log('Roll Until functionality loaded');

// Roll Until system
const rollUntilSystem = {
  // State
  state: {
    isRolling: false,
    targetType: null,
    targetTier: null,
    rollCount: 0,
    silverSpent: 0,
    gemsSpent: 0,
    results: [],
    animationSpeed: 150, // ms between rolls in animation
    currentRollTimeout: null,
    usePremiumCurrency: false,
    towerType: null, // For variant rolls
  },

  // Initialize the roll until system
  init() {
    // Add event listeners
    this.setupEventListeners();
  },

  // Setup event listeners
  setupEventListeners() {
    // Tower roll until buttons
    const rollUntilTowerRare = document.getElementById('roll-until-tower-rare');
    if (rollUntilTowerRare) {
      rollUntilTowerRare.addEventListener('click', () => this.startRollUntil('tower', 'rare', false));
    }

    const rollUntilTowerEpic = document.getElementById('roll-until-tower-epic');
    if (rollUntilTowerEpic) {
      rollUntilTowerEpic.addEventListener('click', () => this.startRollUntil('tower', 'epic', false));
    }

    const rollUntilTowerLegendary = document.getElementById('roll-until-tower-legendary');
    if (rollUntilTowerLegendary) {
      rollUntilTowerLegendary.addEventListener('click', () => this.startRollUntil('tower', 'legendary', false));
    }

    const rollUntilTowerMythic = document.getElementById('roll-until-tower-mythic');
    if (rollUntilTowerMythic) {
      rollUntilTowerMythic.addEventListener('click', () => this.startRollUntil('tower', 'mythic', false));
    }

    // Premium tower roll until buttons
    const rollUntilTowerPremiumRare = document.getElementById('roll-until-tower-premium-rare');
    if (rollUntilTowerPremiumRare) {
      rollUntilTowerPremiumRare.addEventListener('click', () => this.startRollUntil('tower', 'rare', true));
    }

    const rollUntilTowerPremiumEpic = document.getElementById('roll-until-tower-premium-epic');
    if (rollUntilTowerPremiumEpic) {
      rollUntilTowerPremiumEpic.addEventListener('click', () => this.startRollUntil('tower', 'epic', true));
    }

    const rollUntilTowerPremiumLegendary = document.getElementById('roll-until-tower-premium-legendary');
    if (rollUntilTowerPremiumLegendary) {
      rollUntilTowerPremiumLegendary.addEventListener('click', () => this.startRollUntil('tower', 'legendary', true));
    }

    const rollUntilTowerPremiumMythic = document.getElementById('roll-until-tower-premium-mythic');
    if (rollUntilTowerPremiumMythic) {
      rollUntilTowerPremiumMythic.addEventListener('click', () => this.startRollUntil('tower', 'mythic', true));
    }

    const rollUntilTowerPremiumDivine = document.getElementById('roll-until-tower-premium-divine');
    if (rollUntilTowerPremiumDivine) {
      rollUntilTowerPremiumDivine.addEventListener('click', () => this.startRollUntil('tower', 'divine', true));
    }

    // Variant roll until buttons
    const rollUntilVariantRare = document.getElementById('roll-until-variant-rare');
    if (rollUntilVariantRare) {
      rollUntilVariantRare.addEventListener('click', () => {
        const towerSelect = document.getElementById('variant-tower-select');
        if (!towerSelect || !towerSelect.value) {
          alert('Please select a tower first!');
          return;
        }
        this.startRollUntil('variant', 'rare', false, towerSelect.value);
      });
    }

    const rollUntilVariantEpic = document.getElementById('roll-until-variant-epic');
    if (rollUntilVariantEpic) {
      rollUntilVariantEpic.addEventListener('click', () => {
        const towerSelect = document.getElementById('variant-tower-select');
        if (!towerSelect || !towerSelect.value) {
          alert('Please select a tower first!');
          return;
        }
        this.startRollUntil('variant', 'epic', false, towerSelect.value);
      });
    }

    const rollUntilVariantLegendary = document.getElementById('roll-until-variant-legendary');
    if (rollUntilVariantLegendary) {
      rollUntilVariantLegendary.addEventListener('click', () => {
        const towerSelect = document.getElementById('variant-tower-select');
        if (!towerSelect || !towerSelect.value) {
          alert('Please select a tower first!');
          return;
        }
        this.startRollUntil('variant', 'legendary', false, towerSelect.value);
      });
    }

    // Premium variant roll until buttons
    const rollUntilVariantPremiumRare = document.getElementById('roll-until-variant-premium-rare');
    if (rollUntilVariantPremiumRare) {
      rollUntilVariantPremiumRare.addEventListener('click', () => {
        const towerSelect = document.getElementById('variant-tower-select');
        if (!towerSelect || !towerSelect.value) {
          alert('Please select a tower first!');
          return;
        }
        this.startRollUntil('variant', 'rare', true, towerSelect.value);
      });
    }

    const rollUntilVariantPremiumEpic = document.getElementById('roll-until-variant-premium-epic');
    if (rollUntilVariantPremiumEpic) {
      rollUntilVariantPremiumEpic.addEventListener('click', () => {
        const towerSelect = document.getElementById('variant-tower-select');
        if (!towerSelect || !towerSelect.value) {
          alert('Please select a tower first!');
          return;
        }
        this.startRollUntil('variant', 'epic', true, towerSelect.value);
      });
    }

    const rollUntilVariantPremiumLegendary = document.getElementById('roll-until-variant-premium-legendary');
    if (rollUntilVariantPremiumLegendary) {
      rollUntilVariantPremiumLegendary.addEventListener('click', () => {
        const towerSelect = document.getElementById('variant-tower-select');
        if (!towerSelect || !towerSelect.value) {
          alert('Please select a tower first!');
          return;
        }
        this.startRollUntil('variant', 'legendary', true, towerSelect.value);
      });
    }

    const rollUntilVariantPremiumDivine = document.getElementById('roll-until-variant-premium-divine');
    if (rollUntilVariantPremiumDivine) {
      rollUntilVariantPremiumDivine.addEventListener('click', () => {
        const towerSelect = document.getElementById('variant-tower-select');
        if (!towerSelect || !towerSelect.value) {
          alert('Please select a tower first!');
          return;
        }
        this.startRollUntil('variant', 'divine', true, towerSelect.value);
      });
    }

    // Stop button
    const stopRollUntil = document.getElementById('stop-roll-until');
    if (stopRollUntil) {
      stopRollUntil.addEventListener('click', () => this.stopRollUntil());
    }
  },

  // Start rolling until target tier is obtained
  startRollUntil(type, tier, usePremium = false, towerType = null) {
    // Check if already rolling
    if (this.state.isRolling) {
      alert('Already rolling! Please stop the current roll first.');
      return;
    }

    // Check if player has enough currency
    const cost = usePremium ?
      gachaSystem.costs.premium[type].single :
      gachaSystem.costs[type].single;

    const hasSufficientFunds = usePremium ?
      playerData.gems >= cost :
      playerData.silver >= cost;

    if (!hasSufficientFunds) {
      alert(`Not enough ${usePremium ? 'gems' : 'silver'} to start rolling!`);
      return;
    }

    // Reset state
    this.state.isRolling = true;
    this.state.targetType = type;
    this.state.targetTier = tier;
    this.state.rollCount = 0;
    this.state.silverSpent = 0;
    this.state.gemsSpent = 0;
    this.state.results = [];
    this.state.usePremiumCurrency = usePremium;
    this.state.towerType = towerType;

    // Show roll until UI
    this.showRollUntilUI();

    // Start rolling
    this.performNextRoll();
  },

  // Stop rolling
  stopRollUntil() {
    // Clear any pending timeouts
    if (this.state.currentRollTimeout) {
      clearTimeout(this.state.currentRollTimeout);
      this.state.currentRollTimeout = null;
    }

    // Update state
    this.state.isRolling = false;

    // Hide roll until UI
    this.hideRollUntilUI();

    // Show final results
    this.showFinalResults();
  },

  // Perform the next roll
  performNextRoll() {
    if (!this.state.isRolling) return;

    // Check if player has enough currency
    const cost = this.state.usePremiumCurrency ?
      gachaSystem.costs.premium[this.state.targetType].single :
      gachaSystem.costs[this.state.targetType].single;

    const hasSufficientFunds = this.state.usePremiumCurrency ?
      playerData.gems >= cost :
      playerData.silver >= cost;

    if (!hasSufficientFunds) {
      alert(`Not enough ${this.state.usePremiumCurrency ? 'gems' : 'silver'} to continue rolling!`);
      this.stopRollUntil();
      return;
    }

    // Spend currency
    if (this.state.usePremiumCurrency) {
      spendGems(cost);
      this.state.gemsSpent += cost;
    } else {
      spendSilver(cost);
      this.state.silverSpent += cost;
    }

    // Increment roll count
    this.state.rollCount++;

    // Perform roll
    let result;
    if (this.state.targetType === 'tower') {
      result = gachaSystem.rollTower(this.state.usePremiumCurrency);
    } else {
      result = gachaSystem.rollVariant(this.state.towerType, this.state.usePremiumCurrency);
    }

    // Add to results
    this.state.results.push(result);

    // Show current roll
    this.showCurrentRoll(result);

    // Check if target tier is obtained
    const resultTier = this.state.targetType === 'tower' ?
      towerStats[result]?.tier :
      towerVariants[result]?.tier;

    // Get tier rank for comparison
    const tierRanks = {
      'common': 0,
      'rare': 1,
      'epic': 2,
      'legendary': 3,
      'mythic': 4,
      'divine': 5
    };

    const targetTierRank = tierRanks[this.state.targetTier];
    const resultTierRank = tierRanks[resultTier];

    // Check if we've reached or exceeded the target tier
    if (resultTierRank >= targetTierRank) {
      // Success! Show final animation and stop
      this.showSuccessAnimation(result);

      // Schedule stop after animation
      setTimeout(() => {
        this.stopRollUntil();
      }, 3000);

      return;
    }

    // Schedule next roll
    this.state.currentRollTimeout = setTimeout(() => {
      this.performNextRoll();
    }, this.state.animationSpeed);

    // Update currency displays
    updateCurrencyDisplay();
  },

  // Show roll until UI
  showRollUntilUI() {
    const rollUntilContainer = document.getElementById('roll-until-container');
    if (rollUntilContainer) {
      rollUntilContainer.style.display = 'block';
    }

    // Update target display
    const targetDisplay = document.getElementById('roll-until-target');
    if (targetDisplay) {
      targetDisplay.textContent = `${this.state.targetTier.charAt(0).toUpperCase() + this.state.targetTier.slice(1)} ${this.state.targetType.charAt(0).toUpperCase() + this.state.targetType.slice(1)}`;
    }

    // Update roll count display
    const rollCountDisplay = document.getElementById('roll-until-count');
    if (rollCountDisplay) {
      rollCountDisplay.textContent = '0';
    }

    // Update currency spent display
    const currencySpentDisplay = document.getElementById('roll-until-spent');
    if (currencySpentDisplay) {
      currencySpentDisplay.textContent = '0 ' + (this.state.usePremiumCurrency ? 'Gems' : 'Silver');
    }
  },

  // Hide roll until UI
  hideRollUntilUI() {
    const rollUntilContainer = document.getElementById('roll-until-container');
    if (rollUntilContainer) {
      rollUntilContainer.style.display = 'none';
    }
  },

  // Show current roll with enhanced animation
  showCurrentRoll(result) {
    // Update roll count display
    const rollCountDisplay = document.getElementById('roll-until-count');
    if (rollCountDisplay) {
      rollCountDisplay.textContent = this.state.rollCount.toString();
    }

    // Update currency spent display
    const currencySpentDisplay = document.getElementById('roll-until-spent');
    if (currencySpentDisplay) {
      const spent = this.state.usePremiumCurrency ? this.state.gemsSpent : this.state.silverSpent;
      currencySpentDisplay.textContent = `${spent} ${this.state.usePremiumCurrency ? 'Gems' : 'Silver'}`;
    }

    // Update current roll display
    const currentRollDisplay = document.getElementById('roll-until-current');
    if (currentRollDisplay) {
      // Show animation of cycling through multiple towers/variants
      this.showCyclingAnimation(currentRollDisplay, result);
    }
  },

  // Show animation of cycling through multiple towers/variants
  showCyclingAnimation(container, finalResult) {
    // Clear previous content
    container.innerHTML = '';

    // Create animation container
    const animationContainer = document.createElement('div');
    animationContainer.className = 'cycling-animation';
    container.appendChild(animationContainer);

    // Get all possible results based on target type
    const allPossibleResults = this.state.targetType === 'tower' ?
      Object.keys(towerStats) :
      Object.keys(towerVariants);

    // Randomly select some results to show in the animation (excluding the final result)
    const animationResults = [];
    const numAnimationResults = Math.min(10, Math.max(5, Math.floor(Math.random() * 15)));

    for (let i = 0; i < numAnimationResults; i++) {
      let randomIndex = Math.floor(Math.random() * allPossibleResults.length);
      let randomResult = allPossibleResults[randomIndex];

      // Avoid duplicates and the final result
      while (animationResults.includes(randomResult) || randomResult === finalResult) {
        randomIndex = Math.floor(Math.random() * allPossibleResults.length);
        randomResult = allPossibleResults[randomIndex];
      }

      animationResults.push(randomResult);
    }

    // Add the final result at the end
    animationResults.push(finalResult);

    // Function to show a single result in the animation
    const showResult = (index) => {
      if (index >= animationResults.length) return;

      // Clear container
      animationContainer.innerHTML = '';

      // Get result data
      const result = animationResults[index];
      const resultData = this.state.targetType === 'tower' ?
        towerStats[result] :
        window.towerVariants[result];

      const resultTier = resultData?.tier || 'common';

      // Create result element
      const resultElement = document.createElement('div');
      resultElement.className = `roll-result ${resultTier}`;
      resultElement.style.backgroundColor = resultData?.color || '#CCCCCC';

      // Add name
      const nameElement = document.createElement('div');
      nameElement.className = 'roll-result-name';
      nameElement.textContent = resultData?.name || result;
      resultElement.appendChild(nameElement);

      // Add tier
      const tierElement = document.createElement('div');
      tierElement.className = 'roll-result-tier';
      tierElement.textContent = resultTier.charAt(0).toUpperCase() + resultTier.slice(1);
      resultElement.appendChild(tierElement);

      // Add to animation container
      animationContainer.appendChild(resultElement);

      // Calculate delay for next result
      // Speed up as we go through the animation
      const isLast = index === animationResults.length - 1;
      const delay = isLast ? 0 : Math.max(50, 300 - (index * 20));

      // Show next result after delay
      if (!isLast) {
        setTimeout(() => showResult(index + 1), delay);
      }
    };

    // Start the animation
    showResult(0);
  },

  // Show success animation
  showSuccessAnimation(result) {
    // Get result data
    const resultData = this.state.targetType === 'tower' ?
      towerStats[result] :
      towerVariants[result];

    const resultTier = resultData?.tier || 'common';

    // Play animation based on tier
    if (resultTier === 'divine' || resultTier === 'mythic') {
      // For divine and mythic, use the divine cutscene
      gachaSystem.createDivineCutscene('holy', `${resultTier.toUpperCase()} ${this.state.targetType.toUpperCase()} OBTAINED!`);
    } else if (resultTier === 'legendary') {
      // For legendary, use a special animation
      const animationContainer = document.createElement('div');
      animationContainer.className = 'gacha-animation-container';
      gachaSystem.createRegularAnimation(resultTier, null, animationContainer, document.body);
    }

    // Update success message
    const successMessage = document.getElementById('roll-until-success');
    if (successMessage) {
      successMessage.textContent = `Success! Found ${resultData?.name || result} (${resultTier}) after ${this.state.rollCount} rolls!`;
      successMessage.style.display = 'block';
    }
  },

  // Show final results
  showFinalResults() {
    // Get result container
    const resultContainer = this.state.targetType === 'tower' ?
      document.getElementById('tower-result') :
      document.getElementById('variant-result');

    if (!resultContainer) return;

    // Clear container
    resultContainer.innerHTML = '';

    // Create summary
    const summary = document.createElement('div');
    summary.className = 'roll-until-summary';

    // Add header
    const header = document.createElement('h3');
    header.textContent = 'Roll Until Summary';
    summary.appendChild(header);

    // Add stats
    const stats = document.createElement('div');
    stats.className = 'roll-until-stats';

    // Add roll count
    const rollCount = document.createElement('div');
    rollCount.className = 'roll-until-stat';
    rollCount.innerHTML = `<span>Rolls:</span> ${this.state.rollCount}`;
    stats.appendChild(rollCount);

    // Add currency spent
    const currencySpent = document.createElement('div');
    currencySpent.className = 'roll-until-stat';
    const spent = this.state.usePremiumCurrency ? this.state.gemsSpent : this.state.silverSpent;
    currencySpent.innerHTML = `<span>${this.state.usePremiumCurrency ? 'Gems' : 'Silver'} Spent:</span> ${spent}`;
    stats.appendChild(currencySpent);

    // Add to summary
    summary.appendChild(stats);

    // Count tiers
    const tierCounts = {
      common: 0,
      rare: 0,
      epic: 0,
      legendary: 0,
      mythic: 0,
      divine: 0
    };

    // Count results by tier
    this.state.results.forEach(result => {
      const resultData = this.state.targetType === 'tower' ?
        towerStats[result] :
        window.towerVariants[result];

      const resultTier = resultData?.tier || 'common';
      tierCounts[resultTier]++;
    });

    // Add tier counts
    const tierCountsElement = document.createElement('div');
    tierCountsElement.className = 'roll-until-tier-counts';

    // Add header
    const tierCountsHeader = document.createElement('h4');
    tierCountsHeader.textContent = 'Tier Distribution';
    tierCountsElement.appendChild(tierCountsHeader);

    // Add counts
    Object.keys(tierCounts).forEach(tier => {
      if (tierCounts[tier] > 0) {
        const tierCount = document.createElement('div');
        tierCount.className = `roll-until-tier-count ${tier}`;
        tierCount.innerHTML = `<span>${tier.charAt(0).toUpperCase() + tier.slice(1)}:</span> ${tierCounts[tier]} (${Math.round(tierCounts[tier] / this.state.rollCount * 100)}%)`;
        tierCountsElement.appendChild(tierCount);
      }
    });

    // Add to summary
    summary.appendChild(tierCountsElement);

    // Add to result container
    resultContainer.appendChild(summary);

    // Update pity progress bars
    updatePityProgressBars();
  }
};

// Initialize the roll until system when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  rollUntilSystem.init();
});
