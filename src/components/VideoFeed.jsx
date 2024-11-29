// src/components/VideoFeed.jsx
import React, { useEffect, useRef } from 'react';
import { useMeet } from '../hooks/useMeet';

export const VideoFeed = () => {
  const {
    currentMeeting,
    deviceType,
    participants,
    localStream,
    remoteStreams,
  } = useMeet();
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

  const ParticipantVideo = ({ participant }) => {
    if (!remoteVideoRefs.current.has(participant.id)) {
      remoteVideoRefs.current.set(participant.id, React.createRef());
    }

    return (
      <div className="relative rounded-lg overflow-hidden">
        <video
          ref={remoteVideoRefs.current.get(participant.id)}
          autoPlay
          playsInline
          className="w-full h-full object-cover"
        />
        <div className="absolute bottom-2 left-2 bg-black/50 px-2 py-1 rounded text-white text-sm">
          {participant.name}
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black p-4 flex flex-col gap-4">
      <div className="flex gap-4 grow">
        <div className="relative rounded-lg overflow-hidden grow">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
          <div className="absolute bottom-2 left-2 bg-black/50 px-2 py-1 rounded text-white text-sm">
            You
          </div>
        </div>
        {participants && participants.length > 0 ? (
          participants.map((participant) => (
            <ParticipantVideo key={participant.id} participant={participant} />
          ))
        ) : (
          <div className="flex items-center justify-center grow text-white text-lg">
            No participants available
          </div>
        )}
      </div>

      {deviceType === 'glasses' && (
        <div className="self-end space-x-2">
          <button className="px-3 py-1 rounded bg-gray-500 text-white">
            Grid
          </button>
          <button className="px-3 py-1 rounded bg-gray-500 text-white">
            Spotlight
          </button>
        </div>
      )}
    </div>
  );
};

export default VideoFeed;