// src/services/yuzuMeetService.js
import io from 'socket.io-client';

class YuzuMeetService {
  constructor() {
    this.socket = null;
    this._mediaStream = null;
    this.state = {
      currentMeeting: null,
      deviceType: null,
      isMuted: false,
      isVideoOff: false,
      participants: [],
      connectedDevices: new Set(),
      isConnecting: false,
      error: null,
    };
    this.subscribers = new Set();
    this.connectSocket();
  }

  async initialize(deviceType) {
    this.state.deviceType = deviceType;
    await this.connectSocket();
  }

  async initializeMediaStream() {
    try {
      this._mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      this.localStream = this._mediaStream;
      return this._mediaStream;
    } catch (error) {
      console.error('Failed to get media stream:', error);
      throw error;
    }
  }

  async connectSocket() {
    try {
      this.socket = io(`${import.meta.env.VITE_SOCKET_URL}`, {
        auth: { deviceType: this.state.deviceType },
        autoConnect: true // Ensure auto-connection
      });

      this.setupSocketListeners();
    } catch (error) {
      console.error('YuzuMeet: Socket connection failed:', error);
      this.updateState({ error: 'Failed to connect to the server' });
    }
  }

  setupSocketListeners() {
    this.socket.on('connect', () => {
      console.log('YuzuMeet: Socket connected');
    });

    this.socket.on('stateUpdate', (newState) => {
      this.updateState(newState);
    });

    this.socket.on('meetingJoined', (meetingData) => {
      this.updateState({
        currentMeeting: meetingData,
        isConnecting: false,
      });
    });

    this.socket.on('participantUpdate', (participants) => {
      this.updateState({ participants });
    });

    this.socket.on('error', (error) => {
      console.error('YuzuMeet: Socket error:', error);
      this.updateState({ error: error.message });
    });

    this.setupDeviceHandlers();
  }

  setupDeviceHandlers() {
    switch (this.state.deviceType) {
      case 'glasses':
        this.setupGlassesHandlers();
        break;
      case 'ring':
        this.setupRingHandlers();
        break;
      case 'watch':
        this.setupWatchHandlers();
        break;
      default:
        break;
    }
  }

  setupGlassesHandlers() {
    this.socket.on('mediaState', (mediaState) => {
      this.updateState({
        isMuted: mediaState.isMuted,
        isVideoOff: mediaState.isVideoOff
      });
    });
    
    this.socket.on('brightnessChange', (value) => {
      this.updateState({ brightness: value });
    });
  }

  adjustBrightness(value) {
    if (this.state.deviceType === 'glasses') {
      this.socket?.emit('adjustBrightness', value);
      this.updateState({ brightness: value });
    }
  }

  updateGlassesLayout(layout) {
    if (this.state.deviceType === 'glasses') {
      this.socket.emit('updateLayout', layout);
      this.updateState({ currentLayout: layout });
    }
  }

  setupRingHandlers() {
    this.socket.on('gestureRecognized', (gesture) => {
      this.handleRingGesture(gesture);
    });
  }

  setupWatchHandlers() {
    this.socket.on('notificationReceived', (notification) => {
      this.handleWatchNotification(notification);
    });
  }

  async createMeeting(params) {
    try {
      if (!this.socket?.connected) {
        await this.connectSocket();
      }

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
      
      if (this.socket?.connected) {
        this.socket.emit('meetingCreated', meeting);
      }
      
      this.setCurrentMeeting(meeting);
      return meeting;
    } catch (error) {
      console.error('YuzuMeet: Error creating meeting:', error);
      throw error;
    }
  }

  async joinMeeting(meetingId) {
    try {
      this.updateState({ isConnecting: true });
      this.socket.emit('joinMeeting', { meetingId, deviceType: this.state.deviceType });
    } catch (error) {
      console.error('YuzuMeet: Error joining meeting:', error);
      this.updateState({
        isConnecting: false,
        error: 'Failed to join meeting',
      });
      throw error;
    }
  }

  setCurrentMeeting(meeting) {
    if (this.state.currentMeeting?.meetingId === meeting?.meetingId) {
      return;
    }

    this.updateState({
      currentMeeting: meeting,
    });

    if (meeting?.meetingId) {
      this.joinMeeting(meeting.meetingId);
    }
  }

  updateState(newState) {
    this.state = { ...this.state, ...newState };
    this.subscribers.forEach((callback) => callback(this.state));
    this.syncStateWithOtherDevices();
  }

  syncStateWithOtherDevices() {
    if (this.socket) {
      this.socket.emit('stateSync', {
        deviceType: this.state.deviceType,
        state: this.state,
      });
    }
  }

  subscribe(callback) {
    this.subscribers.add(callback);
    return () => {
      this.subscribers.delete(callback);
    };
  }

  async toggleMute() {
    this.socket.emit('toggleMute');
  }

  async toggleVideo() {
    if (!this._mediaStream) {
      await this.initializeMediaStream();
    }
    
    const videoTracks = this._mediaStream.getVideoTracks();
    videoTracks.forEach(track => {
      track.enabled = !track.enabled;
    });
    
    this.socket?.emit('toggleVideo');
    this.updateState({ isVideoOff: !this.state.isVideoOff });
  }

  cleanup() {
    if (this.socket) {
      this.socket.disconnect();
    }
    this.subscribers.clear();
  }
}

export const yuzuMeetService = new YuzuMeetService();