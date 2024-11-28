// src/interfaces/glasses/MeetDisplay.jsx
console.log('GlassesMeetDisplay component loaded');

import React, { useState, useEffect, useRef, useContext } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Mic, Camera, Settings, PhoneOff } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { MeetContext } from '../../context/MeetContext';
import { useNavigate } from 'react-router-dom';
import { meetService } from '../../services/meetService';

export const GlassesMeetDisplay = () => {
  const [isCreatingMeeting, setIsCreatingMeeting] = useState(false);
  
  useEffect(() => {
    const initializeMeeting = async () => {
      if (!currentMeeting && !isCreatingMeeting) {
        try {
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

  const handleMuteToggle = () => {
    setIsMuted((prevState) => !prevState);
  };

  const handleVideoToggle = () => {
    setIsVideoOff((prevState) => !prevState);
  };

  const handleEndCall = async () => {
    try {
      await meetService.endMeeting(currentMeeting.id);
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
          className="w-full h-full object-cover"
          onError={(e) => console.error('Video element error:', e)}
        />

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
              className="p-4 rounded-full bg-slate-700/80 hover:bg-slate-600/80 transition-colors"
            >
              <Mic
                className={`w-6 h-6 text-white ${isMuted ? 'opacity-50' : ''}`}
              />
            </button>
            <button
              onClick={handleVideoToggle}
              className="p-4 rounded-full bg-slate-700/80 hover:bg-slate-600/80 transition-colors"
            >
              <Camera
                className={`w-6 h-6 text-white ${isVideoOff ? 'opacity-50' : ''}`}
              />
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