// src/utils/socketServer.js
import { Server } from 'socket.io';
import ServerSessionManager from './ServerSessionManager.js';

const serverSessionManager = new ServerSessionManager();

export function setupSocketServer(server) {
  const io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL,
      credentials: true
    }
  });

  // Authentication middleware
  io.use((socket, next) => {
    console.log('[SocketServer] Auth attempt:', {
        deviceType: socket.handshake.auth.deviceType,
        session: socket.handshake.session  // Add this to check session
    });
    next(); // Temporarily bypass auth for testing
});

  // Handle device connections
  io.on('connection', (socket) => {
    console.log('[SocketServer] New connection details:', {
        id: socket.id,
        session: socket.handshake.session,
        auth: socket.handshake.auth
    });
    const sessionId = socket.handshake.session?.id;
    const deviceType = socket.handshake.auth.deviceType;

    console.log(`[SocketServer] New ${deviceType} connection:`, socket.id);

    let session = serverSessionManager.getSessionByDeviceId(socket.id);
    if (!session) {
      session = serverSessionManager.addDeviceToSession(sessionId, deviceType, socket);
    }

    // Handle meeting events
    socket.on('joinMeeting', (meetingData) => {
        console.log(`[SocketServer] ${deviceType} joining meeting:`, {
          meetingData,
          sessionId,
          socketId: socket.id
        });
      
        // Get current session
        const session = serverSessionManager.getSessionByDeviceId(socket.id);
        console.log('[SocketServer] Current session:', session);
      
        const updatedSession = serverSessionManager.updateMeetingState(sessionId, {
          ...meetingData,
          deviceType,
          socketId: socket.id
        });
        console.log('[SocketServer] Updated session:', updatedSession);
      
        socket.join(meetingData.meetingId);
      });

    socket.on('mediaStateChange', (state) => {
      const session = serverSessionManager.getSessionByDeviceId(socket.id);
      if (session?.currentMeeting) {
        io.to(session.currentMeeting.meetingId).emit('mediaStateUpdate', {
          deviceType,
          socketId: socket.id,
          ...state
        });
      }
    });

    // Handle device-specific events
    if (deviceType === 'glasses') {
      handleGlassesEvents(socket, session);
    } else if (deviceType === 'ring') {
      handleRingEvents(socket, session);
    } else if (deviceType === 'watch') {
      handleWatchEvents(socket, session);
    }

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`[SocketServer] ${deviceType} disconnected:`, socket.id);
      serverSessionManager.removeDeviceFromSession(socket.id);
    });
  });

  return io;
}

function handleGlassesEvents(socket, session) {
  socket.on('updateLayout', (layout) => {
    const session = serverSessionManager.getSessionByDeviceId(socket.id);
    if (session?.currentMeeting) {
      serverSessionManager.updateSession(session.id, {
        glassesLayout: layout
      });
    }
  });
}

function handleRingEvents(socket, session) {
  socket.on('gesture', (gestureData) => {
    const session = serverSessionManager.getSessionByDeviceId(socket.id);
    if (session?.currentMeeting) {
      session.connectedDevices.forEach(({ socket: deviceSocket, type }) => {
        if (type === 'glasses') {
          deviceSocket.emit('ringGesture', gestureData);
        }
      });
    }
  });
}

function handleWatchEvents(socket, session) {
  socket.on('notification', (notificationData) => {
    const session = serverSessionManager.getSessionByDeviceId(socket.id);
    if (session?.currentMeeting) {
      session.connectedDevices.forEach(({ socket: deviceSocket, type }) => {
        if (type === 'glasses') {
          deviceSocket.emit('watchNotification', notificationData);
        }
      });
    }
  });
}