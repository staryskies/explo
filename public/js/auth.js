/**
 * Authentication functionality for the tower defense game
 */
// Log that auth.js is loaded
console.log('Auth loaded');

// Initialize authentication UI
function initAuthUI() {
  // Get DOM elements
  const loginButton = document.getElementById('login-button');
  const signupButton = document.getElementById('signup-button');
  const guestButton = document.getElementById('guest-button');
  const logoutButton = document.getElementById('logout-button');
  const userInfo = document.getElementById('user-info');
  const usernameDisplay = document.getElementById('username-display');
  
  const loginModal = document.getElementById('login-modal');
  const signupModal = document.getElementById('signup-modal');
  const closeLogin = document.getElementById('close-login');
  const closeSignup = document.getElementById('close-signup');
  
  const loginForm = document.getElementById('login-form');
  const signupForm = document.getElementById('signup-form');
  const loginError = document.getElementById('login-error');
  const signupError = document.getElementById('signup-error');
  
  // Update UI based on auth state
  function updateAuthUI(user) {
    if (user) {
      // User is logged in
      loginButton.style.display = 'none';
      signupButton.style.display = 'none';
      guestButton.style.display = 'none';
      userInfo.style.display = 'flex';
      usernameDisplay.textContent = user.username;
      
      // If user is a guest, show a different message
      if (user.isGuest) {
        usernameDisplay.textContent = `Guest: ${user.username}`;
      }
    } else {
      // User is not logged in
      loginButton.style.display = 'block';
      signupButton.style.display = 'block';
      guestButton.style.display = 'block';
      userInfo.style.display = 'none';
    }
  }
  
  // Add auth state listener
  window.authService.addListener(updateAuthUI);
  
  // Show login modal
  loginButton.addEventListener('click', () => {
    loginModal.style.display = 'block';
    loginError.textContent = '';
    loginForm.reset();
  });
  
  // Show signup modal
  signupButton.addEventListener('click', () => {
    signupModal.style.display = 'block';
    signupError.textContent = '';
    signupForm.reset();
  });
  
  // Close login modal
  closeLogin.addEventListener('click', () => {
    loginModal.style.display = 'none';
  });
  
  // Close signup modal
  closeSignup.addEventListener('click', () => {
    signupModal.style.display = 'none';
  });
  
  // Close modals when clicking outside
  window.addEventListener('click', (event) => {
    if (event.target === loginModal) {
      loginModal.style.display = 'none';
    }
    if (event.target === signupModal) {
      signupModal.style.display = 'none';
    }
  });
  
  // Handle login form submission
  loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;
    
    try {
      loginError.textContent = '';
      await window.authService.login(username, password);
      loginModal.style.display = 'none';
      
      // Reload player data
      updateUI();
    } catch (error) {
      loginError.textContent = error.message;
    }
  });
  
  // Handle signup form submission
  signupForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    
    const username = document.getElementById('signup-username').value;
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;
    const confirmPassword = document.getElementById('signup-confirm-password').value;
    
    // Validate passwords match
    if (password !== confirmPassword) {
      signupError.textContent = 'Passwords do not match';
      return;
    }
    
    try {
      signupError.textContent = '';
      await window.authService.register(username, password, email || null);
      signupModal.style.display = 'none';
      
      // Reload player data
      updateUI();
    } catch (error) {
      signupError.textContent = error.message;
    }
  });
  
  // Handle guest login
  guestButton.addEventListener('click', async () => {
    try {
      await window.authService.createGuest();
      
      // Reload player data
      updateUI();
    } catch (error) {
      console.error('Guest login error:', error);
      alert('Failed to create guest account. Please try again.');
    }
  });
  
  // Handle logout
  logoutButton.addEventListener('click', async () => {
    try {
      await window.authService.logout();
      
      // Reset UI
      updateUI();
    } catch (error) {
      console.error('Logout error:', error);
    }
  });
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initAuthUI);
