// src/context/MeetContext.jsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { yuzuMeetService } from '../services/yuzuMeetService';

export const MeetContext = createContext(null);

export function MeetProvider({ children }) {
  const [meetState, setMeetState] = useState(() => {
    console.log('MeetContext: Initializing state');
    return yuzuMeetService.state;
  });

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

  return (
    <MeetContext.Provider value={{
      ...meetState,
      toggleMute: () => yuzuMeetService.toggleMute(),
      toggleVideo: () => yuzuMeetService.toggleVideo(),
      createMeeting: (params) => yuzuMeetService.createMeeting(params),
      adjustBrightness: (value) => yuzuMeetService.adjustBrightness(value),
      updateGlassesLayout: (layout) => yuzuMeetService.updateGlassesLayout(layout)
    }}>
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