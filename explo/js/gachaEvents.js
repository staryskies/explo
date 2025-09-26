/**
 * Event handlers for the gacha system
 */

// Log that gachaEvents.js is loaded
console.log('Gacha event handlers loaded');

// Initialize gacha event handlers
document.addEventListener('DOMContentLoaded', function() {
  // Initialize cooldowns
  gachaSystem.initCooldowns();

  // Update pity progress bars
  updatePityProgressBars();

  // Tower Gacha Event Handlers
  setupTowerGachaEvents();

  // Variant Gacha Event Handlers
  setupVariantGachaEvents();

  // Roll Until Event Handlers
  setupRollUntilEvents();

  // Update currency displays
  updateGachaCurrencyDisplays();

  // Debug dependencies
  console.log('gachaSystem methods:', {
    rollTowerWithVariant: typeof gachaSystem.rollTowerWithVariant,
    rollTowers: typeof gachaSystem.rollTowers,
    rollVariant: typeof gachaSystem.rollVariant,
    rollVariants: typeof gachaSystem.rollVariants,
    startCooldown: typeof gachaSystem.startCooldown,
    playAnimation: typeof gachaSystem.playAnimation
  });
  console.log('towerStats:', window.towerStats);
  console.log('towerVariants:', window.towerVariants);
});

// Update pity progress bars
function updatePityProgressBars() {
  // Tower pity progress
  if (playerData.towerPity) {
    gachaSystem.pityCounter.tower = { ...playerData.towerPity };
    Object.keys(playerData.towerPity).forEach(tier => {
      const progressBar = document.getElementById(`tower-${tier}-pity`);
      if (progressBar) {
        const pityThreshold = gachaSystem.pity.tower[tier];
        const pityCount = playerData.towerPity[tier];
        const percentage = Math.min(100, (pityCount / pityThreshold) * 100);
        progressBar.style.width = `${percentage}%`;
      }
    });
  }

  // Variant pity progress
  if (playerData.variantPity) {
    gachaSystem.pityCounter.variant = { ...playerData.variantPity };
    Object.keys(playerData.variantPity).forEach(tier => {
      const progressBar = document.getElementById(`variant-${tier}-pity`);
      if (progressBar) {
        const pityThreshold = gachaSystem.pity.variant[tier];
        const pityCount = playerData.variantPity[tier];
        const percentage = Math.min(100, (pityCount / pityThreshold) * 100);
        progressBar.style.width = `${percentage}%`;
      }
    });
  }
}

// Update gacha currency displays
function updateGachaCurrencyDisplays() {
  const towerGachaSilverAmount = document.getElementById('tower-gacha-silver-amount');
  if (towerGachaSilverAmount) {
    towerGachaSilverAmount.textContent = playerData.silver;
  }

  const variantGachaSilverAmount = document.getElementById('variant-gacha-silver-amount');
  if (variantGachaSilverAmount) {
    variantGachaSilverAmount.textContent = playerData.silver;
  }

  const towerGachaGemsAmount = document.getElementById('tower-gacha-gems-amount');
  if (towerGachaGemsAmount) {
    towerGachaGemsAmount.textContent = playerData.gems;
  }

  const variantGachaGemsAmount = document.getElementById('variant-gacha-gems-amount');
  if (variantGachaGemsAmount) {
    variantGachaGemsAmount.textContent = playerData.gems;
  }
}

// Single function to handle all tower rolls
function rollTowers(count, isPremium) {
  const button = document.getElementById(`roll-tower${isPremium ? '-premium' : ''}-${count}`);
  if (!button) {
    console.error(`Button roll-tower${isPremium ? '-premium' : ''}-${count} not found`);
    return;
  }

  if (button.classList.contains('cooldown')) return;

  // Determine currency and cost
  const currencyType = isPremium ? 'gems' : 'silver';
  const costKey = count === 1 ? 'single' : count === 10 ? 'ten' : 'hundred';
  const cost = isPremium ? gachaSystem.costs.premium.tower[costKey] : gachaSystem.costs.tower[costKey];

  // Check if player has enough currency
  if (playerData[currencyType] < cost) {
    const message = `Not enough ${currencyType}! You need ${cost} ${currencyType}.`;
    if (window.notificationSystem) {
      window.notificationSystem.error(message);
    } else {
      alert(message);
    }
    return;
  }

  // Spend currency
  if (isPremium) {
    spendGems(cost);
  } else {
    spendSilver(cost);
  }

  // Roll towers
  let results;
  if (count === 1) {
    results = [gachaSystem.rollTowerWithVariant(isPremium)];
  } else {
    results = gachaSystem.rollTowers(count, isPremium);
  }

  // Show results
  if (count === 1) {
    showTowerResult(results[0]);
  } else {
    showTowerResults(results);
  }

  // Start cooldown
  gachaSystem.startCooldown('tower', count);

  // Update pity progress bars
  updatePityProgressBars();

  // Update currency displays
  updateGachaCurrencyDisplays();
}

// Setup tower gacha event handlers
function setupTowerGachaEvents() {
  // Define roll counts and premium options
  const rollOptions = [
    { count: 1, isPremium: false },
    { count: 10, isPremium: false },
    { count: 100, isPremium: false },
    { count: 1, isPremium: true },
    { count: 10, isPremium: true },
    { count: 100, isPremium: true }
  ];

  // Attach event listeners for each roll option
  rollOptions.forEach(({ count, isPremium }) => {
    const buttonId = `roll-tower${isPremium ? '-premium' : ''}-${count}`;
    const button = document.getElementById(buttonId);
    if (button) {
      button.addEventListener('click', () => rollTowers(count, isPremium));
    } else {
      console.warn(`Button ${buttonId} not found`);
    }
  });
}

// Show tower result
function showTowerResult(result) {
  const resultElement = document.getElementById('tower-result');
  if (!resultElement) return;

  // Clear previous results
  resultElement.innerHTML = '';

  // Get tower data
  const { towerType, variant, towerTier } = result;
  const towerData = towerStats[towerType];
  if (!towerData) {
    console.error(`No tower data found for ${towerType}`);
    return;
  }

  // Create animation container
  const animationContainer = document.createElement('div');
  animationContainer.className = 'gacha-animation-container';

  // Check if it's a divine tier tower
  if (towerTier === 'divine') {
    gachaSystem.createDivineCutscene('holy', 'DIVINE TOWER OBTAINED');
  }

  // Create regular animation
  gachaSystem.createRegularAnimation(towerTier, variant, animationContainer, resultElement);

  // Create result card
  const resultCard = document.createElement('div');
  resultCard.className = `result-card ${towerTier}`;

  // Create tower image
  const towerImage = document.createElement('div');
  towerImage.className = 'tower-image';
  towerImage.style.backgroundColor = towerData.color || '#4CAF50';

  // Create tower info
  const towerInfo = document.createElement('div');
  towerInfo.className = 'tower-info';

  // Create tower name
  const towerName = document.createElement('div');
  towerName.className = 'tower-name';
  towerName.textContent = towerData.name || towerType;

  // Create tower tier
  const towerTierElement = document.createElement('div');
  towerTierElement.className = 'tower-tier';
  towerTierElement.textContent = towerTier.charAt(0).toUpperCase() + towerTier.slice(1);

  // Create variant name
  const variantData = towerVariants[variant] || { name: variant, tier: 'common' };
  const variantName = document.createElement('div');
  variantName.className = 'variant-name';
  variantName.textContent = `Variant: ${variantData.name || variant}`;

  // Create variant tier
  const variantTier = document.createElement('div');
  variantTier.className = 'variant-tier';
  variantTier.textContent = `Variant Tier: ${variantData.tier.charAt(0).toUpperCase() + variantData.tier.slice(1)}`;

  // Add elements to tower info
  towerInfo.appendChild(towerName);
  towerInfo.appendChild(towerTierElement);
  towerInfo.appendChild(variantName);
  towerInfo.appendChild(variantTier);

  // Add elements to result card
  resultCard.appendChild(towerImage);
  resultCard.appendChild(towerInfo);

  // Add result card to result element
  resultElement.appendChild(resultCard);

  // Show notification
  if (window.notificationSystem) {
    const tierName = towerTier.charAt(0).toUpperCase() + towerTier.slice(1);
    window.notificationSystem.roll(`Obtained ${towerData.name || towerType} (${tierName}) with ${variantData.name || variant} Variant`, towerTier);
  }
}

// Show tower results
function showTowerResults(towers) {
  const resultElement = document.getElementById('tower-result');
  if (!resultElement) return;

  // Clear previous results
  resultElement.innerHTML = '';

  // Count towers by tier
  const tierCounts = {
    common: 0,
    rare: 0,
    epic: 0,
    legendary: 0,
    mythic: 0,
    divine: 0
  };

  // Count towers by type and variant
  const typeCounts = {};

  // Process each tower
  towers.forEach(result => {
    const { towerType, variant, towerTier } = result;
    const towerData = towerStats[towerType];
    if (!towerData) {
      console.error(`No tower data found for ${towerType}`);
      return;
    }

    // Increment tier count
    tierCounts[towerTier]++;

    // Increment type count
    const combinedKey = `${towerType}_${variant}`;
    typeCounts[combinedKey] = (typeCounts[combinedKey] || 0) + 1;

    // Check if it's a divine tier tower
    if (towerTier === 'divine') {
      gachaSystem.createDivineCutscene('holy', 'DIVINE TOWER OBTAINED');
    }
  });

  // Create animation for the highest tier
  const highestTier = ['divine', 'mythic', 'legendary', 'epic', 'rare', 'common'].find(tier => tierCounts[tier] > 0) || 'common';
  const highestTierResult = towers.find(result => result.towerTier === highestTier);
  if (highestTierResult && highestTier !== 'common') {
    const animationContainer = document.createElement('div');
    animationContainer.className = 'gacha-animation-container';
    gachaSystem.createRegularAnimation(highestTier, highestTierResult.variant, animationContainer, resultElement);
  }

  // Create summary
  const summary = document.createElement('div');
  summary.className = 'gacha-summary';

  // Create tier summary
  const tierSummary = document.createElement('div');
  tierSummary.className = 'tier-summary';
  tierSummary.innerHTML = '<h3>Tier Summary</h3>';

  // Add tier counts
  Object.keys(tierCounts).forEach(tier => {
    if (tierCounts[tier] > 0) {
      const tierItem = document.createElement('div');
      tierItem.className = `tier-item ${tier}`;
      tierItem.innerHTML = `<span class="tier-name">${tier.charAt(0).toUpperCase() + tier.slice(1)}</span>: <span class="tier-count">${tierCounts[tier]}</span>`;
      tierSummary.appendChild(tierItem);
    }
  });

  // Create type summary
  const typeSummary = document.createElement('div');
  typeSummary.className = 'type-summary';
  typeSummary.innerHTML = '<h3>Tower Summary</h3>';

  // Add type counts
  Object.keys(typeCounts).forEach(combinedKey => {
    const [towerType, variant] = combinedKey.split('_');
    const towerData = towerStats[towerType];
    const variantData = towerVariants[variant] || { name: variant, tier: 'common' };
    if (!towerData) return;

    const typeItem = document.createElement('div');
    typeItem.className = `type-item ${towerData.tier}`;
    typeItem.innerHTML = `<span class="type-name">${towerData.name || towerType} (${variantData.name || variant})</span>: <span class="type-count">${typeCounts[combinedKey]}</span>`;
    typeSummary.appendChild(typeItem);
  });

  // Add summaries to result element
  summary.appendChild(tierSummary);
  summary.appendChild(typeSummary);
  resultElement.appendChild(summary);
}

// Setup variant gacha event handlers
function setupVariantGachaEvents() {
  // Populate tower select
  populateVariantTowerSelect();

  // Show inventory button
  const showInventoryBtn = document.getElementById('show-inventory-btn');
  if (showInventoryBtn) {
    showInventoryBtn.addEventListener('click', function() {
      const towerSelect = document.getElementById('variant-tower-select');
      if (!towerSelect || !towerSelect.value) {
        console.error('No tower selected');
        return;
      }
      const selectedTower = towerSelect.value;
      const rerollSection = document.getElementById('reroll-section');
      if (rerollSection) {
        rerollSection.style.display = 'block';
      }
      populateRerollVariantSelect(selectedTower);
    });
  }

  // Reroll variant button
  const rerollVariantBtn = document.getElementById('reroll-variant-btn');
  if (rerollVariantBtn) {
    rerollVariantBtn.addEventListener('click', function() {
      const towerSelect = document.getElementById('variant-tower-select');
      const variantSelect = document.getElementById('reroll-variant-select');
      if (!towerSelect || !towerSelect.value || !variantSelect || !variantSelect.value) {
        console.error('No tower or variant selected');
        return;
      }

      const selectedTower = towerSelect.value;
      const selectedVariant = variantSelect.value;

      if (playerData.silver < 100) {
        console.error('Not enough silver');
        return;
      }

      spendSilver(100);
      const result = gachaSystem.rerollVariant(selectedTower, selectedVariant);

      if (result) {
        const oldVariantData = towerVariants[result.oldVariant] || { name: result.oldVariant };
        const newVariantData = towerVariants[result.newVariant] || { name: result.newVariant };
        if (newVariantData.tier && newVariantData.tier !== 'common') {
          gachaSystem.playAnimation(newVariantData.tier, null, result.newVariant);
        }
        populateRerollVariantSelect(selectedTower);
        updateGachaCurrencyDisplays();
      } else {
        addSilver(100);
        console.error('Failed to reroll variant');
      }
    });
  }

  // Update variant tower select event
  const variantTowerSelect = document.getElementById('variant-tower-select');
  if (variantTowerSelect) {
    variantTowerSelect.addEventListener('change', function() {
      const rerollSection = document.getElementById('reroll-section');
      if (rerollSection) {
        rerollSection.style.display = 'none';
      }
    });
  }

  // Variant Gacha - Roll 1
  const rollVariant1 = document.getElementById('roll-variant-1');
  if (rollVariant1) {
    rollVariant1.addEventListener('click', function() {
      const towerSelect = document.getElementById('variant-tower-select');
      if (!towerSelect || !towerSelect.value) {
        alert('Please select a tower first!');
        return;
      }
      const selectedTower = towerSelect.value;

      if (playerData.silver < gachaSystem.costs.variant.single) {
        alert(`Not enough silver! You need ${gachaSystem.costs.variant.single} silver.`);
        return;
      }

      spendSilver(gachaSystem.costs.variant.single);
      const variant = gachaSystem.rollVariant(selectedTower);
      if (variant) {
        showVariantResult(variant, selectedTower);
      }
      gachaSystem.startCooldown('variant', 1);
      updatePityProgressBars();
      updateGachaCurrencyDisplays();
    });
  }

  // Variant Gacha - Roll 10
  const rollVariant10 = document.getElementById('roll-variant-10');
  if (rollVariant10) {
    rollVariant10.addEventListener('click', function() {
      const towerSelect = document.getElementById('variant-tower-select');
      if (!towerSelect || !towerSelect.value) {
        alert('Please select a tower first!');
        return;
      }
      const selectedTower = towerSelect.value;

      if (playerData.silver < gachaSystem.costs.variant.ten) {
        alert(`Not enough silver! You need ${gachaSystem.costs.variant.ten} silver.`);
        return;
      }

      spendSilver(gachaSystem.costs.variant.ten);
      const variants = gachaSystem.rollVariants(10, selectedTower);
      if (variants.length > 0) {
        showVariantResults(variants, selectedTower);
      }
      gachaSystem.startCooldown('variant', 10);
      updatePityProgressBars();
      updateGachaCurrencyDisplays();
    });
  }

  // Variant Gacha - Roll 100
  const rollVariant100 = document.getElementById('roll-variant-100');
  if (rollVariant100) {
    rollVariant100.addEventListener('click', function() {
      const towerSelect = document.getElementById('variant-tower-select');
      if (!towerSelect || !towerSelect.value) {
        alert('Please select a tower first!');
        return;
      }
      const selectedTower = towerSelect.value;

      if (playerData.silver < gachaSystem.costs.variant.hundred) {
        alert(`Not enough silver! You need ${gachaSystem.costs.variant.hundred} silver.`);
        return;
      }

      spendSilver(gachaSystem.costs.variant.hundred);
      const variants = gachaSystem.rollVariants(100, selectedTower);
      if (variants.length > 0) {
        showVariantResults(variants, selectedTower);
      }
      gachaSystem.startCooldown('variant', 100);
      updatePityProgressBars();
      updateGachaCurrencyDisplays();
    });
  }

  // Variant Gacha - Premium Roll 1
  const rollVariantPremium1 = document.getElementById('roll-variant-premium-1');
  if (rollVariantPremium1) {
    rollVariantPremium1.addEventListener('click', function() {
      const towerSelect = document.getElementById('variant-tower-select');
      if (!towerSelect || !towerSelect.value) {
        alert('Please select a tower first!');
        return;
      }
      const selectedTower = towerSelect.value;

      if (playerData.gems < gachaSystem.costs.premium.variant.single) {
        alert(`Not enough gems! You need ${gachaSystem.costs.premium.variant.single} gems.`);
        return;
      }

      spendGems(gachaSystem.costs.premium.variant.single);
      const variant = gachaSystem.rollVariant(selectedTower, true);
      if (variant) {
        showVariantResult(variant, selectedTower);
      }
      gachaSystem.startCooldown('variant', 1);
      updatePityProgressBars();
      updateGachaCurrencyDisplays();
    });
  }

  // Variant Gacha - Premium Roll 10
  const rollVariantPremium10 = document.getElementById('roll-variant-premium-10');
  if (rollVariantPremium10) {
    rollVariantPremium10.addEventListener('click', function() {
      const towerSelect = document.getElementById('variant-tower-select');
      if (!towerSelect || !towerSelect.value) {
        alert('Please select a tower first!');
        return;
      }
      const selectedTower = towerSelect.value;

      if (playerData.gems < gachaSystem.costs.premium.variant.ten) {
        alert(`Not enough gems! You need ${gachaSystem.costs.premium.variant.ten} gems.`);
        return;
      }

      spendGems(gachaSystem.costs.premium.variant.ten);
      const variants = gachaSystem.rollVariants(10, selectedTower, true);
      if (variants.length > 0) {
        showVariantResults(variants, selectedTower);
      }
      gachaSystem.startCooldown('variant', 10);
      updatePityProgressBars();
      updateGachaCurrencyDisplays();
    });
  }

  // Variant Gacha - Premium Roll 100
  const rollVariantPremium100 = document.getElementById('roll-variant-premium-100');
  if (rollVariantPremium100) {
    rollVariantPremium100.addEventListener('click', function() {
      const towerSelect = document.getElementById('variant-tower-select');
      if (!towerSelect || !towerSelect.value) {
        alert('Please select a tower first!');
        return;
      }
      const selectedTower = towerSelect.value;

      if (playerData.gems < gachaSystem.costs.premium.variant.hundred) {
        alert(`Not enough gems! You need ${gachaSystem.costs.premium.variant.hundred} gems.`);
        return;
      }

      spendGems(gachaSystem.costs.premium.variant.hundred);
      const variants = gachaSystem.rollVariants(100, selectedTower, true);
      if (variants.length > 0) {
        showVariantResults(variants, selectedTower);
      }
      gachaSystem.startCooldown('variant', 100);
      updatePityProgressBars();
      updateGachaCurrencyDisplays();
    });
  }
}

// Populate variant tower select
function populateVariantTowerSelect() {
  const towerSelect = document.getElementById('variant-tower-select');
  if (!towerSelect) return;

  towerSelect.innerHTML = '';
  playerData.unlockedTowers.forEach(towerType => {
    const towerData = towerStats[towerType];
    if (!towerData) return;

    const option = document.createElement('option');
    option.value = towerType;
    option.textContent = towerData.name || towerType;
    towerSelect.appendChild(option);
  });
}

// Setup roll until event handlers
function setupRollUntilEvents() {
  setupTowerRollUntilButtons();
  setupVariantRollUntilButtons();
}

// Setup Tower Roll Until buttons
function setupTowerRollUntilButtons() {
  const towerTiers = ['rare', 'epic', 'legendary', 'mythic'];
  towerTiers.forEach(tier => {
    const button = document.getElementById(`roll-until-tower-${tier}`);
    if (button) {
      button.addEventListener('click', function() {
        performRollUntil('tower', tier, false, 500);
      });
    }
  });

  const premiumTowerTiers = ['rare', 'epic', 'legendary', 'mythic', 'divine'];
  premiumTowerTiers.forEach(tier => {
    const button = document.getElementById(`roll-until-tower-premium-${tier}`);
    if (button) {
      button.addEventListener('click', function() {
        performRollUntil('tower', tier, true, 500);
      });
    }
  });
}

// Setup Variant Roll Until buttons
function setupVariantRollUntilButtons() {
  const variantTiers = ['rare', 'epic', 'legendary'];
  variantTiers.forEach(tier => {
    const button = document.getElementById(`roll-until-variant-${tier}`);
    if (button) {
      button.addEventListener('click', function() {
        const towerSelect = document.getElementById('variant-tower-select');
        if (!towerSelect || !towerSelect.value) {
          alert('Please select a tower first!');
          return;
        }
        performRollUntil('variant', tier, false, 500);
      });
    }
  });

  const premiumVariantTiers = ['rare', 'epic', 'legendary', 'divine'];
  premiumVariantTiers.forEach(tier => {
    const button = document.getElementById(`roll-until-variant-premium-${tier}`);
    if (button) {
      button.addEventListener('click', function() {
        const towerSelect = document.getElementById('variant-tower-select');
        if (!towerSelect || !towerSelect.value) {
          alert('Please select a tower first!');
          return;
        }
        performRollUntil('variant', tier, true, 500);
      });
    }
  });
}

// Perform Roll Until operation
function performRollUntil(type, targetTier, isPremium, maxRolls = 500) {
  let selectedTower = null;
  if (type === 'variant') {
    const towerSelect = document.getElementById('variant-tower-select');
    if (!towerSelect || !towerSelect.value) {
      if (window.notificationSystem) {
        window.notificationSystem.error('Please select a tower first!');
      } else {
        alert('Please select a tower first!');
      }
      return;
    }
    selectedTower = towerSelect.value;
  }

  const currencyType = isPremium ? 'gems' : 'silver';
  const costPerRoll = isPremium ?
    gachaSystem.costs.premium[type].single :
    gachaSystem.costs[type].single;

  let confirmMessage = '';
  if (type === 'tower') {
    confirmMessage = `This will roll towers until you get a ${targetTier} tier tower or reach ${maxRolls} rolls. It could cost up to ${maxRolls * costPerRoll} ${currencyType}.`;
  } else {
    confirmMessage = `This will roll variants for ${towerStats[selectedTower]?.name || selectedTower} until you get a ${targetTier} tier variant or reach ${maxRolls} rolls. It could cost up to ${maxRolls * costPerRoll} ${currencyType}.`;
  }

  const confirmDialog = document.createElement('div');
  confirmDialog.className = 'confirm-dialog';
  confirmDialog.innerHTML = `
    <div class="confirm-dialog-content">
      <h3>Confirm Roll Until</h3>
      <p>${confirmMessage}</p>
      <div class="confirm-dialog-buttons">
        <button id="confirm-roll-until-cancel">Cancel</button>
        <button id="confirm-roll-until-confirm">Confirm</button>
      </div>
    </div>
  `;
  document.body.appendChild(confirmDialog);

  return new Promise((resolve) => {
    document.getElementById('confirm-roll-until-cancel').addEventListener('click', () => {
      document.body.removeChild(confirmDialog);
      resolve(false);
    });

    document.getElementById('confirm-roll-until-confirm').addEventListener('click', () => {
      document.body.removeChild(confirmDialog);
      resolve(true);
    });
  }).then(confirmed => {
    if (!confirmed) {
      return false;
    }

    const result = gachaSystem.rollUntil(type, targetTier, null, isPremium, maxRolls);
    if (result.success) {
      if (type === 'tower') {
        showTowerResult(result.result);
      } else {
        showVariantResult(result.result, selectedTower);
      }

      if (targetTier !== 'common') {
        const variant = type === 'tower' ? result.result.variant : result.result.variant;
        gachaSystem.playAnimation(targetTier, null, variant);
      }
    } else {
      if (window.notificationSystem) {
        window.notificationSystem.error(`Failed to get ${targetTier} tier after ${result.rolls} rolls. Reason: ${result.reason}`);
      } else {
        alert(`Failed to get ${targetTier} tier after ${result.rolls} rolls. Reason: ${result.reason}`);
      }
    }

    updatePityProgressBars();
    updateGachaCurrencyDisplays();
    return true;
  });
}

// Show variant result
function showVariantResult(result, towerType) {
  const resultElement = document.getElementById('variant-result');
  if (!resultElement) return;

  resultElement.innerHTML = '';

  let variant;
  if (typeof result === 'string') {
    variant = result;
  } else if (result && result.variant) {
    variant = result.variant;
  } else {
    console.error('Invalid variant result format');
    return;
  }

  const variantData = window.towerVariants[variant];
  if (!variantData) return;

  const animationContainer = document.createElement('div');
  animationContainer.className = 'gacha-animation-container';

  if (variantData.tier === 'divine') {
    if (variant === 'holy') {
      gachaSystem.createDivineCutscene('holy', 'HOLY VARIANT OBTAINED');
    } else if (variant === 'satanic') {
      gachaSystem.createDivineCutscene('satanic', 'SATANIC VARIANT OBTAINED');
    } else {
      gachaSystem.createDivineCutscene('holy', 'DIVINE VARIANT OBTAINED');
    }
  }

  gachaSystem.createRegularAnimation(variantData.tier, variant, animationContainer, resultElement);

  const resultCard = document.createElement('div');
  resultCard.className = `result-card ${variantData.tier}`;

  const variantImage = document.createElement('div');
  variantImage.className = 'variant-image';
  variantImage.style.backgroundColor = variantData.color || '#4CAF50';

  const variantInfo = document.createElement('div');
  variantInfo.className = 'variant-info';

  const variantName = document.createElement('div');
  variantName.className = 'variant-name';
  variantName.textContent = variantData.name || variant;

  const variantTier = document.createElement('div');
  variantTier.className = 'variant-tier';
  variantTier.textContent = variantData.tier.charAt(0).toUpperCase() + variantData.tier.slice(1);

  variantInfo.appendChild(variantName);
  variantInfo.appendChild(variantTier);

  resultCard.appendChild(variantImage);
  resultCard.appendChild(variantInfo);

  resultElement.appendChild(resultCard);

  if (window.notificationSystem) {
    const tierName = variantData.tier.charAt(0).toUpperCase() + variantData.tier.slice(1);
    window.notificationSystem.roll(`Obtained ${variantData.name || variant} Variant (${tierName})`, variantData.tier);
  }
}

// Show variant results
function showVariantResults(variants, towerType) {
  const resultElement = document.getElementById('variant-result');
  if (!resultElement) return;

  resultElement.innerHTML = '';

  const tierCounts = {
    common: 0,
    rare: 0,
    epic: 0,
    legendary: 0,
    divine: 0
  };

  const typeCounts = {};

  variants.forEach(variant => {
    const variantData = window.towerVariants[variant];
    if (!variantData) return;

    tierCounts[variantData.tier]++;
    typeCounts[variant] = (typeCounts[variant] || 0) + 1;

    if (variantData.tier === 'divine') {
      if (variant === 'holy') {
        gachaSystem.createDivineCutscene('holy', 'HOLY VARIANT OBTAINED');
      } else if (variant === 'satanic') {
        gachaSystem.createDivineCutscene('satanic', 'SATANIC VARIANT OBTAINED');
      } else {
        gachaSystem.createDivineCutscene('holy', 'DIVINE VARIANT OBTAINED');
      }
    }
  });

  const summary = document.createElement('div');
  summary.className = 'gacha-summary';

  const tierSummary = document.createElement('div');
  tierSummary.className = 'tier-summary';
  tierSummary.innerHTML = '<h3>Tier Summary</h3>';

  Object.keys(tierCounts).forEach(tier => {
    if (tierCounts[tier] > 0) {
      const tierItem = document.createElement('div');
      tierItem.className = `tier-item ${tier}`;
      tierItem.innerHTML = `<span class="tier-name">${tier.charAt(0).toUpperCase() + tier.slice(1)}</span>: <span class="tier-count">${tierCounts[tier]}</span>`;
      tierSummary.appendChild(tierItem);
    }
  });

  const typeSummary = document.createElement('div');
  typeSummary.className = 'type-summary';
  typeSummary.innerHTML = '<h3>Variant Summary</h3>';

  Object.keys(typeCounts).forEach(type => {
    const variantData = towerVariants[type];
    if (!variantData) return;

    const typeItem = document.createElement('div');
    typeItem.className = `type-item ${variantData.tier}`;
    typeItem.innerHTML = `<span class="type-name">${variantData.name || type}</span>: <span class="type-count">${typeCounts[type]}</span>`;
    typeSummary.appendChild(typeItem);
  });

  summary.appendChild(tierSummary);
  summary.appendChild(typeSummary);
  resultElement.appendChild(summary);
}

// Populate reroll variant select
function populateRerollVariantSelect(towerType) {
  const variantSelect = document.getElementById('reroll-variant-select');
  if (!variantSelect) return;

  variantSelect.innerHTML = '';

  const defaultOption = document.createElement('option');
  defaultOption.value = '';
  defaultOption.textContent = 'Select a Variant';
  variantSelect.appendChild(defaultOption);

  if (playerData.towerVariants[towerType]) {
    playerData.towerVariants[towerType].forEach(variant => {
      if (variant === 'normal') return;

      const option = document.createElement('option');
      option.value = variant;
      const variantData = towerVariants[variant] || { name: variant };
      option.textContent = variantData.name || variant;
      variantSelect.appendChild(option);
    });
  }
}