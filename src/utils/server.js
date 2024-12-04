// src/utils/server.js
import express from 'express';
import session from 'express-session';
import { Server } from 'socket.io';
import sharedsession from 'express-socket.io-session';
import cors from 'cors';
import { google } from 'googleapis';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import calendarRouter from '../server/routes/calendar.js';
import { setupSocketServer } from './socketServer.js';

// Load environment variables first
dotenv.config({
  path: process.env.NODE_ENV === 'production' 
    ? '.env.production'
    : '.env.development'
});

// Basic configuration
const PORT = process.env.PORT || 3000;
const isProduction = process.env.NODE_ENV === 'production';
const BACKEND_URL = isProduction 
  ? 'https://yuzu-google-meet.vercel.app'
  : `http://localhost:${PORT}`;
const FRONTEND_URL = isProduction
  ? 'https://yuzu-google-meet.vercel.app'
  : 'http://localhost:8080';

// Validate required environment variables
const requiredEnvVars = ['VITE_GOOGLE_CLIENT_ID', 'VITE_GOOGLE_CLIENT_SECRET', 'SESSION_SECRET'];
requiredEnvVars.forEach((envVar) => {
  if (!process.env[envVar]) {
    console.error(`Missing required environment variable: ${envVar}`);
    process.exit(1);
  }
});

// Initialize Express app
const app = express();

// Initialize Google OAuth2 client
const oauth2Client = new google.auth.OAuth2(
  process.env.VITE_GOOGLE_CLIENT_ID,
  process.env.VITE_GOOGLE_CLIENT_SECRET,
  `${BACKEND_URL}/auth/google/callback`
);

// Session configuration
const sessionMiddleware = session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000,
    domain: isProduction ? '.vercel.app' : undefined
  },
  name: 'sessionId'
});

// Middleware Configuration
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser(process.env.SESSION_SECRET));
app.use(sessionMiddleware);

// CORS Configuration
app.use(cors({
  origin: FRONTEND_URL,
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Cookie'],
  exposedHeaders: ['Set-Cookie', 'Access-Control-Allow-Origin']
}));

// Server setup
const server = app.listen(PORT, () => {
  console.log(`Server running on ${BACKEND_URL}`);
  console.log(`Accepting requests from ${FRONTEND_URL}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Socket.IO setup
const io = new Server(server, {
  cors: {
    origin: FRONTEND_URL,
    methods: ['GET', 'POST'],
    credentials: true
  },
  path: '/socket.io/',
  transports: ['websocket', 'polling']
});

// Share session between Express and Socket.IO
io.use(sharedsession(sessionMiddleware, {
  autoSave: true
}));

// Setup socket handlers
setupSocketServer(io);

// Production static file serving
if (isProduction) {
  const path = await import('path');
  const __dirname = path.dirname(new URL(import.meta.url).pathname);
  app.use(express.static(path.join(__dirname, '../../dist')));
}

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
    redirectUri: `${BACKEND_URL}/auth/google/callback`
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
      'https://www.googleapis.com/auth/meetings.space.created',
      'https://www.googleapis.com/auth/meetings.space.readonly'
    ]
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
      throw new Error('No authorization code received');
    }

    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const userInfo = await oauth2.userinfo.get();

    req.session.tokens = tokens;
    req.session.user = {
      id: userInfo.data.id,
      email: userInfo.data.email,
      name: userInfo.data.name,
      picture: userInfo.data.picture
    };

    await new Promise((resolve, reject) => {
      req.session.save((err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    res.redirect(`${FRONTEND_URL}/glasses`);
  } catch (error) {
    console.error('Auth callback error:', error);
    res.redirect(`${FRONTEND_URL}/#/login?error=${encodeURIComponent(error.message)}`);
  }
});

// User Session Routes
app.get('/auth/user', (req, res) => {
  if (!req.session?.user) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'No user session found'
    });
  }
  res.json(req.session.user);
});

app.post('/auth/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to logout' });
    }
    res.clearCookie('sessionId');
    res.json({ success: true });
  });
});

// Token Refresh Route
app.post('/auth/refresh', async (req, res) => {
  try {
    if (!req.session?.tokens?.refresh_token) {
      throw new Error('No refresh token available');
    }

    oauth2Client.setCredentials({
      refresh_token: req.session.tokens.refresh_token
    });

    const { credentials } = await oauth2Client.refreshAccessToken();
    req.session.tokens = credentials;
    res.json({ success: true, tokens: credentials });
  } catch (error) {
    res.status(500).json({ error: 'Failed to refresh token' });
  }
});

// Register Additional Routes
app.use('/calendar', calendarRouter);

// Production catch-all route for SPA
if (isProduction) {
  const path = await import('path');
  const __dirname = path.dirname(new URL(import.meta.url).pathname);
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../../dist/index.html'));
  });
}

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.url} not found`
  });
});

// Error Handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: isProduction ? 'An unexpected error occurred' : err.message
  });
});

// Error Handling for Uncaught Exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

export { app, io, server };