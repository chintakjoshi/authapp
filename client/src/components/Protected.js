import React, { useEffect, useState } from 'react';
import axios from '../api/axios';
import { useNavigate } from 'react-router-dom';
import AnimatedPage from '../components/AnimatedPage';
import { useAuth } from '../contexts/AuthContext';
import AuthCard from './AuthCard';

function Protected() {
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    axios.get('/api/secure-endpoint')
      .then((res) => setMessage(res.data))
      .catch(() => {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        navigate('/login');
      });
  }, [navigate]);

  const { logout } = useAuth();
  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <AnimatedPage>
      <AuthCard>
        <div className="w-full max-w-2xl bg-white dark:bg-gray-700 text-white rounded-lg shadow-md p-8 text-center">
          <h2 className="text-3xl font-semibold mb-4">Protected Page</h2>
          <p className="mb-6 text-gray-700">{message}</p>
          <button
            onClick={handleLogout}
            className="px-6 py-2 bg-red-500 text-white dark:text-white rounded-md hover:bg-red-600 transition-colors"
          >
            Logout
          </button>
        </div>
      </AuthCard>
    </AnimatedPage>
  );
}

export default Protected;