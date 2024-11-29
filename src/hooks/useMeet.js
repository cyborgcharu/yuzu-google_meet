// src/hooks/useMeet.js
import { useState, useCallback, useEffect } from 'react';
import { meetService } from '../services/meetService';

export const useMeet = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentMeeting, setCurrentMeeting] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStreams, setRemoteStreams] = useState(new Map());

  const createMeeting = useCallback(async (params) => {
    setLoading(true);
    try {
      const result = await meetService.createMeeting(params);
      setCurrentMeeting(result);
      return result;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Fetch participants and video streams when the meeting is created
    if (currentMeeting) {
      fetchParticipants();
      fetchVideoStreams();
    }
  }, [currentMeeting]);

  const fetchParticipants = useCallback(async () => {
    try {
      const participants = await meetService.getParticipants(currentMeeting.id);
      setParticipants(participants);
    } catch (err) {
      setError(err);
    }
  }, [currentMeeting]);

  const fetchVideoStreams = useCallback(async () => {
    try {
      const { localStream, remoteStreams } = await meetService.getVideoStreams(currentMeeting.id);
      setLocalStream(localStream);
      setRemoteStreams(remoteStreams);
    } catch (err) {
      setError(err);
    }
  }, [currentMeeting]);

  return {
    createMeeting,
    currentMeeting,
    participants,
    localStream,
    remoteStreams,
    loading,
    error
  };
};