/**
 * Money Sharing Component for Squad Games
 * Allows players to share silver with squad members
 */
class MoneySharing {
  // Static initialization flag to prevent multiple initializations
  static initialized = false;

  constructor() {
    // Prevent multiple initializations
    if (MoneySharing.initialized) {
      console.warn('MoneySharing already initialized');
      return;
    }
    MoneySharing.initialized = true;

    // Initialize properties
    this.currentSquad = null;
    this.isVisible = false;
    this.listeners = [];

    // UI elements - will be created in createUI
    this.container = null;
    this.membersList = null;
    this.amountInput = null;
    this.sendButton = null;
    this.toggleButton = null;
    this.headerTitle = null;

    // Defer initialization to ensure DOM is ready
    setTimeout(() => this.initialize(), 100);
  }

  // Initialize the component
  initialize() {
    console.log('Initializing MoneySharing component');

    // Create UI elements first
    this.createUI();

    // Initialize when squad service is ready
    if (window.squadService) {
      window.squadService.addListener(squad => {
        console.log('Squad updated in MoneySharing:', squad);
        this.currentSquad = squad;

        // Only update UI if elements are created
        if (this.headerTitle && this.toggleButton) {
          this.updateUI();
        }
      });
    }

    // Add socket event listener for receiving money
    if (window.restCommunicationService && window.restCommunicationService.socket) {
      window.restCommunicationService.socket.on('money-shared', data => {
        this.handleMoneyReceived(data);
      });
    }
  }

  // Create UI elements
  createUI() {
    try {
      console.log('Creating MoneySharing UI elements');
      // Create container
      this.container = document.createElement('div');
      this.container.className = 'money-sharing-container';
      this.container.style.display = 'none';
      this.container.style.position = 'fixed';
      this.container.style.bottom = '10px';
      this.container.style.right = '320px'; // Position next to chat
      this.container.style.width = '250px';
      this.container.style.height = '300px';
      this.container.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
      this.container.style.border = '1px solid #ccc';
      this.container.style.borderRadius = '5px';
      this.container.style.zIndex = '1000';
      this.container.style.display = 'flex';
      this.container.style.flexDirection = 'column';

      // Create header
      const header = document.createElement('div');
      header.className = 'money-sharing-header';
      header.style.padding = '10px';
      header.style.borderBottom = '1px solid #ccc';
      header.style.display = 'flex';
      header.style.justifyContent = 'space-between';
      header.style.alignItems = 'center';
      header.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';

      // Create header title
      this.headerTitle = document.createElement('div');
      this.headerTitle.className = 'money-sharing-title';
      this.headerTitle.textContent = 'Share Silver';
      this.headerTitle.style.fontWeight = 'bold';
      this.headerTitle.style.color = '#fff';

      // Create close button
      const closeButton = document.createElement('button');
      closeButton.className = 'money-sharing-close-btn';
      closeButton.textContent = 'X';
      closeButton.style.background = 'none';
      closeButton.style.border = 'none';
      closeButton.style.color = '#fff';
      closeButton.style.fontSize = '16px';
      closeButton.style.cursor = 'pointer';
      closeButton.addEventListener('click', () => this.toggle());

      // Add elements to header
      header.appendChild(this.headerTitle);
      header.appendChild(closeButton);

      // Create members list
      this.membersList = document.createElement('div');
      this.membersList.className = 'money-sharing-members';
      this.membersList.style.flex = '1';
      this.membersList.style.overflowY = 'auto';
      this.membersList.style.padding = '10px';
      this.membersList.style.color = '#fff';

      // Create input area
      const inputArea = document.createElement('div');
      inputArea.className = 'money-sharing-input-area';
      inputArea.style.padding = '10px';
      inputArea.style.borderTop = '1px solid #ccc';
      inputArea.style.display = 'flex';
      inputArea.style.flexDirection = 'column';
      inputArea.style.gap = '5px';

      // Create amount label
      const amountLabel = document.createElement('label');
      amountLabel.textContent = 'Amount to share:';
      amountLabel.style.color = '#fff';
      amountLabel.style.fontSize = '14px';

      // Create amount input
      this.amountInput = document.createElement('input');
      this.amountInput.type = 'number';
      this.amountInput.min = '1';
      this.amountInput.max = '1000';
      this.amountInput.value = '100';
      this.amountInput.style.padding = '5px';
      this.amountInput.style.borderRadius = '3px';
      this.amountInput.style.border = '1px solid #ccc';
      this.amountInput.style.backgroundColor = '#333';
      this.amountInput.style.color = '#fff';

      // Create send button
      this.sendButton = document.createElement('button');
      this.sendButton.textContent = 'Share Silver';
      this.sendButton.style.padding = '8px';
      this.sendButton.style.marginTop = '5px';
      this.sendButton.style.backgroundColor = '#4CAF50';
      this.sendButton.style.color = '#fff';
      this.sendButton.style.border = 'none';
      this.sendButton.style.borderRadius = '3px';
      this.sendButton.style.cursor = 'pointer';
      this.sendButton.addEventListener('click', () => this.shareMoney());

      // Add elements to input area
      inputArea.appendChild(amountLabel);
      inputArea.appendChild(this.amountInput);
      inputArea.appendChild(this.sendButton);

      // Assemble container
      this.container.appendChild(header);
      this.container.appendChild(this.membersList);
      this.container.appendChild(inputArea);

      // Add to document
      document.body.appendChild(this.container);

      // Create toggle button
      this.createToggleButton();

      // Update UI
      this.updateUI();

      console.log('MoneySharing UI elements created successfully');
    } catch (error) {
      console.error('Error creating MoneySharing UI:', error);
    }
  }

  // Create toggle button
  createToggleButton() {
    this.toggleButton = document.createElement('button');
    this.toggleButton.className = 'money-sharing-toggle-btn';
    this.toggleButton.textContent = '💰 Share Silver';
    this.toggleButton.style.position = 'fixed';
    this.toggleButton.style.bottom = '420px'; // Position above chat toggle
    this.toggleButton.style.right = '10px';
    this.toggleButton.style.padding = '8px 12px';
    this.toggleButton.style.backgroundColor = '#4CAF50';
    this.toggleButton.style.color = '#fff';
    this.toggleButton.style.border = 'none';
    this.toggleButton.style.borderRadius = '5px';
    this.toggleButton.style.cursor = 'pointer';
    this.toggleButton.style.zIndex = '1000';
    this.toggleButton.style.display = 'none'; // Hidden by default
    this.toggleButton.addEventListener('click', () => this.toggle());

    document.body.appendChild(this.toggleButton);
  }

  // Update UI based on current squad
  updateUI() {
    // Make sure UI elements are created before updating them
    if (!this.headerTitle || !this.toggleButton || !this.membersList) {
      return; // UI not ready yet
    }

    if (this.currentSquad) {
      this.headerTitle.textContent = `Share Silver (Squad: ${this.currentSquad.code})`;
      this.toggleButton.style.display = 'block';

      // Update members list
      this.updateMembersList();
    } else {
      this.headerTitle.textContent = 'Share Silver (No Squad)';
      this.toggleButton.style.display = 'none';

      // Hide if visible
      if (this.isVisible) {
        this.toggle();
      }

      // Show "No Squad" message
      this.membersList.innerHTML = '<div style="text-align: center; padding: 20px; color: #999; font-style: italic;">You are not in a squad. Join or create a squad to share silver.</div>';
    }
  }

  // Update members list
  updateMembersList() {
    if (!this.currentSquad || !this.membersList) return;

    this.membersList.innerHTML = '<div style="font-weight: bold; margin-bottom: 10px;">Squad Members:</div>';

    if (this.currentSquad.members && Array.isArray(this.currentSquad.members)) {
      // Get current user ID
      const currentUserId = window.authService ? window.authService.getCurrentUser()?.id : null;

      this.currentSquad.members.forEach(member => {
        // Skip current user
        if (member.id === currentUserId) return;

        const memberElement = document.createElement('div');
        memberElement.className = 'money-sharing-member';
        memberElement.style.display = 'flex';
        memberElement.style.justifyContent = 'space-between';
        memberElement.style.alignItems = 'center';
        memberElement.style.padding = '8px';
        memberElement.style.marginBottom = '5px';
        memberElement.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
        memberElement.style.borderRadius = '3px';

        // Member name
        const nameElement = document.createElement('div');
        nameElement.textContent = member.username + (member.id === this.currentSquad.leaderId ? ' (Leader)' : '');

        // Share button
        const shareButton = document.createElement('button');
        shareButton.textContent = 'Share';
        shareButton.style.padding = '5px 10px';
        shareButton.style.backgroundColor = '#4CAF50';
        shareButton.style.color = '#fff';
        shareButton.style.border = 'none';
        shareButton.style.borderRadius = '3px';
        shareButton.style.cursor = 'pointer';
        shareButton.addEventListener('click', () => this.shareMoney(member.id));

        memberElement.appendChild(nameElement);
        memberElement.appendChild(shareButton);
        this.membersList.appendChild(memberElement);
      });
    } else {
      this.membersList.innerHTML += '<div style="text-align: center; padding: 10px; color: #999;">No other members found</div>';
    }
  }

  // Toggle visibility
  toggle() {
    // Make sure UI elements are created before updating them
    if (!this.container || !this.toggleButton) {
      return; // UI not ready yet
    }

    this.isVisible = !this.isVisible;
    this.container.style.display = this.isVisible ? 'flex' : 'none';
    this.toggleButton.style.display = this.isVisible ? 'none' : 'block';

    // Update members list when opening
    if (this.isVisible) {
      this.updateMembersList();
    }
  }

  // Share money with a squad member
  async shareMoney(targetUserId) {
    if (!this.currentSquad) return;

    // Get amount from input
    const amount = parseInt(this.amountInput.value);
    if (isNaN(amount) || amount <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    // Check if player has enough silver
    const currentSilver = window.playerData ? window.playerData.silver : 0;
    if (currentSilver < amount) {
      alert('Not enough silver');
      return;
    }

    try {
      // If no specific target, share with all squad members
      if (!targetUserId) {
        // Get all squad members except current user
        const currentUserId = window.authService ? window.authService.getCurrentUser()?.id : null;
        const otherMembers = this.currentSquad.members.filter(member => member.id !== currentUserId);

        if (otherMembers.length === 0) {
          alert('No other members in the squad');
          return;
        }

        // Calculate amount per member
        const amountPerMember = Math.floor(amount / otherMembers.length);
        if (amountPerMember <= 0) {
          alert('Amount too small to share with all members');
          return;
        }

        // Share with each member
        for (const member of otherMembers) {
          await this.sendMoneyToMember(member.id, amountPerMember);
        }

        // Spend total silver
        if (window.spendSilver) {
          window.spendSilver(amountPerMember * otherMembers.length);
        } else if (window.playerData) {
          window.playerData.silver -= amountPerMember * otherMembers.length;
          if (window.savePlayerData) window.savePlayerData();
          if (window.updateSilverDisplay) window.updateSilverDisplay();
        }

        // Show success message
        alert(`Shared ${amountPerMember} silver with each squad member`);
      } else {
        // Share with specific member
        await this.sendMoneyToMember(targetUserId, amount);

        // Spend silver
        if (window.spendSilver) {
          window.spendSilver(amount);
        } else if (window.playerData) {
          window.playerData.silver -= amount;
          if (window.savePlayerData) window.savePlayerData();
          if (window.updateSilverDisplay) window.updateSilverDisplay();
        }

        // Show success message
        const member = this.currentSquad.members.find(m => m.id === targetUserId);
        alert(`Shared ${amount} silver with ${member ? member.username : 'squad member'}`);
      }

      // Reset input
      this.amountInput.value = '100';
    } catch (error) {
      console.error('Error sharing money:', error);
      alert('Failed to share silver. Please try again.');
    }
  }

  // Send money to a specific squad member
  async sendMoneyToMember(targetUserId, amount) {
    if (!this.currentSquad || !targetUserId || amount <= 0) return false;

    // Use REST communication service if available
    if (window.restCommunicationService && window.restCommunicationService.socket) {
      window.restCommunicationService.socket.emit('share-money', {
        squadId: this.currentSquad.id,
        targetUserId,
        amount
      });
      return true;
    }

    return false;
  }

  // Handle received money
  handleMoneyReceived(data) {
    if (!data || !data.amount || !data.fromUsername) return;

    // Add silver to player's account
    if (window.addSilver) {
      window.addSilver(data.amount);
    } else if (window.playerData) {
      window.playerData.silver += data.amount;
      if (window.savePlayerData) window.savePlayerData();
      if (window.updateSilverDisplay) window.updateSilverDisplay();
    }

    // Show notification
    this.showNotification(`${data.fromUsername} shared ${data.amount} silver with you!`);

    // Notify listeners
    this.notifyListeners(data);
  }

  // Show notification
  showNotification(message) {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = 'money-notification';
    notification.textContent = message;
    notification.style.position = 'fixed';
    notification.style.top = '20px';
    notification.style.left = '50%';
    notification.style.transform = 'translateX(-50%)';
    notification.style.backgroundColor = 'rgba(76, 175, 80, 0.9)';
    notification.style.color = '#fff';
    notification.style.padding = '10px 20px';
    notification.style.borderRadius = '5px';
    notification.style.zIndex = '2000';
    notification.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.2)';
    notification.style.animation = 'fadeInOut 4s forwards';

    // Add animation style
    const style = document.createElement('style');
    style.textContent = `
      @keyframes fadeInOut {
        0% { opacity: 0; transform: translate(-50%, -20px); }
        10% { opacity: 1; transform: translate(-50%, 0); }
        80% { opacity: 1; transform: translate(-50%, 0); }
        100% { opacity: 0; transform: translate(-50%, -20px); }
      }
    `;
    document.head.appendChild(style);

    // Add to document
    document.body.appendChild(notification);

    // Remove after animation
    setTimeout(() => {
      notification.remove();
    }, 4000);
  }

  // Add listener
  addListener(callback) {
    this.listeners.push(callback);
    return () => this.removeListener(callback);
  }

  // Remove listener
  removeListener(callback) {
    this.listeners = this.listeners.filter(listener => listener !== callback);
  }

  // Notify all listeners
  notifyListeners(data) {
    this.listeners.forEach(listener => listener(data));
  }
}

// Create a singleton instance only if it doesn't already exist
if (!window.moneySharing) {
  window.moneySharing = new MoneySharing();
} else {
  console.log('MoneySharing instance already exists, reusing existing instance');
}
