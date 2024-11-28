// src/server/routes/calendar.js
import express from 'express';
import { google } from 'googleapis';
const router = express.Router();

router.post('/create-meeting', async (req, res) => {
  try {
    if (!req.session.tokens) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );
    oauth2Client.setCredentials(req.session.tokens);

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    
    const event = {
      summary: req.body.title,
      start: { dateTime: req.body.startTime },
      end: { dateTime: req.body.endTime },
      conferenceData: {
        createRequest: { 
          requestId: `yuzu-${Date.now()}`, 
          conferenceSolutionKey: { type: 'hangoutsMeet' } 
        }
      }
    };

    const response = await calendar.events.insert({
      calendarId: 'primary',
      conferenceDataVersion: 1,
      resource: event
    });

    res.json({
      meetingId: response.data.conferenceData.conferenceId,
      meetingUrl: response.data.hangoutLink,
      title: response.data.summary,
      startTime: response.data.start.dateTime,
      endTime: response.data.end.dateTime
    });
  } catch (error) {
    console.error('Error creating meeting:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
