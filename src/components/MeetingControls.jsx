// src/components/MeetingControls.jsx
import React, { useState, useContex, useCallback } from 'react';
import { MeetContext } from '../context/MeetContext';
import { useAuth } from '../context/AuthContext';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Mic, Camera, Settings, PhoneOff, Plus } from 'lucide-react';

export const MeetingControls = () => {
  const { 
    currentMeeting,
    isMuted,
    isVideoOff,
    isLoading,
    googleAuthStatus,
    toggleMute,
    toggleVideo,
    createMeeting
  } = useContext(MeetContext);
  const { user } = useAuth();
  const [isCreatingMeeting, setIsCreatingMeeting] = useState(false);
  const [newMeetingDetails, setNewMeetingDetails] = useState({
    title: `${user?.name}'s Meeting`,
    startTime: new Date().toISOString().slice(0, 16),
    duration: 30,
    attendees: ''
  });

  const handleCreateMeeting = useCallback(async (e) => {
    e.preventDefault();
    if (isCreatingMeeting) return; // Prevent multiple submissions
    
    try {
      setIsCreatingMeeting(true);
      const attendeesList = newMeetingDetails.attendees
        .split(',')
        .map(email => email.trim())
        .filter(Boolean);

      await createMeeting({
        ...newMeetingDetails,
        attendees: attendeesList
      });
      
    } catch (error) {
      console.error('Failed to create meeting:', error);
    } finally {
      setIsCreatingMeeting(false);
    }
  }, [isCreatingMeeting, newMeetingDetails, createMeeting]);

  if (googleAuthStatus !== 'authorized') {
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
            <div>
              <label htmlFor="title" className="block text-sm font-medium mb-1">
                Meeting Title
              </label>
              <input
                id="title"
                type="text"
                value={newMeetingDetails.title}
                onChange={(e) => setNewMeetingDetails({ ...newMeetingDetails, title: e.target.value })}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
            {/* Add other form fields */}
            <button
              type="submit"
              className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              Create Meeting
            </button>
          </form>
        </Card>
      )}
    </div>
  );
};