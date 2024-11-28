// src/context/MeetContext.jsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { meetService } from '../services/meetService';

export const MeetContext = createContext(null);  // Create the context

export function MeetProvider({ children }) {
  console.log('MeetContext: Provider initializing');
  const [meetState, setMeetState] = useState(() => {
    console.log('MeetContext: Initializing state');

    return meetService.state;
  });


  useEffect(() => {
    console.log('MeetContext: Setting up subscription');
    let mounted = true;
    const unsubscribe = meetService.subscribe(state => {
      console.log('MeetContext: Received state update:', state);
      if (mounted && state.currentMeeting?.meetingId && state.currentMeeting?.meetingUrl) {
        setMeetState(state);
      }
    });
    return () => {
      mounted = false;
      console.log('MeetContext: Cleaning up subscription');
      unsubscribe();
    };
  }, []);

  const value = {
    ...meetState,
    createMeeting: (params) => meetService.createMeeting(params),
    toggleMute: () => meetService.toggleMute(),
    toggleVideo: () => meetService.toggleVideo(),
    connectDevice: (deviceType) => meetService.connectDevice(deviceType),
    disconnectDevice: (deviceType) => meetService.disconnectDevice(deviceType),
    setCurrentMeeting: (meeting) => meetService.setCurrentMeeting(meeting),
    updateParticipants: (participants) => meetService.updateParticipants(participants)
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