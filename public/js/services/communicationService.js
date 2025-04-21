/**
 * Communication Service
 * Provides a unified interface for real-time communication with fallback to polling
 */
class CommunicationService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.usePolling = false;
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
    // Try WebSocket connection first
    this.initSocket();
    
    // Set up polling as fallback after a short delay
    setTimeout(() => {
      if (!this.isConnected) {
        console.log('WebSocket connection failed, falling back to polling');
        this.usePolling = true;
        this.startPolling();
      }
    }, 5000);
  }
  
  // Initialize socket connection
  initSocket() {
    if (this.socket) {
      this.disconnect();
    }
    
    const token = window.authService.getToken();
    if (!token) return;
    
    try {
      // Create socket connection with auth token and better reconnection settings
      this.socket = io({
        auth: { token },
        query: { token },
        reconnection: true,
        reconnectionAttempts: 3, // Only try a few times before falling back to polling
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 10000,
        autoConnect: true,
        transports: ['polling', 'websocket'],
        forceNew: false,
        withCredentials: true,
        extraHeaders: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      // Set up socket event listeners
      this.socket.on('connect', () => {
        console.log('Socket connected with ID:', this.socket.id);
        this.isConnected = true;
        this.notifyStateListeners({ connected: true, method: 'websocket' });
      });
      
      this.socket.on('disconnect', (reason) => {
        console.log('Socket disconnected:', reason);
        this.isConnected = false;
        this.notifyStateListeners({ connected: false, method: 'websocket' });
        
        // If disconnected for too long, switch to polling
        if (['io server disconnect', 'transport close', 'transport error'].includes(reason)) {
          setTimeout(() => {
            if (!this.isConnected && !this.usePolling) {
              console.log('WebSocket reconnection failed, switching to polling');
              this.usePolling = true;
              this.startPolling();
            }
          }, 10000);
        }
      });
      
      // Handle global messages
      this.socket.on('global-message', (message) => {
        this.messageCache.global.push(message);
        this.lastMessageTimestamp.global = Date.now();
        this.notifyMessageListeners('global', message);
      });
      
      // Handle squad messages
      this.socket.on('squad-message', (message) => {
        const squadId = message.squadId;
        if (!this.messageCache.squad[squadId]) {
          this.messageCache.squad[squadId] = [];
          this.lastMessageTimestamp.squad[squadId] = 0;
        }
        this.messageCache.squad[squadId].push(message);
        this.lastMessageTimestamp.squad[squadId] = Date.now();
        this.notifyMessageListeners('squad', message);
      });
      
      // Handle game state updates
      this.socket.on('game-state-update', (update) => {
        this.notifyStateListeners({ type: 'game-state', data: update });
      });
      
      // Handle squad joined
      this.socket.on('squad-joined', (squad) => {
        this.notifyStateListeners({ type: 'squad-joined', data: squad });
      });
      
      // Handle member left
      this.socket.on('member-left', (member) => {
        this.notifyStateListeners({ type: 'member-left', data: member });
      });
      
      // Handle errors
      this.socket.on('error', (error) => {
        console.error('Socket error:', error);
        this.notifyStateListeners({ type: 'error', data: error });
      });
      
      this.socket.on('connect_error', (error) => {
        console.error('Connection error:', error);
        
        // If connection error persists, switch to polling
        if (!this.usePolling) {
          setTimeout(() => {
            if (!this.isConnected) {
              console.log('WebSocket connection failed, switching to polling');
              this.usePolling = true;
              this.startPolling();
            }
          }, 5000);
        }
      });
    } catch (error) {
      console.error('Socket initialization error:', error);
      this.usePolling = true;
      this.startPolling();
    }
  }
  
  // Disconnect socket
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    
    this.isConnected = false;
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
    if (window.squadService && window.squadService.currentSquad) {
      const squadId = window.squadService.currentSquad.id;
      this.startSquadPolling(squadId);
    }
    
    this.notifyStateListeners({ connected: true, method: 'polling' });
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
  }
  
  // Poll for messages
  async pollMessages(type, squadId) {
    try {
      const token = window.authService.getToken();
      if (!token) return;
      
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
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`Failed to poll messages: ${response.status}`);
      }
      
      const messages = await response.json();
      
      if (messages && messages.length > 0) {
        if (type === 'global') {
          messages.forEach(message => {
            this.messageCache.global.push(message);
            this.notifyMessageListeners('global', message);
          });
          this.lastMessageTimestamp.global = Date.now();
        } else if (type === 'squad' && squadId) {
          messages.forEach(message => {
            if (!this.messageCache.squad[squadId]) {
              this.messageCache.squad[squadId] = [];
            }
            this.messageCache.squad[squadId].push(message);
            this.notifyMessageListeners('squad', message);
          });
          this.lastMessageTimestamp.squad[squadId] = Date.now();
        }
      }
    } catch (error) {
      console.error(`Poll ${type} messages error:`, error);
    }
  }
  
  // Send a message
  async sendMessage(type, message, squadId) {
    // Create message object
    const messageObj = {
      message,
      timestamp: new Date().toISOString(),
      userId: window.authService.getCurrentUser()?.id || 'guest',
      username: window.authService.getCurrentUser()?.username || 'Guest'
    };
    
    if (type === 'squad' && squadId) {
      messageObj.squadId = squadId;
    }
    
    // Try to send via WebSocket first if connected
    if (this.isConnected && this.socket) {
      try {
        if (type === 'global') {
          this.socket.emit('global-message', { message });
          return true;
        } else if (type === 'squad' && squadId) {
          this.socket.emit('squad-message', { squadId, message });
          return true;
        }
      } catch (socketError) {
        console.error('Socket send error:', socketError);
        // Fall back to HTTP if socket fails
      }
    }
    
    // Fall back to HTTP API
    try {
      const token = window.authService.getToken();
      if (!token) return false;
      
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
        throw new Error(`Failed to send message: ${response.status}`);
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
    
    // Try to send via WebSocket first if connected
    if (this.isConnected && this.socket) {
      try {
        this.socket.emit('game-state', { squadId, gameState });
        return true;
      } catch (socketError) {
        console.error('Socket send game state error:', socketError);
        // Fall back to HTTP if socket fails
      }
    }
    
    // Fall back to HTTP API
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
  
  // Join a squad room
  joinSquadRoom(squadId) {
    if (!squadId) return false;
    
    // Try to join via WebSocket if connected
    if (this.isConnected && this.socket) {
      try {
        this.socket.emit('join-squad', squadId);
      } catch (socketError) {
        console.error('Socket join squad error:', socketError);
      }
    }
    
    // Start polling for this squad regardless
    if (this.usePolling) {
      this.startSquadPolling(squadId);
    }
    
    return true;
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
window.communicationService = new CommunicationService();
