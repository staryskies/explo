/**
 * Game upgrades and tower management extensions
 */
// Log that gameUpgrades.js is loaded
console.log('Game upgrades loaded');

// Extend the Game class with upgrade functionality
Game.prototype.initializeUpgradeSystem = function() {
  // Selected tower for upgrades
  this.selectedTowerForUpgrade = null;
  
  // Initialize map selector
  this.initializeMapSelector();
  
  // Add event listeners for the upgrade menu
  this.setupUpgradeEventListeners();
};

// Initialize the map selector
Game.prototype.initializeMapSelector = function() {
  // Current map template
  this.currentMapTemplate = mapTemplates[0]; // Default to first map
  
  // Generate map options
  const mapOptionsContainer = document.getElementById('map-options');
  mapTemplates.forEach((template, index) => {
    const mapOption = document.createElement('div');
    mapOption.className = 'map-option';
    if (index === 0) mapOption.classList.add('selected');
    mapOption.dataset.mapId = template.id;
    
    const difficultyClass = template.difficulty.toLowerCase().replace(' ', '-');
    
    mapOption.innerHTML = `
      <h4>${template.name}</h4>
      <p>${template.description}</p>
      <span class="difficulty ${difficultyClass}">${template.difficulty}</span>
    `;
    
    mapOption.addEventListener('click', () => {
      // Remove selected class from all options
      document.querySelectorAll('.map-option').forEach(option => {
        option.classList.remove('selected');
      });
      
      // Add selected class to clicked option
      mapOption.classList.add('selected');
      
      // Set current map template
      this.currentMapTemplate = template;
      
      // Change the map
      this.changeMap(template);
    });
    
    mapOptionsContainer.appendChild(mapOption);
  });
  
  // Add event listeners for map selector
  document.getElementById('openMapSelector').addEventListener('click', () => {
    document.getElementById('map-selector').classList.add('active');
  });
  
  document.getElementById('closeMapSelector').addEventListener('click', () => {
    document.getElementById('map-selector').classList.remove('active');
  });
};

// Change the map based on the selected template
Game.prototype.changeMap = function(mapTemplate) {
  console.log(`Changing map to ${mapTemplate.name}`);
  
  // Reset game state
  this.towers = [];
  this.enemies = [];
  this.projectiles = [];
  this.gold = 100;
  this.lives = 10;
  this.score = 0;
  this.wave = 1;
  this.waveInProgress = false;
  this.gameOver = false;
  
  // Create a new map with the selected template
  this.map = new GameMap(this.canvas, this.ctx, mapTemplate);
  
  // Close the map selector
  document.getElementById('map-selector').classList.remove('active');
  
  // Update UI
  this.updateUI();
  
  // Draw the new map
  this.draw();
};

// Set up event listeners for the upgrade menu
Game.prototype.setupUpgradeEventListeners = function() {
  // Close upgrade menu
  document.getElementById('closeUpgradeMenu').addEventListener('click', () => {
    document.getElementById('upgrade-menu').classList.remove('active');
    this.selectedTowerForUpgrade = null;
  });
  
  // Sell tower
  document.getElementById('sellTower').addEventListener('click', () => {
    if (this.selectedTowerForUpgrade) {
      // Get the sell value
      const sellValue = this.selectedTowerForUpgrade.getSellValue();
      
      // Add gold
      this.gold += sellValue;
      
      // Remove tower from the array
      this.towers = this.towers.filter(tower => tower !== this.selectedTowerForUpgrade);
      
      // Close the upgrade menu
      document.getElementById('upgrade-menu').classList.remove('active');
      this.selectedTowerForUpgrade = null;
      
      // Update UI
      this.updateUI();
      
      console.log(`Tower sold for ${sellValue} gold`);
    }
  });
  
  // Upgrade buttons
  document.querySelectorAll('.upgrade-btn').forEach(button => {
    button.addEventListener('click', (e) => {
      const path = e.target.dataset.path;
      const level = parseInt(e.target.dataset.level);
      
      if (this.selectedTowerForUpgrade) {
        // Get the upgrade cost
        const cost = this.selectedTowerForUpgrade.getUpgradeCost(path, level);
        
        // Check if player has enough gold
        if (this.gold >= cost) {
          // Upgrade the tower
          const success = this.selectedTowerForUpgrade.upgrade(path, level);
          
          if (success) {
            // Deduct gold
            this.gold -= cost;
            
            // Update the upgrade menu
            this.updateUpgradeMenu();
            
            // Update UI
            this.updateUI();
            
            console.log(`Tower upgraded: Path ${path}, Level ${level}`);
          }
        } else {
          console.log(`Not enough gold for upgrade. Need ${cost}, have ${this.gold}`);
        }
      }
    });
  });
};

// Select a tower for upgrade
Game.prototype.selectTowerForUpgrade = function(tower) {
  this.selectedTowerForUpgrade = tower;
  
  // Update the upgrade menu
  this.updateUpgradeMenu();
  
  // Show the upgrade menu
  document.getElementById('upgrade-menu').classList.add('active');
};

// Update the upgrade menu with the selected tower's information
Game.prototype.updateUpgradeMenu = function() {
  if (!this.selectedTowerForUpgrade) return;
  
  const tower = this.selectedTowerForUpgrade;
  
  // Update tower info
  document.getElementById('upgrade-tower-name').textContent = tower.name;
  document.getElementById('tower-level').textContent = tower.level;
  document.getElementById('tower-damage').textContent = tower.damage;
  document.getElementById('tower-range').textContent = tower.range;
  document.getElementById('tower-fire-rate').textContent = tower.fireRate.toFixed(2);
  document.getElementById('tower-special').textContent = tower.ability;
  
  // Get upgrade paths
  const towerType = tower.type;
  const pathA = towerUpgrades[towerType]?.pathA;
  const pathB = towerUpgrades[towerType]?.pathB;
  
  // Update path A
  if (pathA) {
    document.getElementById('path-a-name').textContent = pathA.name;
    document.getElementById('path-a-desc').textContent = pathA.description;
    
    // Update upgrade buttons for path A
    const pathALevel = tower.pathALevel;
    const pathAButtons = document.querySelectorAll('#path-a .upgrade-btn');
    
    pathAButtons.forEach((button, index) => {
      const level = index + 1;
      const upgradeData = pathA.upgrades[index];
      
      // Disable buttons for levels already upgraded
      if (level <= pathALevel) {
        button.disabled = true;
        button.textContent = `Level ${level} (Purchased)`;
      } 
      // Enable the next level button if it's the next one to upgrade
      else if (level === pathALevel + 1) {
        button.disabled = false;
        button.textContent = `Level ${level} ($${upgradeData.cost})`;
        
        // Disable if not enough gold
        if (this.gold < upgradeData.cost) {
          button.disabled = true;
        }
      } 
      // Disable future levels
      else {
        button.disabled = true;
        button.textContent = `Level ${level} ($${upgradeData.cost})`;
      }
    });
  }
  
  // Update path B
  if (pathB) {
    document.getElementById('path-b-name').textContent = pathB.name;
    document.getElementById('path-b-desc').textContent = pathB.description;
    
    // Update upgrade buttons for path B
    const pathBLevel = tower.pathBLevel;
    const pathBButtons = document.querySelectorAll('#path-b .upgrade-btn');
    
    pathBButtons.forEach((button, index) => {
      const level = index + 1;
      const upgradeData = pathB.upgrades[index];
      
      // Disable buttons for levels already upgraded
      if (level <= pathBLevel) {
        button.disabled = true;
        button.textContent = `Level ${level} (Purchased)`;
      } 
      // Enable the next level button if it's the next one to upgrade
      else if (level === pathBLevel + 1) {
        button.disabled = false;
        button.textContent = `Level ${level} ($${upgradeData.cost})`;
        
        // Disable if not enough gold
        if (this.gold < upgradeData.cost) {
          button.disabled = true;
        }
      } 
      // Disable future levels
      else {
        button.disabled = true;
        button.textContent = `Level ${level} ($${upgradeData.cost})`;
      }
    });
  }
};
