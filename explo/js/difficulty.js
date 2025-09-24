/**
 * Difficulty selection functionality for the tower defense game
 */
// Log that difficulty.js is loaded
console.log('Difficulty selection loaded');

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
  console.log('Difficulty DOM loaded');

  // Create animated stars in the background
  createStars();

  // Add event listeners
  setupEventListeners();

  // Check for unlocked difficulties
  checkUnlockedDifficulties();
});

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

// Setup event listeners
function setupEventListeners() {
  // Difficulty options
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

  // Back button
  document.getElementById('back-btn').addEventListener('click', () => {
    window.location.href = 'index.html';
  });

  // Start game button
  document.getElementById('start-btn').addEventListener('click', () => {
    const selectedDifficulty = document.querySelector('.difficulty-option.selected');
    if (selectedDifficulty) {
      const difficulty = selectedDifficulty.dataset.difficulty;
      
      // Store selected difficulty in session storage
      sessionStorage.setItem('selectedDifficulty', difficulty);
      
      // Get the map from session storage
      const selectedMap = sessionStorage.getItem('selectedMap');
      
      if (selectedMap) {
        // Navigate to game.html
        window.location.href = 'game.html';
      } else {
        alert('Error: No map selected. Please go back and select a map first.');
        window.location.href = 'index.html';
      }
    } else {
      alert('Please select a difficulty level first');
    }
  });
}

// Check for unlocked difficulties
function checkUnlockedDifficulties() {
  // Get player progress from playerData
  const highestWaveCompleted = playerData.highestWaveCompleted || 0;
  
  // Lock difficulties based on progress
  const difficultyOptions = document.querySelectorAll('.difficulty-option');
  
  // Easy is always unlocked
  difficultyOptions[0].classList.add('selected'); // Select Easy by default
  
  // Medium unlocks after completing wave 15 on Easy
  if (highestWaveCompleted < 15) {
    difficultyOptions[1].classList.add('locked');
    const lockIcon = document.createElement('div');
    lockIcon.className = 'lock-icon';
    lockIcon.textContent = '🔒';
    difficultyOptions[1].appendChild(lockIcon);
    difficultyOptions[1].querySelector('p').textContent = 'Unlocks after completing Wave 15 on Easy';
  }
  
  // Hard unlocks after completing wave 25 on Medium
  if (highestWaveCompleted < 25) {
    difficultyOptions[2].classList.add('locked');
    const lockIcon = document.createElement('div');
    lockIcon.className = 'lock-icon';
    lockIcon.textContent = '🔒';
    difficultyOptions[2].appendChild(lockIcon);
    difficultyOptions[2].querySelector('p').textContent = 'Unlocks after completing Wave 25 on Medium';
  }
  
  // Nightmare unlocks after completing wave 35 on Hard
  if (highestWaveCompleted < 35) {
    difficultyOptions[3].classList.add('locked');
    const lockIcon = document.createElement('div');
    lockIcon.className = 'lock-icon';
    lockIcon.textContent = '🔒';
    difficultyOptions[3].appendChild(lockIcon);
    difficultyOptions[3].querySelector('p').textContent = 'Unlocks after completing Wave 35 on Hard';
  }
  
  // Void unlocks after completing wave 45 on Nightmare
  if (highestWaveCompleted < 45) {
    difficultyOptions[4].classList.add('locked');
    const lockIcon = document.createElement('div');
    lockIcon.className = 'lock-icon';
    lockIcon.textContent = '🔒';
    difficultyOptions[4].appendChild(lockIcon);
    difficultyOptions[4].querySelector('p').textContent = 'Unlocks after completing Wave 45 on Nightmare';
  }
}
