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

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900" />
    </div>
  );
}

function Home() {
  const { isAuthenticated } = useAuth();
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-5rem)]">
      <h1 className="text-4xl font-bold mb-8">Welcome to Yuzu Meet</h1>
      {!isAuthenticated && <LoginButton />}
    </div>
  );
}

function AuthFailure() {
  const navigate = useNavigate();
  useEffect(() => {
    setTimeout(() => navigate('/', { replace: true }), 3000);
  }, [navigate]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <p className="text-red-500">Authentication failed. Redirecting...</p>
    </div>
  );
}

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [loading, isAuthenticated, navigate]);

  if (loading) return <LoadingSpinner />;
  return isAuthenticated ? children : null;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
<<<<<<< HEAD
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
=======
        <div className="min-h-screen bg-gray-100 flex flex-col">
          <Navigation />
          <main className="flex-1 pt-16">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/auth/success" element={<AuthSuccess />} />
              <Route path="/auth/failure" element={<AuthFailure />} />
              <Route 
                path="/glasses" 
                element={
                  <ProtectedRoute>
                    <MeetInterface>
>>>>>>> d709c69 (fixing env variables for prod deploy)
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