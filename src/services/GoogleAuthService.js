// src/services/GoogleAuthService.js
class GoogleAuthService {
  constructor() {
    this.baseUrl = import.meta.env.VITE_API_BASE_URL;
    this.redirectUri = import.meta.env.VITE_GOOGLE_REDIRECT_URI;
  }

  generateAuthUrl() {
    return `${this.baseUrl}/auth/google/login`;
  }

  async handleAuthCallback(code) {
    try {
      const response = await fetch(`${this.baseUrl}/auth/google/callback?code=${code}`);
      if (!response.ok) {
        throw new Error('Failed to authenticate with Google');
      }
      
      const data = await response.json();
      this.setTokens(data.tokens);
      
      authService.setUser(data.user);
      return data.tokens;
    } catch (error) {
      console.error('Google auth error:', error);
      throw error;
    }
  }

  setTokens(tokens) {
    localStorage.setItem('tokens', JSON.stringify(tokens));
  }

  getTokens() {
    const tokens = localStorage.getItem('tokens');
    return tokens ? JSON.parse(tokens) : null;
  }

  isTokenExpired() {
    const tokens = this.getTokens();
    if (!tokens?.access_token) return true;
    if (!tokens.expiry_date) return true;
    return Date.now() >= tokens.expiry_date;
  }

  async refreshTokens() {
    try {
      const tokens = this.getTokens();
      if (!tokens?.refresh_token) throw new Error('No refresh token available');

      const response = await fetch(`${this.baseUrl}/auth/google/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refresh_token: tokens.refresh_token }),
      });

      if (!response.ok) {
        throw new Error('Failed to refresh tokens');
      }

      const newTokens = await response.json();
      this.setTokens(newTokens);
      return newTokens;
    } catch (error) {
      console.error('Token refresh error:', error);
      throw error;
    }
  }
}

export const googleAuthService = new GoogleAuthService();