/**
 * Player data service for the tower defense game
 */
class PlayerDataService {
  constructor() {
    this.playerData = null;
    this.listeners = [];

    // Initialize when auth service is ready
    if (window.authService && window.authService.isLoggedIn()) {
      this.loadPlayerData();
    }

    // Listen for auth state changes
    if (window.authService) {
      window.authService.addListener(user => {
        if (user) {
          this.loadPlayerData();
        } else {
          this.playerData = null;
          this.notifyListeners();
        }
      });
    }
  }

  // Load player data from server
  async loadPlayerData() {
    try {
      const token = window.authService.getToken();
      if (!token) return this.createDefaultPlayerData();

      try {
        const response = await fetch('/api/player-data', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          credentials: 'include'
        });

        if (!response.ok) {
          if (response.status === 401) {
            this.playerData = this.createDefaultPlayerData();
            this.notifyListeners();
            return this.playerData;
          }
          console.warn('Server returned error:', response.status);
          return this.createDefaultPlayerData();
        }

        // Check if response is empty
        const text = await response.text();
        if (!text || text.trim() === '') {
          console.warn('Empty response from server');
          return this.createDefaultPlayerData();
        }

        // Try to parse JSON
        try {
          const data = JSON.parse(text);
          this.playerData = data;
          this.notifyListeners();
          return data;
        } catch (jsonError) {
          console.error('Error parsing player data JSON:', jsonError);
          return this.createDefaultPlayerData();
        }
      } catch (fetchError) {
        console.error('Fetch error:', fetchError);
        return this.createDefaultPlayerData();
      }
    } catch (error) {
      console.error('Load player data error:', error);
      return this.createDefaultPlayerData();
    }
  }

  // Create default player data
  createDefaultPlayerData() {
    const defaultData = {
          silver: 1000,
          highScore: 0,
          gamesPlayed: 0,
          wavesCompleted: 0,
          enemiesKilled: 0,
          highestWaveCompleted: 0,
          completedDifficulties: [],
          towerRolls: 0,
          variantRolls: 0,
          towerPity: {
            rare: 0,
            epic: 0,
            legendary: 0,
            mythic: 0,
            divine: 0
          },
          variantPity: {
            rare: 0,
            epic: 0,
            legendary: 0,
            divine: 0
          },
          unlockedTowers: ['basic'],
          towerVariants: {
            basic: ['normal'],
            archer: [],
            cannon: [],
            sniper: [],
            freeze: [],
            mortar: [],
            laser: [],
            tesla: [],
            flame: [],
            missile: [],
            poison: [],
            vortex: [],
            archangel: []
          }
        };
    this.playerData = defaultData;
    this.notifyListeners();
    return defaultData;
  }

  // Save player data to server
  async savePlayerData(gameData) {
    try {
      const token = window.authService.getToken();
      if (!token) throw new Error('Not authenticated');

      const response = await fetch('/api/player-data', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ gameData }),
        credentials: 'include'
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save player data');
      }

      try {
        const data = await response.json();
        this.playerData = data;
        this.notifyListeners();
        return data;
      } catch (jsonError) {
        console.error('Error parsing saved player data JSON:', jsonError);
        // If we can't parse the JSON, just return the data we tried to save
        this.playerData = gameData;
        this.notifyListeners();
        return gameData;
      }
    } catch (error) {
      console.error('Save player data error:', error);
      throw error;
    }
  }

  // Get player data
  getPlayerData() {
    return this.playerData;
  }

  // Update player data locally
  updatePlayerData(newData) {
    this.playerData = { ...this.playerData, ...newData };
    this.notifyListeners();

    // Save to server in the background
    this.savePlayerData(this.playerData).catch(error => {
      console.error('Failed to save player data:', error);
    });

    return this.playerData;
  }

  // Add player data change listener
  addListener(callback) {
    this.listeners.push(callback);
    // Call the callback immediately with current state
    callback(this.playerData);
    return () => this.removeListener(callback);
  }

  // Remove player data change listener
  removeListener(callback) {
    this.listeners = this.listeners.filter(listener => listener !== callback);
  }

  // Notify all listeners of player data change
  notifyListeners() {
    this.listeners.forEach(listener => listener(this.playerData));
  }
}

// Create a singleton instance
window.playerDataService = new PlayerDataService();
