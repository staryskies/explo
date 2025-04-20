/**
 * Squad functionality for the tower defense game
 */
// Log that squad.js is loaded
console.log('Squad loaded');

// Initialize squad UI
function initSquadUI() {
  // Get DOM elements
  const squadButton = document.getElementById('squad-button');
  const squadModal = document.getElementById('squad-modal');
  const closeSquad = document.getElementById('close-squad');
  
  const noSquadSection = document.getElementById('no-squad');
  const currentSquadSection = document.getElementById('current-squad');
  
  const createSquadBtn = document.getElementById('create-squad-btn');
  const joinSquadBtn = document.getElementById('join-squad-btn');
  const squadCodeInput = document.getElementById('squad-code-input');
  const leaveSquadBtn = document.getElementById('leave-squad-btn');
  
  const squadCode = document.getElementById('squad-code');
  const copyCodeBtn = document.getElementById('copy-code-btn');
  const squadMembersList = document.getElementById('squad-members-list');
  
  const chatMessages = document.getElementById('chat-messages');
  const chatInput = document.getElementById('chat-input');
  const sendMessageBtn = document.getElementById('send-message-btn');
  
  // Update UI based on squad state
  function updateSquadUI(squad) {
    if (squad) {
      // User is in a squad
      noSquadSection.style.display = 'none';
      currentSquadSection.style.display = 'block';
      
      // Update squad code
      squadCode.textContent = squad.code;
      
      // Update squad members list
      squadMembersList.innerHTML = '';
      squad.members.forEach(member => {
        const li = document.createElement('li');
        
        // Check if member is the leader
        if (member.id === squad.leaderId) {
          li.innerHTML = `<span class="squad-leader">${member.username} (Leader)</span>`;
        } else {
          li.textContent = member.username;
        }
        
        squadMembersList.appendChild(li);
      });
    } else {
      // User is not in a squad
      noSquadSection.style.display = 'block';
      currentSquadSection.style.display = 'none';
      
      // Clear chat messages
      chatMessages.innerHTML = '';
    }
  }
  
  // Add squad state listener
  window.squadService.addListener(updateSquadUI);
  
  // Add message listener
  window.squadService.addMessageListener(message => {
    // Create message element
    const messageElement = document.createElement('div');
    messageElement.className = 'chat-message';
    
    // Format timestamp
    const timestamp = new Date(message.timestamp);
    const formattedTime = timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    // Set message content
    messageElement.innerHTML = `
      <span class="sender">${message.username}:</span>
      ${message.message}
      <span class="timestamp">${formattedTime}</span>
    `;
    
    // Add message to chat
    chatMessages.appendChild(messageElement);
    
    // Scroll to bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;
  });
  
  // Show squad modal
  squadButton.addEventListener('click', () => {
    // Check if user is logged in
    if (!window.authService.isLoggedIn()) {
      alert('Please log in or create a guest account to access squads.');
      return;
    }
    
    squadModal.style.display = 'block';
    
    // Refresh squad data
    window.squadService.getCurrentSquad();
  });
  
  // Close squad modal
  closeSquad.addEventListener('click', () => {
    squadModal.style.display = 'none';
  });
  
  // Close modal when clicking outside
  window.addEventListener('click', (event) => {
    if (event.target === squadModal) {
      squadModal.style.display = 'none';
    }
  });
  
  // Create squad
  createSquadBtn.addEventListener('click', async () => {
    try {
      createSquadBtn.disabled = true;
      await window.squadService.createSquad();
      createSquadBtn.disabled = false;
    } catch (error) {
      console.error('Create squad error:', error);
      alert('Failed to create squad. Please try again.');
      createSquadBtn.disabled = false;
    }
  });
  
  // Join squad
  joinSquadBtn.addEventListener('click', async () => {
    const code = squadCodeInput.value.trim().toUpperCase();
    
    if (!code) {
      alert('Please enter a squad code.');
      return;
    }
    
    try {
      joinSquadBtn.disabled = true;
      await window.squadService.joinSquad(code);
      squadCodeInput.value = '';
      joinSquadBtn.disabled = false;
    } catch (error) {
      console.error('Join squad error:', error);
      alert('Failed to join squad. Please check the code and try again.');
      joinSquadBtn.disabled = false;
    }
  });
  
  // Leave squad
  leaveSquadBtn.addEventListener('click', async () => {
    if (confirm('Are you sure you want to leave this squad?')) {
      try {
        leaveSquadBtn.disabled = true;
        await window.squadService.leaveSquad();
        leaveSquadBtn.disabled = false;
      } catch (error) {
        console.error('Leave squad error:', error);
        alert('Failed to leave squad. Please try again.');
        leaveSquadBtn.disabled = false;
      }
    }
  });
  
  // Copy squad code
  copyCodeBtn.addEventListener('click', () => {
    navigator.clipboard.writeText(squadCode.textContent)
      .then(() => {
        // Show temporary success message
        const originalText = copyCodeBtn.textContent;
        copyCodeBtn.textContent = '✓';
        setTimeout(() => {
          copyCodeBtn.textContent = originalText;
        }, 1000);
      })
      .catch(err => {
        console.error('Failed to copy code:', err);
        alert('Failed to copy code. Please try again.');
      });
  });
  
  // Send chat message
  function sendChatMessage() {
    const message = chatInput.value.trim();
    
    if (!message) {
      return;
    }
    
    if (window.squadService.sendMessage(message)) {
      chatInput.value = '';
    } else {
      alert('Failed to send message. Please try again.');
    }
  }
  
  // Send message button
  sendMessageBtn.addEventListener('click', sendChatMessage);
  
  // Send message on Enter key
  chatInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
      sendChatMessage();
    }
  });
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initSquadUI);
