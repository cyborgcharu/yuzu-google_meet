// src/utils/server.js
import express from 'express';
import session from 'express-session';
import cors from 'cors';
import { google } from 'googleapis';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import calendarRouter from '../server/routes/calendar.js';

// Load environment variables
dotenv.config();
console.log("hallelujah")

// Validate required environment variables
const requiredEnvVars = ['VITE_GOOGLE_CLIENT_ID', 'VITE_GOOGLE_CLIENT_SECRET', 'SESSION_SECRET'];
requiredEnvVars.forEach((envVar) => {
  if (!process.env[envVar]) {
    console.error(`Missing required environment variable: ${envVar}`);
    process.exit(1);
  }
});

// Server configuration
const app = express();
const PORT = process.env.PORT || 3000;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:8080';
const BACKEND_URL = process.env.BACKEND_URL || `http://localhost:${PORT}`;

// Initialize Google OAuth2 client
const oauth2Client = new google.auth.OAuth2(
  process.env.VITE_GOOGLE_CLIENT_ID,
  process.env.VITE_GOOGLE_CLIENT_SECRET,
  `${BACKEND_URL}/auth/google/callback`
);

// Middleware Configuration
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser(process.env.SESSION_SECRET));

// CORS Configuration
app.use(
  cors({
    origin: FRONTEND_URL,
    credentials: true,
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    exposedHeaders: ['Access-Control-Allow-Origin'],
  })
);

// Session Configuration
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      path: '/',
      // Remove the domain option to allow the cookie to be set for the entire domain
    },
    name: 'sessionId',
  })
);

// Request Logging Middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Health Check Route
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Google Auth Routes
app.get('/auth/google/login', (req, res) => {
  console.log('OAuth2 Client config:', {
    clientId: process.env.VITE_GOOGLE_CLIENT_ID,
    redirectUri: `${BACKEND_URL}/auth/google/callback`,
  });

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    response_type: 'code',
    flowName: 'GeneralOAuthFlow',
    scope: [
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/calendar',
      'https://www.googleapis.com/auth/calendar.events',
    ],
  });
  console.log('Generated auth URL:', authUrl);
  res.redirect(authUrl);
});

app.get('/auth/google/callback', async (req, res) => {
  console.log('Callback received. Request URL:', req.url);
  console.log('Full callback URL:', `${BACKEND_URL}${req.url}`);

  try {
    const { code } = req.query;
    if (!code) {
      console.error('No authorization code received');
      throw new Error('No authorization code received');
    }

    console.log('Exchanging code for tokens...');
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    console.log('Fetching user information...');
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const userInfo = await oauth2.userinfo.get();

    console.log('Storing user data and tokens in session...');
    console.log('User data:', userInfo.data);
    console.log('Tokens:', tokens);

    req.session.tokens = tokens;
    req.session.user = {
      id: userInfo.data.id,
      email: userInfo.data.email,
      name: userInfo.data.name,
      picture: userInfo.data.picture,
    };

    console.log('Saving session...');
    await new Promise((resolve, reject) => {
      req.session.save((err) => {
        if (err) {
          console.error('Error saving session:', err);
          reject(err);
        } else {
          console.log('Session saved successfully');
          resolve();
        }
      });
    });

    console.log('Redirecting to frontend...');
    res.redirect(`${FRONTEND_URL}/#/dashboard`);
  } catch (error) {
    console.error('Auth callback error:', error);
    res.redirect(`${FRONTEND_URL}/#/login?error=${encodeURIComponent(error.message)}`);
  }
});

// User Session Routes
app.get('/auth/user', (req, res) => {
  console.log('Handling /auth/user request');
  console.log('Session:', req.session);

  if (!req.session?.user) {
    console.error('No user session found');
    console.log('Session cookies:', req.cookies);
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'No user session found',
    });
  }

  console.log('Returning user data:', req.session.user);
  res.json(req.session.user);
});

app.post('/auth/logout', (req, res) => {
  console.log('Handling /auth/logout request');
  req.session.destroy((err) => {
    if (err) {
      console.error('Logout error:', err);
      return res.status(500).json({ error: 'Failed to logout' });
    }
    res.clearCookie('sessionId');
    res.json({ success: true });
  });
});

// Token Refresh Route
app.post('/auth/refresh', async (req, res) => {
  console.log('Handling /auth/refresh request');

  try {
    if (!req.session?.tokens?.refresh_token) {
      console.error('No refresh token available');
      throw new Error('No refresh token available');
    }

    oauth2Client.setCredentials({
      refresh_token: req.session.tokens.refresh_token,
    });

    console.log('Refreshing access token...');
    const { credentials } = await oauth2Client.refreshAccessToken();
    req.session.tokens = credentials;

    console.log('Returning refreshed tokens');
    res.json({ success: true, tokens: credentials });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({ error: 'Failed to refresh token' });
  }
});

// Register Additional Routes
app.use('/calendar', calendarRouter);

// 404 Handler
app.use((req, res) => {
  console.log('Handling 404 request');
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.url} not found`,
  });
});

// Error Handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'An unexpected error occurred',
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server running on ${BACKEND_URL}`);
  console.log(`Accepting requests from ${FRONTEND_URL}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Error Handling for Uncaught Exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

export default app;