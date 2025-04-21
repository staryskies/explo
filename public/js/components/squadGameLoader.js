/**
 * Squad Game Loader Component
 * Allows squad members to load into the same game together
 */
class SquadGameLoader {
  // Static initialization flag to prevent multiple initializations
  static initialized = false;
  constructor() {
    // Prevent multiple initializations
    if (SquadGameLoader.initialized) {
      console.warn('SquadGameLoader already initialized');
      return;
    }
    SquadGameLoader.initialized = true;

    // Initialize properties
    this.isVisible = false;
    this.currentSquad = null;
    this.gameState = null;
    this.readyPlayers = new Set();

    // UI elements - will be created in createUI
    this.container = null;
    this.headerTitle = null;
    this.toggleButton = null;
    this.playersList = null;
    this.readyButton = null;
    this.startButton = null;
    this.difficultySelect = null;
    this.mapSelect = null;

    // Defer initialization to ensure DOM is ready
    setTimeout(() => this.initialize(), 200);
  }

  // Initialize the component
  initialize() {
    console.log('Initializing SquadGameLoader component');

    try {
      // Create UI elements first
      this.createUI();

      // Initialize when squad service is ready
      if (window.squadService) {
        window.squadService.addListener(squad => {
          console.log('Squad updated in game loader:', squad);
          this.currentSquad = squad;

          // Only update UI if elements are created
          if (this.headerTitle && this.toggleButton && this.playersList) {
            this.updateUI();
          }
        });
      }

      // Listen for state updates from REST communication service
      if (window.restCommunicationService) {
        window.restCommunicationService.addStateListener(state => {
          if (state.type === 'squad-state' && state.data) {
            // Handle game state updates
            if (state.data.gameState) {
              this.handleGameStateUpdate({ gameState: state.data.gameState });
            }
          }
        });
      }

      console.log('SquadGameLoader initialized successfully');
    } catch (error) {
      console.error('Error initializing SquadGameLoader:', error);
    }
  }

  // Create UI elements
  createUI() {
    try {
      console.log('Creating SquadGameLoader UI elements');
    // Create container
    this.container = document.createElement('div');
    this.container.className = 'squad-game-loader';
    this.container.style.display = 'none';
    this.container.style.position = 'fixed';
    this.container.style.top = '50%';
    this.container.style.left = '50%';
    this.container.style.transform = 'translate(-50%, -50%)';
    this.container.style.width = '400px';
    this.container.style.backgroundColor = 'rgba(0, 0, 0, 0.9)';
    this.container.style.border = '1px solid #ccc';
    this.container.style.borderRadius = '5px';
    this.container.style.zIndex = '1001';
    this.container.style.padding = '20px';

    // Create header
    const header = document.createElement('div');
    header.className = 'squad-game-loader-header';
    header.style.marginBottom = '20px';
    header.style.display = 'flex';
    header.style.justifyContent = 'space-between';
    header.style.alignItems = 'center';

    this.headerTitle = document.createElement('h2');
    this.headerTitle.textContent = 'Squad Game';
    this.headerTitle.style.margin = '0';
    this.headerTitle.style.color = '#fff';

    const closeButton = document.createElement('button');
    closeButton.textContent = 'X';
    closeButton.style.background = 'none';
    closeButton.style.border = 'none';
    closeButton.style.color = '#fff';
    closeButton.style.cursor = 'pointer';
    closeButton.style.fontSize = '20px';
    closeButton.onclick = () => this.toggle();

    header.appendChild(this.headerTitle);
    header.appendChild(closeButton);

    // Create game settings section
    const settingsSection = document.createElement('div');
    settingsSection.className = 'game-settings-section';
    settingsSection.style.marginBottom = '20px';

    // Create difficulty selector
    const difficultyLabel = document.createElement('label');
    difficultyLabel.textContent = 'Difficulty:';
    difficultyLabel.style.display = 'block';
    difficultyLabel.style.marginBottom = '5px';
    difficultyLabel.style.color = '#fff';

    this.difficultySelect = document.createElement('select');
    this.difficultySelect.style.width = '100%';
    this.difficultySelect.style.padding = '8px';
    this.difficultySelect.style.marginBottom = '15px';
    this.difficultySelect.style.backgroundColor = '#333';
    this.difficultySelect.style.color = '#fff';
    this.difficultySelect.style.border = '1px solid #555';
    this.difficultySelect.style.borderRadius = '3px';

    const difficulties = ['Easy', 'Medium', 'Hard', 'Nightmare', 'Void'];
    difficulties.forEach(diff => {
      const option = document.createElement('option');
      option.value = diff.toLowerCase();
      option.textContent = diff;
      this.difficultySelect.appendChild(option);
    });

    // Create map selector
    const mapLabel = document.createElement('label');
    mapLabel.textContent = 'Map:';
    mapLabel.style.display = 'block';
    mapLabel.style.marginBottom = '5px';
    mapLabel.style.color = '#fff';

    this.mapSelect = document.createElement('select');
    this.mapSelect.style.width = '100%';
    this.mapSelect.style.padding = '8px';
    this.mapSelect.style.marginBottom = '15px';
    this.mapSelect.style.backgroundColor = '#333';
    this.mapSelect.style.color = '#fff';
    this.mapSelect.style.border = '1px solid #555';
    this.mapSelect.style.borderRadius = '3px';

    const maps = ['Classic', 'Desert', 'Forest', 'Snow', 'Volcano'];
    maps.forEach(map => {
      const option = document.createElement('option');
      option.value = map.toLowerCase();
      option.textContent = map;
      this.mapSelect.appendChild(option);
    });

    settingsSection.appendChild(difficultyLabel);
    settingsSection.appendChild(this.difficultySelect);
    settingsSection.appendChild(mapLabel);
    settingsSection.appendChild(this.mapSelect);

    // Create players section
    this.playersSection = document.createElement('div');
    this.playersSection.className = 'players-section';
    this.playersSection.style.marginBottom = '20px';

    const playersLabel = document.createElement('h3');
    playersLabel.textContent = 'Players';
    playersLabel.style.margin = '0 0 10px 0';
    playersLabel.style.color = '#fff';

    this.playersList = document.createElement('div');
    this.playersList.className = 'players-list';
    this.playersList.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
    this.playersList.style.borderRadius = '3px';
    this.playersList.style.padding = '10px';

    this.playersSection.appendChild(playersLabel);
    this.playersSection.appendChild(this.playersList);

    // Create ready button
    this.readyButton = document.createElement('button');
    this.readyButton.textContent = 'Ready';
    this.readyButton.style.padding = '10px';
    this.readyButton.style.backgroundColor = '#4CAF50';
    this.readyButton.style.color = 'white';
    this.readyButton.style.border = 'none';
    this.readyButton.style.borderRadius = '3px';
    this.readyButton.style.cursor = 'pointer';
    this.readyButton.style.width = '100%';
    this.readyButton.style.marginBottom = '10px';
    this.readyButton.onclick = () => this.toggleReady();

    // Create start button (only visible to leader)
    this.startButton = document.createElement('button');
    this.startButton.textContent = 'Start Game';
    this.startButton.style.padding = '10px';
    this.startButton.style.backgroundColor = '#2196F3';
    this.startButton.style.color = 'white';
    this.startButton.style.border = 'none';
    this.startButton.style.borderRadius = '3px';
    this.startButton.style.cursor = 'pointer';
    this.startButton.style.width = '100%';
    this.startButton.style.display = 'none'; // Hidden by default
    this.startButton.onclick = () => this.startGame();

    // Assemble container
    this.container.appendChild(header);
    this.container.appendChild(settingsSection);
    this.container.appendChild(this.playersSection);
    this.container.appendChild(this.readyButton);
    this.container.appendChild(this.startButton);

    // Add to document
    document.body.appendChild(this.container);

    // Create toggle button
    this.createToggleButton();

    console.log('SquadGameLoader UI elements created successfully');
    } catch (error) {
      console.error('Error creating SquadGameLoader UI:', error);
    }
  }

  // Create toggle button
  createToggleButton() {
    const toggleButton = document.createElement('button');
    toggleButton.textContent = 'Squad Game';
    toggleButton.className = 'squad-game-toggle-button';
    toggleButton.style.position = 'fixed';
    toggleButton.style.top = '50px';
    toggleButton.style.right = '10px';
    toggleButton.style.padding = '8px 15px';
    toggleButton.style.backgroundColor = '#4CAF50';
    toggleButton.style.color = 'white';
    toggleButton.style.border = 'none';
    toggleButton.style.borderRadius = '3px';
    toggleButton.style.cursor = 'pointer';
    toggleButton.style.zIndex = '999';
    toggleButton.onclick = () => this.toggle();

    document.body.appendChild(toggleButton);
    this.toggleButton = toggleButton;

    // Hide toggle button if no squad
    if (!this.currentSquad) {
      this.toggleButton.style.display = 'none';
    }
  }

  // Toggle loader visibility
  toggle() {
    // Make sure UI elements are created before updating them
    if (!this.container) {
      return; // UI not ready yet
    }

    this.isVisible = !this.isVisible;
    this.container.style.display = this.isVisible ? 'block' : 'none';

    // Update UI when opening
    if (this.isVisible) {
      this.updateUI();
    }
  }

  // Update UI based on current squad
  updateUI() {
    // Make sure UI elements are created before updating them
    if (!this.headerTitle || !this.toggleButton || !this.playersList ||
        !this.readyButton || !this.startButton) {
      return; // UI not ready yet
    }

    if (!this.currentSquad) {
      this.headerTitle.textContent = 'Squad Game (No Squad)';
      this.toggleButton.style.display = 'none';
      this.playersList.innerHTML = '<p style="color: #ccc; text-align: center;">Not in a squad</p>';
      this.readyButton.disabled = true;
      this.startButton.style.display = 'none';

      // Hide loader if visible
      if (this.isVisible) {
        this.toggle();
      }
      return;
    }

    // Update header
    this.headerTitle.textContent = `Squad Game (${this.currentSquad.code})`;
    this.toggleButton.style.display = 'block';

    // Update players list
    this.playersList.innerHTML = '';

    if (this.currentSquad.members && Array.isArray(this.currentSquad.members)) {
      this.currentSquad.members.forEach(member => {
        const playerItem = document.createElement('div');
        playerItem.className = 'player-item';
        playerItem.style.padding = '5px';
        playerItem.style.marginBottom = '5px';
        playerItem.style.display = 'flex';
        playerItem.style.justifyContent = 'space-between';
        playerItem.style.alignItems = 'center';

        const playerName = document.createElement('span');
        playerName.textContent = member.username + (member.id === this.currentSquad.leaderId ? ' (Leader)' : '');
        playerName.style.color = '#fff';

        const playerStatus = document.createElement('span');
        playerStatus.textContent = this.readyPlayers.has(member.id) ? 'Ready' : 'Not Ready';
        playerStatus.style.color = this.readyPlayers.has(member.id) ? '#4CAF50' : '#f44336';

        playerItem.appendChild(playerName);
        playerItem.appendChild(playerStatus);

        this.playersList.appendChild(playerItem);
      });
    } else {
      this.playersList.innerHTML = '<p style="color: #ccc; text-align: center;">No members found</p>';
    }

    // Get current user
    const currentUser = window.authService.getCurrentUser();
    if (!currentUser) return;

    // Update ready button
    const isCurrentUserReady = this.readyPlayers.has(currentUser.id);
    this.readyButton.textContent = isCurrentUserReady ? 'Cancel Ready' : 'Ready';
    this.readyButton.style.backgroundColor = isCurrentUserReady ? '#f44336' : '#4CAF50';

    // Show start button only to leader
    const isLeader = this.currentSquad.leaderId === currentUser.id;
    this.startButton.style.display = isLeader ? 'block' : 'none';

    // Enable start button only if all players are ready
    const allReady = this.currentSquad.members && Array.isArray(this.currentSquad.members) &&
                     this.currentSquad.members.every(member => this.readyPlayers.has(member.id));
    this.startButton.disabled = !allReady;
    this.startButton.style.opacity = allReady ? '1' : '0.5';
  }

  // Toggle ready status
  async toggleReady() {
    if (!this.currentSquad) return;

    // Make sure UI elements are created before updating them
    if (!this.difficultySelect || !this.mapSelect) {
      return; // UI not ready yet
    }

    const currentUser = window.authService.getCurrentUser();
    if (!currentUser) return;

    const userId = currentUser.id;
    const isReady = this.readyPlayers.has(userId);

    if (isReady) {
      this.readyPlayers.delete(userId);
    } else {
      this.readyPlayers.add(userId);
    }

    // Send ready status to other players
    const gameState = {
      type: 'ready-status',
      userId,
      isReady: !isReady,
      settings: {
        difficulty: this.difficultySelect.value,
        map: this.mapSelect.value
      }
    };

    if (window.restCommunicationService) {
      await window.restCommunicationService.sendGameState(gameState, this.currentSquad.id);
    } else if (window.squadService) {
      await window.squadService.sendGameState(gameState);
    }

    this.updateUI();
  }

  // Handle game state update from other players
  handleGameStateUpdate(update) {
    if (!update || !update.gameState) return;

    const { type, userId, isReady, settings, action } = update.gameState;

    if (type === 'ready-status') {
      if (isReady) {
        this.readyPlayers.add(userId);
      } else {
        this.readyPlayers.delete(userId);
      }

      // Update settings if provided
      if (settings) {
        this.difficultySelect.value = settings.difficulty;
        this.mapSelect.value = settings.map;
      }

      this.updateUI();
    } else if (type === 'game-start') {
      // Start the game with the provided settings
      this.startGameWithSettings(settings);
    }
  }

  // Start the game (leader only)
  async startGame() {
    if (!this.currentSquad) return;

    // Make sure UI elements are created before updating them
    if (!this.difficultySelect || !this.mapSelect) {
      return; // UI not ready yet
    }

    const currentUser = window.authService.getCurrentUser();
    if (!currentUser) return;

    // Check if user is the leader
    const isLeader = this.currentSquad.leaderId === currentUser.id;
    if (!isLeader) return;

    // Check if all players are ready
    const allReady = this.currentSquad.members && Array.isArray(this.currentSquad.members) &&
                     this.currentSquad.members.every(member => this.readyPlayers.has(member.id));
    if (!allReady) return;

    // Get game settings
    const settings = {
      difficulty: this.difficultySelect.value,
      map: this.mapSelect.value
    };

    // Send game start to all players
    const gameState = {
      type: 'game-start',
      settings
    };

    if (window.restCommunicationService) {
      await window.restCommunicationService.sendGameState(gameState, this.currentSquad.id);
    } else if (window.squadService) {
      await window.squadService.sendGameState(gameState);
    }

    // Start the game locally
    this.startGameWithSettings(settings);
  }

  // Start the game with the provided settings
  startGameWithSettings(settings) {
    // Make sure UI elements are created before updating them
    if (!this.container) {
      return; // UI not ready yet
    }

    // Close the loader
    if (this.isVisible) {
      this.toggle();
    }

    // Start the game with the provided settings
    if (window.game) {
      // Reset ready status
      this.readyPlayers.clear();

      try {
        // Start the game
        window.game.startGame(settings.difficulty, settings.map);

        // Show a notification
        const notification = document.createElement('div');
        notification.textContent = 'Squad game started!';
        notification.style.position = 'fixed';
        notification.style.top = '20px';
        notification.style.left = '50%';
        notification.style.transform = 'translateX(-50%)';
        notification.style.padding = '10px 20px';
        notification.style.backgroundColor = '#4CAF50';
        notification.style.color = 'white';
        notification.style.borderRadius = '5px';
        notification.style.zIndex = '9999';

        document.body.appendChild(notification);

        // Remove notification after 3 seconds
        setTimeout(() => {
          if (document.body.contains(notification)) {
            document.body.removeChild(notification);
          }
        }, 3000);
      } catch (error) {
        console.error('Error starting game:', error);
        alert('Failed to start the game. Please try again.');
      }
    } else {
      console.error('Game object not available');
    }
  }
}

// Create a singleton instance
window.squadGameLoader = new SquadGameLoader();
