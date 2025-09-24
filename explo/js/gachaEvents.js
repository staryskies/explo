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
});

// Update pity progress bars
function updatePityProgressBars() {
  // Tower pity progress
  if (playerData.towerPity) {
    // Update tower pity counters
    gachaSystem.pityCounter.tower = { ...playerData.towerPity };

    // Update tower pity progress bars
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
    // Update variant pity counters
    gachaSystem.pityCounter.variant = { ...playerData.variantPity };

    // Update variant pity progress bars
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
  // Update tower gacha silver display
  const towerGachaSilverAmount = document.getElementById('tower-gacha-silver-amount');
  if (towerGachaSilverAmount) {
    towerGachaSilverAmount.textContent = playerData.silver;
  }

  // Update variant gacha silver display
  const variantGachaSilverAmount = document.getElementById('variant-gacha-silver-amount');
  if (variantGachaSilverAmount) {
    variantGachaSilverAmount.textContent = playerData.silver;
  }

  // Update tower gacha gems display
  const towerGachaGemsAmount = document.getElementById('tower-gacha-gems-amount');
  if (towerGachaGemsAmount) {
    towerGachaGemsAmount.textContent = playerData.gems;
  }

  // Update variant gacha gems display
  const variantGachaGemsAmount = document.getElementById('variant-gacha-gems-amount');
  if (variantGachaGemsAmount) {
    variantGachaGemsAmount.textContent = playerData.gems;
  }
}

// Setup tower gacha event handlers
function setupTowerGachaEvents() {
  // Tower Gacha - Roll 1
  const rollTower1 = document.getElementById('roll-tower-1');
  if (rollTower1) {
    rollTower1.addEventListener('click', function() {
      // Check if player has enough silver
      if (playerData.silver < gachaSystem.costs.tower.single) {
        if (window.notificationSystem) {
          window.notificationSystem.error(`Not enough silver! You need ${gachaSystem.costs.tower.single} silver.`);
        } else {
          alert(`Not enough silver! You need ${gachaSystem.costs.tower.single} silver.`);
        }
        return;
      }

      // Spend silver
      spendSilver(gachaSystem.costs.tower.single);

      // Roll tower
      const tower = gachaSystem.rollTower();

      // Show result
      showTowerResult(tower);

      // Start cooldown
      gachaSystem.startCooldown('tower', 1);

      // Update pity progress bars
      updatePityProgressBars();

      // Update currency displays
      updateGachaCurrencyDisplays();
    });
  }

  // Tower Gacha - Roll 10
  const rollTower10 = document.getElementById('roll-tower-10');
  if (rollTower10) {
    rollTower10.addEventListener('click', function() {
      // Check if player has enough silver
      if (playerData.silver < gachaSystem.costs.tower.ten) {
        if (window.notificationSystem) {
          window.notificationSystem.error(`Not enough silver! You need ${gachaSystem.costs.tower.ten} silver.`);
        } else {
          alert(`Not enough silver! You need ${gachaSystem.costs.tower.ten} silver.`);
        }
        return;
      }

      // Spend silver
      spendSilver(gachaSystem.costs.tower.ten);

      // Roll towers
      const towers = gachaSystem.rollTowers(10);

      // Show results
      showTowerResults(towers);

      // Start cooldown
      gachaSystem.startCooldown('tower', 10);

      // Update pity progress bars
      updatePityProgressBars();

      // Update currency displays
      updateGachaCurrencyDisplays();
    });
  }

  // Tower Gacha - Roll 100
  const rollTower100 = document.getElementById('roll-tower-100');
  if (rollTower100) {
    rollTower100.addEventListener('click', function() {
      // Check if player has enough silver
      if (playerData.silver < gachaSystem.costs.tower.hundred) {
        alert(`Not enough silver! You need ${gachaSystem.costs.tower.hundred} silver.`);
        return;
      }

      // Spend silver
      spendSilver(gachaSystem.costs.tower.hundred);

      // Roll towers
      const towers = gachaSystem.rollTowers(100);

      // Show results
      showTowerResults(towers);

      // Start cooldown
      gachaSystem.startCooldown('tower', 100);

      // Update pity progress bars
      updatePityProgressBars();

      // Update currency displays
      updateGachaCurrencyDisplays();
    });
  }

  // Tower Gacha - Premium Roll 1
  const rollTowerPremium1 = document.getElementById('roll-tower-premium-1');
  if (rollTowerPremium1) {
    rollTowerPremium1.addEventListener('click', function() {
      // Check if player has enough gems
      if (playerData.gems < gachaSystem.costs.premium.tower.single) {
        alert(`Not enough gems! You need ${gachaSystem.costs.premium.tower.single} gems.`);
        return;
      }

      // Spend gems
      spendGems(gachaSystem.costs.premium.tower.single);

      // Roll tower with increased rates (1.5x)
      const tower = gachaSystem.rollTower(true);

      // Show result
      showTowerResult(tower);

      // Start cooldown (shorter for premium)
      gachaSystem.startCooldown('tower', 1);

      // Update pity progress bars
      updatePityProgressBars();

      // Update currency displays
      updateGachaCurrencyDisplays();
    });
  }

  // Tower Gacha - Premium Roll 10
  const rollTowerPremium10 = document.getElementById('roll-tower-premium-10');
  if (rollTowerPremium10) {
    rollTowerPremium10.addEventListener('click', function() {
      // Check if player has enough gems
      if (playerData.gems < gachaSystem.costs.premium.tower.ten) {
        alert(`Not enough gems! You need ${gachaSystem.costs.premium.tower.ten} gems.`);
        return;
      }

      // Spend gems
      spendGems(gachaSystem.costs.premium.tower.ten);

      // Roll towers with increased rates
      const towers = gachaSystem.rollTowers(10, true);

      // Show results
      showTowerResults(towers);

      // Start cooldown (shorter for premium)
      gachaSystem.startCooldown('tower', 10);

      // Update pity progress bars
      updatePityProgressBars();

      // Update currency displays
      updateGachaCurrencyDisplays();
    });
  }

  // Tower Gacha - Premium Roll 100
  const rollTowerPremium100 = document.getElementById('roll-tower-premium-100');
  if (rollTowerPremium100) {
    rollTowerPremium100.addEventListener('click', function() {
      // Check if player has enough gems
      if (playerData.gems < gachaSystem.costs.premium.tower.hundred) {
        alert(`Not enough gems! You need ${gachaSystem.costs.premium.tower.hundred} gems.`);
        return;
      }

      // Spend gems
      spendGems(gachaSystem.costs.premium.tower.hundred);

      // Roll towers with increased rates
      const towers = gachaSystem.rollTowers(100, true);

      // Show results
      showTowerResults(towers);

      // Start cooldown (shorter for premium)
      gachaSystem.startCooldown('tower', 100);

      // Update pity progress bars
      updatePityProgressBars();

      // Update currency displays
      updateGachaCurrencyDisplays();
    });
  }
}

// Setup variant gacha event handlers
function setupVariantGachaEvents() {
  // Populate tower select
  populateVariantTowerSelect();

  // Show inventory button
  const showInventoryBtn = document.getElementById('show-inventory-btn');
  if (showInventoryBtn) {
    showInventoryBtn.addEventListener('click', function() {
      // Get selected tower
      const towerSelect = document.getElementById('variant-tower-select');
      if (!towerSelect || !towerSelect.value) {
        console.error('No tower selected');
        return;
      }
      const selectedTower = towerSelect.value;

      // Show the reroll section
      const rerollSection = document.getElementById('reroll-section');
      if (rerollSection) {
        rerollSection.style.display = 'block';
      }

      // Populate the variant select
      populateRerollVariantSelect(selectedTower);
    });
  }

  // Reroll variant button
  const rerollVariantBtn = document.getElementById('reroll-variant-btn');
  if (rerollVariantBtn) {
    rerollVariantBtn.addEventListener('click', function() {
      // Get selected tower and variant
      const towerSelect = document.getElementById('variant-tower-select');
      const variantSelect = document.getElementById('reroll-variant-select');

      if (!towerSelect || !towerSelect.value || !variantSelect || !variantSelect.value) {
        console.error('No tower or variant selected');
        return;
      }

      const selectedTower = towerSelect.value;
      const selectedVariant = variantSelect.value;

      // Check if player has enough silver
      if (playerData.silver < 100) {
        console.error('Not enough silver');
        return;
      }

      // Spend silver
      spendSilver(100);

      // Reroll variant
      const result = gachaSystem.rerollVariant(selectedTower, selectedVariant);

      if (result) {
        // Show result
        const oldVariantData = towerVariants[result.oldVariant] || { name: result.oldVariant };
        const newVariantData = towerVariants[result.newVariant] || { name: result.newVariant };

        // Play animation if it's a rare+ variant
        if (newVariantData.tier && newVariantData.tier !== 'common') {
          gachaSystem.playAnimation(newVariantData.tier, null, result.newVariant);
        }

        // Update the variant select
        populateRerollVariantSelect(selectedTower);

        // Update currency displays
        updateGachaCurrencyDisplays();
      } else {
        // Refund silver if reroll failed
        addSilver(100);
        console.error('Failed to reroll variant');
      }
    });
  }

  // Update variant tower select event
  const variantTowerSelect = document.getElementById('variant-tower-select');
  if (variantTowerSelect) {
    variantTowerSelect.addEventListener('change', function() {
      // Hide the reroll section when tower changes
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
      // Get selected tower
      const towerSelect = document.getElementById('variant-tower-select');
      if (!towerSelect || !towerSelect.value) {
        alert('Please select a tower first!');
        return;
      }
      const selectedTower = towerSelect.value;

      // Check if player has enough silver
      if (playerData.silver < gachaSystem.costs.variant.single) {
        alert(`Not enough silver! You need ${gachaSystem.costs.variant.single} silver.`);
        return;
      }

      // Spend silver
      spendSilver(gachaSystem.costs.variant.single);

      // Roll variant
      const variant = gachaSystem.rollVariant(selectedTower);

      // Show result
      if (variant) {
        showVariantResult(variant, selectedTower);
      }

      // Start cooldown
      gachaSystem.startCooldown('variant', 1);

      // Update pity progress bars
      updatePityProgressBars();

      // Update currency displays
      updateGachaCurrencyDisplays();
    });
  }

  // Variant Gacha - Roll 10
  const rollVariant10 = document.getElementById('roll-variant-10');
  if (rollVariant10) {
    rollVariant10.addEventListener('click', function() {
      // Get selected tower
      const towerSelect = document.getElementById('variant-tower-select');
      if (!towerSelect || !towerSelect.value) {
        alert('Please select a tower first!');
        return;
      }
      const selectedTower = towerSelect.value;

      // Check if player has enough silver
      if (playerData.silver < gachaSystem.costs.variant.ten) {
        alert(`Not enough silver! You need ${gachaSystem.costs.variant.ten} silver.`);
        return;
      }

      // Spend silver
      spendSilver(gachaSystem.costs.variant.ten);

      // Roll variants
      const variants = gachaSystem.rollVariants(10, selectedTower);

      // Show results
      if (variants.length > 0) {
        showVariantResults(variants, selectedTower);
      }

      // Start cooldown
      gachaSystem.startCooldown('variant', 10);

      // Update pity progress bars
      updatePityProgressBars();

      // Update currency displays
      updateGachaCurrencyDisplays();
    });
  }

  // Variant Gacha - Roll 100
  const rollVariant100 = document.getElementById('roll-variant-100');
  if (rollVariant100) {
    rollVariant100.addEventListener('click', function() {
      // Get selected tower
      const towerSelect = document.getElementById('variant-tower-select');
      if (!towerSelect || !towerSelect.value) {
        alert('Please select a tower first!');
        return;
      }
      const selectedTower = towerSelect.value;

      // Check if player has enough silver
      if (playerData.silver < gachaSystem.costs.variant.hundred) {
        alert(`Not enough silver! You need ${gachaSystem.costs.variant.hundred} silver.`);
        return;
      }

      // Spend silver
      spendSilver(gachaSystem.costs.variant.hundred);

      // Roll variants
      const variants = gachaSystem.rollVariants(100, selectedTower);

      // Show results
      if (variants.length > 0) {
        showVariantResults(variants, selectedTower);
      }

      // Start cooldown
      gachaSystem.startCooldown('variant', 100);

      // Update pity progress bars
      updatePityProgressBars();

      // Update currency displays
      updateGachaCurrencyDisplays();
    });
  }

  // Variant Gacha - Premium Roll 1
  const rollVariantPremium1 = document.getElementById('roll-variant-premium-1');
  if (rollVariantPremium1) {
    rollVariantPremium1.addEventListener('click', function() {
      // Get selected tower
      const towerSelect = document.getElementById('variant-tower-select');
      if (!towerSelect || !towerSelect.value) {
        alert('Please select a tower first!');
        return;
      }
      const selectedTower = towerSelect.value;

      // Check if player has enough gems
      if (playerData.gems < gachaSystem.costs.premium.variant.single) {
        alert(`Not enough gems! You need ${gachaSystem.costs.premium.variant.single} gems.`);
        return;
      }

      // Spend gems
      spendGems(gachaSystem.costs.premium.variant.single);

      // Roll variant with increased rates
      const variant = gachaSystem.rollVariant(selectedTower, true);

      // Show result
      if (variant) {
        showVariantResult(variant, selectedTower);
      }

      // Start cooldown
      gachaSystem.startCooldown('variant', 1);

      // Update pity progress bars
      updatePityProgressBars();

      // Update currency displays
      updateGachaCurrencyDisplays();
    });
  }

  // Variant Gacha - Premium Roll 10
  const rollVariantPremium10 = document.getElementById('roll-variant-premium-10');
  if (rollVariantPremium10) {
    rollVariantPremium10.addEventListener('click', function() {
      // Get selected tower
      const towerSelect = document.getElementById('variant-tower-select');
      if (!towerSelect || !towerSelect.value) {
        alert('Please select a tower first!');
        return;
      }
      const selectedTower = towerSelect.value;

      // Check if player has enough gems
      if (playerData.gems < gachaSystem.costs.premium.variant.ten) {
        alert(`Not enough gems! You need ${gachaSystem.costs.premium.variant.ten} gems.`);
        return;
      }

      // Spend gems
      spendGems(gachaSystem.costs.premium.variant.ten);

      // Roll variants with increased rates
      const variants = gachaSystem.rollVariants(10, selectedTower, true);

      // Show results
      if (variants.length > 0) {
        showVariantResults(variants, selectedTower);
      }

      // Start cooldown
      gachaSystem.startCooldown('variant', 10);

      // Update pity progress bars
      updatePityProgressBars();

      // Update currency displays
      updateGachaCurrencyDisplays();
    });
  }

  // Variant Gacha - Premium Roll 100
  const rollVariantPremium100 = document.getElementById('roll-variant-premium-100');
  if (rollVariantPremium100) {
    rollVariantPremium100.addEventListener('click', function() {
      // Get selected tower
      const towerSelect = document.getElementById('variant-tower-select');
      if (!towerSelect || !towerSelect.value) {
        alert('Please select a tower first!');
        return;
      }
      const selectedTower = towerSelect.value;

      // Check if player has enough gems
      if (playerData.gems < gachaSystem.costs.premium.variant.hundred) {
        alert(`Not enough gems! You need ${gachaSystem.costs.premium.variant.hundred} gems.`);
        return;
      }

      // Spend gems
      spendGems(gachaSystem.costs.premium.variant.hundred);

      // Roll variants with increased rates
      const variants = gachaSystem.rollVariants(100, selectedTower, true);

      // Show results
      if (variants.length > 0) {
        showVariantResults(variants, selectedTower);
      }

      // Start cooldown
      gachaSystem.startCooldown('variant', 100);

      // Update pity progress bars
      updatePityProgressBars();

      // Update currency displays
      updateGachaCurrencyDisplays();
    });
  }
}

// Populate variant tower select
function populateVariantTowerSelect() {
  const towerSelect = document.getElementById('variant-tower-select');
  if (!towerSelect) return;

  // Clear existing options
  towerSelect.innerHTML = '';

  // Add options for unlocked towers
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
  // Tower Roll Until buttons
  setupTowerRollUntilButtons();

  // Variant Roll Until buttons
  setupVariantRollUntilButtons();
}

// Setup Tower Roll Until buttons
function setupTowerRollUntilButtons() {
  // Regular (Silver) Roll Until buttons
  const towerTiers = ['rare', 'epic', 'legendary', 'mythic'];

  towerTiers.forEach(tier => {
    const button = document.getElementById(`roll-until-tower-${tier}`);
    if (button) {
      button.addEventListener('click', function() {
        performRollUntil('tower', tier, false, 500);
      });
    }
  });

  // Premium (Gems) Roll Until buttons
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
  // Regular (Silver) Roll Until buttons
  const variantTiers = ['rare', 'epic', 'legendary'];

  variantTiers.forEach(tier => {
    const button = document.getElementById(`roll-until-variant-${tier}`);
    if (button) {
      button.addEventListener('click', function() {
        // Check if tower is selected
        const towerSelect = document.getElementById('variant-tower-select');
        if (!towerSelect || !towerSelect.value) {
          alert('Please select a tower first!');
          return;
        }

        performRollUntil('variant', tier, false, 500);
      });
    }
  });

  // Premium (Gems) Roll Until buttons
  const premiumVariantTiers = ['rare', 'epic', 'legendary', 'divine'];

  premiumVariantTiers.forEach(tier => {
    const button = document.getElementById(`roll-until-variant-premium-${tier}`);
    if (button) {
      button.addEventListener('click', function() {
        // Check if tower is selected
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
  // Get tower type for variant rolls
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

  // Calculate cost per roll
  const currencyType = isPremium ? 'gems' : 'silver';
  const costPerRoll = isPremium ?
    gachaSystem.costs.premium[type].single :
    gachaSystem.costs[type].single;

  // Create confirmation message
  let confirmMessage = '';
  if (type === 'tower') {
    confirmMessage = `This will roll towers until you get a ${targetTier} tier tower or reach ${maxRolls} rolls. It could cost up to ${maxRolls * costPerRoll} ${currencyType}.`;
  } else {
    confirmMessage = `This will roll variants for ${towerStats[selectedTower]?.name || selectedTower} until you get a ${targetTier} tier variant or reach ${maxRolls} rolls. It could cost up to ${maxRolls * costPerRoll} ${currencyType}.`;
  }

  // Create a confirmation dialog
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

  // Return a promise that resolves when the user confirms or rejects
  return new Promise((resolve) => {
    // Add event listeners
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

    // Perform roll until
    const result = gachaSystem.rollUntil(type, targetTier, selectedTower, isPremium, maxRolls);

    // Show result
    if (result.success) {
      // Show the result
      if (type === 'tower') {
        showTowerResult(result.result.towerType);
      } else {
        showVariantResult(result.result.variant, selectedTower);
      }

      // Play animation if it's rare+
      if (targetTier !== 'common') {
        gachaSystem.playAnimation(targetTier, null, result.result.variant);
      }
    } else {
      // Show failure message
      if (window.notificationSystem) {
        window.notificationSystem.error(`Failed to get ${targetTier} tier after ${result.rolls} rolls.`);
      }
    }

    // Update displays
    updatePityProgressBars();
    updateGachaCurrencyDisplays();

    return true;
  });


}

// Show tower result
function showTowerResult(tower) {
  const resultElement = document.getElementById('tower-result');
  if (!resultElement) return;

  // Clear previous results
  resultElement.innerHTML = '';

  // Get tower data
  const towerData = towerStats[tower];
  if (!towerData) return;

  // Create animation container
  const animationContainer = document.createElement('div');
  animationContainer.className = 'gacha-animation-container';

  // Check if it's a divine tier tower
  if (towerData.tier === 'divine') {
    // Create divine cutscene
    gachaSystem.createDivineCutscene('holy', 'DIVINE TOWER OBTAINED');
  }

  // Create regular animation
  gachaSystem.createRegularAnimation(towerData.tier, null, animationContainer, resultElement);

  // Create result card
  const resultCard = document.createElement('div');
  resultCard.className = `result-card ${towerData.tier}`;

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
  towerName.textContent = towerData.name || tower;

  // Create tower tier
  const towerTier = document.createElement('div');
  towerTier.className = 'tower-tier';
  towerTier.textContent = towerData.tier.charAt(0).toUpperCase() + towerData.tier.slice(1);

  // Add elements to tower info
  towerInfo.appendChild(towerName);
  towerInfo.appendChild(towerTier);

  // Add elements to result card
  resultCard.appendChild(towerImage);
  resultCard.appendChild(towerInfo);

  // Add result card to result element
  resultElement.appendChild(resultCard);

  // Add tower to inventory
  addTowerToInventory(tower);

  // Show notification
  if (window.notificationSystem) {
    const tierName = towerData.tier.charAt(0).toUpperCase() + towerData.tier.slice(1);
    window.notificationSystem.roll(`Obtained ${towerData.name || tower} (${tierName})`, towerData.tier);
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

  // Count towers by type
  const typeCounts = {};

  // Process each tower
  towers.forEach(tower => {
    const towerData = towerStats[tower];
    if (!towerData) return;

    // Increment tier count
    tierCounts[towerData.tier]++;

    // Increment type count
    typeCounts[tower] = (typeCounts[tower] || 0) + 1;

    // Check if it's a divine tier tower
    if (towerData.tier === 'divine') {
      // Create divine cutscene
      gachaSystem.createDivineCutscene('holy', 'DIVINE TOWER OBTAINED');
    }

    // Add tower to inventory
    addTowerToInventory(tower);
  });

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
  Object.keys(typeCounts).forEach(type => {
    const towerData = towerStats[type];
    if (!towerData) return;

    const typeItem = document.createElement('div');
    typeItem.className = `type-item ${towerData.tier}`;
    typeItem.innerHTML = `<span class="type-name">${towerData.name || type}</span>: <span class="type-count">${typeCounts[type]}</span>`;
    typeSummary.appendChild(typeItem);
  });

  // Add summaries to result element
  summary.appendChild(tierSummary);
  summary.appendChild(typeSummary);
  resultElement.appendChild(summary);
}

// Show variant result
function showVariantResult(result, towerType) {
  const resultElement = document.getElementById('variant-result');
  if (!resultElement) return;

  // Clear previous results
  resultElement.innerHTML = '';

  // Handle both old and new result formats
  let variant;
  if (typeof result === 'string') {
    // Old format - just the variant string
    variant = result;
  } else if (result && result.variant) {
    // New format - object with variant property
    variant = result.variant;
  } else {
    console.error('Invalid variant result format');
    return;
  }

  // Get variant data
  const variantData = window.towerVariants[variant];
  if (!variantData) return;

  // Create animation container
  const animationContainer = document.createElement('div');
  animationContainer.className = 'gacha-animation-container';

  // Check if it's a divine tier variant
  if (variantData.tier === 'divine') {
    // Check if it's a holy or satanic variant
    if (variant === 'holy') {
      // Create holy divine cutscene
      gachaSystem.createDivineCutscene('holy', 'HOLY VARIANT OBTAINED');
    } else if (variant === 'satanic') {
      // Create satanic divine cutscene
      gachaSystem.createDivineCutscene('satanic', 'SATANIC VARIANT OBTAINED');
    } else {
      // Create regular divine cutscene
      gachaSystem.createDivineCutscene('holy', 'DIVINE VARIANT OBTAINED');
    }
  }

  // Create regular animation
  gachaSystem.createRegularAnimation(variantData.tier, variant, animationContainer, resultElement);

  // Create result card
  const resultCard = document.createElement('div');
  resultCard.className = `result-card ${variantData.tier}`;

  // Create variant image
  const variantImage = document.createElement('div');
  variantImage.className = 'variant-image';
  variantImage.style.backgroundColor = variantData.color || '#4CAF50';

  // Create variant info
  const variantInfo = document.createElement('div');
  variantInfo.className = 'variant-info';

  // Create variant name
  const variantName = document.createElement('div');
  variantName.className = 'variant-name';
  variantName.textContent = variantData.name || variant;

  // Create variant tier
  const variantTier = document.createElement('div');
  variantTier.className = 'variant-tier';
  variantTier.textContent = variantData.tier.charAt(0).toUpperCase() + variantData.tier.slice(1);

  // Add elements to variant info
  variantInfo.appendChild(variantName);
  variantInfo.appendChild(variantTier);

  // Add elements to result card
  resultCard.appendChild(variantImage);
  resultCard.appendChild(variantInfo);

  // Add result card to result element
  resultElement.appendChild(resultCard);

  // Show notification
  if (window.notificationSystem) {
    const tierName = variantData.tier.charAt(0).toUpperCase() + variantData.tier.slice(1);
    window.notificationSystem.roll(`Obtained ${variantData.name || variant} Variant (${tierName})`, variantData.tier);
  }
}

// Show variant results
function showVariantResults(variants, towerType) {
  const resultElement = document.getElementById('variant-result');
  if (!resultElement) return;

  // Clear previous results
  resultElement.innerHTML = '';

  // Count variants by tier
  const tierCounts = {
    common: 0,
    rare: 0,
    epic: 0,
    legendary: 0,
    divine: 0
  };

  // Count variants by type
  const typeCounts = {};

  // Process each variant
  variants.forEach(variant => {
    const variantData = window.towerVariants[variant];
    if (!variantData) return;

    // Increment tier count
    tierCounts[variantData.tier]++;

    // Increment type count
    typeCounts[variant] = (typeCounts[variant] || 0) + 1;

    // Check if it's a divine tier variant
    if (variantData.tier === 'divine') {
      // Check if it's a holy or satanic variant
      if (variant === 'holy') {
        // Create holy divine cutscene
        gachaSystem.createDivineCutscene('holy', 'HOLY VARIANT OBTAINED');
      } else if (variant === 'satanic') {
        // Create satanic divine cutscene
        gachaSystem.createDivineCutscene('satanic', 'SATANIC VARIANT OBTAINED');
      } else {
        // Create regular divine cutscene
        gachaSystem.createDivineCutscene('holy', 'DIVINE VARIANT OBTAINED');
      }
    }
  });

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
  typeSummary.innerHTML = '<h3>Variant Summary</h3>';

  // Add type counts
  Object.keys(typeCounts).forEach(type => {
    const variantData = towerVariants[type];
    if (!variantData) return;

    const typeItem = document.createElement('div');
    typeItem.className = `type-item ${variantData.tier}`;
    typeItem.innerHTML = `<span class="type-name">${variantData.name || type}</span>: <span class="type-count">${typeCounts[type]}</span>`;
    typeSummary.appendChild(typeItem);
  });

  // Add summaries to result element
  summary.appendChild(tierSummary);
  summary.appendChild(typeSummary);
  resultElement.appendChild(summary);
}

// Populate reroll variant select
function populateRerollVariantSelect(towerType) {
  const variantSelect = document.getElementById('reroll-variant-select');
  if (!variantSelect) return;

  // Clear existing options
  variantSelect.innerHTML = '';

  // Add default option
  const defaultOption = document.createElement('option');
  defaultOption.value = '';
  defaultOption.textContent = 'Select a Variant';
  variantSelect.appendChild(defaultOption);

  // Add tower variants
  if (playerData.towerVariants[towerType]) {
    playerData.towerVariants[towerType].forEach(variant => {
      // Skip normal variant as it can't be rerolled
      if (variant === 'normal') return;

      const option = document.createElement('option');
      option.value = variant;
      const variantData = towerVariants[variant] || { name: variant };
      option.textContent = variantData.name || variant;
      variantSelect.appendChild(option);
    });
  }
}