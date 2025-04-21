/**
 * REST Communication Service
 * Provides a REST API-based communication system with polling for real-time updates
 */
class RestCommunicationService {
  constructor() {
    this.isConnected = false;
    this.pollingInterval = 3000; // 3 seconds
    this.pollingTimers = {};
    this.messageListeners = [];
    this.stateListeners = [];
    this.messageCache = {
      global: [],
      squad: {}
    };
    this.lastMessageTimestamp = {
      global: 0,
      squad: {}
    };
    this.currentSquad = null;

    // Initialize when auth service is ready
    if (window.authService && window.authService.isLoggedIn()) {
      this.init();
    }

    // Listen for auth state changes
    if (window.authService) {
      window.authService.addListener(user => {
        if (user) {
          this.init();
        } else {
          this.disconnect();
        }
      });
    }
  }

  // Initialize the communication service
  init() {
    console.log('Initializing REST communication service');
    this.isConnected = true;
    this.notifyStateListeners({ connected: true, method: 'rest' });
    this.startPolling();
  }

  // Disconnect and stop polling
  disconnect() {
    console.log('Disconnecting REST communication service');
    this.isConnected = false;
    this.notifyStateListeners({ connected: false, method: 'rest' });
    this.stopPolling();
  }

  // Start polling for updates
  startPolling() {
    this.stopPolling(); // Clear any existing timers

    // Poll for global messages
    this.pollingTimers.global = setInterval(() => {
      this.pollMessages('global');
    }, this.pollingInterval);

    // Poll for squad data if in a squad
    if (this.currentSquad) {
      this.startSquadPolling(this.currentSquad.id);
    }
  }

  // Start polling for a specific squad
  startSquadPolling(squadId) {
    if (!squadId) return;

    // Stop existing polling for this squad
    if (this.pollingTimers.squad && this.pollingTimers.squad[squadId]) {
      clearInterval(this.pollingTimers.squad[squadId]);
    }

    // Initialize squad polling structures
    if (!this.pollingTimers.squad) this.pollingTimers.squad = {};
    if (!this.messageCache.squad[squadId]) this.messageCache.squad[squadId] = [];
    if (!this.lastMessageTimestamp.squad[squadId]) this.lastMessageTimestamp.squad[squadId] = 0;

    // Start polling for squad messages
    this.pollingTimers.squad[squadId] = setInterval(() => {
      this.pollMessages('squad', squadId);
    }, this.pollingInterval);

    // Start polling for squad state
    this.pollingTimers[`squad-state-${squadId}`] = setInterval(() => {
      this.pollSquadState(squadId);
    }, this.pollingInterval * 2); // Less frequent polling for state
  }

  // Stop all polling
  stopPolling() {
    // Clear global polling
    if (this.pollingTimers.global) {
      clearInterval(this.pollingTimers.global);
      this.pollingTimers.global = null;
    }

    // Clear squad polling
    if (this.pollingTimers.squad) {
      Object.keys(this.pollingTimers.squad).forEach(squadId => {
        clearInterval(this.pollingTimers.squad[squadId]);
      });
      this.pollingTimers.squad = {};
    }

    // Clear other polling timers
    Object.keys(this.pollingTimers).forEach(key => {
      if (key.startsWith('squad-state-')) {
        clearInterval(this.pollingTimers[key]);
        delete this.pollingTimers[key];
      }
    });
  }

  // Poll for messages
  async pollMessages(type, squadId) {
    try {
      // Skip polling if not connected
      if (!this.isConnected) {
        return;
      }

      // Try to get token
      let token;
      try {
        token = window.authService.getToken();
        if (!token) {
          console.warn('No auth token available for polling');
          return;
        }
      } catch (tokenError) {
        console.warn('Error getting auth token:', tokenError);
        return;
      }

      let url = '';
      let since = 0;

      if (type === 'global') {
        url = '/api/messages/global';
        since = this.lastMessageTimestamp.global;
      } else if (type === 'squad' && squadId) {
        url = `/api/messages/squad/${squadId}`;
        since = this.lastMessageTimestamp.squad[squadId] || 0;
      } else {
        return;
      }

      // Add timestamp to URL to prevent caching
      url += `?since=${since}&t=${Date.now()}`;

      try {
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          credentials: 'include'
        });

        if (!response.ok) {
          console.warn(`Failed to poll ${type} messages: ${response.status}`);
          // Don't throw an error, just return and try again later
          return;
        }

        let messages;
        try {
          messages = await response.json();
        } catch (jsonError) {
          console.warn(`Error parsing ${type} messages JSON:`, jsonError);
          return;
        }

        if (!messages || !Array.isArray(messages)) {
          console.warn(`Invalid ${type} messages response:`, messages);
          return;
        }

        if (messages.length > 0) {
          console.log(`Received ${messages.length} ${type} messages`);

          if (type === 'global') {
            messages.forEach(message => {
              // Ensure message has an ID
              if (!message.id) {
                message.id = 'server_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
              }

              // Check if message already exists in cache
              if (!this.messageCache.global.some(m => m.id === message.id)) {
                this.messageCache.global.push(message);
                this.notifyMessageListeners('global', message);
              }
            });
            this.lastMessageTimestamp.global = Date.now();
          } else if (type === 'squad' && squadId) {
            if (!this.messageCache.squad[squadId]) {
              this.messageCache.squad[squadId] = [];
            }

            messages.forEach(message => {
              // Ensure message has an ID
              if (!message.id) {
                message.id = 'server_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
              }

              // Check if message already exists in cache
              if (!this.messageCache.squad[squadId].some(m => m.id === message.id)) {
                this.messageCache.squad[squadId].push(message);
                this.notifyMessageListeners('squad', message);
              }
            });
            this.lastMessageTimestamp.squad[squadId] = Date.now();
          }
        }
      } catch (fetchError) {
        console.error(`Fetch error for ${type} messages:`, fetchError);
      }
    } catch (error) {
      console.error(`Poll ${type} messages error:`, error);
    }
  }

  // Poll for squad state
  async pollSquadState(squadId) {
    try {
      const token = window.authService.getToken();
      if (!token) return;

      const url = `/api/squads/${squadId}/state?t=${Date.now()}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`Failed to poll squad state: ${response.status}`);
      }

      const state = await response.json();

      // Notify listeners of state update
      this.notifyStateListeners({
        type: 'squad-state',
        data: state
      });

      return state;
    } catch (error) {
      console.error('Poll squad state error:', error);
    }
  }

  // Send a message
  async sendMessage(type, message, squadId) {
    try {
      // Generate a unique ID for the message
      const messageId = 'msg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);

      // Get current user info
      let userId = 'guest';
      let username = 'Guest';

      try {
        const currentUser = window.authService.getCurrentUser();
        if (currentUser) {
          userId = currentUser.id || userId;
          username = currentUser.username || username;
        }
      } catch (userError) {
        console.warn('Error getting current user:', userError);
        // Continue with default values
      }

      // Create message object
      const messageObj = {
        id: messageId,
        message,
        timestamp: new Date().toISOString(),
        userId,
        username
      };

      if (type === 'squad' && squadId) {
        messageObj.squadId = squadId;
      }

      // Add message to local cache immediately for instant feedback
      if (type === 'global') {
        this.messageCache.global.push(messageObj);
        this.notifyMessageListeners('global', messageObj);
      } else if (type === 'squad' && squadId) {
        if (!this.messageCache.squad[squadId]) {
          this.messageCache.squad[squadId] = [];
        }
        this.messageCache.squad[squadId].push(messageObj);
        this.notifyMessageListeners('squad', messageObj);
      }

      // Now send to server
      const token = window.authService.getToken();
      if (!token) {
        console.warn('No auth token available, message only stored locally');
        return true; // Return success since we've added to local cache
      }

      let url = '';

      if (type === 'global') {
        url = '/api/messages/global';
      } else if (type === 'squad' && squadId) {
        url = `/api/messages/squad/${squadId}`;
      } else {
        return false;
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(messageObj),
        credentials: 'include'
      });

      if (!response.ok) {
        console.warn(`Server returned ${response.status} for message, but continuing with local cache`);
        return true; // Still return success since we've added to local cache
      }

      try {
        const data = await response.json();
        console.log('Message sent successfully:', data);
      } catch (jsonError) {
        console.warn('Error parsing response JSON:', jsonError);
      }

      return true;
    } catch (error) {
      console.error(`Send ${type} message error:`, error);
      return false;
    }
  }

  // Send game state update
  async sendGameState(gameState, squadId) {
    if (!squadId) return false;

    try {
      const token = window.authService.getToken();
      if (!token) return false;

      const response = await fetch(`/api/squads/${squadId}/game-state`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ gameState }),
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`Failed to send game state: ${response.status}`);
      }

      return true;
    } catch (error) {
      console.error('Send game state error:', error);
      return false;
    }
  }

  // Set current squad
  setCurrentSquad(squad) {
    this.currentSquad = squad;

    // Start polling for this squad
    if (squad) {
      this.startSquadPolling(squad.id);
    }
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
  notifyMessageListeners(type, message) {
    this.messageListeners.forEach(listener => {
      try {
        listener(type, message);
      } catch (error) {
        console.error('Error in message listener:', error);
      }
    });
  }

  // Add state listener
  addStateListener(callback) {
    this.stateListeners.push(callback);
    return () => this.removeStateListener(callback);
  }

  // Remove state listener
  removeStateListener(callback) {
    this.stateListeners = this.stateListeners.filter(listener => listener !== callback);
  }

  // Notify all state listeners
  notifyStateListeners(state) {
    this.stateListeners.forEach(listener => {
      try {
        listener(state);
      } catch (error) {
        console.error('Error in state listener:', error);
      }
    });
  }

  // Get cached messages
  getMessages(type, squadId) {
    if (type === 'global') {
      return [...this.messageCache.global];
    } else if (type === 'squad' && squadId && this.messageCache.squad[squadId]) {
      return [...this.messageCache.squad[squadId]];
    }
    return [];
  }
}

// Create a singleton instance
window.restCommunicationService = new RestCommunicationService();
