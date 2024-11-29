// src/components/MeetingControls.jsx
import React, { useState, useContext, useCallback } from 'react';
import { MeetContext } from '../context/MeetContext';
import { useAuth } from '../context/AuthContext';
import { Card } from './ui/card';
import { Mic, Camera, Plus } from 'lucide-react';

export const MeetingControls = () => {
  const { 
    currentMeeting,
    isMuted,
    isVideoOff,
    isLoading,
    toggleMute,
    toggleVideo,
    createMeeting
  } = useContext(MeetContext);

  const { user, isAuthenticated } = useAuth();
  
  const [isCreatingMeeting, setIsCreatingMeeting] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState(null);
  const [newMeetingDetails, setNewMeetingDetails] = useState({
    title: user?.name ? `${user.name}'s Meeting` : 'New Meeting',
    startTime: new Date().toISOString().slice(0, 16),
    duration: 30,
    attendees: ''
  });

  const handleCreateMeeting = useCallback(async (e) => {
    e.preventDefault();
    if (isCreating) return;
    
    try {
      setError(null);
      setIsCreating(true);
      console.log('Creating meeting with details:', newMeetingDetails);
      
      const startTime = new Date(newMeetingDetails.startTime).toISOString();
      const endTime = new Date(new Date(newMeetingDetails.startTime).getTime() + (newMeetingDetails.duration * 60000)).toISOString();
      
      const result = await createMeeting({
        title: newMeetingDetails.title,
        startTime: startTime,
        endTime: endTime,
        attendees: newMeetingDetails.attendees ? 
          newMeetingDetails.attendees.split(',').map(email => email.trim()) : 
          []
      });
      
      console.log('Meeting created:', result);
      setIsCreatingMeeting(false);
    } catch (err) {
      console.error('Failed to create meeting:', err);
      setError(err.message || 'Failed to create meeting');
    } finally {
      setIsCreating(false);
    }
  }, [isCreating, newMeetingDetails, createMeeting]);

  if (!isAuthenticated) {
    return (
      <Card className="p-4 bg-slate-800 text-white">
        <p>Please authenticate with Google Meet to continue</p>
        <a 
          href="/auth/google" 
          className="mt-2 inline-block px-4 py-2 bg-blue-500 rounded hover:bg-blue-600"
        >
          Sign in with Google
        </a>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {currentMeeting && (
        <Card className="p-4 bg-slate-800 text-white">
          <h3 className="text-lg font-semibold">{currentMeeting.title}</h3>
          <p className="text-sm opacity-80">
            {new Date(currentMeeting.startTime).toLocaleString()}
          </p>
          <a 
            href={currentMeeting.meetingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-block px-4 py-2 bg-blue-500 rounded hover:bg-blue-600"
          >
            Join Meeting
          </a>
        </Card>
      )}

      <Card className="p-4 bg-slate-800 text-white">
        <div className="flex justify-center space-x-4">
          <button 
            onClick={() => toggleMute()}
            className={`p-3 rounded-full ${isMuted ? 'bg-red-500' : 'bg-slate-700'}`}
            disabled={isLoading}
          >
            <Mic className="w-6 h-6" />
          </button>
          <button 
            onClick={() => toggleVideo()}
            className={`p-3 rounded-full ${isVideoOff ? 'bg-red-500' : 'bg-slate-700'}`}
            disabled={isLoading}
          >
            <Camera className="w-6 h-6" />
          </button>
          <button 
            onClick={() => setIsCreatingMeeting(true)}
            className="p-3 rounded-full bg-green-600 hover:bg-green-700"
            disabled={isLoading}
          >
            <Plus className="w-6 h-6" />
          </button>
        </div>
      </Card>

      {isCreatingMeeting && (
        <Card className="p-4 bg-slate-800 text-white">
          <form onSubmit={handleCreateMeeting} className="space-y-4">
            {/* Title Field */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium mb-1">
                Meeting Title
              </label>
              <input
                id="title"
                type="text"
                value={newMeetingDetails.title}
                onChange={(e) => setNewMeetingDetails({ ...newMeetingDetails, title: e.target.value })}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm text-black bg-white"
              />
            </div>

            {/* Start Time Field */}
            <div>
              <label htmlFor="startTime" className="block text-sm font-medium mb-1">
                Start Time
              </label>
              <input
                id="startTime"
                type="datetime-local"
                value={newMeetingDetails.startTime}
                onChange={(e) => setNewMeetingDetails({ ...newMeetingDetails, startTime: e.target.value })}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm text-black bg-white"
              />
            </div>

            {/* Duration Field */}
            <div>
              <label htmlFor="duration" className="block text-sm font-medium mb-1">
                Duration (minutes)
              </label>
              <input
                id="duration"
                type="number"
                min="15"
                max="240"
                value={newMeetingDetails.duration}
                onChange={(e) => setNewMeetingDetails({ ...newMeetingDetails, duration: parseInt(e.target.value) })}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm text-black bg-white"
              />
            </div>

            {/* Attendees Field */}
            <div>
              <label htmlFor="attendees" className="block text-sm font-medium mb-1">
                Attendees (comma-separated emails)
              </label>
              <input
                id="attendees"
                type="text"
                value={newMeetingDetails.attendees}
                onChange={(e) => setNewMeetingDetails({ ...newMeetingDetails, attendees: e.target.value })}
                placeholder="email1@example.com, email2@example.com"
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm text-black bg-white"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isCreating}
              className={`inline-flex justify-center rounded-md border border-transparent 
                ${isCreating ? 'bg-indigo-400' : 'bg-indigo-600 hover:bg-indigo-700'} 
                py-2 px-4 text-sm font-medium text-white shadow-sm 
                focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2`}
            >
              {isCreating ? 'Creating...' : 'Create Meeting'}
            </button>

            {/* Error Display */}
            {error && (
              <div className="mt-2 text-red-500 text-sm">
                {error}
              </div>
            )}
          </form>
        </Card>
      )}
    </div>
  );
};