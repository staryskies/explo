/**
 * Leaderboard component for the tower defense game
 */
// Log that leaderboard.js is loaded
console.log('Leaderboard component loaded');

// Leaderboard component
const leaderboardComponent = {
  // Leaderboard state
  state: {
    activeTab: 'highscore-tab',
    highScores: [], // High score leaderboard
    maxWaves: [], // Max wave leaderboard
    towerCollections: [] // Tower collection leaderboard
  },

  // Initialize the leaderboard component
  init() {
    // Set up event listeners
    this.setupEventListeners();
  },

  // Set up event listeners
  setupEventListeners() {
    // Leaderboard button
    const leaderboardButton = document.getElementById('leaderboard-button');
    if (leaderboardButton) {
      leaderboardButton.addEventListener('click', () => this.openLeaderboard());
    }

    // Close button
    const closeLeaderboard = document.getElementById('close-leaderboard');
    if (closeLeaderboard) {
      closeLeaderboard.addEventListener('click', () => this.closeLeaderboard());
    }

    // Tab buttons
    const leaderboardTabs = document.querySelectorAll('.leaderboard-tab');
    leaderboardTabs.forEach(tab => {
      tab.addEventListener('click', () => this.switchTab(tab.dataset.tab));
    });
  },

  // Open the leaderboard
  openLeaderboard() {
    const leaderboardModal = document.getElementById('leaderboard-modal');
    if (leaderboardModal) {
      leaderboardModal.style.display = 'block';
      
      // Load leaderboard data
      this.loadLeaderboardData();
      
      // Switch to the active tab
      this.switchTab(this.state.activeTab);
    }
  },

  // Close the leaderboard
  closeLeaderboard() {
    const leaderboardModal = document.getElementById('leaderboard-modal');
    if (leaderboardModal) {
      leaderboardModal.style.display = 'none';
    }
  },

  // Switch tabs
  switchTab(tabId) {
    // Update active tab
    this.state.activeTab = tabId;
    
    // Update tab buttons
    const tabs = document.querySelectorAll('.leaderboard-tab');
    tabs.forEach(tab => {
      if (tab.dataset.tab === tabId) {
        tab.classList.add('active');
      } else {
        tab.classList.remove('active');
      }
    });
    
    // Update tab content
    const tabContents = document.querySelectorAll('.leaderboard-tab-content');
    tabContents.forEach(content => {
      if (content.id === tabId) {
        content.classList.add('active');
      } else {
        content.classList.remove('active');
      }
    });
    
    // Load tab-specific data
    if (tabId === 'highscore-tab') {
      this.loadHighScores();
    } else if (tabId === 'waves-tab') {
      this.loadMaxWaves();
    } else if (tabId === 'towers-tab') {
      this.loadTowerCollections();
    }
  },

  // Load leaderboard data
  loadLeaderboardData() {
    // In a real implementation, this would fetch data from the server
    // For now, we'll use a mock implementation
    
    // Generate some mock data if we don't have any
    if (this.state.highScores.length === 0) {
      this.generateMockData();
    }
    
    // Load high scores
    this.loadHighScores();
    
    // Load max waves
    this.loadMaxWaves();
    
    // Load tower collections
    this.loadTowerCollections();
  },

  // Generate mock data for testing
  generateMockData() {
    // Generate mock high scores
    this.state.highScores = [
      { id: 'player1', name: 'Player1', score: 50000, difficulty: 'nightmare' },
      { id: 'player2', name: 'Player2', score: 45000, difficulty: 'hard' },
      { id: 'player3', name: 'Player3', score: 40000, difficulty: 'nightmare' },
      { id: 'player4', name: 'Player4', score: 35000, difficulty: 'medium' },
      { id: 'player5', name: 'Player5', score: 30000, difficulty: 'hard' },
      { id: 'player6', name: 'Player6', score: 25000, difficulty: 'easy' },
      { id: 'player7', name: 'Player7', score: 20000, difficulty: 'medium' },
      { id: 'player8', name: 'Player8', score: 15000, difficulty: 'easy' },
      { id: 'player9', name: 'Player9', score: 10000, difficulty: 'easy' },
      { id: 'player10', name: 'Player10', score: 5000, difficulty: 'easy' }
    ];
    
    // Add current player if they have a high score
    if (playerData.highScore > 0) {
      const currentPlayer = {
        id: window.authService?.getCurrentUser()?.id || 'guest',
        name: window.authService?.getCurrentUser()?.username || 'You',
        score: playerData.highScore,
        difficulty: playerData.completedDifficulties[playerData.completedDifficulties.length - 1] || 'easy'
      };
      
      this.state.highScores.push(currentPlayer);
      
      // Sort high scores
      this.state.highScores.sort((a, b) => b.score - a.score);
      
      // Limit to top 10
      this.state.highScores = this.state.highScores.slice(0, 10);
    }
    
    // Generate mock max waves
    this.state.maxWaves = [
      { id: 'player1', name: 'Player1', wave: 50, difficulty: 'nightmare' },
      { id: 'player2', name: 'Player2', wave: 45, difficulty: 'hard' },
      { id: 'player3', name: 'Player3', wave: 40, difficulty: 'nightmare' },
      { id: 'player4', name: 'Player4', wave: 35, difficulty: 'medium' },
      { id: 'player5', name: 'Player5', wave: 30, difficulty: 'hard' },
      { id: 'player6', name: 'Player6', wave: 25, difficulty: 'easy' },
      { id: 'player7', name: 'Player7', wave: 20, difficulty: 'medium' },
      { id: 'player8', name: 'Player8', wave: 15, difficulty: 'easy' },
      { id: 'player9', name: 'Player9', wave: 10, difficulty: 'easy' },
      { id: 'player10', name: 'Player10', wave: 5, difficulty: 'easy' }
    ];
    
    // Add current player if they have completed waves
    if (playerData.highestWaveCompleted > 0) {
      const currentPlayer = {
        id: window.authService?.getCurrentUser()?.id || 'guest',
        name: window.authService?.getCurrentUser()?.username || 'You',
        wave: playerData.highestWaveCompleted,
        difficulty: playerData.completedDifficulties[playerData.completedDifficulties.length - 1] || 'easy'
      };
      
      this.state.maxWaves.push(currentPlayer);
      
      // Sort max waves
      this.state.maxWaves.sort((a, b) => b.wave - a.wave);
      
      // Limit to top 10
      this.state.maxWaves = this.state.maxWaves.slice(0, 10);
    }
    
    // Generate mock tower collections
    this.state.towerCollections = [
      { id: 'player1', name: 'Player1', towers: 12, variants: 45 },
      { id: 'player2', name: 'Player2', towers: 11, variants: 40 },
      { id: 'player3', name: 'Player3', towers: 10, variants: 35 },
      { id: 'player4', name: 'Player4', towers: 9, variants: 30 },
      { id: 'player5', name: 'Player5', towers: 8, variants: 25 },
      { id: 'player6', name: 'Player6', towers: 7, variants: 20 },
      { id: 'player7', name: 'Player7', towers: 6, variants: 15 },
      { id: 'player8', name: 'Player8', towers: 5, variants: 10 },
      { id: 'player9', name: 'Player9', towers: 4, variants: 5 },
      { id: 'player10', name: 'Player10', towers: 3, variants: 3 }
    ];
    
    // Add current player
    const currentPlayerTowers = playerData.unlockedTowers.length;
    let currentPlayerVariants = 0;
    
    // Count total variants
    Object.values(playerData.towerVariants).forEach(variants => {
      currentPlayerVariants += variants.length;
    });
    
    const currentPlayer = {
      id: window.authService?.getCurrentUser()?.id || 'guest',
      name: window.authService?.getCurrentUser()?.username || 'You',
      towers: currentPlayerTowers,
      variants: currentPlayerVariants
    };
    
    this.state.towerCollections.push(currentPlayer);
    
    // Sort tower collections by towers, then variants
    this.state.towerCollections.sort((a, b) => {
      if (a.towers !== b.towers) {
        return b.towers - a.towers;
      }
      return b.variants - a.variants;
    });
    
    // Limit to top 10
    this.state.towerCollections = this.state.towerCollections.slice(0, 10);
  },

  // Load high scores
  loadHighScores() {
    // Get the high scores container
    const highScoresContainer = document.getElementById('highscore-leaderboard');
    if (!highScoresContainer) return;
    
    // Clear the container
    highScoresContainer.innerHTML = '';
    
    // Add high scores
    if (this.state.highScores.length === 0) {
      highScoresContainer.innerHTML = '<div class="empty-message">No high scores yet</div>';
      return;
    }
    
    // Create table
    const table = document.createElement('table');
    table.className = 'leaderboard-table';
    
    // Create header
    const header = document.createElement('tr');
    header.innerHTML = `
      <th>Rank</th>
      <th>Player</th>
      <th>Score</th>
      <th>Difficulty</th>
    `;
    table.appendChild(header);
    
    // Add rows
    this.state.highScores.forEach((score, index) => {
      const row = document.createElement('tr');
      
      // Highlight current player
      const isCurrentPlayer = score.id === (window.authService?.getCurrentUser()?.id || 'guest');
      if (isCurrentPlayer) {
        row.className = 'current-player';
      }
      
      row.innerHTML = `
        <td>${index + 1}</td>
        <td>${score.name}${isCurrentPlayer ? ' (You)' : ''}</td>
        <td>${formatNumber(score.score)}</td>
        <td>${this.formatDifficulty(score.difficulty)}</td>
      `;
      
      table.appendChild(row);
    });
    
    highScoresContainer.appendChild(table);
  },

  // Load max waves
  loadMaxWaves() {
    // Get the max waves container
    const maxWavesContainer = document.getElementById('waves-leaderboard');
    if (!maxWavesContainer) return;
    
    // Clear the container
    maxWavesContainer.innerHTML = '';
    
    // Add max waves
    if (this.state.maxWaves.length === 0) {
      maxWavesContainer.innerHTML = '<div class="empty-message">No wave records yet</div>';
      return;
    }
    
    // Create table
    const table = document.createElement('table');
    table.className = 'leaderboard-table';
    
    // Create header
    const header = document.createElement('tr');
    header.innerHTML = `
      <th>Rank</th>
      <th>Player</th>
      <th>Wave</th>
      <th>Difficulty</th>
    `;
    table.appendChild(header);
    
    // Add rows
    this.state.maxWaves.forEach((wave, index) => {
      const row = document.createElement('tr');
      
      // Highlight current player
      const isCurrentPlayer = wave.id === (window.authService?.getCurrentUser()?.id || 'guest');
      if (isCurrentPlayer) {
        row.className = 'current-player';
      }
      
      row.innerHTML = `
        <td>${index + 1}</td>
        <td>${wave.name}${isCurrentPlayer ? ' (You)' : ''}</td>
        <td>${wave.wave}</td>
        <td>${this.formatDifficulty(wave.difficulty)}</td>
      `;
      
      table.appendChild(row);
    });
    
    maxWavesContainer.appendChild(table);
  },

  // Load tower collections
  loadTowerCollections() {
    // Get the tower collections container
    const towerCollectionsContainer = document.getElementById('towers-leaderboard');
    if (!towerCollectionsContainer) return;
    
    // Clear the container
    towerCollectionsContainer.innerHTML = '';
    
    // Add tower collections
    if (this.state.towerCollections.length === 0) {
      towerCollectionsContainer.innerHTML = '<div class="empty-message">No collection records yet</div>';
      return;
    }
    
    // Create table
    const table = document.createElement('table');
    table.className = 'leaderboard-table';
    
    // Create header
    const header = document.createElement('tr');
    header.innerHTML = `
      <th>Rank</th>
      <th>Player</th>
      <th>Towers</th>
      <th>Variants</th>
    `;
    table.appendChild(header);
    
    // Add rows
    this.state.towerCollections.forEach((collection, index) => {
      const row = document.createElement('tr');
      
      // Highlight current player
      const isCurrentPlayer = collection.id === (window.authService?.getCurrentUser()?.id || 'guest');
      if (isCurrentPlayer) {
        row.className = 'current-player';
      }
      
      row.innerHTML = `
        <td>${index + 1}</td>
        <td>${collection.name}${isCurrentPlayer ? ' (You)' : ''}</td>
        <td>${collection.towers}/${Object.keys(towerStats).length}</td>
        <td>${collection.variants}</td>
      `;
      
      table.appendChild(row);
    });
    
    towerCollectionsContainer.appendChild(table);
  },

  // Format difficulty
  formatDifficulty(difficulty) {
    const difficultyIcons = {
      'easy': '🌱',
      'medium': '🌿',
      'hard': '🔥',
      'nightmare': '☠️',
      'void': '⚫'
    };
    
    const icon = difficultyIcons[difficulty] || '';
    const name = difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
    
    return `${icon} ${name}`;
  }
};

// Initialize the leaderboard component when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  leaderboardComponent.init();
});
