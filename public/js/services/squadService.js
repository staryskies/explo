/**
 * Squad service for the tower defense game
 */
class SquadService {
  constructor() {
    this.socket = null;
    this.currentSquad = null;
    this.listeners = [];
    this.messageListeners = [];
    this.gameStateListeners = [];

    // Initialize socket connection when auth service is ready
    if (window.authService && window.authService.isLoggedIn()) {
      this.initSocket();
    }

    // Listen for auth state changes
    if (window.authService) {
      window.authService.addListener(user => {
        if (user) {
          this.initSocket();
        } else {
          this.disconnectSocket();
        }
      });
    }
  }

  // Initialize socket connection
  initSocket() {
    if (this.socket) {
      this.disconnectSocket();
    }

    const token = window.authService.getToken();
    if (!token) return;

    // Create socket connection with auth token and better reconnection settings
    this.socket = io({
      auth: { token },
      query: { token }, // Add token to query for better compatibility
      reconnection: true,
      reconnectionAttempts: Infinity, // Keep trying to reconnect
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
      autoConnect: true,
      transports: ['polling', 'websocket'],
      forceNew: false,
      withCredentials: true,
      extraHeaders: {
        'Authorization': `Bearer ${token}`
      }
    });

    // Handle connection events
    this.socket.on('connect', () => {
      console.log('Socket connected with ID:', this.socket.id);

      // Get current squad
      this.getCurrentSquad().then(squad => {
        if (squad) {
          this.joinSquadRoom(squad.id);
        }
      });
    });

    // Handle connection established event
    this.socket.on('connection-established', (data) => {
      console.log('Connection established:', data);
    });

    // Handle disconnection
    this.socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);

      // Attempt to reconnect if not intentional
      if (reason === 'io server disconnect' || reason === 'transport close') {
        console.log('Attempting to reconnect...');
        this.socket.connect();
      }
    });

    // Handle reconnection
    this.socket.on('reconnect', (attemptNumber) => {
      console.log(`Socket reconnected after ${attemptNumber} attempts`);

      // Rejoin squad room if we were in one
      if (this.currentSquad) {
        this.joinSquadRoom(this.currentSquad.id);
      }
    });

    // Handle reconnection attempts
    this.socket.on('reconnect_attempt', (attemptNumber) => {
      console.log(`Reconnection attempt ${attemptNumber}`);
    });

    // Handle reconnection errors
    this.socket.on('reconnect_error', (error) => {
      console.error('Reconnection error:', error);
    });

    // Handle reconnection failures
    this.socket.on('reconnect_failed', () => {
      console.error('Failed to reconnect after all attempts');
    });

    // Handle errors
    this.socket.on('error', (error) => {
      console.error('Socket error:', error);
    });

    // Handle connect errors
    this.socket.on('connect_error', (error) => {
      console.error('Connection error:', error);
    });

    // Handle squad events
    this.socket.on('squad-joined', (squad) => {
      this.currentSquad = squad;
      this.notifyListeners();
    });

    this.socket.on('member-joined', (member) => {
      if (this.currentSquad) {
        // Add member if not already in the squad
        const existingMember = this.currentSquad.members.find(m => m.id === member.id);
        if (!existingMember) {
          this.currentSquad.members.push({
            ...member,
            joinedAt: new Date().toISOString()
          });
          this.notifyListeners();
        }
      }
    });

    this.socket.on('member-left', (member) => {
      if (this.currentSquad) {
        // Remove member from squad
        this.currentSquad.members = this.currentSquad.members.filter(m => m.id !== member.id);
        this.notifyListeners();
      }
    });

    // Handle squad messages
    this.socket.on('squad-message', (message) => {
      this.notifyMessageListeners(message);
    });

    // Handle game state updates
    this.socket.on('game-state-update', (update) => {
      this.notifyGameStateListeners(update);
    });
  }

  // Disconnect socket
  disconnectSocket() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.currentSquad = null;
    this.notifyListeners();
  }

  // Join squad room
  joinSquadRoom(squadId) {
    if (!squadId) {
      console.error('Cannot join squad: Invalid squad ID');
      return;
    }

    if (!this.socket) {
      console.log('Socket not initialized, initializing...');
      this.initSocket();
    }

    // If socket exists but not connected, set up a connection handler
    if (this.socket && !this.socket.connected) {
      console.log('Socket not connected, waiting for connection...');
      const connectHandler = () => {
        console.log('Connected, now joining squad:', squadId);
        this.socket.emit('join-squad', squadId);
        this.socket.off('connect', connectHandler);
      };
      this.socket.on('connect', connectHandler);
      this.socket.connect();
      return;
    }

    // If socket is connected, join immediately
    if (this.socket && this.socket.connected) {
      console.log('Joining squad room:', squadId);
      this.socket.emit('join-squad', squadId);
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

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create squad');
      }

      this.currentSquad = data;
      this.notifyListeners();

      // Join squad room
      this.joinSquadRoom(data.id);

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

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to join squad');
      }

      this.currentSquad = data;
      this.notifyListeners();

      // Join squad room
      this.joinSquadRoom(data.id);

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
      } else {
        this.currentSquad = null;
        this.notifyListeners();
      }

      return this.currentSquad;
    } catch (error) {
      console.error('Get current squad error:', error);
      return null;
    }
  }

  // Send message to squad
  sendMessage(message) {
    if (!this.socket || !this.currentSquad) {
      return false;
    }

    this.socket.emit('squad-message', {
      squadId: this.currentSquad.id,
      message
    });

    return true;
  }

  // Send game state update to squad
  sendGameState(gameState) {
    if (!this.socket || !this.currentSquad) {
      return false;
    }

    this.socket.emit('game-state', {
      squadId: this.currentSquad.id,
      gameState
    });

    return true;
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
