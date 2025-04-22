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
    this.consecutiveErrors = 0;
    this.maxConsecutiveErrors = 5;
    this.errorBackoffFactor = 1.5;
    this.maxPollFrequency = 30000; // 30 seconds max

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

    // Use a more conservative polling approach
    const basePollFrequency = 5000; // 5 seconds base

    // If we're already at a higher frequency due to errors, keep it
    if (this.pollFrequency < basePollFrequency) {
      this.pollFrequency = basePollFrequency;
    }

    // Add some randomness to the polling interval to prevent synchronized requests
    const randomizedFrequency = this.pollFrequency + (Math.random() * 1000 - 500); // +/- 500ms

    console.log(`Starting squad polling with frequency: ${Math.round(randomizedFrequency)}ms`);

    // Use a more reliable polling mechanism
    const poll = () => {
      if (!this.pollInterval) return; // Stop if polling has been cancelled

      // Schedule the next poll first, so if refreshSquadData throws, we still continue polling
      this.pollInterval = setTimeout(() => {
        poll();
      }, this.pollFrequency + (Math.random() * 1000 - 500)); // Add jitter to each interval

      // Then do the actual data refresh
      this.refreshSquadData().catch(error => {
        console.error('Error in poll cycle:', error);
        // Errors are already handled in refreshSquadData
      });
    };

    // Start the polling cycle
    this.pollInterval = setTimeout(() => {
      poll();
    }, randomizedFrequency);
  }

  // Stop polling
  stopPolling() {
    if (this.pollInterval) {
      clearTimeout(this.pollInterval); // Changed from clearInterval to clearTimeout
      this.pollInterval = null;
      console.log('Stopped squad polling');
    }
  }

  // Refresh squad data
  async refreshSquadData() {
    if (!this.currentSquad) return;

    // Add jitter to prevent all clients from hitting the server at the same time
    const jitter = Math.floor(Math.random() * 2000); // 0-2000ms jitter (increased from 1000ms)
    await new Promise(resolve => setTimeout(resolve, jitter));

    try {
      const token = window.authService.getToken();
      if (!token) return;

      // Add timestamp to prevent caching and track request time
      const timestamp = Date.now();

      // Check if we've had too many consecutive errors
      if (this.consecutiveErrors >= this.maxConsecutiveErrors) {
        console.log(`Too many consecutive errors (${this.consecutiveErrors}), pausing polling for 10 seconds`);
        // Pause polling for a while
        this.stopPolling();
        setTimeout(() => {
          this.consecutiveErrors = 0; // Reset error count
          this.startPolling(); // Restart polling
        }, 10000); // 10 second pause
        return;
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout (increased from 5s)

      try {
        const response = await fetch(`/api/squads/${this.currentSquad.id}/state?t=${timestamp}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          credentials: 'include',
          signal: controller.signal
        });

        clearTimeout(timeoutId); // Clear the timeout

        if (!response.ok) {
          if (response.status === 404) {
            // Squad no longer exists
            this.currentSquad = null;
            this.notifyListeners();
            this.stopPolling();
            this.consecutiveErrors = 0; // Reset error count
            return;
          }

          if (response.status === 503 || response.status === 429 || response.status === 500 || response.status === 504) {
            // Server is overloaded or rate limiting, back off polling
            this.consecutiveErrors++;
            const backoffFactor = Math.pow(this.errorBackoffFactor, Math.min(this.consecutiveErrors, 5));
            this.pollFrequency = Math.min(this.pollFrequency * backoffFactor, this.maxPollFrequency);
            console.log(`Server error (${response.status}), increasing poll frequency to ${this.pollFrequency}ms (consecutive errors: ${this.consecutiveErrors})`);
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

        // Reset consecutive errors on success
        this.consecutiveErrors = 0;

        // If we got a successful response, we can gradually decrease the polling frequency
        // back to normal if it was increased due to errors
        if (this.pollFrequency > 5000) {
          this.pollFrequency = Math.max(this.pollFrequency * 0.9, 5000); // Decrease gradually, min 5s
          this.stopPolling();
          this.startPolling();
        }
      } catch (fetchError) {
        clearTimeout(timeoutId); // Make sure to clear the timeout

        if (fetchError.name === 'AbortError') {
          console.error('Fetch aborted due to timeout');
          this.consecutiveErrors++;
          const backoffFactor = Math.pow(this.errorBackoffFactor, Math.min(this.consecutiveErrors, 5));
          this.pollFrequency = Math.min(this.pollFrequency * backoffFactor, this.maxPollFrequency);
          console.log(`Fetch timeout, increasing poll frequency to ${this.pollFrequency}ms (consecutive errors: ${this.consecutiveErrors})`);
          this.stopPolling();
          this.startPolling();
          return;
        }

        throw fetchError; // Re-throw for the outer catch
      }
    } catch (error) {
      console.error('Refresh squad data error:', error);

      // Increment consecutive errors
      this.consecutiveErrors++;

      // Increase polling interval on error to reduce server load
      const backoffFactor = Math.pow(this.errorBackoffFactor, Math.min(this.consecutiveErrors, 5));
      this.pollFrequency = Math.min(this.pollFrequency * backoffFactor, this.maxPollFrequency);
      console.log(`Error refreshing data, increasing poll frequency to ${this.pollFrequency}ms (consecutive errors: ${this.consecutiveErrors})`);
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
