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

  // Create animated stars in the background
  createStars();
});

// Create animated stars in the background
function createStars() {
  const container = document.getElementById('main-menu-container');
  const starCount = 100;

  for (let i = 0; i < starCount; i++) {
    const star = document.createElement('div');
    star.className = 'star';

    // Random position
    star.style.left = `${Math.random() * 100}%`;
    star.style.top = `${Math.random() * 100}%`;

    // Random size (1-3px)
    const size = 1 + Math.random() * 2;
    star.style.width = `${size}px`;
    star.style.height = `${size}px`;

    // Random animation delay
    star.style.animationDelay = `${Math.random() * 3}s`;

    container.appendChild(star);
  }
}

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
