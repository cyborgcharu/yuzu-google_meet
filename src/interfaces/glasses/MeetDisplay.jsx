// src/interfaces/glasses/MeetDisplay.jsx
import React, { useState, useEffect } from 'react';
import { useMeet } from '../../context/MeetContext';
import { Card } from '../../components/ui/card';
import { VideoFeed } from '../../components/VideoFeed';
import { Mic, Camera, Plus, PhoneOff } from 'lucide-react';
import { MeetingPanel } from '../../components/MeetingPanel'; // Add this import

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
    if (!mediaStream) {
      initializeMediaStream().catch(err => {
        console.error('GlassesMeetDisplay: Media init failed', err);
      });
    }
  }, [initializeMediaStream, mediaStream]);

  useEffect(() => {
    console.log('[GlassesMeetDisplay] showCreatePanel:', showCreatePanel);
  }, [showCreatePanel]);

  if (error) return <Card className="p-4 bg-red-50"><p className="text-red-600">Error: {error}</p></Card>;

  return (
    <div className="min-h-screen bg-black text-white p-4">
      <main className="relative">
        <VideoFeed />
        {!currentMeeting && (
          <div className="absolute top-0 left-0 w-full h-full flex flex-col items-center justify-center z-10">
            {showCreatePanel ? (
              <div className="w-full max-w-md bg-opacity-90 bg-black p-4 rounded-lg shadow-lg">
                <MeetingPanel onClose={() => setShowCreatePanel(false)} />
              </div>
            ) : (
              <button
                onClick={() => {
                  console.log('[GlassesMeetDisplay] Showing create panel');
                  setShowCreatePanel(true);
                }}
                className="mb-4 bg-blue-500 hover:bg-blue-600 p-6 rounded-full transform transition-transform hover:scale-105"
              >
                <Plus className="w-8 h-8" />
              </button>
            )}
          </div>
        )}

        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 flex gap-4 bg-gray-900 p-4 rounded-full shadow-lg z-20">
          <button
            onClick={toggleMute}
            className={`p-4 rounded-full transition-colors ${isMuted ? 'bg-red-500' : 'bg-blue-500'}`}
          >
            <Mic className="w-6 h-6 text-white" />
          </button>
          <button
            onClick={toggleVideo}
            className={`p-4 rounded-full transition-colors ${isVideoOff ? 'bg-red-500' : 'bg-blue-500'}`}
          >
            <Camera className="w-6 h-6 text-white" />
          </button>
          {currentMeeting && (
            <button
              onClick={endMeeting}
              className="p-4 rounded-full bg-red-500 hover:bg-red-600 transition-colors"
            >
              <PhoneOff className="w-6 h-6 text-white" />
            </button>
          )}
        </div>
      </main>
    </div>
  );
};