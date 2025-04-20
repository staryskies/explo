/**
 * Global Chat Component
 * Provides a global chat interface for all players
 */
class GlobalChat {
  constructor() {
    this.messages = [];
    this.listeners = [];
    this.socket = null;
    this.isVisible = false;
    this.container = null;
    this.messageList = null;
    this.inputField = null;
    this.sendButton = null;
    
    // Initialize when auth service is ready
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
    
    // Create UI elements
    this.createUI();
  }
  
  // Initialize socket connection
  initSocket() {
    if (this.socket) {
      this.disconnectSocket();
    }
    
    const token = window.authService.getToken();
    if (!token) return;
    
    // Use the same socket as squadService if available
    if (window.squadService && window.squadService.socket) {
      this.socket = window.squadService.socket;
      this.setupSocketListeners();
      return;
    }
    
    // Create socket connection with auth token
    this.socket = io({
      auth: { token },
      query: { token },
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
      autoConnect: true,
      transports: ['polling', 'websocket']
    });
    
    this.setupSocketListeners();
  }
  
  // Set up socket event listeners
  setupSocketListeners() {
    if (!this.socket) return;
    
    // Remove any existing listeners to prevent duplicates
    this.socket.off('global-message');
    
    // Listen for global messages
    this.socket.on('global-message', (message) => {
      this.addMessage(message);
    });
  }
  
  // Disconnect socket
  disconnectSocket() {
    // Don't disconnect if it's shared with squadService
    if (window.squadService && window.squadService.socket === this.socket) {
      this.socket = null;
      return;
    }
    
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
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
  sendMessage() {
    const message = this.inputField.value.trim();
    if (!message) return;
    
    if (!this.socket || !this.socket.connected) {
      console.error('Socket not connected');
      return;
    }
    
    this.socket.emit('global-message', { message });
    this.inputField.value = '';
  }
  
  // Add a message to the chat
  addMessage(message) {
    this.messages.push(message);
    
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
    
    // Notify listeners
    this.notifyListeners();
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
