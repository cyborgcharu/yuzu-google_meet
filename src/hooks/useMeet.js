// src/hooks/useMeet.js
import { useState, useCallback } from 'react';
import { meetService } from '../services/meetService';

export const useMeet = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const createMeeting = useCallback(async (params) => {
    setLoading(true);
    try {
      const result = await googleMeetService.createMeeting(params);
      return result;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    createMeeting,
    loading,
    error
  };
};