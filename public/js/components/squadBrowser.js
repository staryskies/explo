/**
 * Squad Browser Component
 * Allows players to browse and join available squads
 */
class SquadBrowser {
  constructor() {
    this.squads = [];
    this.listeners = [];
    this.isVisible = false;
    this.container = null;
    this.squadList = null;
    this.createButton = null;
    this.joinInput = null;
    this.joinButton = null;

    // Create UI elements
    this.createUI();

    // Load squads when initialized
    this.loadSquads();
  }

  // Load available squads
  async loadSquads() {
    try {
      // Show loading state
      this.squadList.innerHTML = '<p style="color: #ccc; text-align: center;">Loading squads...</p>';

      const token = window.authService.getToken();
      if (!token) {
        this.squadList.innerHTML = '<p style="color: #ccc; text-align: center;">Please log in to view squads</p>';
        return [];
      }

      try {
        const response = await fetch('/api/squads/public', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          credentials: 'include'
        });

        if (!response.ok) {
          throw new Error('Failed to load squads');
        }

        const data = await response.json();
        this.squads = data.squads || [];
        this.updateSquadList();

        return this.squads;
      } catch (fetchError) {
        console.error('Fetch squads error:', fetchError);
        this.squadList.innerHTML = '<p style="color: #f44336; text-align: center;">Failed to load squads. Please try again.</p>';
        return [];
      }
    } catch (error) {
      console.error('Load squads error:', error);
      this.squadList.innerHTML = '<p style="color: #f44336; text-align: center;">An error occurred. Please try again.</p>';
      return [];
    }
  }

  // Create UI elements
  createUI() {
    // Create container
    this.container = document.createElement('div');
    this.container.className = 'squad-browser';
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
    header.className = 'squad-browser-header';
    header.style.marginBottom = '20px';
    header.style.display = 'flex';
    header.style.justifyContent = 'space-between';
    header.style.alignItems = 'center';

    const title = document.createElement('h2');
    title.textContent = 'Available Squads';
    title.style.margin = '0';
    title.style.color = '#fff';

    const closeButton = document.createElement('button');
    closeButton.textContent = 'X';
    closeButton.style.background = 'none';
    closeButton.style.border = 'none';
    closeButton.style.color = '#fff';
    closeButton.style.cursor = 'pointer';
    closeButton.style.fontSize = '20px';
    closeButton.onclick = () => this.toggle();

    header.appendChild(title);
    header.appendChild(closeButton);

    // Create squad list
    this.squadList = document.createElement('div');
    this.squadList.className = 'squad-list';
    this.squadList.style.marginBottom = '20px';
    this.squadList.style.maxHeight = '300px';
    this.squadList.style.overflowY = 'auto';

    // Create join squad section
    const joinSection = document.createElement('div');
    joinSection.className = 'join-squad-section';
    joinSection.style.marginBottom = '20px';
    joinSection.style.display = 'flex';
    joinSection.style.flexDirection = 'column';

    const joinLabel = document.createElement('h3');
    joinLabel.textContent = 'Join Squad by Code';
    joinLabel.style.margin = '0 0 10px 0';
    joinLabel.style.color = '#fff';

    const joinInputContainer = document.createElement('div');
    joinInputContainer.style.display = 'flex';

    this.joinInput = document.createElement('input');
    this.joinInput.type = 'text';
    this.joinInput.placeholder = 'Enter squad code';
    this.joinInput.style.flex = '1';
    this.joinInput.style.padding = '8px';
    this.joinInput.style.border = '1px solid #ccc';
    this.joinInput.style.borderRadius = '3px';
    this.joinInput.style.marginRight = '5px';
    this.joinInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.joinSquad();
      }
    });

    this.joinButton = document.createElement('button');
    this.joinButton.textContent = 'Join';
    this.joinButton.style.padding = '8px 15px';
    this.joinButton.style.backgroundColor = '#4CAF50';
    this.joinButton.style.color = 'white';
    this.joinButton.style.border = 'none';
    this.joinButton.style.borderRadius = '3px';
    this.joinButton.style.cursor = 'pointer';
    this.joinButton.onclick = () => this.joinSquad();

    joinInputContainer.appendChild(this.joinInput);
    joinInputContainer.appendChild(this.joinButton);

    joinSection.appendChild(joinLabel);
    joinSection.appendChild(joinInputContainer);

    // Create create squad button
    this.createButton = document.createElement('button');
    this.createButton.textContent = 'Create New Squad';
    this.createButton.style.padding = '10px';
    this.createButton.style.backgroundColor = '#2196F3';
    this.createButton.style.color = 'white';
    this.createButton.style.border = 'none';
    this.createButton.style.borderRadius = '3px';
    this.createButton.style.cursor = 'pointer';
    this.createButton.style.width = '100%';
    this.createButton.onclick = () => this.createSquad();

    // Assemble container
    this.container.appendChild(header);
    this.container.appendChild(this.squadList);
    this.container.appendChild(joinSection);
    this.container.appendChild(this.createButton);

    // Add to document
    document.body.appendChild(this.container);

    // Create toggle button
    this.createToggleButton();
  }

  // Create toggle button
  createToggleButton() {
    const toggleButton = document.createElement('button');
    toggleButton.textContent = 'Find Squads';
    toggleButton.className = 'squad-browser-toggle-button';
    toggleButton.style.position = 'fixed';
    toggleButton.style.top = '10px';
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
  }

  // Toggle browser visibility
  toggle() {
    this.isVisible = !this.isVisible;
    this.container.style.display = this.isVisible ? 'block' : 'none';

    if (this.isVisible) {
      this.loadSquads();
    }
  }

  // Update squad list UI
  updateSquadList() {
    // Clear current list
    this.squadList.innerHTML = '';

    if (this.squads.length === 0) {
      const noSquads = document.createElement('p');
      noSquads.textContent = 'No squads available. Create one or join by code.';
      noSquads.style.color = '#ccc';
      noSquads.style.textAlign = 'center';
      noSquads.style.padding = '20px';
      this.squadList.appendChild(noSquads);
      return;
    }

    // Add each squad to the list
    this.squads.forEach(squad => {
      const squadItem = document.createElement('div');
      squadItem.className = 'squad-item';
      squadItem.style.padding = '10px';
      squadItem.style.marginBottom = '10px';
      squadItem.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
      squadItem.style.borderRadius = '3px';
      squadItem.style.display = 'flex';
      squadItem.style.justifyContent = 'space-between';
      squadItem.style.alignItems = 'center';

      const squadInfo = document.createElement('div');
      squadInfo.className = 'squad-info';

      const squadName = document.createElement('div');
      squadName.className = 'squad-name';
      squadName.textContent = `Squad ${squad.code}`;
      squadName.style.color = '#fff';
      squadName.style.fontWeight = 'bold';

      const squadMembers = document.createElement('div');
      squadMembers.className = 'squad-members';
      squadMembers.textContent = `Members: ${squad.memberCount}/4`;
      squadMembers.style.color = '#ccc';
      squadMembers.style.fontSize = '0.9em';

      squadInfo.appendChild(squadName);
      squadInfo.appendChild(squadMembers);

      const joinButton = document.createElement('button');
      joinButton.textContent = 'Join';
      joinButton.style.padding = '5px 10px';
      joinButton.style.backgroundColor = '#4CAF50';
      joinButton.style.color = 'white';
      joinButton.style.border = 'none';
      joinButton.style.borderRadius = '3px';
      joinButton.style.cursor = 'pointer';
      joinButton.onclick = () => this.joinSquadById(squad.id);

      squadItem.appendChild(squadInfo);
      squadItem.appendChild(joinButton);

      this.squadList.appendChild(squadItem);
    });
  }

  // Create a new squad
  async createSquad() {
    try {
      if (!window.squadService) {
        console.error('Squad service not available');
        return;
      }

      const squad = await window.squadService.createSquad();
      this.toggle(); // Close the browser

      // Show squad code to share
      alert(`Squad created! Share this code with friends: ${squad.code}`);

      return squad;
    } catch (error) {
      console.error('Create squad error:', error);
      alert('Failed to create squad. Please try again.');
    }
  }

  // Join a squad by code
  async joinSquad() {
    const code = this.joinInput.value.trim();
    if (!code) {
      alert('Please enter a squad code');
      return;
    }

    try {
      if (!window.squadService) {
        console.error('Squad service not available');
        return;
      }

      const squad = await window.squadService.joinSquad(code);
      this.toggle(); // Close the browser

      return squad;
    } catch (error) {
      console.error('Join squad error:', error);
      alert('Failed to join squad. Please check the code and try again.');
    }
  }

  // Join a squad by ID
  async joinSquadById(squadId) {
    try {
      const token = window.authService.getToken();
      if (!token) return;

      const response = await fetch(`/api/squads/${squadId}/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include'
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to join squad');
      }

      const data = await response.json();

      // Update squad service
      if (window.squadService) {
        window.squadService.currentSquad = data;
        window.squadService.notifyListeners();
        window.squadService.joinSquadRoom(data.id);
      }

      this.toggle(); // Close the browser

      return data;
    } catch (error) {
      console.error('Join squad by ID error:', error);
      alert('Failed to join squad. Please try again.');
    }
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
  notifyListeners() {
    this.listeners.forEach(listener => listener(this.squads));
  }
}

// Create a singleton instance
window.squadBrowser = new SquadBrowser();
