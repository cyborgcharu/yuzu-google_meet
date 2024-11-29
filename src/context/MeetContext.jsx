// src/context/MeetContext.jsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { yuzuMeetService } from '../services/yuzuMeetService';

export const MeetContext = createContext(null);

export function MeetProvider({ children, deviceType = 'glasses' }) {
  console.log('MeetContext: Provider initializing for device:', deviceType);
  const [meetState, setMeetState] = useState(() => {
    console.log('MeetContext: Initializing state');
    return yuzuMeetService.state;
  });

  useEffect(() => {
    console.log('MeetContext: Initializing YuzuMeetService');
    yuzuMeetService.initialize(deviceType).catch(console.error);
  }, [deviceType]);

  useEffect(() => {
    console.log('MeetContext: Setting up subscription');
    let mounted = true;
    const unsubscribe = yuzuMeetService.subscribe(state => {
      console.log('MeetContext: Received state update:', state);
      if (mounted) {
        setMeetState(state);
      }
    });
    
    return () => {
      mounted = false;
      console.log('MeetContext: Cleaning up subscription');
      unsubscribe();
    };
  }, []);

  // Create a value object with device-specific methods
  const value = {
    ...meetState,
    deviceType,
    createMeeting: (params) => yuzuMeetService.createMeeting(params),
    joinMeeting: (meetingId) => yuzuMeetService.joinMeeting(meetingId),
    toggleMute: () => yuzuMeetService.toggleMute(),
    toggleVideo: () => yuzuMeetService.toggleVideo(),
    
    // Device-specific actions
    ...(deviceType === 'glasses' && {
      updateParticipantLayout: (layout) => yuzuMeetService.updateGlassesLayout(layout),
      adjustBrightness: (level) => yuzuMeetService.adjustGlassesBrightness(level)
    }),
    
    ...(deviceType === 'ring' && {
      registerGesture: (gesture) => yuzuMeetService.registerRingGesture(gesture),
      calibrate: () => yuzuMeetService.calibrateRing()
    }),
    
    ...(deviceType === 'watch' && {
      updateNotificationPreferences: (prefs) => yuzuMeetService.updateWatchNotifications(prefs),
      vibrate: (pattern) => yuzuMeetService.vibrateWatch(pattern)
    })
  };

  return (
    <MeetContext.Provider value={value}>
      {children}
    </MeetContext.Provider>
  );
}

export function useMeet() {
  const context = useContext(MeetContext);
  if (!context) {
    throw new Error('useMeet must be used within a MeetProvider');
  }
  return context;
}