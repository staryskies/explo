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
  
  // Generate map options
  generateMapOptions();
  
  // Generate shop options
  generateShopOptions();
  
  // Generate upgrade options
  generateUpgradeOptions();
});

// Update UI with player data
function updateUI() {
  // Update silver display
  document.getElementById('silver-amount').textContent = playerData.silver;
  document.getElementById('shop-silver-amount').textContent = playerData.silver;
  document.getElementById('upgrades-silver-amount').textContent = playerData.silver;
  
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
  
  // Shop button
  document.getElementById('shop-button').addEventListener('click', () => {
    document.getElementById('tower-shop-modal').classList.add('active');
  });
  
  // Upgrades button
  document.getElementById('upgrades-button').addEventListener('click', () => {
    document.getElementById('tower-upgrades-modal').classList.add('active');
  });
  
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
  
  // Start game button
  document.getElementById('start-game-btn').addEventListener('click', () => {
    const selectedMap = document.querySelector('.map-option.selected');
    if (selectedMap) {
      const mapId = selectedMap.dataset.mapId;
      // Store selected map in session storage
      sessionStorage.setItem('selectedMap', mapId);
      // Navigate to game.html
      window.location.href = 'game.html';
    } else {
      alert('Please select a map first');
    }
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
    
    // Add map image (placeholder)
    const mapImage = document.createElement('img');
    mapImage.src = `assets/maps/${map.id}.jpg`;
    mapImage.alt = map.name;
    mapImage.onerror = function() {
      this.src = 'assets/maps/placeholder.jpg';
    };
    
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
    
    // Add tower image (placeholder)
    const towerImage = document.createElement('img');
    towerImage.src = `assets/towers/${towerType}.png`;
    towerImage.alt = towerType;
    towerImage.onerror = function() {
      this.src = 'assets/towers/placeholder.png';
    };
    
    // Add tower details
    const towerName = document.createElement('h3');
    towerName.textContent = towerStats[towerType].name;
    
    const towerDesc = document.createElement('p');
    towerDesc.textContent = towerStats[towerType].description;
    
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
      
      // Add variant image (placeholder)
      const variantImage = document.createElement('img');
      variantImage.src = `assets/variants/${towerType}_${variant}.png`;
      variantImage.alt = `${variant} ${towerType}`;
      variantImage.onerror = function() {
        this.src = 'assets/variants/placeholder.png';
      };
      
      // Add variant details
      const variantName = document.createElement('h3');
      variantName.textContent = `${variant.charAt(0).toUpperCase() + variant.slice(1)} ${towerStats[towerType].name}`;
      
      const variantDesc = document.createElement('p');
      variantDesc.textContent = `Special ${variant} variant of the ${towerStats[towerType].name}`;
      
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
