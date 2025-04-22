/**
 * Squad service for the tower defense game
 */
class SquadService {
  constructor() {
    this.currentSquad = null;
    this.listeners = [];
    this.messageListeners = [];
    this.gameStateListeners = [];
    this.pollInterval = null;
    this.pollFrequency = 5000; // 5 seconds

    // Initialize when auth service is ready
    if (window.authService && window.authService.isLoggedIn()) {
      this.getCurrentSquad();
    }

    // Listen for auth state changes
    if (window.authService) {
      window.authService.addListener(user => {
        if (user) {
          this.getCurrentSquad();
        } else {
          this.currentSquad = null;
          this.notifyListeners();
          this.stopPolling();
        }
      });
    }

    // Listen for state updates from REST communication service
    if (window.restCommunicationService) {
      window.restCommunicationService.addStateListener(state => {
        if (state.type === 'squad-state' && state.data) {
          // Update squad data if it's our current squad
          if (this.currentSquad && state.data.id === this.currentSquad.id) {
            this.currentSquad = state.data;
            this.notifyListeners();
          }
        }
      });
    }
  }

  // Start polling for squad updates
  startPolling() {
    this.stopPolling();

    if (!this.currentSquad) return;

    // Use exponential backoff for polling
    let pollCount = 0;
    const maxPollFrequency = 30000; // 30 seconds max
    const basePollFrequency = 5000; // 5 seconds base

    this.pollInterval = setInterval(() => {
      // Increase poll frequency over time to reduce server load
      pollCount++;
      const currentFrequency = Math.min(
        basePollFrequency * Math.pow(1.2, Math.min(pollCount, 10)),
        maxPollFrequency
      );

      // Update the interval if needed
      if (currentFrequency > this.pollFrequency) {
        this.pollFrequency = currentFrequency;
        this.stopPolling();
        this.startPolling();
        return;
      }

      this.refreshSquadData();
    }, this.pollFrequency);
  }

  // Stop polling
  stopPolling() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
  }

  // Refresh squad data
  async refreshSquadData() {
    if (!this.currentSquad) return;

    // Add jitter to prevent all clients from hitting the server at the same time
    const jitter = Math.floor(Math.random() * 1000); // 0-1000ms jitter
    await new Promise(resolve => setTimeout(resolve, jitter));

    try {
      const token = window.authService.getToken();
      if (!token) return;

      // Add timestamp to prevent caching and track request time
      const timestamp = Date.now();
      const response = await fetch(`/api/squads/${this.currentSquad.id}/state?t=${timestamp}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include',
        // Add timeout to the fetch request
        signal: AbortSignal.timeout(5000) // 5 second timeout
      });

      if (!response.ok) {
        if (response.status === 404) {
          // Squad no longer exists
          this.currentSquad = null;
          this.notifyListeners();
          this.stopPolling();
          return;
        }

        if (response.status === 503 || response.status === 429) {
          // Server is overloaded or rate limiting, back off polling
          this.pollFrequency = Math.min(this.pollFrequency * 1.5, 30000); // Increase up to 30s max
          console.log(`Server busy, increasing poll frequency to ${this.pollFrequency}ms`);
          this.stopPolling();
          this.startPolling();
          return;
        }

        throw new Error(`Failed to refresh squad data: ${response.status}`);
      }

      const data = await response.json();

      // Update squad data
      this.currentSquad = data;
      this.notifyListeners();

      // If we got a successful response, we can gradually decrease the polling frequency
      // back to normal if it was increased due to errors
      if (this.pollFrequency > 5000) {
        this.pollFrequency = Math.max(this.pollFrequency * 0.9, 5000); // Decrease gradually, min 5s
        this.stopPolling();
        this.startPolling();
      }
    } catch (error) {
      console.error('Refresh squad data error:', error);

      // Increase polling interval on error to reduce server load
      this.pollFrequency = Math.min(this.pollFrequency * 1.5, 30000); // Increase up to 30s max
      console.log(`Error refreshing data, increasing poll frequency to ${this.pollFrequency}ms`);
      this.stopPolling();
      this.startPolling();
    }
  }

  // Create a new squad
  async createSquad() {
    try {
      const token = window.authService.getToken();
      if (!token) throw new Error('Not authenticated');

      const response = await fetch('/api/squads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include'
      });

      if (!response.ok) {
        const statusText = response.statusText || 'Unknown error';
        const status = response.status;
        console.error(`Server error: ${status} ${statusText}`);
        throw new Error(`Server error: ${status} ${statusText}`);
      }

      let data;
      try {
        const responseText = await response.text();
        if (!responseText) {
          throw new Error('Empty response from server');
        }

        try {
          data = JSON.parse(responseText);
        } catch (parseError) {
          console.error('JSON parse error:', parseError, 'Response text:', responseText);
          throw new Error('Invalid server response. Please try again later.');
        }
      } catch (textError) {
        console.error('Error reading response:', textError);
        throw new Error('Failed to read server response. Please try again later.');
      }

      this.currentSquad = data;
      this.notifyListeners();

      // Start polling for updates
      this.startPolling();

      // Inform REST communication service about the squad
      if (window.restCommunicationService) {
        window.restCommunicationService.setCurrentSquad(data);
      }

      return data;
    } catch (error) {
      console.error('Create squad error:', error);
      throw error;
    }
  }

  // Join a squad by code
  async joinSquad(code) {
    try {
      const token = window.authService.getToken();
      if (!token) throw new Error('Not authenticated');

      const response = await fetch('/api/squads/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ code }),
        credentials: 'include'
      });

      if (!response.ok) {
        const statusText = response.statusText || 'Unknown error';
        const status = response.status;
        console.error(`Server error: ${status} ${statusText}`);
        throw new Error(`Server error: ${status} ${statusText}`);
      }

      let data;
      try {
        const responseText = await response.text();
        if (!responseText) {
          throw new Error('Empty response from server');
        }

        try {
          data = JSON.parse(responseText);
        } catch (parseError) {
          console.error('JSON parse error:', parseError, 'Response text:', responseText);
          throw new Error('Invalid server response. Please try again later.');
        }
      } catch (textError) {
        console.error('Error reading response:', textError);
        throw new Error('Failed to read server response. Please try again later.');
      }

      this.currentSquad = data;
      this.notifyListeners();

      // Start polling for updates
      this.startPolling();

      // Inform REST communication service about the squad
      if (window.restCommunicationService) {
        window.restCommunicationService.setCurrentSquad(data);
      }

      return data;
    } catch (error) {
      console.error('Join squad error:', error);
      throw error;
    }
  }

  // Leave current squad
  async leaveSquad() {
    if (!this.currentSquad) {
      return;
    }

    try {
      const token = window.authService.getToken();
      if (!token) throw new Error('Not authenticated');

      const response = await fetch(`/api/squads/${this.currentSquad.id}/leave`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include'
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to leave squad');
      }

      this.currentSquad = null;
      this.notifyListeners();
      this.stopPolling();

      // Inform REST communication service
      if (window.restCommunicationService) {
        window.restCommunicationService.setCurrentSquad(null);
      }
    } catch (error) {
      console.error('Leave squad error:', error);
      throw error;
    }
  }

  // Get current squad
  async getCurrentSquad() {
    try {
      const token = window.authService.getToken();
      if (!token) return null;

      const response = await fetch('/api/squads/my-squad', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include'
      });

      if (!response.ok) {
        if (response.status === 401) {
          return null;
        }
        throw new Error('Failed to get current squad');
      }

      const data = await response.json();

      if (data.squad) {
        this.currentSquad = data.squad;
        this.notifyListeners();

        // Start polling for updates
        this.startPolling();

        // Inform REST communication service about the squad
        if (window.restCommunicationService) {
          window.restCommunicationService.setCurrentSquad(data.squad);
        }
      } else {
        this.currentSquad = null;
        this.notifyListeners();
        this.stopPolling();
      }

      return this.currentSquad;
    } catch (error) {
      console.error('Get current squad error:', error);
      return null;
    }
  }

  // Send message to squad
  async sendMessage(message) {
    if (!this.currentSquad) {
      return false;
    }

    if (window.restCommunicationService) {
      return await window.restCommunicationService.sendMessage('squad', message, this.currentSquad.id);
    }

    return false;
  }

  // Send game state update to squad
  async sendGameState(gameState) {
    if (!this.currentSquad) {
      return false;
    }

    if (window.restCommunicationService) {
      return await window.restCommunicationService.sendGameState(gameState, this.currentSquad.id);
    }

    return false;
  }

  // Add squad state change listener
  addListener(callback) {
    this.listeners.push(callback);
    // Call the callback immediately with current state
    callback(this.currentSquad);
    return () => this.removeListener(callback);
  }

  // Remove squad state change listener
  removeListener(callback) {
    this.listeners = this.listeners.filter(listener => listener !== callback);
  }

  // Notify all listeners of squad state change
  notifyListeners() {
    this.listeners.forEach(listener => listener(this.currentSquad));
  }

  // Add message listener
  addMessageListener(callback) {
    this.messageListeners.push(callback);
    return () => this.removeMessageListener(callback);
  }

  // Remove message listener
  removeMessageListener(callback) {
    this.messageListeners = this.messageListeners.filter(listener => listener !== callback);
  }

  // Notify all message listeners
  notifyMessageListeners(message) {
    this.messageListeners.forEach(listener => listener(message));
  }

  // Add game state listener
  addGameStateListener(callback) {
    this.gameStateListeners.push(callback);
    return () => this.removeGameStateListener(callback);
  }

  // Remove game state listener
  removeGameStateListener(callback) {
    this.gameStateListeners = this.gameStateListeners.filter(listener => listener !== callback);
  }

  // Notify all game state listeners
  notifyGameStateListeners(update) {
    this.gameStateListeners.forEach(listener => listener(update));
  }
}

// Create a singleton instance
window.squadService = new SquadService();
