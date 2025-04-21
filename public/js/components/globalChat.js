/**
 * Global Chat Component
 * Provides a global chat interface for all players
 */
class GlobalChat {
  constructor() {
    this.messages = [];
    this.listeners = [];
    this.isVisible = false;
    this.container = null;
    this.messageList = null;
    this.inputField = null;
    this.sendButton = null;
    this.connectionStatus = null;

    // Create UI elements
    this.createUI();

    // Initialize messages from communication service
    if (window.communicationService) {
      // Load existing messages
      this.messages = window.communicationService.getMessages('global');
      this.updateMessageList();

      // Listen for new messages
      window.communicationService.addMessageListener((type, message) => {
        if (type === 'global') {
          this.addMessage(message);
        }
      });

      // Listen for connection state changes
      window.communicationService.addStateListener((state) => {
        this.updateConnectionStatus(state);
      });
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

    if (!window.communicationService) {
      console.error('Communication service not available');
      return;
    }

    const success = await window.communicationService.sendMessage('global', message);
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
    // Check if message already exists
    if (this.messages.some(m => m.id === message.id)) {
      return;
    }

    this.messages.push(message);

    // Add message to UI
    this.addMessageToUI(message);

    // Notify listeners
    this.notifyListeners();
  }

  // Add a message to the UI
  addMessageToUI(message) {
    if (!this.messageList) return;

    // Create message element
    const messageElement = document.createElement('div');
    messageElement.className = 'chat-message';
    messageElement.style.marginBottom = '10px';

    const username = document.createElement('span');
    username.className = 'chat-username';
    username.textContent = message.username;
    username.style.fontWeight = 'bold';
    username.style.color = '#4CAF50';
    username.style.marginRight = '5px';

    const timestamp = document.createElement('span');
    timestamp.className = 'chat-timestamp';
    timestamp.textContent = new Date(message.timestamp).toLocaleTimeString();
    timestamp.style.fontSize = '0.8em';
    timestamp.style.color = '#999';
    timestamp.style.marginLeft = '5px';

    const content = document.createElement('div');
    content.className = 'chat-content';
    content.textContent = message.message;
    content.style.color = '#fff';
    content.style.wordBreak = 'break-word';

    messageElement.appendChild(username);
    messageElement.appendChild(timestamp);
    messageElement.appendChild(content);

    this.messageList.appendChild(messageElement);

    // Scroll to bottom
    this.messageList.scrollTop = this.messageList.scrollHeight;
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
