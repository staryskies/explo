/**
 * Mock Authentication service for the tower defense game (static version)
 */
class MockAuthService {
  constructor() {
    this.user = null;
    this.listeners = [];

    // Try to load user from localStorage
    this.loadUserFromStorage();
    
    console.log('Mock Auth Service initialized');
  }

  // Load user from localStorage
  loadUserFromStorage() {
    try {
      const userData = localStorage.getItem('towerDefenseUser');

      if (userData) {
        this.user = JSON.parse(userData);
        this.notifyListeners();
      }
    } catch (error) {
      console.error('Failed to load user from storage:', error);
      this.clearUserData();
    }
  }

  // Save user to localStorage
  saveUserToStorage() {
    try {
      if (this.user) {
        localStorage.setItem('towerDefenseUser', JSON.stringify(this.user));
      } else {
        this.clearUserData();
      }
    } catch (error) {
      console.error('Failed to save user to storage:', error);
    }
  }

  // Clear user data from localStorage
  clearUserData() {
    localStorage.removeItem('towerDefenseUser');
    this.user = null;
  }

  // Register a new user (mock implementation)
  async register(username, password, email = null) {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Check if username already exists
    const existingUsers = JSON.parse(localStorage.getItem('mockUsers') || '[]');
    if (existingUsers.some(user => user.username === username)) {
      throw new Error('Username already exists');
    }
    
    // Create new user
    const newUser = {
      id: Date.now().toString(),
      username,
      email,
      isGuest: false,
      createdAt: new Date().toISOString()
    };
    
    // Save to mock database
    existingUsers.push({username, password});
    localStorage.setItem('mockUsers', JSON.stringify(existingUsers));
    
    // Set as current user
    this.user = newUser;
    this.saveUserToStorage();
    this.notifyListeners();
    
    return newUser;
  }

  // Login user (mock implementation)
  async login(username, password) {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Check credentials
    const existingUsers = JSON.parse(localStorage.getItem('mockUsers') || '[]');
    const user = existingUsers.find(user => user.username === username && user.password === password);
    
    if (!user) {
      throw new Error('Invalid username or password');
    }
    
    // Create user object
    const loggedInUser = {
      id: Date.now().toString(),
      username,
      email: null,
      isGuest: false,
      createdAt: new Date().toISOString()
    };
    
    // Set as current user
    this.user = loggedInUser;
    this.saveUserToStorage();
    this.notifyListeners();
    
    return loggedInUser;
  }

  // Create guest user (mock implementation)
  async createGuest() {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Create guest user with random name
    const guestId = Math.floor(Math.random() * 10000);
    const guestUser = {
      id: Date.now().toString(),
      username: `Guest${guestId}`,
      email: null,
      isGuest: true,
      createdAt: new Date().toISOString()
    };
    
    // Set as current user
    this.user = guestUser;
    this.saveUserToStorage();
    this.notifyListeners();
    
    return guestUser;
  }

  // Logout user (mock implementation)
  async logout() {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    this.clearUserData();
    this.notifyListeners();
  }

  // Check if user is logged in
  isLoggedIn() {
    return !!this.user;
  }

  // Check if user is a guest
  isGuest() {
    return this.user && this.user.isGuest;
  }

  // Add auth state change listener
  addListener(callback) {
    this.listeners.push(callback);
    // Call the callback immediately with current state
    callback(this.user);
    return () => this.removeListener(callback);
  }

  // Remove auth state change listener
  removeListener(callback) {
    this.listeners = this.listeners.filter(listener => listener !== callback);
  }

  // Notify all listeners of auth state change
  notifyListeners() {
    this.listeners.forEach(listener => listener(this.user));
  }
}

// Create a singleton instance
window.authService = new MockAuthService();
