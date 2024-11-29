// src/services/yuzuMeetService.js
import io from 'socket.io-client';

class YuzuMeetService {
    constructor() {
        this.socket = null;
        this._mediaStream = null;
        this.state = {
            currentMeeting: null,
            deviceType: 'glasses',
            isMuted: false,
            isVideoOff: false,
            participants: [],
            connectedDevices: new Set(),
            isConnecting: false,
            error: null,
            brightness: 0.8,
            mediaStream: null,
            localStream: null,
            remoteStreams: new Map()
        };
        this.subscribers = new Set();
        this.connectSocket();
    }

    connectSocket() {
        try {
            console.log('[YuzuMeetService] Connecting socket with:', {
                url: import.meta.env.VITE_SOCKET_URL,
                auth: { deviceType: this.state.deviceType }
            });
            this.socket = io(import.meta.env.VITE_SOCKET_URL, {
                auth: { deviceType: this.state.deviceType },
                withCredentials: true
            });
    
            // Add these debug logs
            this.socket.on('connect', () => {
                console.log('[YuzuMeetService] Socket connected with ID:', this.socket.id);
            });
    
            this.socket.on('connect_error', (error) => {
                console.error('[YuzuMeetService] Socket connection error:', error);
            });
    
            this.setupSocketListeners();
        } catch (error) {
            console.error('[YuzuMeetService] Socket connect error:', error);
            this.updateState({ error: 'Socket connection failed' });
            throw error;
        }
    }

    async initializeMediaStream() {
        console.log('[YuzuMeetService] Starting stream init');
        try {
          if (this._mediaStream) {
            console.log('[YuzuMeetService] Reusing stream:', this._mediaStream.getTracks());
            return this._mediaStream;
          }
      
          const devices = await navigator.mediaDevices.enumerateDevices();
          console.log('[YuzuMeetService] Available devices:', devices);
      
          const stream = await navigator.mediaDevices.getUserMedia({
            audio: true,
            video: { width: { ideal: 1280 }, height: { ideal: 720 } }
          });
          
          this._mediaStream = stream;
          console.log('[YuzuMeetService] New stream tracks:', stream.getTracks());
          
          this.updateState({
            mediaStream: stream,
            localStream: stream,
            error: null
          });
      
          return stream;
        } catch (err) {
          console.error('[YuzuMeetService] Stream init error:', err);
          throw err;
        }
      }

    setupSocketListeners() {
        const events = {
            'connect': () => {
                console.log('Socket connected');
                this.updateState({ error: null });
            },
            'disconnect': () => {
                console.log('Socket disconnected');
                this.cleanup();
            },
            'stateUpdate': (state) => this.updateState(state),
            'meetingJoined': (meeting) => {
                console.log('Meeting joined:', meeting);
                this.updateState({
                    currentMeeting: meeting,
                    isConnecting: false,
                    error: null
                });
            },
            'participantUpdate': (participants) => {
                    console.log('[YuzuMeetService] Received participant update:', participants);
                    this.updateState({ participants });
                },
            'error': (error) => {
                console.error('Socket error:', error);
                this.updateState({ error: error.message });
            }
        };

        Object.entries(events).forEach(([event, handler]) => {
            this.socket.on(event, handler);
        });
    }

    async createMeeting(params) {
        try {
            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/calendar/create-meeting`, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(params)
            });
    
            const meeting = await response.json();
            if (!response.ok) throw new Error(meeting.message);
    
            console.log('[YuzuMeetService] Meeting created, joining:', meeting);
            
            // First update state with the meeting
            this.updateState({ 
                currentMeeting: meeting
            });
            
            // Then explicitly try to join with the meeting ID
            try {
                await this.joinMeeting(meeting.meetingId);
                console.log('[YuzuMeetService] Successfully joined meeting');
            } catch (joinError) {
                console.error('[YuzuMeetService] Failed to join meeting:', joinError);
                throw joinError;
            }
    
            return meeting;
        } catch (error) {
            this.updateState({ error: error.message });
            throw error;
        }
    }
    

    async joinMeeting(meetingId) {
        try {
            await this.initializeMediaStream();
            this.updateState({ isConnecting: true, error: null });
            this.socket?.emit('joinMeeting', {
                meetingId,
                deviceType: this.state.deviceType,
                meetingUrl: this.state.currentMeeting?.meetingUrl,
                googleMeetId: this.state.currentMeeting?.meetingId 
            });
            this.socket?.emit('joinMeeting', {
                meetingId,
                deviceType: this.state.deviceType,
                meetingUrl: this.state.currentMeeting?.meetingUrl,
                googleMeetId: this.state.currentMeeting?.meetingId 
            });
        } catch (error) {
            this.updateState({
                isConnecting: false,
                error: error.message
            });
            throw error;
        }
    }

    async endMeeting() {
        try {
            this.socket?.emit('leaveMeeting');
            this.cleanup();
            this.updateState({
                currentMeeting: null,
                participants: [],
                remoteStreams: new Map()
            });
        } catch (error) {
            this.updateState({ error: error.message });
            throw error;
        }
    }

    async toggleMute() {
        try {
            const audioTracks = this._mediaStream?.getAudioTracks() || [];
            audioTracks.forEach(track => track.enabled = !track.enabled);
            this.socket?.emit('toggleMute');
            this.updateState({ isMuted: !this.state.isMuted });
        } catch (error) {
            this.updateState({ error: error.message });
            throw error;
        }
    }

    async toggleVideo() {
        try {
            if (!this._mediaStream) await this.initializeMediaStream();
            const videoTracks = this._mediaStream.getVideoTracks();
            videoTracks.forEach(track => track.enabled = !track.enabled);
            this.socket?.emit('toggleVideo');
            this.updateState({ isVideoOff: !this.state.isVideoOff });
        } catch (error) {
            this.updateState({ error: error.message });
            throw error;
        }
    }

    updateGlassesLayout(layout) {
        if (this.state.deviceType === 'glasses') {
            this.socket?.emit('updateLayout', layout);
            this.updateState({ currentLayout: layout });
        }
    }

    adjustBrightness(value) {
        if (this.state.deviceType === 'glasses') {
            this.socket?.emit('adjustBrightness', value);
            this.updateState({ brightness: value });
        }
    }

    updateState(newState) {
        this.state = { ...this.state, ...newState };
        this.subscribers.forEach(cb => cb(this.state));
        this.socket?.emit('stateSync', {
            deviceType: this.state.deviceType,
            state: this.state
        });
    }

    subscribe(callback) {
        this.subscribers.add(callback);
        return () => this.subscribers.delete(callback);
    }

    cleanup() {
        this._mediaStream?.getTracks().forEach(track => track.stop());
        this._mediaStream = null;
        this.socket?.disconnect();
    }
}

export const yuzuMeetService = new YuzuMeetService();