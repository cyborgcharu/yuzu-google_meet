// src/components/MeetingPanel.jsx
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useMeet } from '../context/MeetContext';
import { Card } from './ui/card';

export const MeetingPanel = () => {
    const { user, isAuthenticated } = useAuth();
    const { createMeeting } = useMeet();
    const [isCreating, setIsCreating] = useState(false);
    const [error, setError] = useState(null);
    const [details, setDetails] = useState({
      title: user?.name ? `${user.name}'s Meeting` : 'New Meeting',
      startTime: new Date().toISOString().slice(0, 16),
      duration: 30,
      attendees: ''
    });
  
    const handleCreate = async (e) => {
        e.preventDefault();
        if (isCreating) return;
        
        try {
          console.log('[MeetingPanel] Creating meeting with details:', details);
          setError(null);
          setIsCreating(true);
          
          const startTime = new Date(details.startTime).toISOString();
          const endTime = new Date(new Date(details.startTime).getTime() + 
            (details.duration * 60000)).toISOString();
          
          const meeting = await createMeeting({
            title: details.title,
            startTime,
            endTime,
            attendees: details.attendees ? 
              details.attendees.split(',').map(email => email.trim()) : []
          });
          console.log('[MeetingPanel] Meeting created:', meeting);
        } catch (err) {
          console.error('[MeetingPanel] Create meeting error:', err);
          setError(err.message || 'Failed to create meeting');
        } finally {
          setIsCreating(false);
        }
      };
  
    return (
      <Card className="p-4 bg-slate-800 text-white">
        <form onSubmit={handleCreate} className="space-y-4">
          <input
            type="text"
            value={details.title}
            onChange={e => setDetails({ ...details, title: e.target.value })}
            className="block w-full rounded text-black"
            placeholder="Meeting Title"
          />
          <input
            type="datetime-local"
            value={details.startTime}
            onChange={e => setDetails({ ...details, startTime: e.target.value })}
            className="block w-full rounded text-black"
          />
          <input
            type="number"
            min="15"
            max="240"
            value={details.duration}
            onChange={e => setDetails({ ...details, duration: parseInt(e.target.value) })}
            className="block w-full rounded text-black"
            placeholder="Duration (minutes)"
          />
          <input
            type="text"
            value={details.attendees}
            onChange={e => setDetails({ ...details, attendees: e.target.value })}
            className="block w-full rounded text-black"
            placeholder="Attendees (comma-separated emails)"
          />
          <button
            type="submit"
            disabled={isCreating}
            className="w-full bg-blue-500 rounded p-2"
          >
            {isCreating ? 'Creating...' : 'Create Meeting'}
          </button>
          {error && <div className="text-red-500">{error}</div>}
        </form>
      </Card>
    );
  };