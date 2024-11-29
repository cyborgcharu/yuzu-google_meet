// src/interfaces/glasses/MeetDisplay.jsx
import React, { useState, useEffect } from 'react';
import { useMeet } from '../../context/MeetContext';
import { Card } from '../../components/ui/card';
import { VideoFeed } from '../../components/VideoFeed';
import { Mic, Camera, Plus, PhoneOff } from 'lucide-react';

export const GlassesMeetDisplay = () => {
  const {
    currentMeeting,
    participants,
    isMuted,
    isVideoOff,
    error,
    toggleMute,
    toggleVideo,
    endMeeting,
    initializeMediaStream,
    mediaStream
  } = useMeet();

  const [showCreatePanel, setShowCreatePanel] = useState(false);

  useEffect(() => {
    console.log('GlassesMeetDisplay: Initializing media');
    if (!mediaStream) { // Only initialize if no stream exists
      initializeMediaStream().catch(err => {
        console.error('GlassesMeetDisplay: Media init failed', err);
      });
    }
  }, [initializeMediaStream, mediaStream]);

  if (error) return <Card className="p-4 bg-red-50"><p className="text-red-600">Error: {error}</p></Card>;

  return (
    <div className="min-h-screen bg-black text-white p-4">
      <main>
        <VideoFeed />
        {!currentMeeting && (
          <div className="flex flex-col items-center justify-center min-h-[calc(100vh-8rem)]">
            <button
              onClick={() => setShowCreatePanel(true)}
              className="mb-4 bg-blue-500 hover:bg-blue-600 p-3 rounded-full"
            >
              <Plus className="w-6 h-6" />
            </button>
          </div>
        )}
      </main>

      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 flex gap-4 bg-gray-900 p-4 rounded-full shadow-lg">
        <button
          onClick={toggleMute}
          className={`p-4 rounded-full ${isMuted ? 'bg-red-500' : 'bg-blue-500'}`}
        >
          <Mic className="w-6 h-6 text-white" />
        </button>
        <button
          onClick={toggleVideo}
          className={`p-4 rounded-full ${isVideoOff ? 'bg-red-500' : 'bg-blue-500'}`}
        >
          <Camera className="w-6 h-6 text-white" />
        </button>
        {currentMeeting && (
          <button
            onClick={endMeeting}
            className="p-4 rounded-full bg-red-500 hover:bg-red-600"
          >
            <PhoneOff className="w-6 h-6 text-white" />
          </button>
        )}
      </div>
    </div>
  );
};