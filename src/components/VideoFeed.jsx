// src/components/VideoFeed.jsx
import React, { useEffect, useRef, useContext } from 'react';
import { MeetContext } from '../context/MeetContext';
import { useAuth } from '../context/AuthContext';

export const VideoFeed = () => {
  const { currentMeeting } = useContext(MeetContext);
  const { user } = useAuth();
  const videoRef = useRef(null);

  useEffect(() => {
    const joinMeeting = async () => {
      try {
        // Join the meeting using the currentMeeting details
        await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        videoRef.current.srcObject = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        videoRef.current.play();
      } catch (error) {
        console.error('Failed to join meeting:', error);
      }
    };

    if (currentMeeting) {
      joinMeeting();
    }
  }, [currentMeeting]);

  return (
    <div className="fixed inset-0 bg-slate-900 z-50">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full h-full object-cover"
        onError={(e) => console.error('Video element error:', e)}
      />
    </div>
  );
};