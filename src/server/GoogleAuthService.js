// src/services/GoogleAuthService.js
import { google } from 'googleapis';

class GoogleAuthService {
  constructor() {
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      import.meta.env.VITE_API_BASE_URL
    );
  }

  getClient() {
    return this.oauth2Client;
  }

  generateAuthUrl() {
    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent', // Force consent to get refresh token
      scope: [
        'https://www.googleapis.com/auth/userinfo.profile',
        'https://www.googleapis.com/auth/userinfo.email'
      ]
    });
  }

  async getTokens(code) {
    try {
      return await this.oauth2Client.getToken(code);
    } catch (error) {
      console.error('Error getting tokens:', error);
      throw error;
    }
  }
}

export default GoogleAuthService;