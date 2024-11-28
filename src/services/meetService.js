// src/services/meetService.js
class MeetService {
  constructor() {
    console.log('MeetService: Initializing with clean state');
    this._isCreatingMeeting = false;
    this.state = {
      currentMeeting: null,
      isMuted: false,
      isVideoOff: false,
      participants: [],
      connectedDevices: new Set(),
      isConnecting: false,
      error: null
    };
    this.subscribers = new Set();
    this._mediaStream = null;
  }

  subscribe(callback) {
    console.log('MeetService: Adding subscriber');
    this.subscribers.add(callback);
    return () => {
      console.log('MeetService: Removing subscriber');
      this.subscribers.delete(callback);
    };
  }

  async initializeMediaStream() {
    console.log('MeetService: Starting media stream initialization');
    try {
      if (!this._mediaStream) {
        console.log('MeetService: Requesting user media permissions');
        this._mediaStream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 }
          }
        });
        console.log('MeetService: Media stream obtained:', this._mediaStream.getTracks().map(t => t.kind));
      }
      return this._mediaStream;
    } catch (error) {
      console.error('MeetService: Failed to initialize media stream:', error);
      throw error;
    }
  }

  async createMeeting(params) {
    if (this._isCreatingMeeting) {
      console.log('MeetService: Meeting creation already in progress');
      return;
    }

    try {
      this._isCreatingMeeting = true;
      console.log('MeetService: Creating new meeting with params:', params);
      
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/calendar/create-meeting`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      });
  
      if (response.status === 401) {
        const data = await response.json();
        if (data.redirectUrl) {
          window.location.href = data.redirectUrl;
          return;
        }
      }
  
      if (!response.ok) {
        throw new Error('Failed to create meeting');
      }
      
      const meeting = await response.json();
      this.setCurrentMeeting(meeting);
      return meeting;
    } catch (error) {
      console.error('MeetService: Error creating meeting:', error);
      throw error;
    } finally {
      this._isCreatingMeeting = false;
    }
  }

  setCurrentMeeting(meeting) {
    if (this.state.currentMeeting?.meetingId === meeting?.meetingId) {
      return;
    }
    console.log('MeetService: Setting current meeting:', meeting);
    
    this.updateState({
      currentMeeting: meeting
    });
    
    localStorage.setItem('currentMeeting', JSON.stringify(meeting));
    
    if (meeting?.meetingUrl) {
      window.open(meeting.meetingUrl, '_blank');
    }
  }

  updateState(newState) {
    console.log('MeetService: Updating state:', newState);
    this.state = { ...this.state, ...newState };
    this.subscribers.forEach(callback => callback(this.state));
  }

  cleanup() {
    console.log('MeetService: Cleaning up');
    if (this._mediaStream) {
      this._mediaStream.getTracks().forEach(track => track.stop());
      this._mediaStream = null;
    }
    this.subscribers.clear();
    this.state.connectedDevices.clear();
  }
}

export const meetService = new MeetService();
export const googleMeetService = meetService;