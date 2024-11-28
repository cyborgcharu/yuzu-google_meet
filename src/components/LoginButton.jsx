// src/components/LoginButton.jsx
import React from 'react';
import { useAuth } from '../context/AuthContext';

const LoginButton = () => {
  const { loginWithGoogle } = useAuth(); // Changed from login to loginWithGoogle to match AuthContext

  const handleLogin = async () => {
    try {
      window.location.href = `${import.meta.env.VITE_API_BASE_URL}/auth/google/login`;
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  return (
    <button
      onClick={handleLogin}
      className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-lg"
    >
      Sign in with Google
    </button>
  );
};

export default LoginButton;