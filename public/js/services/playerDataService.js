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
      if (!token) return null;

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
          this.playerData = null;
          this.notifyListeners();
          return null;
        }
        throw new Error('Failed to load player data');
      }

      const data = await response.json();
      this.playerData = data;
      this.notifyListeners();

      return data;
    } catch (error) {
      console.error('Load player data error:', error);
      return null;
    }
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

      const data = await response.json();
      this.playerData = data;
      this.notifyListeners();

      return data;
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
