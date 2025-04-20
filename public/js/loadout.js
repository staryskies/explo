/**
 * Loadout selection functionality for the tower defense game
 */
// Log that loadout.js is loaded
console.log('Loadout selection loaded');

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
  console.log('Loadout DOM loaded');

  // Create animated stars in the background
  createStars();

  // Initialize the loadout system
  initializeLoadout();

  // Add event listeners
  setupEventListeners();
});

// Create animated stars in the background
function createStars() {
  // Use document.body as the container to make stars appear on all screens
  const container = document.body;
  const starCount = 150;

  for (let i = 0; i < starCount; i++) {
    const star = document.createElement('div');
    star.className = 'star';

    // Random position
    star.style.left = `${Math.random() * 100}%`;
    star.style.top = `${Math.random() * 100}%`;

    // Random size and opacity
    const size = Math.random() * 3 + 1;
    star.style.width = `${size}px`;
    star.style.height = `${size}px`;

    // Random animation duration and delay
    const duration = Math.random() * 3 + 2;
    star.style.setProperty('--duration', `${duration}s`);
    star.style.animationDelay = `${Math.random() * 5}s`;

    // Random opacity
    const opacity = Math.random() * 0.5 + 0.3;
    star.style.setProperty('--opacity', opacity);
    star.style.setProperty('--opacity-half', opacity / 2);

    // Random scale
    const scale = Math.random() * 0.5 + 1.2;
    star.style.setProperty('--scale', scale);

    // Random z-index to create depth
    star.style.zIndex = Math.floor(Math.random() * 20);

    container.appendChild(star);
  }
}

// Initialize the loadout system
function initializeLoadout() {
  // Get the selected difficulty from session storage
  const selectedDifficulty = sessionStorage.getItem('selectedDifficulty');
  if (!selectedDifficulty) {
    alert('No difficulty selected. Redirecting to difficulty selection.');
    window.location.href = 'difficulty.html';
    return;
  }

  // Get the selected map from session storage
  const selectedMap = sessionStorage.getItem('selectedMap');
  if (!selectedMap) {
    alert('No map selected. Redirecting to map selection.');
    window.location.href = 'index.html';
    return;
  }

  // Initialize the selected towers array (max 4 towers)
  window.selectedTowers = [];

  // Populate available towers
  populateAvailableTowers();

  // Update the start button state
  updateStartButtonState();
}

// Populate available towers
function populateAvailableTowers() {
  const availableTowersContainer = document.getElementById('available-towers');

  // Clear existing content
  availableTowersContainer.innerHTML = '';

  // Get only unlocked tower types from playerData
  const towerTypes = playerData.unlockedTowers;

  // Create a tower option for each unlocked tower type
  towerTypes.forEach(towerType => {
    const towerData = towerStats[towerType];
    if (!towerData) return; // Skip if tower data doesn't exist

    // Create tower option element
    const towerOption = document.createElement('div');
    towerOption.className = 'tower-option';
    towerOption.dataset.type = towerType;

    // Create tower icon
    const towerIcon = document.createElement('div');
    towerIcon.className = 'tower-icon';
    towerIcon.style.backgroundColor = towerData.color || '#4CAF50';

    // Create tower name
    const towerName = document.createElement('div');
    towerName.className = 'tower-name';
    towerName.textContent = towerData.name || towerType;

    // Add elements to tower option
    towerOption.appendChild(towerIcon);
    towerOption.appendChild(towerName);

    // Add click event for towers
    towerOption.addEventListener('click', () => {
      selectTower(towerType, towerData);
    });

    // Add hover event for tower preview
    towerOption.addEventListener('mouseenter', () => {
      showTowerPreview(towerType, towerData);
    });

    towerOption.addEventListener('mouseleave', () => {
      hideTowerPreview();
    });

    // Add to container
    availableTowersContainer.appendChild(towerOption);
  });
}

// Select a tower for the loadout
function selectTower(towerType, towerData) {
  // Check if this tower is already selected
  const towerIndex = window.selectedTowers.indexOf(towerType);

  if (towerIndex !== -1) {
    // Tower is already selected, remove it
    window.selectedTowers.splice(towerIndex, 1);

    // Update UI
    updateSelectedTowersUI();

    // Remove selected class from tower option
    document.querySelector(`.tower-option[data-type="${towerType}"]`).classList.remove('selected');
  } else {
    // Check if we already have 4 towers selected
    if (window.selectedTowers.length >= 4) {
      alert('You can only select up to 4 towers. Remove one to add another.');
      return;
    }

    // Add tower to selected towers
    window.selectedTowers.push(towerType);

    // Update UI
    updateSelectedTowersUI();

    // Add selected class to tower option
    document.querySelector(`.tower-option[data-type="${towerType}"]`).classList.add('selected');
  }

  // Update start button state
  updateStartButtonState();
}

// Update the selected towers UI
function updateSelectedTowersUI() {
  const selectedSlotsContainer = document.getElementById('selected-towers');
  const slots = selectedSlotsContainer.querySelectorAll('.selected-slot');

  // Reset all slots
  slots.forEach((slot, index) => {
    // Clear the slot
    slot.innerHTML = '';
    slot.className = 'selected-slot empty';

    // If we have a tower for this slot, fill it
    if (index < window.selectedTowers.length) {
      const towerType = window.selectedTowers[index];
      const towerData = towerStats[towerType];

      // Mark as filled
      slot.className = 'selected-slot filled';

      // Create tower icon
      const towerIcon = document.createElement('div');
      towerIcon.className = 'tower-icon';
      towerIcon.style.backgroundColor = towerData.color || '#4CAF50';

      // Create remove button
      const removeButton = document.createElement('div');
      removeButton.className = 'remove-tower';
      removeButton.textContent = '×';
      removeButton.addEventListener('click', (e) => {
        e.stopPropagation();
        removeTower(index);
      });

      // Add elements to slot
      slot.appendChild(towerIcon);
      slot.appendChild(removeButton);

      // Add hover event for tower preview
      slot.addEventListener('mouseenter', () => {
        showTowerPreview(towerType, towerData);
      });

      slot.addEventListener('mouseleave', () => {
        hideTowerPreview();
      });
    }
  });
}

// Remove a tower from the loadout
function removeTower(index) {
  if (index >= 0 && index < window.selectedTowers.length) {
    // Get the tower type before removing
    const towerType = window.selectedTowers[index];

    // Remove from selected towers
    window.selectedTowers.splice(index, 1);

    // Update UI
    updateSelectedTowersUI();

    // Remove selected class from tower option
    document.querySelector(`.tower-option[data-type="${towerType}"]`).classList.remove('selected');

    // Update start button state
    updateStartButtonState();
  }
}

// Show tower preview
function showTowerPreview(towerType, towerData) {
  const previewElement = document.getElementById('tower-preview');

  // Set tower name
  document.getElementById('preview-name').textContent = towerData.name || towerType;

  // Set tower stats
  document.getElementById('preview-damage').textContent = towerData.damage || 0;
  document.getElementById('preview-range').textContent = towerData.range || 0;
  document.getElementById('preview-fire-rate').textContent = towerData.fireRate?.toFixed(1) || 0;
  document.getElementById('preview-special').textContent = towerData.ability || 'None';

  // Set targeting capabilities
  document.getElementById('preview-target-ground').textContent = 'Yes';
  document.getElementById('preview-target-ground').className = 'target-yes';

  // Flying targeting
  if (towerData.canTargetFlying) {
    document.getElementById('preview-target-flying').textContent = 'Yes';
    document.getElementById('preview-target-flying').className = 'target-yes';
  } else {
    document.getElementById('preview-target-flying').textContent = 'No';
    document.getElementById('preview-target-flying').className = 'target-no';
  }

  // Shadow targeting (only certain tower types)
  const shadowTargetingTowers = ['tesla', 'laser', 'flame'];
  if (shadowTargetingTowers.includes(towerType)) {
    document.getElementById('preview-target-shadow').textContent = 'Yes';
    document.getElementById('preview-target-shadow').className = 'target-yes';
  } else {
    document.getElementById('preview-target-shadow').textContent = 'No';
    document.getElementById('preview-target-shadow').className = 'target-no';
  }

  // Show the preview
  previewElement.classList.remove('hidden');
}

// Hide tower preview
function hideTowerPreview() {
  document.getElementById('tower-preview').classList.add('hidden');
}

// Update the start button state
function updateStartButtonState() {
  const startButton = document.getElementById('start-btn');

  // Enable the button if at least one tower is selected
  startButton.disabled = window.selectedTowers.length === 0;
}

// Setup event listeners
function setupEventListeners() {
  // Back button
  document.getElementById('back-btn').addEventListener('click', () => {
    window.location.href = 'difficulty.html';
  });

  // Start game button
  document.getElementById('start-btn').addEventListener('click', () => {
    if (window.selectedTowers.length > 0) {
      // Store selected towers in session storage
      sessionStorage.setItem('selectedTowers', JSON.stringify(window.selectedTowers));

      // Navigate to game.html
      window.location.href = 'game.html';
    } else {
      alert('Please select at least one tower for your loadout');
    }
  });

  // Empty slot click event
  document.querySelectorAll('.selected-slot.empty').forEach(slot => {
    slot.addEventListener('click', () => {
      // If we have available towers that aren't selected yet, suggest selecting one
      const availableTowers = document.querySelectorAll('.tower-option:not(.selected)');
      if (availableTowers.length > 0) {
        alert('Click on an available tower to add it to your loadout');
      } else {
        alert('All available towers are already selected');
      }
    });
  });
}
