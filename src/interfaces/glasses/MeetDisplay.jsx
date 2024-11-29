// src/interfaces/glasses/MeetDisplay.jsx
import React, { useEffect, useContext } from 'react';
import { MeetContext } from '../../context/MeetContext';
import { Card } from '../../components/ui/card';
import { StatusIndicators } from '../../components/StatusIndicators';
import { VideoFeed } from '../../components/VideoFeed';
import { MeetingControls } from '../../components/MeetingControls';

export const GlassesMeetDisplay = () => {
  const {
    currentMeeting,
    participants,
    isMuted,
    isVideoOff,
    deviceType,
    error,
    toggleMute,
    toggleVideo,
    updateGlassesLayout,
    adjustBrightness,
  } = useContext(MeetContext);

  useEffect(() => {
    // Initialize glasses-specific features
    if (!currentMeeting) return;

    // Set default layout and brightness
    updateGlassesLayout(participants);
    adjustBrightness(0.8);
  }, [currentMeeting, participants, updateGlassesLayout, adjustBrightness]);

  if (error) {
    return (
      <Card className="p-4 bg-red-50">
        <p className="text-red-600">Error: {error}</p>
      </Card>
    );
  }

  if (!currentMeeting) {
    return (
      <div className="p-4 space-y-4">
        <Card className="p-4">
          <p className="text-lg">No active meeting</p>
        </Card>
        <MeetingControls /> {/* Add this to allow meeting creation */}
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      <StatusIndicators
        isMuted={isMuted}
        isVideoOff={isVideoOff}
        participants={participants}
      />

      <div className="flex-1">
        <VideoFeed
          participants={participants}
          currentMeeting={currentMeeting}
          deviceType={deviceType}
        />
      </div>

      <div className="fixed bottom-4 left-4 space-x-2">
        <MeetingControls /> {/* Add controls here as well */}
        <button
          onClick={toggleMute}
          className={`p-2 rounded-full ${isMuted ? 'bg-red-500' : 'bg-blue-500'}`}
        >
          {isMuted ? 'Unmute' : 'Mute'}
        </button>
        <button
          onClick={toggleVideo}
          className={`p-2 rounded-full ${isVideoOff ? 'bg-red-500' : 'bg-blue-500'}`}
        >
          {isVideoOff ? 'Start Video' : 'Stop Video'}
        </button>
      </div>
    </div>
  );
};