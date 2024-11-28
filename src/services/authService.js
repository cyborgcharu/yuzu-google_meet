// src/services/authService.js
class AuthService {
  constructor() {
    this.subscribers = [];
    this.user = null;
  }

  // Add subscriber
  subscribe(callback) {
    this.subscribers.push(callback);
    // Return unsubscribe function
    return () => {
      this.subscribers = this.subscribers.filter(sub => sub !== callback);
    };
  }

  // Notify all subscribers
  notify() {
    this.subscribers.forEach(callback => callback(this.user));
  }

  // Get current user
  getUser() {
    return this.user;
  }

  // Set user and notify subscribers
  setUser(user) {
    this.user = user;
    this.notify();
  }

  // Clear user data
  clearUser() {
    this.user = null;
    this.notify();
  }

  // Check if user is authenticated
  isAuthenticated() {
    return !!this.user;
  }

  async logout() {
    try {
      await fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/logout`, {
        method: 'POST',
        credentials: 'include'
      });
      this.clearUser();
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  }
}

export const authService = new AuthService();