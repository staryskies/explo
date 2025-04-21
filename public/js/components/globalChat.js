/**
 * Global Chat Component
 * Provides a global chat interface for all players
 */
class GlobalChat {
  // Static initialization flag to prevent multiple initializations
  static initialized = false;
  constructor() {
    // Prevent multiple initializations
    if (GlobalChat.initialized) {
      console.warn('GlobalChat already initialized');
      return;
    }
    GlobalChat.initialized = true;

    // Initialize properties
    this.messages = [];
    this.listeners = [];
    this.isVisible = false;

    // UI elements - will be created in createUI
    this.container = null;
    this.messageList = null;
    this.inputField = null;
    this.sendButton = null;
    this.connectionStatus = null;

    // Defer initialization to ensure DOM is ready
    setTimeout(() => this.initialize(), 100);
  }

  // Initialize the component
  initialize() {
    console.log('Initializing GlobalChat component');

    try {
      // Create UI elements first
      this.createUI();

      // Initialize messages from REST communication service
      if (window.restCommunicationService) {
        // Load existing messages
        this.messages = window.restCommunicationService.getMessages('global');
        this.updateMessageList();

        // Listen for new messages
        window.restCommunicationService.addMessageListener((type, message) => {
          if (type === 'global') {
            this.addMessage(message);
          }
        });

        // Listen for connection state changes
        window.restCommunicationService.addStateListener((state) => {
          this.updateConnectionStatus(state);
        });
      }

      console.log('GlobalChat initialized successfully');
    } catch (error) {
      console.error('Error initializing GlobalChat:', error);
    }
  }

  // Update connection status display
  updateConnectionStatus(state) {
    if (!this.connectionStatus) return;

    if (state.connected) {
      this.connectionStatus.textContent = `Connected (${state.method})`;
      this.connectionStatus.style.color = '#4CAF50';
    } else {
      this.connectionStatus.textContent = 'Disconnected';
      this.connectionStatus.style.color = '#f44336';
    }
  }

  // Create UI elements
  createUI() {
    try {
      console.log('Creating GlobalChat UI elements');
    // Create container
    this.container = document.createElement('div');
    this.container.className = 'chat-container global-chat';
    this.container.style.display = 'none';
    this.container.style.position = 'fixed';
    this.container.style.bottom = '10px';
    this.container.style.left = '10px';
    this.container.style.width = '300px';
    this.container.style.height = '400px';
    this.container.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    this.container.style.border = '1px solid #ccc';
    this.container.style.borderRadius = '5px';
    this.container.style.zIndex = '1000';
    this.container.style.display = 'flex';
    this.container.style.flexDirection = 'column';

    // Create header
    const header = document.createElement('div');
    header.className = 'chat-header';
    header.style.padding = '10px';
    header.style.borderBottom = '1px solid #ccc';
    header.style.display = 'flex';
    header.style.justifyContent = 'space-between';
    header.style.alignItems = 'center';

    const title = document.createElement('h3');
    title.textContent = 'Global Chat';
    title.style.margin = '0';
    title.style.color = '#fff';

    const closeButton = document.createElement('button');
    closeButton.textContent = 'X';
    closeButton.style.background = 'none';
    closeButton.style.border = 'none';
    closeButton.style.color = '#fff';
    closeButton.style.cursor = 'pointer';
    closeButton.style.fontSize = '16px';
    closeButton.onclick = () => this.toggle();

    header.appendChild(title);
    header.appendChild(closeButton);

    // Create connection status
    this.connectionStatus = document.createElement('div');
    this.connectionStatus.className = 'connection-status';
    this.connectionStatus.textContent = 'Connecting...';
    this.connectionStatus.style.fontSize = '0.8em';
    this.connectionStatus.style.color = '#999';
    this.connectionStatus.style.padding = '5px 10px';
    this.connectionStatus.style.textAlign = 'center';
    this.connectionStatus.style.borderBottom = '1px solid #333';

    // Create message list
    this.messageList = document.createElement('div');
    this.messageList.className = 'chat-messages';
    this.messageList.style.flex = '1';
    this.messageList.style.overflowY = 'auto';
    this.messageList.style.padding = '10px';

    // Create input area
    const inputArea = document.createElement('div');
    inputArea.className = 'chat-input';
    inputArea.style.padding = '10px';
    inputArea.style.borderTop = '1px solid #ccc';
    inputArea.style.display = 'flex';

    this.inputField = document.createElement('input');
    this.inputField.type = 'text';
    this.inputField.placeholder = 'Type a message...';
    this.inputField.style.flex = '1';
    this.inputField.style.padding = '8px';
    this.inputField.style.border = '1px solid #ccc';
    this.inputField.style.borderRadius = '3px';
    this.inputField.style.marginRight = '5px';
    this.inputField.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.sendMessage();
      }
    });

    this.sendButton = document.createElement('button');
    this.sendButton.textContent = 'Send';
    this.sendButton.style.padding = '8px 15px';
    this.sendButton.style.backgroundColor = '#4CAF50';
    this.sendButton.style.color = 'white';
    this.sendButton.style.border = 'none';
    this.sendButton.style.borderRadius = '3px';
    this.sendButton.style.cursor = 'pointer';
    this.sendButton.onclick = () => this.sendMessage();

    inputArea.appendChild(this.inputField);
    inputArea.appendChild(this.sendButton);

    // Assemble container
    this.container.appendChild(header);
    this.container.appendChild(this.connectionStatus);
    this.container.appendChild(this.messageList);
    this.container.appendChild(inputArea);

    // Add to document
    document.body.appendChild(this.container);

    // Create toggle button
    this.createToggleButton();

    console.log('GlobalChat UI elements created successfully');
    } catch (error) {
      console.error('Error creating GlobalChat UI:', error);
    }
  }

  // Create toggle button
  createToggleButton() {
    const toggleButton = document.createElement('button');
    toggleButton.textContent = 'Global Chat';
    toggleButton.className = 'chat-toggle-button';
    toggleButton.style.position = 'fixed';
    toggleButton.style.bottom = '10px';
    toggleButton.style.left = '10px';
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
  }

  // Toggle chat visibility
  toggle() {
    this.isVisible = !this.isVisible;
    this.container.style.display = this.isVisible ? 'flex' : 'none';
    this.toggleButton.style.display = this.isVisible ? 'none' : 'block';
  }

  // Send a message
  async sendMessage() {
    const message = this.inputField.value.trim();
    if (!message) return;

    if (!window.restCommunicationService) {
      console.error('REST communication service not available');
      return;
    }

    const success = await window.restCommunicationService.sendMessage('global', message);
    if (success) {
      this.inputField.value = '';
    } else {
      alert('Failed to send message. Please try again.');
    }
  }

  // Update message list with all messages
  updateMessageList() {
    if (!this.messageList) return;

    // Clear existing messages
    this.messageList.innerHTML = '';

    // Add all messages
    this.messages.forEach(message => {
      this.addMessageToUI(message);
    });

    // Scroll to bottom
    this.messageList.scrollTop = this.messageList.scrollHeight;
  }

  // Add a message to the chat
  addMessage(message) {
    try {
      // Validate message
      if (!message) {
        console.warn('Attempted to add null/undefined message');
        return;
      }

      // Ensure message has an ID
      if (!message.id) {
        message.id = 'local_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      }

      // Check if message already exists
      if (this.messages.some(m => m.id === message.id)) {
        return;
      }

      // Ensure message has required fields
      if (!message.username) message.username = 'Unknown';
      if (!message.timestamp) message.timestamp = new Date().toISOString();
      if (!message.message) message.message = '';

      // Add to messages array
      this.messages.push(message);

      // Add message to UI if UI is ready
      if (this.messageList) {
        this.addMessageToUI(message);
      }

      // Notify listeners
      this.notifyListeners();

      // Limit cache size
      if (this.messages.length > 100) {
        this.messages = this.messages.slice(-100);
      }
    } catch (error) {
      console.error('Error adding message:', error);
    }
  }

  // Add a message to the UI
  addMessageToUI(message) {
    try {
      if (!this.messageList) return;

      // Create message element
      const messageElement = document.createElement('div');
      messageElement.className = 'chat-message';
      messageElement.style.marginBottom = '10px';

      const username = document.createElement('span');
      username.className = 'chat-username';
      username.textContent = message.username || 'Unknown';
      username.style.fontWeight = 'bold';
      username.style.color = '#4CAF50';
      username.style.marginRight = '5px';

      const timestamp = document.createElement('span');
      timestamp.className = 'chat-timestamp';
      try {
        timestamp.textContent = new Date(message.timestamp).toLocaleTimeString();
      } catch (dateError) {
        timestamp.textContent = new Date().toLocaleTimeString();
      }
      timestamp.style.fontSize = '0.8em';
      timestamp.style.color = '#999';
      timestamp.style.marginLeft = '5px';

      const content = document.createElement('div');
      content.className = 'chat-content';
      content.textContent = message.message || '';
      content.style.color = '#fff';
      content.style.wordBreak = 'break-word';

      messageElement.appendChild(username);
      messageElement.appendChild(timestamp);
      messageElement.appendChild(content);

      this.messageList.appendChild(messageElement);

      // Scroll to bottom
      this.messageList.scrollTop = this.messageList.scrollHeight;
    } catch (error) {
      console.error('Error adding message to UI:', error);
    }
  }

  // Add message listener
  addListener(callback) {
    this.listeners.push(callback);
    return () => this.removeListener(callback);
  }

  // Remove message listener
  removeListener(callback) {
    this.listeners = this.listeners.filter(listener => listener !== callback);
  }

  // Notify all listeners
  notifyListeners() {
    this.listeners.forEach(listener => listener(this.messages));
  }
}

// Create a singleton instance
window.globalChat = new GlobalChat();
