// src/context/MeetContext.jsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { yuzuMeetService } from '../services/yuzuMeetService';

export const MeetContext = createContext(null);

export function MeetProvider({ children }) {
  const [state, setState] = useState(yuzuMeetService.state);

  useEffect(() => {
    console.log('[MeetContext] Creating provider');
    const unsubscribe = yuzuMeetService.subscribe((state) => {
      console.log('[MeetContext] State update:', state);
      setState(state);
    });
    return () => unsubscribe();
  }, []);

  const contextValue = {
    ...state,
    toggleMute: () => yuzuMeetService.toggleMute(),
    toggleVideo: () => yuzuMeetService.toggleVideo(),
    createMeeting: (params) => yuzuMeetService.createMeeting(params),
    adjustBrightness: (value) => yuzuMeetService.adjustBrightness(value),
    updateGlassesLayout: (layout) => yuzuMeetService.updateGlassesLayout(layout),
    joinMeeting: (meetingId) => yuzuMeetService.joinMeeting(meetingId),
    initializeMediaStream: () => yuzuMeetService.initializeMediaStream(),
    endMeeting: () => yuzuMeetService.endMeeting(),
    setCurrentMeeting: (meeting) => yuzuMeetService.setCurrentMeeting(meeting)
  };

  return (
    <MeetContext.Provider value={contextValue}>
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
