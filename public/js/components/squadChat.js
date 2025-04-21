/**
 * Squad Chat Component
 * Provides a chat interface for squad members
 */
class SquadChat {
  constructor() {
    this.messages = [];
    this.listeners = [];
    this.isVisible = false;
    this.container = null;
    this.messageList = null;
    this.inputField = null;
    this.sendButton = null;
    this.currentSquad = null;
    this.headerTitle = null;
    this.toggleButton = null;
    this.membersList = null;
    this.squadCode = null;
    this.leaveButton = null;

    // Create UI elements first
    this.createUI();

    // Initialize when squad service is ready
    if (window.squadService) {
      window.squadService.addListener(squad => {
        this.currentSquad = squad;
        this.updateHeader();

        // If we have a squad, tell the REST communication service about it
        if (window.restCommunicationService && squad) {
          window.restCommunicationService.setCurrentSquad(squad);

          // Load existing messages for this squad
          const messages = window.restCommunicationService.getMessages('squad', squad.id);
          messages.forEach(message => this.addMessage(message));
        }
      });
    }

    // Add message listener to REST communication service
    if (window.restCommunicationService) {
      window.restCommunicationService.addMessageListener((type, message) => {
        if (type === 'squad' && this.currentSquad && message.squadId === this.currentSquad.id) {
          this.addMessage(message);
        }
      });
    }
  }

  // Create UI elements
  createUI() {
    // Create container
    this.container = document.createElement('div');
    this.container.className = 'chat-container squad-chat';
    this.container.style.display = 'none';
    this.container.style.position = 'fixed';
    this.container.style.bottom = '10px';
    this.container.style.right = '10px';
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

    this.headerTitle = document.createElement('h3');
    this.headerTitle.textContent = 'Squad Chat';
    this.headerTitle.style.margin = '0';
    this.headerTitle.style.color = '#fff';

    const closeButton = document.createElement('button');
    closeButton.textContent = 'X';
    closeButton.style.background = 'none';
    closeButton.style.border = 'none';
    closeButton.style.color = '#fff';
    closeButton.style.cursor = 'pointer';
    closeButton.style.fontSize = '16px';
    closeButton.onclick = () => this.toggle();

    header.appendChild(this.headerTitle);
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

    // Create squad info section
    this.squadInfo = document.createElement('div');
    this.squadInfo.className = 'squad-info';
    this.squadInfo.style.padding = '10px';
    this.squadInfo.style.borderTop = '1px solid #ccc';
    this.squadInfo.style.backgroundColor = 'rgba(33, 150, 243, 0.1)';

    // Create members list
    this.membersList = document.createElement('div');
    this.membersList.className = 'members-list';
    this.membersList.style.fontSize = '0.9em';
    this.membersList.style.color = '#ccc';

    // Create squad code
    this.squadCode = document.createElement('div');
    this.squadCode.className = 'squad-code';
    this.squadCode.style.marginTop = '5px';
    this.squadCode.style.fontSize = '0.9em';
    this.squadCode.style.color = '#4CAF50';

    // Create leave button
    this.leaveButton = document.createElement('button');
    this.leaveButton.textContent = 'Leave Squad';
    this.leaveButton.style.marginTop = '10px';
    this.leaveButton.style.padding = '5px 10px';
    this.leaveButton.style.backgroundColor = '#f44336';
    this.leaveButton.style.color = 'white';
    this.leaveButton.style.border = 'none';
    this.leaveButton.style.borderRadius = '3px';
    this.leaveButton.style.cursor = 'pointer';
    this.leaveButton.style.width = '100%';
    this.leaveButton.onclick = () => this.leaveSquad();

    this.squadInfo.appendChild(this.membersList);
    this.squadInfo.appendChild(this.squadCode);
    this.squadInfo.appendChild(this.leaveButton);

    // Assemble container
    this.container.appendChild(header);
    this.container.appendChild(this.messageList);
    this.container.appendChild(inputArea);
    this.container.appendChild(this.squadInfo);

    // Add to document
    document.body.appendChild(this.container);

    // Create toggle button
    this.createToggleButton();

    // Update header and squad info
    this.updateHeader();
    this.updateSquadInfo();
  }

  // Create toggle button
  createToggleButton() {
    const toggleButton = document.createElement('button');
    toggleButton.textContent = 'Squad Chat';
    toggleButton.className = 'chat-toggle-button squad-chat-toggle';
    toggleButton.style.position = 'fixed';
    toggleButton.style.bottom = '10px';
    toggleButton.style.right = '10px';
    toggleButton.style.padding = '8px 15px';
    toggleButton.style.backgroundColor = '#2196F3';
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

  // Update header based on current squad
  updateHeader() {
    // Make sure UI elements are created before updating them
    if (!this.headerTitle || !this.toggleButton) {
      return; // UI not ready yet, will be updated when createUI is called
    }

    if (this.currentSquad) {
      this.headerTitle.textContent = `Squad Chat (${this.currentSquad.code})`;
      this.toggleButton.style.display = 'block';
    } else {
      this.headerTitle.textContent = 'Squad Chat (No Squad)';
      this.toggleButton.style.display = 'none';

      // Hide chat if visible
      if (this.isVisible) {
        this.toggle();
      }
    }

    this.updateSquadInfo();
  }

  // Update squad info section
  updateSquadInfo() {
    // Make sure UI elements are created before updating them
    if (!this.membersList || !this.squadCode || !this.leaveButton) {
      return; // UI not ready yet, will be updated when createUI is called
    }

    if (!this.currentSquad) {
      this.membersList.textContent = 'Not in a squad';
      this.squadCode.textContent = '';
      this.leaveButton.style.display = 'none';
      return;
    }

    // Update members list
    this.membersList.innerHTML = '<strong>Members:</strong><br>';
    if (this.currentSquad.members && Array.isArray(this.currentSquad.members)) {
      this.currentSquad.members.forEach(member => {
        const memberElement = document.createElement('div');
        memberElement.textContent = member.username + (member.id === this.currentSquad.leaderId ? ' (Leader)' : '');
        this.membersList.appendChild(memberElement);
      });
    } else {
      this.membersList.innerHTML += '<div>No members found</div>';
    }

    // Update squad code
    this.squadCode.textContent = `Squad Code: ${this.currentSquad.code}`;

    // Show leave button
    this.leaveButton.style.display = 'block';
  }

  // Toggle chat visibility
  toggle() {
    // Make sure UI elements are created before updating them
    if (!this.container || !this.toggleButton) {
      return; // UI not ready yet
    }

    this.isVisible = !this.isVisible;
    this.container.style.display = this.isVisible ? 'flex' : 'none';
    this.toggleButton.style.display = this.isVisible ? 'none' : 'block';

    // Update squad info when opening
    if (this.isVisible) {
      this.updateSquadInfo();
    }
  }

  // Send a message
  async sendMessage() {
    const message = this.inputField.value.trim();
    if (!message || !this.currentSquad) return;

    if (!window.restCommunicationService) {
      console.error('REST communication service not available');
      return;
    }

    const success = await window.restCommunicationService.sendMessage('squad', message, this.currentSquad.id);
    if (success) {
      this.inputField.value = '';
    } else {
      alert('Failed to send message. Please try again.');
    }
  }

  // Add a message to the chat
  addMessage(message) {
    // Check if message already exists in our list
    if (this.messages.some(m => m.id === message.id)) {
      return; // Skip duplicate messages
    }

    this.messages.push(message);

    // Make sure UI elements are created before updating them
    if (!this.messageList) {
      return; // UI not ready yet
    }

    // Create message element
    const messageElement = document.createElement('div');
    messageElement.className = 'chat-message';
    messageElement.style.marginBottom = '10px';

    const username = document.createElement('span');
    username.className = 'chat-username';
    username.textContent = message.username || 'Unknown';
    username.style.fontWeight = 'bold';
    username.style.color = '#2196F3';
    username.style.marginRight = '5px';

    const timestamp = document.createElement('span');
    timestamp.className = 'chat-timestamp';
    timestamp.textContent = new Date(message.timestamp || Date.now()).toLocaleTimeString();
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

    // Notify listeners
    this.notifyListeners();
  }

  // Leave the current squad
  async leaveSquad() {
    if (!this.currentSquad) return;

    // Make sure UI elements are created before updating them
    if (!this.container || !this.toggleButton) {
      return; // UI not ready yet
    }

    if (confirm('Are you sure you want to leave this squad?')) {
      try {
        if (!window.squadService) {
          console.error('Squad service not available');
          return;
        }

        await window.squadService.leaveSquad();

        // Close chat
        if (this.isVisible) {
          this.toggle();
        }
      } catch (error) {
        console.error('Leave squad error:', error);
        alert('Failed to leave squad. Please try again.');
      }
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
window.squadChat = new SquadChat();
