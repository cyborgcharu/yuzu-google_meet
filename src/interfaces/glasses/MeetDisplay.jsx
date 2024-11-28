// src/interfaces/glasses/MeetDisplay.jsx
import React, { useState, useEffect, useRef, useContext } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Mic, Camera, Settings, PhoneOff } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { MeetContext } from '../../context/MeetContext';
import { useNavigate } from 'react-router-dom';
import { meetService } from '../../services/meetService';

export const GlassesMeetDisplay = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isCreatingMeeting, setIsCreatingMeeting] = useState(false);
  
  // Get meet context
  const meetContext = useContext(MeetContext);
  if (!meetContext) {
    throw new Error('GlassesMeetDisplay must be used within a MeetProvider');
  }
  
  const { currentMeeting, createMeeting } = meetContext;

  // Initialize meeting when component mounts
  useEffect(() => {
    const initializeMeeting = async () => {
      if (!currentMeeting && !isCreatingMeeting) {
        try {
          console.log('Creating new meeting...');
          setIsCreatingMeeting(true);
          await createMeeting({
            title: `${user?.name}'s Meeting`,
            startTime: new Date().toISOString(),
            endTime: new Date(Date.now() + 3600000).toISOString()
          });
        } catch (err) {
          console.error('Failed to create meeting:', err);
        } finally {
          setIsCreatingMeeting(false);
        }
      }
    };

    initializeMeeting();
  }, [currentMeeting, createMeeting, user, isCreatingMeeting]);

  // Initialize video stream when component mounts
  useEffect(() => {
    const initializeVideo = async () => {
      try {
        if (!isVideoOff && videoRef.current) {
          const stream = await navigator.mediaDevices.getUserMedia({ 
            video: true,
            audio: true 
          });
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error('Failed to initialize video:', err);
        setIsVideoOff(true);
      }
    };

    initializeVideo();
    
    // Cleanup function
    return () => {
      if (videoRef.current?.srcObject) {
        const tracks = videoRef.current.srcObject.getTracks();
        tracks.forEach(track => track.stop());
      }
    };
  }, [isVideoOff]);

  const handleMuteToggle = () => {
    setIsMuted(prev => !prev);
    if (videoRef.current?.srcObject) {
      videoRef.current.srcObject.getAudioTracks().forEach(track => {
        track.enabled = isMuted;
      });
    }
  };

  const handleVideoToggle = () => {
    setIsVideoOff(prev => !prev);
    if (videoRef.current?.srcObject) {
      videoRef.current.srcObject.getVideoTracks().forEach(track => {
        track.enabled = isVideoOff;
      });
    }
  };

  const handleEndCall = async () => {
    try {
      if (currentMeeting) {
        await meetService.endMeeting(currentMeeting.meetingId);
      }
      // Stop all media tracks
      if (videoRef.current?.srcObject) {
        const tracks = videoRef.current.srcObject.getTracks();
        tracks.forEach(track => track.stop());
      }
      navigate('/');
    } catch (err) {
      console.error('Failed to end meeting:', err);
    }
  };

  return (
    <Card className="fixed inset-0 bg-slate-900 z-50">
      <CardContent className="relative w-full h-full">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isMuted}
          className={`w-full h-full object-cover ${isVideoOff ? 'hidden' : ''}`}
          onError={(e) => console.error('Video element error:', e)}
        />

        {isVideoOff && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-800">
            <Camera className="w-24 h-24 text-slate-600" />
          </div>
        )}

        {currentMeeting && (
          <div className="absolute top-8 left-1/2 transform -translate-x-1/2 bg-slate-800/80 backdrop-blur-sm rounded-lg p-4 text-center">
            <p className="text-base text-white">
              Meeting ID: {currentMeeting.meetingId}
            </p>
            
              href={currentMeeting.meetingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-400 hover:text-blue-300 inline-block mt-1"
            <a>
              Join on web →
            </a>
          </div>
        )}

        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 bg-slate-800/50 backdrop-blur-sm rounded-full">
          <div className="flex items-center space-x-4 p-2">
            <button
              onClick={handleMuteToggle}
              className={`p-4 rounded-full ${
                isMuted ? 'bg-red-500/80 hover:bg-red-600/80' : 'bg-slate-700/80 hover:bg-slate-600/80'
              } transition-colors`}
            >
              <Mic className="w-6 h-6 text-white" />
            </button>
            <button
              onClick={handleVideoToggle}
              className={`p-4 rounded-full ${
                isVideoOff ? 'bg-red-500/80 hover:bg-red-600/80' : 'bg-slate-700/80 hover:bg-slate-600/80'
              } transition-colors`}
            >
              <Camera className="w-6 h-6 text-white" />
            </button>
            <button
              onClick={handleEndCall}
              className="p-4 rounded-full bg-red-500/80 hover:bg-red-600/80 transition-colors"
            >
              <PhoneOff className="w-6 h-6 text-white" />
            </button>
            <button
              className="p-4 rounded-full bg-slate-700/80 hover:bg-slate-600/80 transition-colors"
            >
              <Settings className="w-6 h-6 text-white" />
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};