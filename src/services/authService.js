// src/services/authService.js
class AuthService {
  constructor() {
    this.baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
  }

  async getUser() {
    try {
      const response = await fetch(`${this.baseUrl}/auth/user`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        }
      });

      // If unauthorized, return null instead of throwing
      if (response.status === 401) {
        return null;
      }

      if (!response.ok) {
        throw new Error(`Failed to get user: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting user:', error);
      return null;
    }
  }

  login() {
    // Redirect to Google OAuth
    window.location.href = `${this.baseUrl}/auth/google`;
  }

  async logout() {
    try {
      const response = await fetch(`${this.baseUrl}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to logout');
      }

      return await response.json();
    } catch (error) {
      console.error('Error logging out:', error);
      throw error;
    }
  }
}

export const authService = new AuthService();