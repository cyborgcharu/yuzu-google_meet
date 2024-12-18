// src/utils/ServerSessionManager.js
class ServerSessionManager {
    constructor() {
      this.sessions = new Map();
      this.deviceSessions = new Map(); // Maps deviceId to sessionId
    }
  
    createServerSession(sessionId, user) {
      console.log('[ServerSessionManager] Creating server session:', sessionId);
      const session = {
        id: sessionId,
        user,
        connectedDevices: new Map(), // deviceId -> { type, socket }
        currentMeeting: null,
        createdAt: new Date(),
        lastActivity: new Date()
      };
      this.sessions.set(sessionId, session);
      return session;
    }
  
    addDeviceToSession(sessionId, deviceType, socket) {
      const session = this.sessions.get(sessionId);
      if (!session) {
        console.log('[ServerSessionManager] Session not found:', sessionId);
        return null;
      }
  
      const deviceId = `${deviceType}-${socket.id}`;
      session.connectedDevices.set(deviceId, {
        type: deviceType,
        socket,
        connectedAt: new Date()
      });
      this.deviceSessions.set(deviceId, sessionId);
      
      console.log(`[ServerSessionManager] Added ${deviceType} to session:`, sessionId);
      return session;
    }
  
    removeDeviceFromSession(deviceId) {
      const sessionId = this.deviceSessions.get(deviceId);
      if (!sessionId) return;
  
      const session = this.sessions.get(sessionId);
      if (!session) return;
  
      session.connectedDevices.delete(deviceId);
      this.deviceSessions.delete(deviceId);
      console.log(`[ServerSessionManager] Removed device ${deviceId} from session ${sessionId}`);
    }
  
    getSessionByDeviceId(deviceId) {
      const sessionId = this.deviceSessions.get(deviceId);
      return sessionId ? this.sessions.get(sessionId) : null;
    }
  
    updateSession(sessionId, updates) {
      const session = this.sessions.get(sessionId);
      if (!session) return null;
  
      const updatedSession = {
        ...session,
        ...updates,
        lastActivity: new Date()
      };
      this.sessions.set(sessionId, updatedSession);
      return updatedSession;
    }
  
    cleanupSession(sessionId) {
      const session = this.sessions.get(sessionId);
      if (!session) return;
  
      // Close all socket connections
      session.connectedDevices.forEach(({ socket }, deviceId) => {
        socket.disconnect(true);
        this.deviceSessions.delete(deviceId);
      });
  
      this.sessions.delete(sessionId);
      console.log(`[ServerSessionManager] Cleaned up session:`, sessionId);
    }
  
    getConnectedDevices(sessionId) {
      const session = this.sessions.get(sessionId);
      if (!session) return new Map();
      return session.connectedDevices;
    }
  
    updateMeetingState(sessionId, meetingState) {
        const session = this.sessions.get(sessionId);
        if (!session) return null;
      
        // Add this check and merge
        if (session.currentMeeting?.meetingId === meetingState.meetingId) {
          meetingState = { ...session.currentMeeting, ...meetingState };
        }
      
        // Initialize or update participants array
        if (!meetingState.participants) {
          meetingState.participants = [];
        }
        
        // Add the current device as a participant if not already present
        const deviceInfo = {
          deviceType: meetingState.deviceType,
          socketId: meetingState.socketId
        };
        
        if (!meetingState.participants.some(p => p.socketId === deviceInfo.socketId)) {
          meetingState.participants.push(deviceInfo);
        }
      
        session.currentMeeting = meetingState;
        session.lastActivity = new Date();
        
        // Emit both meeting state and participant updates
        session.connectedDevices.forEach(({ socket }) => {
          socket.emit('meetingStateUpdate', meetingState);
          socket.emit('participantUpdate', meetingState.participants);
        });
      
        return session;
    }
  }
  
  export default ServerSessionManager;