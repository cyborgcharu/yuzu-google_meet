// src/interfaces/ring/MeetDisplay.jsx
import React, { useEffect, useRef, useContext } from 'react';
import { Card } from '@/components/ui/card';
import { Mic, Camera, Settings, PhoneOff } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { MeetContext } from '@/context/MeetContext';
import { useNavigate } from 'react-router-dom';
import { yuzuMeetService } from '../../services/yuzuMeetService';

export const RingMeetDisplay = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const { 
    currentMeeting,
    isMuted,
    isVideoOff,
    error,
    createMeeting,
    endMeeting,
    toggleMute,
    toggleVideo
  } = useContext(MeetContext);

  const deviceType = window.location.pathname.split('/')[1] || 'web';

  // Initial meeting and media stream setup
  useEffect(() => {
    let mounted = true;
  
    const initializeMedia = async () => {
      try {
        if (!currentMeeting) {
          await createMeeting({
            title: `Yuzu ${deviceType} Meeting - ${user?.name}`,
            startTime: new Date().toISOString(),
            endTime: new Date(Date.now() + 3600000).toISOString()
          });
        }
    
        const mediaStream = await meetService.initializeMediaStream();
        if (mounted && videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      } catch (err) {
        console.error('Failed to initialize media:', err);
      }
    };
  
    initializeMedia();
  
    return () => {
      mounted = false;
    };
  }, [currentMeeting, createMeeting, deviceType, user?.name]); 

  const handleToggleVideo = (e) => {
    e.preventDefault();
    console.log('Current video state before toggle:', isVideoOff);
    toggleVideo(deviceType);
  };
  
  const handleToggleMute = (e) => {
    e.preventDefault();
    console.log('Current audio state before toggle:', isMuted);
    toggleMute(deviceType);
  };

  const handleEndCall = async (e) => {
    e.preventDefault();
    try {
      await endMeeting();
      meetService.stopMediaStream();
      navigate('/');
    } catch (err) {
      console.error('Failed to end meeting:', err);
    }
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <p className="text-red-500 mb-4">Error: {error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-900">
      {/* Meeting Info */}
      {currentMeeting && (
        <div className="fixed top-4 right-4 bg-slate-800/80 backdrop-blur-sm rounded-lg p-2 text-white">
          <p className="text-sm">Meeting ID: {currentMeeting.meetingId}</p>
          <a 
            href={currentMeeting.meetingUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-sm text-blue-400 hover:text-blue-300"
          >
            Join on web →
          </a>
        </div>
      )}

      {/* Main Video Feed */}
      <div className="flex-1 relative">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
        />
        
        {isVideoOff && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-900">
            <div className="w-24 h-24 rounded-full bg-slate-700 flex items-center justify-center">
              <span className="text-3xl text-white">
                {user?.name?.[0]?.toUpperCase() || '?'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <Card className="fixed bottom-8 left-1/2 transform -translate-x-1/2 bg-slate-800/50 backdrop-blur">
        <div className="flex items-center space-x-4 p-2">
          <button
            onClick={handleToggleMute}
            className={`p-3 rounded-full transition-colors ${
              isMuted ? 'bg-red-500 hover:bg-red-600' : 'bg-slate-700 hover:bg-slate-600'
            }`}
          >
            <Mic className="w-5 h-5 text-white" />
          </button>
          
          <button
            onClick={handleToggleVideo}
            className={`p-3 rounded-full transition-colors ${
              isVideoOff ? 'bg-red-500 hover:bg-red-600' : 'bg-slate-700 hover:bg-slate-600'
            }`}
          >
            <Camera className="w-5 h-5 text-white" />
          </button>
          
          <button
            onClick={handleEndCall}
            className="p-3 rounded-full bg-red-500 hover:bg-red-600 transition-colors"
          >
            <PhoneOff className="w-5 h-5 text-white" />
          </button>
          
          <button
            className="p-3 rounded-full bg-slate-700 hover:bg-slate-600 transition-colors"
          >
            <Settings className="w-5 h-5 text-white" />
          </button>
        </div>
      </Card>
    </div>
  );
};