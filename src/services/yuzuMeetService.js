// src/services/yuzuMeetService.js
import io from 'socket.io-client';

class YuzuMeetService {
  constructor() {
    this.socket = null;
    this.state = {
      currentMeeting: null,
      deviceType: null, // 'glasses', 'ring', or 'watch'
      isMuted: false,
      isVideoOff: false,
      participants: [],
      connectedDevices: new Set(),
      isConnecting: false,
      error: null
    };
    this.subscribers = new Set();
  }

  async initialize(deviceType) {
    this.state.deviceType = deviceType;
    await this.connectSocket();
  }

  async connectSocket() {
    try {
      this.socket = io(`${import.meta.env.VITE_SOCKET_URL}`, {
        auth: {
          deviceType: this.state.deviceType
        }
      });

      this.setupSocketListeners();
    } catch (error) {
      console.error('YuzuMeet: Socket connection failed:', error);
      throw error;
    }
  }

  setupSocketListeners() {
    this.socket.on('connect', () => {
      console.log('YuzuMeet: Socket connected');
    });

    this.socket.on('stateUpdate', (newState) => {
      console.log('YuzuMeet: Received state update:', newState);
      this.updateState(newState);
    });

    this.socket.on('meetingJoined', (meetingData) => {
      console.log('YuzuMeet: Joined meeting:', meetingData);
      this.updateState({
        currentMeeting: meetingData,
        isConnecting: false
      });
    });

    this.socket.on('participantUpdate', (participants) => {
      console.log('YuzuMeet: Participant update:', participants);
      this.updateState({ participants });
    });

    this.socket.on('error', (error) => {
      console.error('YuzuMeet: Socket error:', error);
      this.updateState({ error: error.message });
    });

    // Device-specific handlers
    if (this.state.deviceType === 'glasses') {
      this.setupGlassesHandlers();
    } else if (this.state.deviceType === 'ring') {
      this.setupRingHandlers();
    } else if (this.state.deviceType === 'watch') {
      this.setupWatchHandlers();
    }
  }

  setupGlassesHandlers() {
    this.socket.on('mediaState', (mediaState) => {
      this.updateState({
        isMuted: mediaState.isMuted,
        isVideoOff: mediaState.isVideoOff
      });
    });
  }

  setupRingHandlers() {
    this.socket.on('gestureRecognized', (gesture) => {
      // Handle ring-specific gestures
      this.handleRingGesture(gesture);
    });
  }

  setupWatchHandlers() {
    this.socket.on('notificationReceived', (notification) => {
      // Handle watch-specific notifications
      this.handleWatchNotification(notification);
    });
  }

  async createMeeting(params) {
    try {
      this.socket.emit('createMeeting', params);
      return new Promise((resolve, reject) => {
        this.socket.once('meetingCreated', (meeting) => {
          this.setCurrentMeeting(meeting);
          resolve(meeting);
        });
        this.socket.once('error', reject);
      });
    } catch (error) {
      console.error('YuzuMeet: Error creating meeting:', error);
      throw error;
    }
  }

  async joinMeeting(meetingId) {
    try {
      this.updateState({ isConnecting: true });
      this.socket.emit('joinMeeting', {
        meetingId,
        deviceType: this.state.deviceType
      });
    } catch (error) {
      console.error('YuzuMeet: Error joining meeting:', error);
      this.updateState({
        isConnecting: false,
        error: 'Failed to join meeting'
      });
      throw error;
    }
  }

  setCurrentMeeting(meeting) {
    if (this.state.currentMeeting?.meetingId === meeting?.meetingId) {
      return;
    }
    
    this.updateState({
      currentMeeting: meeting
    });
    
    if (meeting?.meetingId) {
      this.joinMeeting(meeting.meetingId);
    }
  }

  updateState(newState) {
    this.state = { ...this.state, ...newState };
    this.subscribers.forEach(callback => callback(this.state));
    
    // Sync state with other devices
    if (this.socket) {
      this.socket.emit('stateSync', {
        deviceType: this.state.deviceType,
        state: this.state
      });
    }
  }

  subscribe(callback) {
    this.subscribers.add(callback);
    return () => {
      this.subscribers.delete(callback);
    };
  }

  // Media controls - now sent through socket
  async toggleMute() {
    this.socket.emit('toggleMute');
  }

  async toggleVideo() {
    this.socket.emit('toggleVideo');
  }

  cleanup() {
    if (this.socket) {
      this.socket.disconnect();
    }
    this.subscribers.clear();
  }
}

export const yuzuMeetService = new YuzuMeetService();