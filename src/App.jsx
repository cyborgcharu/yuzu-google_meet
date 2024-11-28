// src/App.jsx
console.log('App component loaded');
import React, { useEffect } from 'react';
import { 
  BrowserRouter, 
  Routes, 
  Route, 
  Navigate, 
  Link,
  useNavigate 
} from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { MeetProvider } from './context/MeetContext';
import LoginButton from '@/components/LoginButton';
import { StatusIndicators } from './components/StatusIndicators';
import { GlassesMeetDisplay } from './interfaces/glasses/MeetDisplay';
import { WristMeetDisplay } from './interfaces/wrist/MeetDisplay';
import { RingMeetDisplay } from './interfaces/ring/MeetDisplay';
import AuthSuccess from './components/AuthSuccess';

function Navigation() {
  const { user, isAuthenticated, logout } = useAuth();
  
  return (
    <nav className="bg-slate-800/95 backdrop-blur-sm text-white fixed top-0 left-0 right-0 z-50">
      <div className="flex justify-between items-center p-4">
        <div className="flex items-center">
          <img 
            src="/logo.png" 
            alt="Yuzu Meet" 
            className="h-8 w-8"  // Adjust size as needed
          />
          <span className="ml-2 font-bold">Meet</span>
        </div>
        <div className="flex items-center space-x-6">
          <Link to="/glasses" className="hover:text-slate-300">Glasses</Link>
          <Link to="/wrist" className="hover:text-slate-300">Wrist</Link>
          <Link to="/ring" className="hover:text-slate-300">Ring</Link>
          {isAuthenticated ? (
            <>
              <span>{user?.name}</span>
              <button onClick={logout} className="hover:text-slate-300">
                Logout
              </button>
            </>
          ) : (
            <LoginButton />
          )}
        </div>
      </div>
    </nav>
  );
}

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

function SuccessPage() {
  const navigate = useNavigate();
  const { checkAuth } = useAuth();

  useEffect(() => {
    const completeAuth = async () => {
      try {
        await checkAuth();
        navigate('/glasses', { replace: true });
      } catch (error) {
        console.error('Auth completion failed:', error);
        navigate('/', { replace: true });
      }
    };
    completeAuth();
  }, [navigate, checkAuth]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900" />
      <p className="mt-4">Completing login...</p>
    </div>
  );
}

function AuthFailure() {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate('/', { replace: true });
    }, 3000);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <p className="text-red-500">Authentication failed. Redirecting to home...</p>
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

  if (loading) {
    return <LoadingSpinner />;
  }

  return isAuthenticated ? children : null;
}

// Wrapper component for meet interfaces
function MeetInterface({ children }) {
  const { isAuthenticated } = useAuth();
  
  if (!isAuthenticated) {
    return null;
  }

  return (
    <MeetProvider>
      {children}
    </MeetProvider>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="min-h-screen bg-gray-100 flex flex-col">
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
                    <MeetInterface>
                      <GlassesMeetDisplay />
                    </MeetInterface>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/wrist" 
                element={
                  <ProtectedRoute>
                    <MeetInterface>
                      <WristMeetDisplay />
                    </MeetInterface>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/ring" 
                element={
                  <ProtectedRoute>
                    <MeetInterface>
                      <RingMeetDisplay />
                    </MeetInterface>
                  </ProtectedRoute>
                } 
              />
            </Routes>
          </main>
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;