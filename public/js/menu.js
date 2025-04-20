/**
 * Main menu functionality for the tower defense game
 */
// Log that menu.js is loaded
console.log('Menu loaded');

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
  console.log('Menu DOM loaded');

  // Initialize UI
  updateUI();

  // Add event listeners
  setupEventListeners();

  // Setup gacha system event listeners
  setupGachaEventListeners();

  // Initialize cooldowns from localStorage
  if (gachaSystem.initCooldowns) {
    gachaSystem.initCooldowns();
  }

  // Generate map options
  generateMapOptions();

  // Generate shop options
  generateShopOptions();

  // Generate upgrade options
  generateUpgradeOptions();

  // Create animated stars in the background
  createStars();
});

// Helper function to check if a tower is unlocked
function isTowerUnlocked(towerType) {
  return playerData.unlockedTowers.includes(towerType);
}

// Helper function to check if a tower variant is unlocked
function isVariantUnlocked(towerType, variant) {
  return playerData.towerVariants[towerType]?.includes(variant);
}

// Check for unlocked difficulties
function checkUnlockedDifficulties() {
  // Get player progress from playerData
  const highestWaveCompleted = playerData.highestWaveCompleted || 0;

  // Lock difficulties based on progress
  const difficultyOptions = document.querySelectorAll('.difficulty-option');

  // Easy, Medium, and Hard are always unlocked
  difficultyOptions[0].classList.add('selected'); // Select Easy by default

  // Add click event listeners to Easy, Medium, and Hard
  for (let i = 0; i <= 2; i++) {
    difficultyOptions[i].classList.remove('locked');
    difficultyOptions[i].addEventListener('click', () => {
      // Remove selected class from all options
      document.querySelectorAll('.difficulty-option').forEach(opt => {
        opt.classList.remove('selected');
      });
      // Add selected class to clicked option
      difficultyOptions[i].classList.add('selected');
    });
  }

  // Nightmare is now automatically unlocked
  difficultyOptions[3].classList.remove('locked');
  difficultyOptions[3].addEventListener('click', () => {
    // Remove selected class from all options
    document.querySelectorAll('.difficulty-option').forEach(opt => {
      opt.classList.remove('selected');
    });
    // Add selected class to clicked option
    difficultyOptions[3].classList.add('selected');
  });

  // Void unlocks after completing wave 50 on Nightmare
  if (highestWaveCompleted < 50) {
    difficultyOptions[4].classList.add('locked');
    if (!difficultyOptions[4].querySelector('.lock-icon')) {
      const lockIcon = document.createElement('div');
      lockIcon.className = 'lock-icon';
      lockIcon.textContent = '🔒';
      difficultyOptions[4].appendChild(lockIcon);
      difficultyOptions[4].querySelector('p').textContent = 'Unlocks after completing Wave 50 on Nightmare';
    }
  } else {
    difficultyOptions[4].classList.remove('locked');
    difficultyOptions[4].addEventListener('click', () => {
      // Remove selected class from all options
      document.querySelectorAll('.difficulty-option').forEach(opt => {
        opt.classList.remove('selected');
      });
      // Add selected class to clicked option
      difficultyOptions[4].classList.add('selected');
    });
  }
}

// Create animated stars in the background
function createStars() {
  // Use document.body as the container to make stars appear on all screens
  const container = document.body;
  const starCount = 150; // Increased star count

  for (let i = 0; i < starCount; i++) {
    const star = document.createElement('div');

    // Assign different sizes with different classes
    const sizeRandom = Math.random();
    if (sizeRandom > 0.9) {
      star.className = 'star large';
    } else if (sizeRandom > 0.7) {
      star.className = 'star medium';
    } else {
      star.className = 'star';
    }

    // Random position
    star.style.left = `${Math.random() * 100}%`;
    star.style.top = `${Math.random() * 100}%`;

    // Random animation delay for twinkling
    star.style.animationDelay = `${Math.random() * 3}s`;

    // Add floating animation to some stars
    if (Math.random() > 0.7) {
      star.style.animation = `twinkle 3s infinite, float ${5 + Math.random() * 5}s infinite`;
    }

    // Random z-index to create depth
    star.style.zIndex = Math.floor(Math.random() * 20);

    container.appendChild(star);
  }
}

// Update UI with player data
function updateUI() {
  // Update silver display
  document.getElementById('silver-amount').textContent = playerData.silver;

  // Update gacha silver display if it exists
  const gachaSilverAmount = document.getElementById('gacha-silver-amount');
  if (gachaSilverAmount) {
    gachaSilverAmount.textContent = playerData.silver;
  }

  // Update towers unlocked
  document.getElementById('towers-unlocked').textContent =
    `${getUnlockedTowerCount()}/${getTotalTowerCount()}`;

  // Update high score
  document.getElementById('high-score').textContent = playerData.highScore;
}

// Setup event listeners
function setupEventListeners() {
  // Play button
  document.getElementById('play-button').addEventListener('click', () => {
    document.getElementById('map-selection-modal').classList.add('active');
  });

  // Tower Gacha button
  const towerGachaButton = document.getElementById('tower-gacha-button');
  if (towerGachaButton) {
    towerGachaButton.addEventListener('click', () => {
      const towerGachaModal = document.getElementById('tower-gacha-modal');
      if (towerGachaModal) {
        towerGachaModal.classList.add('active');
        // Update silver display when opening the modal
        const towerGachaSilverAmount = document.getElementById('tower-gacha-silver-amount');
        if (towerGachaSilverAmount) {
          towerGachaSilverAmount.textContent = playerData.silver;
        }
        // Update pity progress bars
        updatePityProgressBars('tower');
      } else {
        console.error('Tower gacha modal not found');
      }
    });
  } else {
    console.error('Tower gacha button not found');
  }

  // Variant Gacha button
  const variantGachaButton = document.getElementById('variant-gacha-button');
  if (variantGachaButton) {
    variantGachaButton.addEventListener('click', () => {
      const variantGachaModal = document.getElementById('variant-gacha-modal');
      if (variantGachaModal) {
        // Populate tower select dropdown for variants
        populateVariantTowerSelect();

        variantGachaModal.classList.add('active');
        // Update silver display when opening the modal
        const variantGachaSilverAmount = document.getElementById('variant-gacha-silver-amount');
        if (variantGachaSilverAmount) {
          variantGachaSilverAmount.textContent = playerData.silver;
        }
        // Update pity progress bars
        updatePityProgressBars('variant');
      } else {
        console.error('Variant gacha modal not found');
      }
    });
  } else {
    console.error('Variant gacha button not found');
  }

  // Inventory button
  const inventoryButton = document.getElementById('inventory-button');
  if (inventoryButton) {
    inventoryButton.addEventListener('click', () => {
      const inventoryModal = document.getElementById('inventory-modal');
      if (inventoryModal) {
        // Generate inventory content before showing the modal
        generateInventoryContent();

        inventoryModal.classList.add('active');
        // Update silver display when opening the modal
        const inventorySilverAmount = document.getElementById('inventory-silver-amount');
        if (inventorySilverAmount) {
          inventorySilverAmount.textContent = playerData.silver;
        }
      } else {
        console.error('Inventory modal not found');
      }
    });
  } else {
    console.error('Inventory button not found');
  }

  // Close buttons
  document.querySelectorAll('.close-btn').forEach(button => {
    button.addEventListener('click', (e) => {
      // Find the parent modal
      const modal = e.target.closest('.modal');
      if (modal) {
        modal.classList.remove('active');
      }
    });
  });

  // Select difficulty button (after map selection)
  document.getElementById('select-difficulty-btn').addEventListener('click', () => {
    const selectedMap = document.querySelector('.map-option.selected');
    if (selectedMap) {
      const mapId = selectedMap.dataset.mapId;
      // Store selected map in session storage
      sessionStorage.setItem('selectedMap', mapId);
      // Show difficulty selection modal
      document.getElementById('map-selection-modal').classList.remove('active');
      document.getElementById('difficulty-selection-modal').classList.add('active');

      // Check for unlocked difficulties
      checkUnlockedDifficulties();
    } else {
      alert('Please select a map first');
    }
  });

  // Back to map selection button
  document.getElementById('back-to-map-btn').addEventListener('click', () => {
    document.getElementById('difficulty-selection-modal').classList.remove('active');
    document.getElementById('map-selection-modal').classList.add('active');
  });

  // Select loadout button (after difficulty selection)
  document.getElementById('select-loadout-btn').addEventListener('click', () => {
    const selectedDifficulty = document.querySelector('.difficulty-option.selected');
    if (selectedDifficulty) {
      const difficulty = selectedDifficulty.dataset.difficulty;
      // Store selected difficulty in session storage
      sessionStorage.setItem('selectedDifficulty', difficulty);
      // Navigate to loadout.html
      window.location.href = 'loadout.html';
    } else {
      alert('Please select a difficulty level first');
    }
  });

  // Add click event listeners to difficulty options
  document.querySelectorAll('.difficulty-option:not(.locked)').forEach(option => {
    option.addEventListener('click', () => {
      // Remove selected class from all options
      document.querySelectorAll('.difficulty-option').forEach(opt => {
        opt.classList.remove('selected');
      });
      // Add selected class to clicked option
      option.classList.add('selected');
    });
  });
}

// Generate map options
function generateMapOptions() {
  const mapContainer = document.getElementById('map-selection-options');

  // Clear existing options
  mapContainer.innerHTML = '';

  // Add map options
  mapTemplates.forEach((map, index) => {
    const mapOption = document.createElement('div');
    mapOption.className = 'map-option';
    mapOption.dataset.mapId = map.id;

    // Create a canvas for the map preview
    const mapImage = document.createElement('canvas');
    mapImage.width = 200;
    mapImage.height = 120;
    const ctx = mapImage.getContext('2d');

    // Get map colors from template
    const backgroundColor = map.backgroundColor || '#4CAF50';
    const pathColor = map.pathColor || '#795548';
    const decorationColors = map.decorationColors || ['#8BC34A', '#689F38', '#33691E'];

    // Fill background
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, 200, 120);

    // Draw map preview based on map type
    switch(map.pathType) {
      case 'single':
        // Draw a simple horizontal path
        ctx.fillStyle = pathColor;
        ctx.fillRect(0, 50, 200, 20);
        break;

      case 'winding':
        // Draw a winding path
        ctx.fillStyle = pathColor;
        ctx.beginPath();
        ctx.moveTo(0, 60);
        ctx.bezierCurveTo(50, 20, 100, 100, 150, 40);
        ctx.lineTo(200, 40);
        ctx.lineTo(200, 60);
        ctx.bezierCurveTo(150, 60, 100, 120, 50, 40);
        ctx.lineTo(0, 40);
        ctx.closePath();
        ctx.fill();
        break;

      case 'spiral':
        // Draw a spiral path
        ctx.fillStyle = pathColor;
        ctx.beginPath();
        ctx.moveTo(0, 60);
        ctx.lineTo(160, 60);
        ctx.lineTo(160, 20);
        ctx.lineTo(40, 20);
        ctx.lineTo(40, 100);
        ctx.lineTo(120, 100);
        ctx.lineTo(120, 40);
        ctx.lineTo(80, 40);
        ctx.lineTo(80, 80);
        ctx.lineTo(200, 80);
        ctx.lineTo(200, 60);
        ctx.closePath();
        ctx.fill();
        break;

      case 'crossroads':
        // Draw a crossroads path
        ctx.fillStyle = pathColor;
        ctx.fillRect(0, 50, 200, 20); // Horizontal
        ctx.fillRect(90, 0, 20, 120); // Vertical
        break;

      case 'maze':
        // Draw a maze-like path
        ctx.fillStyle = pathColor;

        // Horizontal paths
        ctx.fillRect(0, 20, 160, 15);
        ctx.fillRect(40, 60, 160, 15);
        ctx.fillRect(0, 100, 120, 15);

        // Vertical paths
        ctx.fillRect(40, 20, 15, 55);
        ctx.fillRect(120, 35, 15, 80);
        ctx.fillRect(160, 0, 15, 60);
        break;

      default:
        // Default simple path
        ctx.fillStyle = pathColor;
        ctx.fillRect(0, 50, 200, 20);
    }

    // Add decorative elements based on map theme
    if (map.id === 'desert') {
      // Add desert dunes
      ctx.fillStyle = decorationColors[0];
      ctx.beginPath();
      ctx.moveTo(0, 100);
      ctx.bezierCurveTo(50, 90, 100, 110, 150, 95);
      ctx.lineTo(200, 95);
      ctx.lineTo(200, 120);
      ctx.lineTo(0, 120);
      ctx.closePath();
      ctx.fill();

      // Add a palm tree
      ctx.fillStyle = '#8D6E63';
      ctx.fillRect(170, 30, 4, 20);
      ctx.fillStyle = '#4CAF50';
      ctx.beginPath();
      ctx.arc(172, 30, 10, 0, Math.PI * 2);
      ctx.fill();

    } else if (map.id === 'snow') {
      // Add snowflakes
      ctx.fillStyle = '#FFFFFF';
      for (let i = 0; i < 20; i++) {
        const x = Math.random() * 200;
        const y = Math.random() * 120;
        const size = 1 + Math.random() * 2;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
      }

    } else if (map.id === 'volcano') {
      // Add lava pools
      ctx.fillStyle = '#FF5722';
      ctx.beginPath();
      ctx.arc(30, 30, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(160, 90, 15, 0, Math.PI * 2);
      ctx.fill();

      // Add smoke
      ctx.fillStyle = 'rgba(120, 120, 120, 0.7)';
      ctx.beginPath();
      ctx.arc(30, 20, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(160, 75, 12, 0, Math.PI * 2);
      ctx.fill();

    } else if (map.id === 'maze') {
      // Add hedge decorations
      ctx.fillStyle = decorationColors[2];
      for (let i = 0; i < 10; i++) {
        const x = 20 + Math.random() * 160;
        const y = 20 + Math.random() * 80;
        const size = 3 + Math.random() * 5;

        // Don't draw on paths
        const isOnPath = (
          (y >= 20 && y <= 35) || // Top horizontal
          (y >= 60 && y <= 75) || // Middle horizontal
          (y >= 100 && y <= 115) || // Bottom horizontal
          (x >= 40 && x <= 55) || // Left vertical
          (x >= 120 && x <= 135) || // Middle vertical
          (x >= 160 && x <= 175) // Right vertical
        );

        if (!isOnPath) {
          ctx.beginPath();
          ctx.arc(x, y, size, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    } else if (map.id === 'infinite') {
      // Add special infinite mode decorations
      // Stars in the background
      ctx.fillStyle = '#FFFFFF';
      for (let i = 0; i < 30; i++) {
        const x = Math.random() * 200;
        const y = Math.random() * 120;
        const size = 1 + Math.random() * 2;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
      }

      // Infinity symbol
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 3;
      ctx.beginPath();

      // Left loop
      ctx.moveTo(80, 60);
      ctx.bezierCurveTo(70, 40, 50, 40, 40, 60);
      ctx.bezierCurveTo(30, 80, 50, 80, 60, 60);

      // Right loop
      ctx.bezierCurveTo(70, 40, 90, 40, 100, 60);
      ctx.bezierCurveTo(110, 80, 90, 80, 80, 60);

      ctx.stroke();
    } else {
      // Default map decorations
      ctx.fillStyle = decorationColors[1];
      for (let i = 0; i < 8; i++) {
        const x = 20 + Math.random() * 160;
        const y = 20 + Math.random() * 80;
        const size = 3 + Math.random() * 4;

        // Don't draw on the path
        if (!(y > 50 && y < 70)) {
          ctx.beginPath();
          ctx.arc(x, y, size, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    // Draw map name
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 16px Roboto';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(map.name, 100, 5);

    // Add difficulty indicator
    ctx.font = '12px Roboto';
    ctx.fillText(map.difficulty, 100, 100);

    // Add map details
    const mapName = document.createElement('h3');
    mapName.textContent = map.name;

    const mapDesc = document.createElement('p');
    mapDesc.textContent = map.description;

    const mapDifficulty = document.createElement('span');
    mapDifficulty.className = 'difficulty ' + map.difficulty.toLowerCase().replace(' ', '-');
    mapDifficulty.textContent = map.difficulty;

    // Add elements to map option
    mapOption.appendChild(mapImage);
    mapOption.appendChild(mapName);
    mapOption.appendChild(mapDesc);
    mapOption.appendChild(mapDifficulty);

    // Add click event
    mapOption.addEventListener('click', () => {
      // Remove selected class from all options
      document.querySelectorAll('.map-option').forEach(option => {
        option.classList.remove('selected');
      });

      // Add selected class to clicked option
      mapOption.classList.add('selected');
    });

    // Add to container
    mapContainer.appendChild(mapOption);

    // Select first map by default
    if (index === 0) {
      mapOption.classList.add('selected');
    }
  });
}

// Generate shop options
function generateShopOptions() {
  const shopContainer = document.getElementById('tower-shop-options');

  // Check if the shop container exists
  if (!shopContainer) {
    console.log('Shop container not found, skipping shop generation');
    return;
  }

  // Clear existing options
  shopContainer.innerHTML = '';

  // Add tower options
  Object.keys(playerData.towerPrices).forEach(towerType => {
    // Skip basic tower as it's already unlocked
    if (towerType === 'basic') return;

    const isUnlocked = isTowerUnlocked(towerType);
    const price = playerData.towerPrices[towerType];

    const shopItem = document.createElement('div');
    shopItem.className = 'shop-item';
    if (!isUnlocked) {
      shopItem.classList.add('locked');
    }

    // Create a canvas for the tower image
    const towerImage = document.createElement('canvas');
    towerImage.width = 80;
    towerImage.height = 80;
    const ctx = towerImage.getContext('2d');

    // Get tower color from towerStats
    const towerColor = towerStats[towerType]?.color || '#1976D2';

    // Draw tower based on type
    switch(towerType) {
      case 'archer':
        // Draw archer tower
        // Base
        ctx.fillStyle = '#795548';
        ctx.beginPath();
        ctx.arc(40, 50, 20, 0, Math.PI * 2);
        ctx.fill();

        // Tower body
        ctx.fillStyle = towerColor;
        ctx.fillRect(30, 15, 20, 40);

        // Bow
        ctx.strokeStyle = '#8D6E63';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(40, 25, 15, Math.PI * 0.25, Math.PI * 0.75, false);
        ctx.stroke();

        // Arrow
        ctx.strokeStyle = '#555';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(40, 25);
        ctx.lineTo(40, 10);
        ctx.stroke();

        // Arrowhead
        ctx.fillStyle = '#555';
        ctx.beginPath();
        ctx.moveTo(40, 5);
        ctx.lineTo(37, 12);
        ctx.lineTo(43, 12);
        ctx.closePath();
        ctx.fill();
        break;

      case 'cannon':
        // Draw cannon tower
        // Base
        ctx.fillStyle = '#555';
        ctx.beginPath();
        ctx.arc(40, 55, 20, 0, Math.PI * 2);
        ctx.fill();

        // Cannon body
        ctx.fillStyle = towerColor;
        ctx.beginPath();
        ctx.arc(40, 40, 15, 0, Math.PI * 2);
        ctx.fill();

        // Cannon barrel
        ctx.fillStyle = '#333';
        ctx.fillRect(30, 10, 20, 30);

        // Cannon opening
        ctx.fillStyle = '#111';
        ctx.beginPath();
        ctx.arc(40, 10, 8, 0, Math.PI * 2);
        ctx.fill();
        break;

      default:
        // Basic tower or fallback
        // Base
        ctx.fillStyle = '#555';
        ctx.beginPath();
        ctx.arc(40, 60, 15, 0, Math.PI * 2);
        ctx.fill();

        // Tower body
        ctx.fillStyle = towerColor;
        ctx.fillRect(30, 20, 20, 40);

        // Tower top
        ctx.beginPath();
        ctx.arc(40, 20, 10, 0, Math.PI * 2);
        ctx.fill();
    }

    // Add tower type label
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 10px Roboto';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText(towerStats[towerType]?.name || towerType, 40, 78);

    // Add locked overlay if tower is locked
    if (!isUnlocked) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(0, 0, 80, 80);

      // Add lock icon
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;

      // Lock body
      ctx.fillStyle = '#aaa';
      ctx.fillRect(30, 35, 20, 15);

      // Lock shackle
      ctx.beginPath();
      ctx.arc(40, 35, 10, Math.PI, Math.PI * 2);
      ctx.closePath();
      ctx.stroke();
    }

    // Add tower details
    const towerName = document.createElement('h3');
    towerName.textContent = towerStats[towerType]?.name || towerType.charAt(0).toUpperCase() + towerType.slice(1);

    const towerDesc = document.createElement('p');
    towerDesc.textContent = towerStats[towerType]?.description || `A powerful ${towerType} tower`;

    const towerPrice = document.createElement('span');
    towerPrice.className = 'price';
    towerPrice.textContent = `${price} Silver`;

    // Add buy button
    const buyButton = document.createElement('button');
    buyButton.className = 'buy-btn';
    buyButton.textContent = isUnlocked ? 'Purchased' : 'Buy';
    buyButton.disabled = isUnlocked || playerData.silver < price;

    // Add buy event
    if (!isUnlocked) {
      buyButton.addEventListener('click', () => {
        if (spendSilver(price)) {
          unlockTower(towerType);
          shopItem.classList.remove('locked');
          buyButton.textContent = 'Purchased';
          buyButton.disabled = true;
          updateUI();

          // Update upgrades section
          generateUpgradeOptions();
        }
      });
    }

    // Add elements to shop item
    shopItem.appendChild(towerImage);
    shopItem.appendChild(towerName);
    shopItem.appendChild(towerDesc);
    shopItem.appendChild(towerPrice);
    shopItem.appendChild(buyButton);

    // Add to container
    shopContainer.appendChild(shopItem);
  });
}

// Generate upgrade options
// Spend silver and return true if successful
function spendSilver(amount) {
  if (playerData.silver >= amount) {
    playerData.silver -= amount;
    savePlayerData();
    updateSilverDisplay();
    return true;
  }
  return false;
}

// Update silver display in all relevant elements
function updateSilverDisplay() {
  // Update main silver display
  const silverAmount = document.getElementById('silver-amount');
  if (silverAmount) {
    silverAmount.textContent = playerData.silver;
  }

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

  // Update inventory silver display
  const inventorySilverAmount = document.getElementById('inventory-silver-amount');
  if (inventorySilverAmount) {
    inventorySilverAmount.textContent = playerData.silver;
  }
}

// Get the number of unlocked towers
function getUnlockedTowerCount() {
  return playerData.unlockedTowers.length;
}

// Get the total number of towers
function getTotalTowerCount() {
  return Object.keys(playerData.towerPrices).length;
}

// Generate inventory content
function generateInventoryContent() {
  // Generate towers inventory
  generateTowersInventory();

  // Populate tower select dropdown for variants inventory
  const inventoryTowerSelect = document.getElementById('inventory-tower-select');
  if (inventoryTowerSelect) {
    inventoryTowerSelect.innerHTML = '';

    // Only show unlocked towers
    playerData.unlockedTowers.forEach(towerType => {
      const option = document.createElement('option');
      option.value = towerType;
      option.textContent = towerStats[towerType]?.name || towerType;
      inventoryTowerSelect.appendChild(option);
    });

    // Add change event listener
    inventoryTowerSelect.addEventListener('change', updateVariantsInventory);

    // Generate variants for the first tower
    updateVariantsInventory();
  }
}

// Generate towers inventory
function generateTowersInventory() {
  const towersInventory = document.getElementById('towers-inventory');
  if (!towersInventory) return;

  // Clear existing content
  towersInventory.innerHTML = '';

  // Add only unlocked towers
  playerData.unlockedTowers.forEach(towerType => {
    const towerData = towerStats[towerType];
    if (!towerData) return; // Skip if tower data doesn't exist

    // Create inventory item
    const inventoryItem = document.createElement('div');
    inventoryItem.className = `inventory-item ${towerData.tier}`;

    // Create tower image container
    const imageContainer = document.createElement('div');
    imageContainer.className = `inventory-item-image ${towerData.tier}`;

    // Create canvas for tower image
    const towerCanvas = document.createElement('canvas');
    towerCanvas.width = 60;
    towerCanvas.height = 60;
    const ctx = towerCanvas.getContext('2d');

    // Draw tower
    drawTower(ctx, towerType, towerData);

    imageContainer.appendChild(towerCanvas);

    // Create tower name
    const towerName = document.createElement('div');
    towerName.className = 'inventory-item-name';
    towerName.textContent = towerData.name || towerType;

    // Create tower tier
    const towerTier = document.createElement('div');
    towerTier.className = `inventory-item-tier ${towerData.tier}`;
    towerTier.textContent = capitalizeFirstLetter(towerData.tier);

    // Create tower description
    const towerDesc = document.createElement('div');
    towerDesc.className = 'inventory-item-description';
    towerDesc.textContent = towerData.description || '';

    // Add elements to inventory item
    inventoryItem.appendChild(imageContainer);
    inventoryItem.appendChild(towerName);
    inventoryItem.appendChild(towerTier);
    inventoryItem.appendChild(towerDesc);

    // Add to inventory grid
    towersInventory.appendChild(inventoryItem);
  });
}

// Update variants inventory based on selected tower
function updateVariantsInventory() {
  const variantsInventory = document.getElementById('variants-inventory');
  const inventoryTowerSelect = document.getElementById('inventory-tower-select');
  if (!variantsInventory || !inventoryTowerSelect) return;

  // Get selected tower
  const selectedTower = inventoryTowerSelect.value;
  if (!selectedTower) return;

  // Clear existing content
  variantsInventory.innerHTML = '';

  // Get unlocked variants for this tower
  const unlockedVariants = playerData.towerVariants[selectedTower] || [];

  // If no variants are unlocked, show a message
  if (unlockedVariants.length === 0) {
    const noVariantsMessage = document.createElement('div');
    noVariantsMessage.className = 'no-variants-message';
    noVariantsMessage.textContent = 'No variants unlocked for this tower yet. Use the gacha to unlock variants.';
    variantsInventory.appendChild(noVariantsMessage);
    return;
  }

  // Add only unlocked variants
  unlockedVariants.forEach(variantType => {
    const variantData = towerVariants[variantType];
    if (!variantData) return; // Skip if variant data doesn't exist

    // Create inventory item
    const inventoryItem = document.createElement('div');
    inventoryItem.className = `inventory-item ${variantData.tier}`;

    // Create variant image container
    const imageContainer = document.createElement('div');
    imageContainer.className = `inventory-item-image ${variantData.tier}`;

    // Create canvas for variant image
    const variantCanvas = document.createElement('canvas');
    variantCanvas.width = 60;
    variantCanvas.height = 60;
    const ctx = variantCanvas.getContext('2d');

    // Draw variant
    drawTowerWithVariant(ctx, selectedTower, towerStats[selectedTower], variantType, variantData);

    imageContainer.appendChild(variantCanvas);

    // Create variant name
    const variantName = document.createElement('div');
    variantName.className = 'inventory-item-name';
    variantName.textContent = variantData.name || variantType;

    // Create variant tier
    const variantTier = document.createElement('div');
    variantTier.className = `inventory-item-tier ${variantData.tier}`;
    variantTier.textContent = capitalizeFirstLetter(variantData.tier);

    // Create variant description
    const variantDesc = document.createElement('div');
    variantDesc.className = 'inventory-item-description';
    variantDesc.textContent = variantData.description || '';

    // Add elements to inventory item
    inventoryItem.appendChild(imageContainer);
    inventoryItem.appendChild(variantName);
    inventoryItem.appendChild(variantTier);
    inventoryItem.appendChild(variantDesc);

    // Add to inventory grid
    variantsInventory.appendChild(inventoryItem);
  });
}

// Helper function to draw a tower on canvas
function drawTower(ctx, _towerType, towerData) {
  // Base
  ctx.fillStyle = '#555';
  ctx.beginPath();
  ctx.arc(30, 40, 10, 0, Math.PI * 2);
  ctx.fill();

  // Tower body
  ctx.fillStyle = towerData.color || '#4CAF50';
  ctx.fillRect(22, 15, 16, 25);

  // Tower top
  ctx.beginPath();
  ctx.arc(30, 15, 8, 0, Math.PI * 2);
  ctx.fill();
}

// Helper function to draw a locked tower silhouette
function drawLockedTower(ctx) {
  // Draw silhouette
  ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
  ctx.beginPath();
  ctx.arc(30, 40, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(22, 15, 16, 25);
  ctx.beginPath();
  ctx.arc(30, 15, 8, 0, Math.PI * 2);
  ctx.fill();

  // Draw lock
  ctx.strokeStyle = '#aaa';
  ctx.lineWidth = 2;

  // Lock body
  ctx.fillStyle = '#ccc';
  ctx.fillRect(25, 25, 10, 8);

  // Lock shackle
  ctx.beginPath();
  ctx.arc(30, 25, 5, Math.PI, Math.PI * 2);
  ctx.stroke();
}

// Helper function to draw a tower with variant
function drawTowerWithVariant(ctx, _towerType, towerData, _variantType, variantData) {
  // Base
  ctx.fillStyle = '#555';
  ctx.beginPath();
  ctx.arc(30, 40, 10, 0, Math.PI * 2);
  ctx.fill();

  // Tower body
  ctx.fillStyle = towerData.color || '#4CAF50';
  ctx.fillRect(22, 15, 16, 25);

  // Tower top with variant color
  ctx.fillStyle = variantData.color || '#FFD700';
  ctx.beginPath();
  ctx.arc(30, 15, 8, 0, Math.PI * 2);
  ctx.fill();
}

// Helper function to draw a locked variant silhouette
function drawLockedVariant(ctx) {
  // Draw silhouette
  ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
  ctx.beginPath();
  ctx.arc(30, 40, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(22, 15, 16, 25);
  ctx.beginPath();
  ctx.arc(30, 15, 8, 0, Math.PI * 2);
  ctx.fill();

  // Draw question mark
  ctx.fillStyle = '#ccc';
  ctx.font = 'bold 20px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('?', 30, 30);
}

// Helper function to capitalize first letter
function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

// Populate tower select dropdown for variants
function populateVariantTowerSelect() {
  const variantTowerSelect = document.getElementById('variant-tower-select');
  if (!variantTowerSelect) return;

  // Clear existing options
  variantTowerSelect.innerHTML = '';

  // Only show unlocked towers
  playerData.unlockedTowers.forEach(towerType => {
    const option = document.createElement('option');
    option.value = towerType;
    option.textContent = towerStats[towerType]?.name || towerType;
    variantTowerSelect.appendChild(option);
  });
}

// Update pity progress bars
function updatePityProgressBars(type) {
  const pityCounters = gachaSystem.pityCounter[type];
  const pityThresholds = gachaSystem.pity[type];

  // Update each pity progress bar
  for (const tier in pityCounters) {
    const progressBar = document.getElementById(`${type}-${tier}-pity`);
    if (progressBar) {
      const percentage = (pityCounters[tier] / pityThresholds[tier]) * 100;
      progressBar.style.width = `${Math.min(percentage, 100)}%`;
    }
  }
}

// Setup gacha system event listeners
function setupGachaEventListeners() {
  // Check if tower gacha elements exist
  const rollTower1 = document.getElementById('roll-tower-1');
  const rollTower10 = document.getElementById('roll-tower-10');
  const rollTower100 = document.getElementById('roll-tower-100');
  const closeTowerGacha = document.getElementById('close-tower-gacha');
  const towerResult = document.getElementById('tower-result');

  // Check if variant gacha elements exist
  const rollVariant1 = document.getElementById('roll-variant-1');
  const rollVariant10 = document.getElementById('roll-variant-10');
  const rollVariant100 = document.getElementById('roll-variant-100');
  const closeVariantGacha = document.getElementById('close-variant-gacha');
  const variantResult = document.getElementById('variant-result');

  // Tower roll buttons
  if (rollTower1) {
    rollTower1.addEventListener('click', () => {
      // Check if button is on cooldown
      if (rollTower1.classList.contains('cooldown')) return;

      if (spendSilver(gachaSystem.costs.tower.single)) {
        // Start cooldown
        gachaSystem.startCooldown('tower', 1);

        // Roll tower
        const tower = gachaSystem.rollTower();
        const tier = towerStats[tower].tier;

        // Play animation for rare and above
        if (tier !== 'common') {
          const animationDuration = gachaSystem.playAnimation(tier, towerResult);

          // Delay displaying result until animation is complete
          setTimeout(() => {
            displayTowerResult(tower, towerResult);
            updateSilverDisplay();
            updatePityProgressBars('tower');
          }, animationDuration);
        } else {
          // Display result immediately for common
          displayTowerResult(tower, towerResult);
          updateSilverDisplay();
          updatePityProgressBars('tower');
        }
      } else {
        alert('Not enough silver!');
      }
    });
  }

  if (rollTower10) {
    rollTower10.addEventListener('click', () => {
      // Check if button is on cooldown
      if (rollTower10.classList.contains('cooldown')) return;

      if (spendSilver(gachaSystem.costs.tower.ten)) {
        // Start cooldown
        gachaSystem.startCooldown('tower', 10);

        // Roll towers
        const towers = gachaSystem.rollTowers(10);

        // Find highest tier
        let highestTier = 'common';
        const tierOrder = ['common', 'rare', 'epic', 'legendary', 'mythic', 'divine'];

        towers.forEach(tower => {
          const tier = towerStats[tower].tier;
          if (tierOrder.indexOf(tier) > tierOrder.indexOf(highestTier)) {
            highestTier = tier;
          }
        });

        // Play animation for rare and above
        if (highestTier !== 'common') {
          const animationDuration = gachaSystem.playAnimation(highestTier, towerResult);

          // Delay displaying results until animation is complete
          setTimeout(() => {
            displayTowerResults(towers, towerResult);
            updateSilverDisplay();
            updatePityProgressBars('tower');
          }, animationDuration);
        } else {
          // Display results immediately for common
          displayTowerResults(towers, towerResult);
          updateSilverDisplay();
          updatePityProgressBars('tower');
        }
      } else {
        alert('Not enough silver!');
      }
    });
  }

  if (rollTower100) {
    rollTower100.addEventListener('click', () => {
      // Check if button is on cooldown
      if (rollTower100.classList.contains('cooldown')) return;

      if (spendSilver(gachaSystem.costs.tower.hundred)) {
        // Start cooldown
        gachaSystem.startCooldown('tower', 100);

        // Roll towers
        const towers = gachaSystem.rollTowers(100);

        // Find highest tier
        let highestTier = 'common';
        const tierOrder = ['common', 'rare', 'epic', 'legendary', 'mythic', 'divine'];

        towers.forEach(tower => {
          const tier = towerStats[tower].tier;
          if (tierOrder.indexOf(tier) > tierOrder.indexOf(highestTier)) {
            highestTier = tier;
          }
        });

        // Play animation for rare and above
        if (highestTier !== 'common') {
          const animationDuration = gachaSystem.playAnimation(highestTier, towerResult);

          // Delay displaying results until animation is complete
          setTimeout(() => {
            displayTowerResults(towers, towerResult);
            updateSilverDisplay();
            updatePityProgressBars('tower');
          }, animationDuration);
        } else {
          // Display results immediately for common
          displayTowerResults(towers, towerResult);
          updateSilverDisplay();
          updatePityProgressBars('tower');
        }
      } else {
        alert('Not enough silver!');
      }
    });
  }

  // Variant roll buttons
  if (rollVariant1) {
    rollVariant1.addEventListener('click', () => {
      // Check if button is on cooldown
      if (rollVariant1.classList.contains('cooldown')) return;

      const selectedTower = document.getElementById('variant-tower-select')?.value || 'basic';
      if (spendSilver(gachaSystem.costs.variant.single)) {
        // Start cooldown
        gachaSystem.startCooldown('variant', 1);

        // Roll variant
        const variant = gachaSystem.rollVariant(selectedTower);
        if (variant) {
          const tier = towerVariants[variant].tier;

          // Play animation for rare and above
          if (tier !== 'common') {
            const animationDuration = gachaSystem.playAnimation(tier, variantResult, variant);

            // Delay displaying result until animation is complete
            setTimeout(() => {
              displayVariantResult(variant, selectedTower, variantResult);
              updateSilverDisplay();
              updatePityProgressBars('variant');
            }, animationDuration);
          } else {
            // Display result immediately for common
            displayVariantResult(variant, selectedTower, variantResult);
            updateSilverDisplay();
            updatePityProgressBars('variant');
          }
        }
      } else {
        alert('Not enough silver!');
      }
    });
  }

  if (rollVariant10) {
    rollVariant10.addEventListener('click', () => {
      // Check if button is on cooldown
      if (rollVariant10.classList.contains('cooldown')) return;

      const selectedTower = document.getElementById('variant-tower-select')?.value || 'basic';
      if (spendSilver(gachaSystem.costs.variant.ten)) {
        // Start cooldown
        gachaSystem.startCooldown('variant', 10);

        // Roll variants
        const variants = gachaSystem.rollVariants(10, selectedTower);
        if (variants.length > 0) {
          // Find highest tier
          let highestTier = 'common';
          const tierOrder = ['common', 'rare', 'epic', 'legendary', 'divine'];

          variants.forEach(variant => {
            const tier = towerVariants[variant].tier;
            if (tierOrder.indexOf(tier) > tierOrder.indexOf(highestTier)) {
              highestTier = tier;
            }
          });

          // Play animation for rare and above
          if (highestTier !== 'common') {
            // Find a variant of the highest tier to use for the animation
            const highestVariant = variants.find(v => towerVariants[v].tier === highestTier) || variants[0];
            const animationDuration = gachaSystem.playAnimation(highestTier, variantResult, highestVariant);

            // Delay displaying results until animation is complete
            setTimeout(() => {
              displayVariantResults(variants, selectedTower, variantResult);
              updateSilverDisplay();
              updatePityProgressBars('variant');
            }, animationDuration);
          } else {
            // Display results immediately for common
            displayVariantResults(variants, selectedTower, variantResult);
            updateSilverDisplay();
            updatePityProgressBars('variant');
          }
        }
      } else {
        alert('Not enough silver!');
      }
    });
  }

  if (rollVariant100) {
    rollVariant100.addEventListener('click', () => {
      // Check if button is on cooldown
      if (rollVariant100.classList.contains('cooldown')) return;

      const selectedTower = document.getElementById('variant-tower-select')?.value || 'basic';
      if (spendSilver(gachaSystem.costs.variant.hundred)) {
        // Start cooldown
        gachaSystem.startCooldown('variant', 100);

        // Roll variants
        const variants = gachaSystem.rollVariants(100, selectedTower);
        if (variants.length > 0) {
          // Find highest tier
          let highestTier = 'common';
          const tierOrder = ['common', 'rare', 'epic', 'legendary', 'divine'];

          variants.forEach(variant => {
            const tier = towerVariants[variant].tier;
            if (tierOrder.indexOf(tier) > tierOrder.indexOf(highestTier)) {
              highestTier = tier;
            }
          });

          // Play animation for rare and above
          if (highestTier !== 'common') {
            // Find a variant of the highest tier to use for the animation
            const highestVariant = variants.find(v => towerVariants[v].tier === highestTier) || variants[0];
            const animationDuration = gachaSystem.playAnimation(highestTier, variantResult, highestVariant);

            // Delay displaying results until animation is complete
            setTimeout(() => {
              displayVariantResults(variants, selectedTower, variantResult);
              updateSilverDisplay();
              updatePityProgressBars('variant');
            }, animationDuration);
          } else {
            // Display results immediately for common
            displayVariantResults(variants, selectedTower, variantResult);
            updateSilverDisplay();
            updatePityProgressBars('variant');
          }
        }
      } else {
        alert('Not enough silver!');
      }
    });
  }

  // Close tower gacha button
  if (closeTowerGacha) {
    closeTowerGacha.addEventListener('click', () => {
      const towerGachaModal = document.getElementById('tower-gacha-modal');
      if (towerGachaModal) {
        towerGachaModal.classList.remove('active');
      }
    });
  }

  // Close variant gacha button
  if (closeVariantGacha) {
    closeVariantGacha.addEventListener('click', () => {
      const variantGachaModal = document.getElementById('variant-gacha-modal');
      if (variantGachaModal) {
        variantGachaModal.classList.remove('active');
      }
    });
  }

  // Close inventory button
  const closeInventory = document.getElementById('close-inventory');
  if (closeInventory) {
    closeInventory.addEventListener('click', () => {
      const inventoryModal = document.getElementById('inventory-modal');
      if (inventoryModal) {
        inventoryModal.classList.remove('active');
      }
    });
  }

  // Inventory tab switching
  const inventoryTabs = document.querySelectorAll('.inventory-tab');
  if (inventoryTabs.length > 0) {
    inventoryTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        // Remove active class from all tabs
        inventoryTabs.forEach(t => t.classList.remove('active'));
        // Add active class to clicked tab
        tab.classList.add('active');

        // Hide all tab content
        document.querySelectorAll('.inventory-tab-content').forEach(content => {
          content.classList.remove('active');
        });

        // Show the corresponding tab content
        const tabId = tab.dataset.tab;
        const tabContent = document.getElementById(tabId);
        if (tabContent) {
          tabContent.classList.add('active');

          // If variants tab is selected, update the variants display
          if (tabId === 'variants-tab') {
            updateVariantsInventory();
          }
        }
      });
    });
  }

  // Update silver display
  updateSilverDisplay();

  // Initialize pity progress bars
  updatePityProgressBars('tower');
  updatePityProgressBars('variant');
}

// Display a single tower result
function displayTowerResult(tower, resultElement) {
  if (!resultElement) return;

  // Clear previous results
  resultElement.innerHTML = '';

  // Create canvas for tower image
  const canvas = document.createElement('canvas');
  canvas.width = 120;
  canvas.height = 120;
  const ctx = canvas.getContext('2d');

  // Get tower data
  const towerData = towerStats[tower];

  // Draw tower
  drawLargeTower(ctx, tower, towerData);

  // Create tower info
  const towerInfo = document.createElement('div');
  towerInfo.className = 'gacha-item-info';

  // Tower name with tier
  const towerName = document.createElement('div');
  towerName.className = `gacha-item-name ${towerData.tier}`;
  towerName.textContent = towerData.name || tower;

  // Tower tier
  const towerTier = document.createElement('div');
  towerTier.className = `gacha-item-tier ${towerData.tier}`;
  towerTier.textContent = capitalizeFirstLetter(towerData.tier);

  // Add elements to info
  towerInfo.appendChild(towerName);
  towerInfo.appendChild(towerTier);

  // Add elements to result
  resultElement.appendChild(canvas);
  resultElement.appendChild(towerInfo);
}

// Display multiple tower results
function displayTowerResults(towers, resultElement) {
  if (!resultElement) return;

  // Clear previous results
  resultElement.innerHTML = '';

  // Create result summary
  const resultSummary = document.createElement('div');
  resultSummary.className = 'gacha-result-summary';

  // Count towers by tier
  const tierCounts = {};
  towers.forEach(tower => {
    const tier = towerStats[tower].tier;
    tierCounts[tier] = (tierCounts[tier] || 0) + 1;
  });

  // Create summary text
  const summaryText = document.createElement('div');
  summaryText.className = 'gacha-summary-text';
  summaryText.innerHTML = 'You got:<br>';

  // Add tier counts to summary
  for (const tier of ['divine', 'mythic', 'legendary', 'epic', 'rare', 'common']) {
    if (tierCounts[tier]) {
      const tierSpan = document.createElement('span');
      tierSpan.className = tier;
      tierSpan.textContent = `${tierCounts[tier]} ${capitalizeFirstLetter(tier)}`;
      summaryText.appendChild(tierSpan);
      summaryText.appendChild(document.createElement('br'));
    }
  }

  // Add summary to result
  resultElement.appendChild(summaryText);

  // Display the highest tier tower
  const tiers = ['divine', 'mythic', 'legendary', 'epic', 'rare', 'common'];
  for (const tier of tiers) {
    const towersOfTier = towers.filter(tower => towerStats[tower].tier === tier);
    if (towersOfTier.length > 0) {
      displayTowerResult(towersOfTier[0], resultElement);
      break;
    }
  }
}

// Display a single variant result
function displayVariantResult(variant, towerType, resultElement) {
  if (!resultElement) return;

  // Clear previous results
  resultElement.innerHTML = '';

  // Create canvas for variant image
  const canvas = document.createElement('canvas');
  canvas.width = 120;
  canvas.height = 120;
  const ctx = canvas.getContext('2d');

  // Get variant data
  const variantData = towerVariants[variant];
  const towerData = towerStats[towerType];

  // Draw tower with variant
  drawLargeTowerWithVariant(ctx, towerType, towerData, variant, variantData);

  // Create variant info
  const variantInfo = document.createElement('div');
  variantInfo.className = 'gacha-item-info';

  // Variant name with tier
  const variantName = document.createElement('div');
  variantName.className = `gacha-item-name ${variantData.tier}`;
  variantName.textContent = variantData.name || variant;

  // Variant tier
  const variantTier = document.createElement('div');
  variantTier.className = `gacha-item-tier ${variantData.tier}`;
  variantTier.textContent = capitalizeFirstLetter(variantData.tier);

  // Add elements to info
  variantInfo.appendChild(variantName);
  variantInfo.appendChild(variantTier);

  // Add elements to result
  resultElement.appendChild(canvas);
  resultElement.appendChild(variantInfo);
}

// Display multiple variant results
function displayVariantResults(variants, towerType, resultElement) {
  if (!resultElement) return;

  // Clear previous results
  resultElement.innerHTML = '';

  // Create result summary
  const resultSummary = document.createElement('div');
  resultSummary.className = 'gacha-result-summary';

  // Count variants by tier
  const tierCounts = {};
  variants.forEach(variant => {
    const tier = towerVariants[variant].tier;
    tierCounts[tier] = (tierCounts[tier] || 0) + 1;
  });

  // Create summary text
  const summaryText = document.createElement('div');
  summaryText.className = 'gacha-summary-text';
  summaryText.innerHTML = 'You got:<br>';

  // Add tier counts to summary
  for (const tier of ['divine', 'legendary', 'epic', 'rare', 'common']) {
    if (tierCounts[tier]) {
      const tierSpan = document.createElement('span');
      tierSpan.className = tier;
      tierSpan.textContent = `${tierCounts[tier]} ${capitalizeFirstLetter(tier)}`;
      summaryText.appendChild(tierSpan);
      summaryText.appendChild(document.createElement('br'));
    }
  }

  // Add summary to result
  resultElement.appendChild(summaryText);

  // Display the highest tier variant
  const tiers = ['divine', 'legendary', 'epic', 'rare', 'common'];
  for (const tier of tiers) {
    const variantsOfTier = variants.filter(variant => towerVariants[variant].tier === tier);
    if (variantsOfTier.length > 0) {
      displayVariantResult(variantsOfTier[0], towerType, resultElement);
      break;
    }
  }
}

// Draw a large tower for gacha result
function drawLargeTower(ctx, _towerType, towerData) {
  // Base
  ctx.fillStyle = '#555';
  ctx.beginPath();
  ctx.arc(60, 80, 20, 0, Math.PI * 2);
  ctx.fill();

  // Tower body
  ctx.fillStyle = towerData.color || '#4CAF50';
  ctx.fillRect(45, 30, 30, 50);

  // Tower top
  ctx.beginPath();
  ctx.arc(60, 30, 15, 0, Math.PI * 2);
  ctx.fill();

  // Add glow effect based on tier
  switch(towerData.tier) {
    case 'divine':
      // Divine tier has a special golden glow with rays
      ctx.shadowColor = '#FFEB3B';
      ctx.shadowBlur = 25;

      // Draw outer glow
      ctx.beginPath();
      ctx.arc(60, 30, 20, 0, Math.PI * 2);
      ctx.strokeStyle = '#FFEB3B';
      ctx.lineWidth = 3;
      ctx.stroke();

      // Draw rays
      for (let i = 0; i < 12; i++) {
        const angle = Math.PI * 2 * (i / 12);
        const innerRadius = 20;
        const outerRadius = 30;

        ctx.beginPath();
        ctx.moveTo(
          60 + Math.cos(angle) * innerRadius,
          30 + Math.sin(angle) * innerRadius
        );
        ctx.lineTo(
          60 + Math.cos(angle) * outerRadius,
          30 + Math.sin(angle) * outerRadius
        );
        ctx.strokeStyle = '#FFEB3B';
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      ctx.shadowBlur = 0;
      break;
    case 'mythic':
      ctx.shadowColor = '#9C27B0';
      ctx.shadowBlur = 20;
      ctx.beginPath();
      ctx.arc(60, 30, 18, 0, Math.PI * 2);
      ctx.strokeStyle = '#9C27B0';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.shadowBlur = 0;
      break;
    case 'legendary':
      ctx.shadowColor = '#FFD700';
      ctx.shadowBlur = 15;
      ctx.beginPath();
      ctx.arc(60, 30, 18, 0, Math.PI * 2);
      ctx.strokeStyle = '#FFD700';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.shadowBlur = 0;
      break;
    case 'epic':
      ctx.shadowColor = '#8A2BE2';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(60, 30, 17, 0, Math.PI * 2);
      ctx.strokeStyle = '#8A2BE2';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.shadowBlur = 0;
      break;
    case 'rare':
      ctx.shadowColor = '#1E90FF';
      ctx.shadowBlur = 5;
      ctx.beginPath();
      ctx.arc(60, 30, 16, 0, Math.PI * 2);
      ctx.strokeStyle = '#1E90FF';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.shadowBlur = 0;
      break;
  }
}

// Draw a large tower with variant for gacha result
function drawLargeTowerWithVariant(ctx, _towerType, towerData, _variantType, variantData) {
  // Base
  ctx.fillStyle = '#555';
  ctx.beginPath();
  ctx.arc(60, 80, 20, 0, Math.PI * 2);
  ctx.fill();

  // Tower body
  ctx.fillStyle = towerData.color || '#4CAF50';
  ctx.fillRect(45, 30, 30, 50);

  // Tower top with variant color
  ctx.fillStyle = variantData.color || '#FFD700';
  ctx.beginPath();
  ctx.arc(60, 30, 15, 0, Math.PI * 2);
  ctx.fill();

  // Add glow effect based on tier
  switch(variantData.tier) {
    case 'divine':
      // Divine tier has a special golden glow with rays
      ctx.shadowColor = '#FFEB3B';
      ctx.shadowBlur = 25;

      // Draw outer glow
      ctx.beginPath();
      ctx.arc(60, 30, 20, 0, Math.PI * 2);
      ctx.strokeStyle = '#FFEB3B';
      ctx.lineWidth = 3;
      ctx.stroke();

      // Draw rays
      for (let i = 0; i < 12; i++) {
        const angle = Math.PI * 2 * (i / 12);
        const innerRadius = 20;
        const outerRadius = 30;

        ctx.beginPath();
        ctx.moveTo(
          60 + Math.cos(angle) * innerRadius,
          30 + Math.sin(angle) * innerRadius
        );
        ctx.lineTo(
          60 + Math.cos(angle) * outerRadius,
          30 + Math.sin(angle) * outerRadius
        );
        ctx.strokeStyle = '#FFEB3B';
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      ctx.shadowBlur = 0;
      break;
    case 'legendary':
      ctx.shadowColor = '#FFD700';
      ctx.shadowBlur = 15;
      ctx.beginPath();
      ctx.arc(60, 30, 18, 0, Math.PI * 2);
      ctx.strokeStyle = '#FFD700';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.shadowBlur = 0;
      break;
    case 'epic':
      ctx.shadowColor = '#8A2BE2';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(60, 30, 17, 0, Math.PI * 2);
      ctx.strokeStyle = '#8A2BE2';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.shadowBlur = 0;
      break;
    case 'rare':
      ctx.shadowColor = '#1E90FF';
      ctx.shadowBlur = 5;
      ctx.beginPath();
      ctx.arc(60, 30, 16, 0, Math.PI * 2);
      ctx.strokeStyle = '#1E90FF';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.shadowBlur = 0;
      break;
  }
}

function generateUpgradeOptions() {
  const upgradesContainer = document.getElementById('tower-upgrades-options');

  // Clear existing options
  upgradesContainer.innerHTML = '';

  // Add upgrade options for unlocked towers
  playerData.unlockedTowers.forEach(towerType => {
    // Get available variants
    const variants = Object.keys(playerData.variantPrices[towerType] || {});

    // Skip if no variants available
    if (variants.length === 0) return;

    variants.forEach(variant => {
      const isUnlocked = isVariantUnlocked(towerType, variant);
      const price = playerData.variantPrices[towerType][variant];

      const upgradeItem = document.createElement('div');
      upgradeItem.className = 'upgrade-item';
      if (!isUnlocked) {
        upgradeItem.classList.add('locked');
      }

      // Create a canvas for the variant image
      const variantImage = document.createElement('canvas');
      variantImage.width = 80;
      variantImage.height = 80;
      const ctx = variantImage.getContext('2d');

      // Get variant-specific color
      let variantColor;
      switch(variant) {
        case 'ice': variantColor = '#29B6F6'; break;
        case 'fire': variantColor = '#F44336'; break;
        case 'poison': variantColor = '#4CAF50'; break;
        case 'gold': variantColor = '#FFC107'; break;
        case 'dragon': variantColor = '#FF5722'; break;
        case 'magma': variantColor = '#E91E63'; break;
        default: variantColor = '#1976D2';
      }

      // Get base tower color
      const towerColor = towerStats[towerType]?.color || '#1976D2';

      // Draw base
      ctx.fillStyle = '#555';
      ctx.beginPath();
      ctx.arc(40, 60, 15, 0, Math.PI * 2);
      ctx.fill();

      // Draw tower based on type with variant color
      switch(towerType) {
        case 'archer':
          // Draw archer tower with variant elements
          // Tower body
          ctx.fillStyle = towerColor;
          ctx.fillRect(30, 15, 20, 40);

          // Variant bow
          ctx.strokeStyle = variantColor;
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(40, 25, 15, Math.PI * 0.25, Math.PI * 0.75, false);
          ctx.stroke();

          // Variant arrow
          ctx.strokeStyle = variantColor;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(40, 25);
          ctx.lineTo(40, 10);
          ctx.stroke();

          // Variant arrowhead
          ctx.fillStyle = variantColor;
          ctx.beginPath();
          ctx.moveTo(40, 5);
          ctx.lineTo(37, 12);
          ctx.lineTo(43, 12);
          ctx.closePath();
          ctx.fill();
          break;

        default:
          // Basic tower with variant elements
          // Tower body
          ctx.fillStyle = towerColor;
          ctx.fillRect(30, 20, 20, 40);

          // Variant top
          ctx.fillStyle = variantColor;
          ctx.beginPath();
          ctx.arc(40, 20, 10, 0, Math.PI * 2);
          ctx.fill();
      }

      // Add variant-specific effects
      switch(variant) {
        case 'ice':
          // Add ice crystals
          ctx.strokeStyle = '#BBDEFB';
          ctx.lineWidth = 1;
          for (let i = 0; i < 6; i++) {
            const angle = Math.PI * 2 * (i / 6);
            const x = 40 + Math.cos(angle) * 25;
            const y = 35 + Math.sin(angle) * 25;

            // Draw snowflake
            for (let j = 0; j < 3; j++) {
              const lineAngle = angle + (j * Math.PI / 3);
              ctx.beginPath();
              ctx.moveTo(x, y);
              ctx.lineTo(
                x + Math.cos(lineAngle) * 5,
                y + Math.sin(lineAngle) * 5
              );
              ctx.stroke();
            }
          }
          break;

        case 'fire':
          // Add flames
          for (let i = 0; i < 5; i++) {
            const angle = Math.PI * 2 * (i / 5);
            const x = 40 + Math.cos(angle) * 20;
            const y = 35 + Math.sin(angle) * 20;

            const flameGradient = ctx.createRadialGradient(x, y, 0, x, y, 8);
            flameGradient.addColorStop(0, '#FFEB3B');
            flameGradient.addColorStop(0.5, '#FF9800');
            flameGradient.addColorStop(1, 'rgba(244, 67, 54, 0)');

            ctx.fillStyle = flameGradient;
            ctx.beginPath();
            ctx.arc(x, y, 8, 0, Math.PI * 2);
            ctx.fill();
          }
          break;

        case 'poison':
          // Add poison bubbles
          ctx.fillStyle = 'rgba(76, 175, 80, 0.5)';
          for (let i = 0; i < 8; i++) {
            const angle = Math.PI * 2 * (i / 8);
            const distance = 15 + Math.random() * 10;
            const x = 40 + Math.cos(angle) * distance;
            const y = 35 + Math.sin(angle) * distance;
            const size = 2 + Math.random() * 4;

            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fill();
          }
          break;

        case 'gold':
          // Add gold sparkles
          ctx.fillStyle = '#FFD700';
          for (let i = 0; i < 8; i++) {
            const angle = Math.PI * 2 * (i / 8);
            const x = 40 + Math.cos(angle) * 20;
            const y = 35 + Math.sin(angle) * 20;

            // Draw star
            ctx.beginPath();
            for (let j = 0; j < 5; j++) {
              const starAngle = angle + (j * Math.PI * 2 / 5);
              const radius = (j % 2 === 0) ? 5 : 2;
              const starX = x + Math.cos(starAngle) * radius;
              const starY = y + Math.sin(starAngle) * radius;

              if (j === 0) {
                ctx.moveTo(starX, starY);
              } else {
                ctx.lineTo(starX, starY);
              }
            }
            ctx.closePath();
            ctx.fill();
          }
          break;

        case 'dragon':
          // Add dragon wings
          ctx.fillStyle = '#FF5722';

          // Left wing
          ctx.beginPath();
          ctx.moveTo(40, 30);
          ctx.quadraticCurveTo(20, 20, 15, 35);
          ctx.quadraticCurveTo(25, 40, 40, 35);
          ctx.closePath();
          ctx.fill();

          // Right wing
          ctx.beginPath();
          ctx.moveTo(40, 30);
          ctx.quadraticCurveTo(60, 20, 65, 35);
          ctx.quadraticCurveTo(55, 40, 40, 35);
          ctx.closePath();
          ctx.fill();
          break;

        case 'magma':
          // Add magma cracks
          ctx.strokeStyle = '#FFEB3B';
          ctx.lineWidth = 2;

          for (let i = 0; i < 5; i++) {
            const startAngle = Math.PI * 2 * (i / 5);
            const startX = 40 + Math.cos(startAngle) * 15;
            const startY = 35 + Math.sin(startAngle) * 15;

            ctx.beginPath();
            ctx.moveTo(startX, startY);

            // Create zigzag crack
            let x = startX;
            let y = startY;
            const endX = 40 + Math.cos(startAngle) * 30;
            const endY = 35 + Math.sin(startAngle) * 30;

            for (let j = 0; j < 3; j++) {
              const midX = x + (endX - x) * (j + 1) / 4;
              const midY = y + (endY - y) * (j + 1) / 4;
              const offset = (j % 2 === 0) ? 5 : -5;
              const perpX = -Math.sin(startAngle) * offset;
              const perpY = Math.cos(startAngle) * offset;

              ctx.lineTo(midX + perpX, midY + perpY);
            }

            ctx.lineTo(endX, endY);
            ctx.stroke();
          }
          break;
      }

      // Add variant name
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 10px Roboto';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText(`${variant.charAt(0).toUpperCase() + variant.slice(1)}`, 40, 78);

      // Add locked overlay if variant is locked
      if (!isUnlocked) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(0, 0, 80, 80);

        // Add lock icon
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;

        // Lock body
        ctx.fillStyle = '#aaa';
        ctx.fillRect(30, 35, 20, 15);

        // Lock shackle
        ctx.beginPath();
        ctx.arc(40, 35, 10, Math.PI, Math.PI * 2);
        ctx.closePath();
        ctx.stroke();
      }

      // Add variant details
      const variantName = document.createElement('h3');
      const towerDisplayName = towerStats[towerType]?.name || towerType.charAt(0).toUpperCase() + towerType.slice(1);
      variantName.textContent = `${variant.charAt(0).toUpperCase() + variant.slice(1)} ${towerDisplayName}`;

      const variantDesc = document.createElement('p');
      variantDesc.textContent = `Special ${variant} variant of the ${towerDisplayName}`;

      const variantPrice = document.createElement('span');
      variantPrice.className = 'price';
      variantPrice.textContent = `${price} Silver`;

      // Add buy/select button
      const actionButton = document.createElement('button');
      actionButton.className = 'buy-btn';

      if (isUnlocked) {
        const isSelected = playerData.selectedVariants[towerType] === variant;
        actionButton.textContent = isSelected ? 'Selected' : 'Select';
        actionButton.disabled = isSelected;

        // Add select event
        if (!isSelected) {
          actionButton.addEventListener('click', () => {
            selectVariant(towerType, variant);

            // Update all buttons for this tower type
            document.querySelectorAll(`.upgrade-item[data-tower="${towerType}"] .buy-btn`).forEach(btn => {
              btn.textContent = 'Select';
              btn.disabled = false;
            });

            actionButton.textContent = 'Selected';
            actionButton.disabled = true;
          });
        }
      } else {
        actionButton.textContent = 'Buy';
        actionButton.disabled = playerData.silver < price;

        // Add buy event
        actionButton.addEventListener('click', () => {
          if (spendSilver(price)) {
            unlockVariant(towerType, variant);
            upgradeItem.classList.remove('locked');
            actionButton.textContent = 'Select';
            actionButton.disabled = false;
            updateUI();

            // Add select event after purchase
            actionButton.addEventListener('click', () => {
              selectVariant(towerType, variant);

              // Update all buttons for this tower type
              document.querySelectorAll(`.upgrade-item[data-tower="${towerType}"] .buy-btn`).forEach(btn => {
                btn.textContent = 'Select';
                btn.disabled = false;
              });

              actionButton.textContent = 'Selected';
              actionButton.disabled = true;
            });
          }
        });
      }

      // Add data attribute for tower type
      upgradeItem.dataset.tower = towerType;

      // Add elements to upgrade item
      upgradeItem.appendChild(variantImage);
      upgradeItem.appendChild(variantName);
      upgradeItem.appendChild(variantDesc);
      upgradeItem.appendChild(variantPrice);
      upgradeItem.appendChild(actionButton);

      // Add to container
      upgradesContainer.appendChild(upgradeItem);
    });
  });

  // Add message if no upgrades available
  if (upgradesContainer.children.length === 0) {
    const message = document.createElement('p');
    message.textContent = 'No tower upgrades available. Purchase towers in the shop first.';
    message.style.textAlign = 'center';
    message.style.gridColumn = '1 / -1';
    upgradesContainer.appendChild(message);
  }
}
