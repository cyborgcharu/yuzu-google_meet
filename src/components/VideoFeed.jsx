// src/components/VideoFeed.jsx
import React, { useEffect, useRef, useState } from 'react';
import { useMeet } from '../hooks/useMeet';

export const VideoFeed = () => {
  const {
    currentMeeting,
    deviceType,
    participants,
    localStream,
    remoteStreams
  } = useMeet();
  const [layout, setLayout] = useState('grid');
  const localVideoRef = useRef(null);
  const remoteVideoRefs = useRef(new Map());

  useEffect(() => {
    if (localStream && localVideoRef.current) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    remoteStreams.forEach((stream, participantId) => {
      const videoRef = remoteVideoRefs.current.get(participantId);
      if (videoRef && videoRef.srcObject !== stream) {
        videoRef.srcObject = stream;
      }
    });
  }, [remoteStreams]);

  const renderParticipantVideo = (participant) => {
    if (!remoteVideoRefs.current.has(participant.id)) {
      remoteVideoRefs.current.set(participant.id, React.createRef());
    }

    return (
      <div key={participant.id} className="relative">
        <video
          ref={remoteVideoRefs.current.get(participant.id)}
          autoPlay
          playsInline
          className="w-full h-full object-cover rounded-lg"
        />
        <div className="absolute bottom-2 left-2 bg-black/50 px-2 py-1 rounded text-white text-sm">
          {participant.name}
        </div>
      </div>
    );
  };

  const getLayoutClass = () => {
    switch (layout) {
      case 'grid':
        return 'grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-4';
      case 'spotlight':
        return 'grid grid-cols-1 gap-2';
      default:
        return 'grid grid-cols-2 gap-2';
    }
  };

  return (
    <div className="fixed inset-0 bg-black">
      <div className={`p-4 h-full ${getLayoutClass()}`}>
        {/* Local video */}
        <div className="relative">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover rounded-lg"
          />
          <div className="absolute bottom-2 left-2 bg-black/50 px-2 py-1 rounded text-white text-sm">
            You
          </div>
        </div>
        
        {/* Remote participants */}
        {participants.map(renderParticipantVideo)}
      </div>

      {deviceType === 'glasses' && (
        <div className="absolute top-4 right-4 space-x-2">
          <button
            onClick={() => setLayout('grid')}
            className={`px-3 py-1 rounded ${
              layout === 'grid' ? 'bg-blue-500' : 'bg-gray-500'
            }`}
          >
            Grid
          </button>
          <button
            onClick={() => setLayout('spotlight')}
            className={`px-3 py-1 rounded ${
              layout === 'spotlight' ? 'bg-blue-500' : 'bg-gray-500'
            }`}
          >
            Spotlight
          </button>
        </div>
      )}
    </div>
  );
};