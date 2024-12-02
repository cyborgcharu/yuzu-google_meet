// src/App.jsx
import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { MeetProvider } from './context/MeetContext';
import { GlassesMeetDisplay } from './interfaces/glasses/MeetDisplay';
import { WristMeetDisplay } from './interfaces/wrist/MeetDisplay';
import { RingMeetDisplay } from './interfaces/ring/MeetDisplay';
import { StatusIndicators } from './components/StatusIndicators';
import Navigation from './components/Navigation';
import AuthSuccess from './components/AuthSuccess';
import LoginButton from '@/components/LoginButton';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <MeetProvider>
          <div className="min-h-screen bg-black text-white flex flex-col">
            <Navigation />
            <StatusIndicators />
            <main className="flex-1 pt-16">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/auth/success" element={<AuthSuccess />} />
                <Route path="/auth/failure" element={<AuthFailure />} />
                <Route 
                  path="/glasses" 
                  element={
                    <ProtectedRoute>
                      <GlassesMeetDisplay />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/wrist" 
                  element={
                    <ProtectedRoute>
                      <WristMeetDisplay />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/ring" 
                  element={
                    <ProtectedRoute>
                      <RingMeetDisplay />
                    </ProtectedRoute>
                  } 
                />
              </Routes>
            </main>
          </div>
        </MeetProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}