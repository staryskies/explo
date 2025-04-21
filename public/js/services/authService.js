/**
 * Authentication service for the tower defense game
 */
class AuthService {
  constructor() {
    this.user = null;
    this.token = null;
    this.listeners = [];

    // Try to load user from localStorage
    this.loadUserFromStorage();
  }

  // Load user from localStorage
  loadUserFromStorage() {
    try {
      const userData = localStorage.getItem('towerDefenseUser');
      const tokenData = localStorage.getItem('towerDefenseToken');

      if (userData && tokenData) {
        this.user = JSON.parse(userData);
        this.token = tokenData;
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
      if (this.user && this.token) {
        localStorage.setItem('towerDefenseUser', JSON.stringify(this.user));
        localStorage.setItem('towerDefenseToken', this.token);
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
    localStorage.removeItem('towerDefenseToken');
    this.user = null;
    this.token = null;
  }

  // Register a new user
  async register(username, password, email = null) {
    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password, email }),
        credentials: 'include'
      });

      // Check if response is ok before trying to parse JSON
      if (!response.ok) {
        let errorMessage = 'Registration failed';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (jsonError) {
          const errorText = await response.text();
          console.error('Server error response:', errorText);
          errorMessage = 'Server error: ' + (errorText.substring(0, 100) || errorMessage);
        }
        throw new Error(errorMessage);
      }

      // Try to parse JSON response
      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        console.error('JSON parse error:', jsonError);
        throw new Error('Invalid server response. Please try again later.');
      }

      this.user = data.user;
      this.token = data.token;
      this.saveUserToStorage();
      this.notifyListeners();

      return data.user;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  }

  // Login user
  async login(username, password) {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password }),
        credentials: 'include'
      });

      // Check if response is ok before trying to parse JSON
      if (!response.ok) {
        let errorMessage = 'Login failed';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (jsonError) {
          const errorText = await response.text();
          console.error('Server error response:', errorText);
          errorMessage = 'Server error: ' + (errorText.substring(0, 100) || errorMessage);
        }
        throw new Error(errorMessage);
      }

      // Try to parse JSON response
      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        console.error('JSON parse error:', jsonError);
        throw new Error('Invalid server response. Please try again later.');
      }

      this.user = data.user;
      this.token = data.token;
      this.saveUserToStorage();
      this.notifyListeners();

      return data.user;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  // Create guest user
  async createGuest() {
    try {
      const response = await fetch('/api/auth/guest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      // Check if response is ok before trying to parse JSON
      if (!response.ok) {
        const statusText = response.statusText || 'Unknown error';
        const status = response.status;
        console.error(`Server error: ${status} ${statusText}`);
        throw new Error(`Server error: ${status} ${statusText}`);
      }

      // Try to parse JSON response
      let data;
      try {
        const responseText = await response.text();
        if (!responseText) {
          throw new Error('Empty response from server');
        }

        try {
          data = JSON.parse(responseText);
        } catch (parseError) {
          console.error('JSON parse error:', parseError, 'Response text:', responseText);
          throw new Error('Invalid server response. Please try again later.');
        }
      } catch (textError) {
        console.error('Error reading response:', textError);
        throw new Error('Failed to read server response. Please try again later.');
      }

      this.user = data.user;
      this.token = data.token;
      this.saveUserToStorage();
      this.notifyListeners();

      return data.user;
    } catch (error) {
      console.error('Create guest error:', error);
      throw error;
    }
  }

  // Logout user
  async logout() {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token}`
        },
        credentials: 'include'
      });

      this.clearUserData();
      this.notifyListeners();
    } catch (error) {
      console.error('Logout error:', error);
      // Still clear user data even if the request fails
      this.clearUserData();
      this.notifyListeners();
      throw error;
    }
  }

  // Get current user
  async getCurrentUser() {
    if (!this.token) {
      return null;
    }

    try {
      const response = await fetch('/api/auth/me', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token}`
        },
        credentials: 'include'
      });

      if (!response.ok) {
        // If unauthorized, clear user data
        if (response.status === 401) {
          this.clearUserData();
          this.notifyListeners();
          return null;
        }
        throw new Error('Failed to get current user');
      }

      const data = await response.json();
      this.user = data.user;
      this.notifyListeners();

      return data.user;
    } catch (error) {
      console.error('Get current user error:', error);
      return null;
    }
  }

  // Convert guest to registered user
  async convertGuest(username, password, email = null) {
    if (!this.user || !this.user.isGuest) {
      throw new Error('Only guest accounts can be converted');
    }

    try {
      const response = await fetch('/api/auth/convert-guest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token}`
        },
        body: JSON.stringify({ username, password, email }),
        credentials: 'include'
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to convert guest account');
      }

      this.user = data.user;
      this.saveUserToStorage();
      this.notifyListeners();

      return data.user;
    } catch (error) {
      console.error('Convert guest error:', error);
      throw error;
    }
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

  // Get auth token
  getToken() {
    return this.token;
  }
}

// Create a singleton instance
window.authService = new AuthService();
