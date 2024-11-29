// src/components/VideoFeed.jsx
import React, { useEffect, useRef, useState } from 'react';
import { useMeet } from '../context/MeetContext';
import { Card } from './ui/card';

class VideoErrorBoundary extends React.Component {
  state = { error: null };
  
  static getDerivedStateFromError(error) {
    return { error };
  }
  
  render() {
    if (this.state.error) {
      return <Card className="bg-red-50 p-4">{this.state.error.message}</Card>;
    }
    return this.props.children;
  }
}

export const VideoFeed = ({ compact = false, minimal = false }) => {
  const {
    mediaStream,
    isMuted,
    isVideoOff
  } = useMeet();

  const localVideoRef = useRef(null);
  const [videoError, setVideoError] = useState(null);

  useEffect(() => {
    console.log('[VideoFeed] Mount', {
      hasStream: !!mediaStream,
      tracks: mediaStream?.getTracks().map(t => t.kind),
      videoRef: localVideoRef.current
    });

    try {
      if (mediaStream && localVideoRef.current) {
        localVideoRef.current.srcObject = mediaStream;
        localVideoRef.current.onloadedmetadata = () => {
          console.log('[VideoFeed] Video metadata loaded');
          localVideoRef.current.play().catch(console.error);
        };
        localVideoRef.current.onerror = (e) => {
          console.error('[VideoFeed] Video error:', e);
          setVideoError(e);
        };
      }
    } catch (err) {
      console.error('[VideoFeed] Setup error:', err);
      setVideoError(err);
    }

    return () => {
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = null;
      }
    };
  }, [mediaStream]);

  return (
    <VideoErrorBoundary>
      <div className="min-h-screen bg-black">
        <video
          ref={localVideoRef}
          autoPlay
          playsInline
          muted
          className={`w-full h-full object-cover ${isVideoOff ? 'hidden' : ''}`}
        />
        {videoError && <div className="text-red-500">Error: {videoError.message}</div>}
      </div>
    </VideoErrorBoundary>
  );
};