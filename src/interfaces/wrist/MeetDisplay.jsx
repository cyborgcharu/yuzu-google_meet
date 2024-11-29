// src/interfaces/wrist/MeetDisplay.jsx
import React, { useEffect, useRef, useContext } from 'react';
import { Card } from '@/components/ui/card';
import { Mic, Camera, Settings, PhoneOff } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { MeetContext } from '@/context/MeetContext';
import { useNavigate } from 'react-router-dom';
import { yuzuMeetService } from '../../services/yuzuMeetService';

export const WristMeetDisplay = () => {
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

  const deviceType = window.location.pathname.split('/')[1] || 'web'; // 'glasses' or 'wrist'


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
  
    // Only cleanup on unmount
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
      <div className="fixed inset-0 bg-slate-900 flex flex-col items-center justify-center p-4">
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
    <div className="fixed inset-0 bg-slate-900">
      <div className="flex flex-col h-full items-center justify-center space-y-6">
        {/* Video Preview */}
        <div className="w-[300px] h-[200px] rounded-lg overflow-hidden bg-slate-800 shadow-lg relative">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
          {isVideoOff && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-800">
              <span className="text-4xl text-white">
                {user?.name?.[0]?.toUpperCase() || '?'}
              </span>
            </div>
          )}
        </div>

        {/* Meeting Info */}
        {currentMeeting && (
          <div className="bg-slate-800/80 backdrop-blur-sm rounded-lg p-2 text-white text-center">
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
        
        {/* Controls Card */}
        <Card className="w-[300px] bg-slate-800/90 backdrop-blur-sm text-white shadow-lg">
          <div className="p-4">
            <h2 className="text-xl mb-4 text-center">{user?.name || 'User'}</h2>
            
            <div className="flex justify-center space-x-4">
              <button 
                onClick={handleToggleMute}
                className={`p-4 rounded-full transition-colors ${
                  isMuted ? 'bg-red-500 hover:bg-red-600' : 'bg-slate-700 hover:bg-slate-600'
                }`}
              >
                <Mic className="w-6 h-6" />
              </button>
              <button 
                onClick={handleToggleVideo}
                className={`p-4 rounded-full transition-colors ${
                  isVideoOff ? 'bg-red-500 hover:bg-red-600' : 'bg-slate-700 hover:bg-slate-600'
                }`}
              >
                <Camera className="w-6 h-6" />
              </button>
              <button 
                onClick={handleEndCall}
                className="p-4 rounded-full bg-red-500 hover:bg-red-600 transition-colors"
              >
                <PhoneOff className="w-6 h-6" />
              </button>
              <button 
                className="p-4 rounded-full bg-slate-700 hover:bg-slate-600 transition-colors"
              >
                <Settings className="w-6 h-6" />
              </button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};