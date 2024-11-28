// src/server/routes/calendar.js
import express from 'express';
import { google } from 'googleapis';

const router = express.Router();
console.log('Calendar Router: Initializing');

router.post('/create-meeting', async (req, res) => {
  if (res.headersSent) return; // Add this check
  console.log('Calendar Route: Creating new meeting');
  try {
    // Check for valid session and tokens
    if (!req.session?.tokens) {
      console.error('Calendar Route: No tokens in session');
      return res.status(401).json({ error: 'Not authenticated' });
    }

    if (!req.session?.user?.email) {
      console.error('Calendar Route: No user email in session');
      return res.status(401).json({ error: 'User email not found' });
    }

    // Initialize OAuth client
    const oauth2Client = new google.auth.OAuth2(
      process.env.VITE_GOOGLE_CLIENT_ID,
      process.env.VITE_GOOGLE_CLIENT_SECRET,
      `${process.env.BACKEND_URL}/auth/google/callback`
    );

    // Set up credentials and refresh token handler
    oauth2Client.setCredentials(req.session.tokens);
    oauth2Client.on('tokens', (tokens) => {
      console.log('Calendar Route: Refreshing tokens');
      req.session.tokens = {
        ...req.session.tokens,
        ...tokens
      };
    });

    // Initialize Calendar API
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    
    // Prepare meeting time parameters
    const startTime = req.body.startTime || new Date().toISOString();
    const endTime = req.body.endTime || new Date(Date.now() + 3600000).toISOString();

    console.log('Calendar Route: Creating calendar event with Meet');
    const event = await calendar.events.insert({
      calendarId: 'primary',
      conferenceDataVersion: 1,
      requestBody: {
        summary: req.body.title || 'Yuzu Meeting',
        description: 'Meeting created via Yuzu Meet',
        start: { 
          dateTime: startTime,
          timeZone: 'UTC'
        },
        end: { 
          dateTime: endTime,
          timeZone: 'UTC'
        },
        conferenceData: {
          createRequest: {
            requestId: `yuzu-${Date.now()}`,
            conferenceSolutionKey: { type: 'hangoutsMeet' }
          }
        },
        attendees: [{
          email: req.session.user.email,
          responseStatus: 'accepted',
          organizer: true
        }],
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'popup', minutes: 5 }
          ]
        }
      }
    });

    // Verify the response has required fields
    if (!event.data.hangoutLink || !event.data.conferenceData?.conferenceId) {
      console.error('Calendar Route: Invalid meeting data received:', event.data);
      throw new Error('Failed to create Google Meet link');
    }

    console.log('Calendar Route: Event created successfully');
    
    // Prepare meeting details response    
    const meetingDetails = {
      meetingId: event.data.conferenceData.conferenceId,
      meetingUrl: event.data.hangoutLink,
      title: event.data.summary,
      startTime: event.data.start.dateTime,
      endTime: event.data.end.dateTime,
      createdAt: new Date().toISOString(),
      organizer: event.data.organizer
    };
    
    console.log('Calendar Route: Returning meeting details:', meetingDetails);
    res.json(meetingDetails);

  } catch (error) {
    console.error('Calendar Route: Error creating meeting:', error);
    if (res.headersSent) return;
    
    if (error.code === 401 || error.response?.status === 401) {
      return res.status(401).json({
        error: 'Authentication expired',
        message: 'Please sign in again'
      });
    }

    if (error.code === 403 || error.response?.status === 403) {
      return res.status(403).json({
        error: 'Permission denied',
        message: 'Missing required Google Calendar permissions'
      });
    }

    res.status(500).json({
      error: 'Failed to create meeting',
      message: error.message
    });
  }
});

export default router;