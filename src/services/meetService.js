// src/services/meetService.js
class MeetService {
  constructor() {
    console.log('MeetService: Initializing with WebRTC support');
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
    
    // WebRTC related properties
    this.peerConnections = new Map(); // Store RTCPeerConnection for each participant
    this.localStream = null;
    this.remoteStreams = new Map();
    this._mediaStream = null;
    
    // Initialize ICE servers (STUN/TURN)
    this.iceServers = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
        // Add your TURN servers here for production
      ]
    };

    this.subscribers = new Set();
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
        this.localStream = this._mediaStream;
        console.log('MeetService: Media stream obtained:', this._mediaStream.getTracks().map(t => t.kind));
      }
      return this._mediaStream;
    } catch (error) {
      console.error('MeetService: Failed to initialize media stream:', error);
      throw error;
    }
  }

  async createPeerConnection(participantId) {
    try {
      const peerConnection = new RTCPeerConnection(this.iceServers);
      
      // Add local tracks to the peer connection
      this.localStream.getTracks().forEach(track => {
        peerConnection.addTrack(track, this.localStream);
      });

      // Handle incoming tracks
      peerConnection.ontrack = (event) => {
        console.log('MeetService: Received remote track from:', participantId);
        this.remoteStreams.set(participantId, event.streams[0]);
        this.updateParticipantStream(participantId, event.streams[0]);
      };

      // Handle ICE candidates
      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          this.sendIceCandidate(participantId, event.candidate);
        }
      };

      // Handle connection state changes
      peerConnection.onconnectionstatechange = () => {
        console.log('MeetService: Connection state changed:', peerConnection.connectionState);
        if (peerConnection.connectionState === 'connected') {
          this.updateParticipantStatus(participantId, 'connected');
        }
      };

      this.peerConnections.set(participantId, peerConnection);
      return peerConnection;
    } catch (error) {
      console.error('MeetService: Error creating peer connection:', error);
      throw error;
    }
  }

  async joinMeeting(meetingId) {
    try {
      console.log('MeetService: Joining meeting:', meetingId);
      this.updateState({ isConnecting: true });

      // Initialize media stream
      await this.initializeMediaStream();

      // Connect to signaling server (you'll need to implement this)
      await this.connectToSignalingServer(meetingId);

      // Update state to reflect connection
      this.updateState({
        isConnecting: false,
        currentMeeting: {
          ...this.state.currentMeeting,
          isConnected: true
        }
      });

    } catch (error) {
      console.error('MeetService: Failed to join meeting:', error);
      this.updateState({ 
        isConnecting: false,
        error: 'Failed to join meeting: ' + error.message
      });
      throw error;
    }
  }

  async connectToSignalingServer(meetingId) {
    // Implement WebSocket connection to your signaling server
    // This is where you'll handle the Google Meet integration
    console.log('MeetService: Connecting to signaling server for meeting:', meetingId);
    
    // Example WebSocket connection (implement your actual signaling logic)
    this.signalingConnection = new WebSocket(`wss://your-signaling-server.com/meet/${meetingId}`);
    
    this.signalingConnection.onmessage = async (event) => {
      const message = JSON.parse(event.data);
      await this.handleSignalingMessage(message);
    };
  }

  async handleSignalingMessage(message) {
    switch (message.type) {
      case 'offer':
        await this.handleOffer(message);
        break;
      case 'answer':
        await this.handleAnswer(message);
        break;
      case 'ice-candidate':
        await this.handleIceCandidate(message);
        break;
      case 'participant-joined':
        await this.handleParticipantJoined(message);
        break;
      case 'participant-left':
        await this.handleParticipantLeft(message);
        break;
    }
  }

  async createMeeting(params) {
    if (this._isCreatingMeeting) {
      console.log('MeetService: Meeting creation already in progress');
      return;
    }

    try {
      this._isCreatingMeeting = true;
      
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/calendar/create-meeting`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      });

      if (!response.ok) {
        throw new Error('Failed to create meeting');
      }
      
      const meeting = await response.json();
      await this.setCurrentMeeting(meeting);
      return meeting;
    } catch (error) {
      console.error('MeetService: Error creating meeting:', error);
      throw error;
    } finally {
      this._isCreatingMeeting = false;
    }
  }

  async setCurrentMeeting(meeting) {
    if (this.state.currentMeeting?.meetingId === meeting?.meetingId) {
      return;
    }
    
    console.log('MeetService: Setting current meeting:', meeting);
    this.updateState({
      currentMeeting: meeting
    });
    
    localStorage.setItem('currentMeeting', JSON.stringify(meeting));
    
    // Join the meeting immediately
    if (meeting?.meetingId) {
      await this.joinMeeting(meeting.meetingId);
    }
  }

  updateState(newState) {
    console.log('MeetService: Updating state:', newState);
    this.state = { ...this.state, ...newState };
    this.subscribers.forEach(callback => callback(this.state));
  }

  // Media control methods
  async toggleMute() {
    if (this.localStream) {
      const audioTracks = this.localStream.getAudioTracks();
      audioTracks.forEach(track => {
        track.enabled = !track.enabled;
      });
      this.updateState({ isMuted: !this.state.isMuted });
    }
  }

  async toggleVideo() {
    if (this.localStream) {
      const videoTracks = this.localStream.getVideoTracks();
      videoTracks.forEach(track => {
        track.enabled = !track.enabled;
      });
      this.updateState({ isVideoOff: !this.state.isVideoOff });
    }
  }

  cleanup() {
    console.log('MeetService: Cleaning up');
    
    // Close all peer connections
    this.peerConnections.forEach(connection => {
      connection.close();
    });
    this.peerConnections.clear();

    // Stop all media tracks
    if (this._mediaStream) {
      this._mediaStream.getTracks().forEach(track => track.stop());
      this._mediaStream = null;
    }

    // Close signaling connection
    if (this.signalingConnection) {
      this.signalingConnection.close();
    }

    this.remoteStreams.clear();
    this.subscribers.clear();
    this.state.connectedDevices.clear();
  }

  // Methods to implement for full Google Meet integration
  async handleOffer(message) {
    // Implement offer handling
  }

  async handleAnswer(message) {
    // Implement answer handling
  }

  async handleIceCandidate(message) {
    // Implement ICE candidate handling
  }

  async handleParticipantJoined(message) {
    // Implement new participant handling
  }

  async handleParticipantLeft(message) {
    // Implement participant departure handling
  }

  async sendIceCandidate(participantId, candidate) {
    // Implement ICE candidate sending
  }

  updateParticipantStream(participantId, stream) {
    // Implement participant stream updates
  }

  updateParticipantStatus(participantId, status) {
    // Implement participant status updates
  }
}

export const meetService = new MeetService();
export const googleMeetService = meetService;