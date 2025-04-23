/**
 * Leaderboard functionality for the tower defense game
 */
// Log that leaderboard.js is loaded
console.log('Leaderboard component loaded');

// Leaderboard object
const leaderboard = {
  // Current leaderboard data
  data: {
    highScores: [],
    waveRecords: [],
    towerCollections: []
  },

  // Initialize leaderboard
  initialize() {
    // Get DOM elements
    this.leaderboardModal = document.getElementById('leaderboard-modal');
    this.closeLeaderboard = document.getElementById('close-leaderboard');
    this.leaderboardTabs = document.querySelectorAll('.leaderboard-tab');
    this.leaderboardTabContents = document.querySelectorAll('.leaderboard-tab-content');

    // High scores table
    this.highScoresTable = document.getElementById('high-scores-table');
    this.highScoresTableBody = this.highScoresTable?.querySelector('tbody');

    // Wave records table
    this.waveRecordsTable = document.getElementById('wave-records-table');
    this.waveRecordsTableBody = this.waveRecordsTable?.querySelector('tbody');

    // Tower collections table
    this.towerCollectionsTable = document.getElementById('tower-collections-table');
    this.towerCollectionsTableBody = this.towerCollectionsTable?.querySelector('tbody');

    // Initialize event listeners
    this.initEventListeners();

    console.log('Leaderboard initialized');
  },

  // Initialize event listeners
  initEventListeners() {
    // Close leaderboard modal
    if (this.closeLeaderboard) {
      this.closeLeaderboard.addEventListener('click', () => {
        this.leaderboardModal.classList.remove('active');
      });
    }

    // Close modal when clicking outside
    window.addEventListener('click', (event) => {
      if (event.target === this.leaderboardModal) {
        this.leaderboardModal.classList.remove('active');
      }
    });

    // Tab switching
    this.leaderboardTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        // Remove active class from all tabs
        this.leaderboardTabs.forEach(t => t.classList.remove('active'));

        // Add active class to clicked tab
        tab.classList.add('active');

        // Hide all tab contents
        this.leaderboardTabContents.forEach(content => {
          content.classList.remove('active');
        });

        // Show selected tab content
        const tabId = tab.getAttribute('data-tab');
        document.getElementById(tabId).classList.add('active');
      });
    });
  },

  // Open leaderboard modal
  openLeaderboard() {
    // Load leaderboard data
    this.loadLeaderboardData();

    // Show modal
    this.leaderboardModal.classList.add('active');
  },

  // Load leaderboard data
  async loadLeaderboardData() {
    try {
      // Show loading state
      this.showLoadingState();

      // Load data from server or local storage
      await this.loadHighScores();
      await this.loadWaveRecords();
      await this.loadTowerCollections();

      console.log('Leaderboard data loaded');
    } catch (error) {
      console.error('Error loading leaderboard data:', error);
      this.showErrorState('Failed to load leaderboard data. Please try again later.');
    }
  },

  // Show loading state
  showLoadingState() {
    const loadingHtml = `
      <tr>
        <td colspan="4" class="loading-cell">
          <div class="loading-spinner"></div>
          <div>Loading leaderboard data...</div>
        </td>
      </tr>
    `;

    if (this.highScoresTableBody) {
      this.highScoresTableBody.innerHTML = loadingHtml;
    }

    if (this.waveRecordsTableBody) {
      this.waveRecordsTableBody.innerHTML = loadingHtml;
    }

    if (this.towerCollectionsTableBody) {
      this.towerCollectionsTableBody.innerHTML = loadingHtml;
    }
  },

  // Show error state
  showErrorState(message) {
    const errorHtml = `
      <tr>
        <td colspan="4" class="error-cell">
          <div class="error-icon">⚠️</div>
          <div>${message}</div>
        </td>
      </tr>
    `;

    if (this.highScoresTableBody) {
      this.highScoresTableBody.innerHTML = errorHtml;
    }

    if (this.waveRecordsTableBody) {
      this.waveRecordsTableBody.innerHTML = errorHtml;
    }

    if (this.towerCollectionsTableBody) {
      this.towerCollectionsTableBody.innerHTML = errorHtml;
    }
  },

  // Load high scores
  async loadHighScores() {
    try {
      // For static version, use mock data
      const mockHighScores = [
        { username: 'Player1', score: 15000, difficulty: 'hard', date: '2023-06-15' },
        { username: 'Player2', score: 12500, difficulty: 'nightmare', date: '2023-06-14' },
        { username: 'Player3', score: 10000, difficulty: 'medium', date: '2023-06-13' },
        { username: 'Player4', score: 9500, difficulty: 'easy', date: '2023-06-12' },
        { username: 'Player5', score: 8000, difficulty: 'hard', date: '2023-06-11' },
        { username: 'Player6', score: 7500, difficulty: 'medium', date: '2023-06-10' },
        { username: 'Player7', score: 7000, difficulty: 'easy', date: '2023-06-09' },
        { username: 'Player8', score: 6500, difficulty: 'hard', date: '2023-06-08' },
        { username: 'Player9', score: 6000, difficulty: 'medium', date: '2023-06-07' },
        { username: 'Player10', score: 5500, difficulty: 'easy', date: '2023-06-06' }
      ];

      // Update data
      this.data.highScores = mockHighScores;

      // Update table
      if (this.highScoresTableBody) {
        this.highScoresTableBody.innerHTML = '';

        mockHighScores.forEach((score, index) => {
          const row = document.createElement('tr');
          row.innerHTML = `
            <td>${index + 1}</td>
            <td>${score.username}</td>
            <td>${formatNumber(score.score)}</td>
            <td>${score.difficulty}</td>
            <td>${score.date}</td>
          `;
          this.highScoresTableBody.appendChild(row);
        });
      }
    } catch (error) {
      console.error('Error loading high scores:', error);
      throw error;
    }
  },

  // Load wave records
  async loadWaveRecords() {
    try {
      // For static version, use mock data
      const mockWaveRecords = [
        { username: 'Player1', wave: 50, difficulty: 'nightmare', date: '2023-06-15' },
        { username: 'Player2', wave: 45, difficulty: 'hard', date: '2023-06-14' },
        { username: 'Player3', wave: 40, difficulty: 'medium', date: '2023-06-13' },
        { username: 'Player4', wave: 35, difficulty: 'easy', date: '2023-06-12' },
        { username: 'Player5', wave: 30, difficulty: 'hard', date: '2023-06-11' },
        { username: 'Player6', wave: 25, difficulty: 'medium', date: '2023-06-10' },
        { username: 'Player7', wave: 20, difficulty: 'easy', date: '2023-06-09' },
        { username: 'Player8', wave: 15, difficulty: 'hard', date: '2023-06-08' },
        { username: 'Player9', wave: 10, difficulty: 'medium', date: '2023-06-07' },
        { username: 'Player10', wave: 5, difficulty: 'easy', date: '2023-06-06' }
      ];

      // Update data
      this.data.waveRecords = mockWaveRecords;

      // Update table
      if (this.waveRecordsTableBody) {
        this.waveRecordsTableBody.innerHTML = '';

        mockWaveRecords.forEach((record, index) => {
          const row = document.createElement('tr');
          row.innerHTML = `
            <td>${index + 1}</td>
            <td>${record.username}</td>
            <td>${record.wave}</td>
            <td>${record.difficulty}</td>
            <td>${record.date}</td>
          `;
          this.waveRecordsTableBody.appendChild(row);
        });
      }
    } catch (error) {
      console.error('Error loading wave records:', error);
      throw error;
    }
  },

  // Load tower collections
  async loadTowerCollections() {
    try {
      // For static version, use mock data
      const mockTowerCollections = [
        { username: 'Player1', towers: 12, variants: 25, rareTowers: 8, date: '2023-06-15' },
        { username: 'Player2', towers: 10, variants: 20, rareTowers: 7, date: '2023-06-14' },
        { username: 'Player3', towers: 9, variants: 18, rareTowers: 6, date: '2023-06-13' },
        { username: 'Player4', towers: 8, variants: 16, rareTowers: 5, date: '2023-06-12' },
        { username: 'Player5', towers: 7, variants: 14, rareTowers: 4, date: '2023-06-11' },
        { username: 'Player6', towers: 6, variants: 12, rareTowers: 3, date: '2023-06-10' },
        { username: 'Player7', towers: 5, variants: 10, rareTowers: 2, date: '2023-06-09' },
        { username: 'Player8', towers: 4, variants: 8, rareTowers: 1, date: '2023-06-08' },
        { username: 'Player9', towers: 3, variants: 6, rareTowers: 0, date: '2023-06-07' },
        { username: 'Player10', towers: 2, variants: 4, rareTowers: 0, date: '2023-06-06' }
      ];

      // Update data
      this.data.towerCollections = mockTowerCollections;

      // Update table
      if (this.towerCollectionsTableBody) {
        this.towerCollectionsTableBody.innerHTML = '';

        mockTowerCollections.forEach((collection, index) => {
          const row = document.createElement('tr');
          row.innerHTML = `
            <td>${index + 1}</td>
            <td>${collection.username}</td>
            <td>${collection.towers}</td>
            <td>${collection.variants}</td>
            <td>${collection.rareTowers}</td>
          `;
          this.towerCollectionsTableBody.appendChild(row);
        });
      }
    } catch (error) {
      console.error('Error loading tower collections:', error);
      throw error;
    }
  }
};

// Helper function to format numbers with commas
function formatNumber(num) {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  leaderboard.initialize();

  // Add event listener to leaderboard button
  const leaderboardButton = document.getElementById('leaderboard-button');
  if (leaderboardButton) {
    leaderboardButton.addEventListener('click', () => {
      leaderboard.openLeaderboard();
    });
  }
});
