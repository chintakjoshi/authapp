import React, { useState, useEffect } from 'react';
import axios from '../api/axios';
import { useNavigate } from 'react-router-dom';
import AuthCard from '../components/AuthCard';

function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('/auth/forgot-password', null, {
        params: { email },
      });
      setMessage(res.data || 'If the email exists, a reset link has been sent.');
      setCooldown(180); // 3 minutes
    } catch (err) {
      const status = err.response?.status;
      if (status === 429) {
        setMessage(err.response?.data || 'Please wait before requesting again.');
      } else {
        setMessage('Something went wrong. Please try again.');
      }
    }
  };

  useEffect(() => {
    if (cooldown === 0) return;
    const interval = setInterval(() => {
      setCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldown]);

  return (
    <AuthCard
      title="Forgot Password"
      bottomContent={(
        <button
          onClick={() => navigate('/login')}
          className="text-blue-500 hover:underline text-sm"
        >
          Back to Login
        </button>
      )}
    >
      {message && (
        <p className="mb-4 text-sm text-center text-green-500">{message}</p>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email"
          type="email"
          required
          className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
        <button
          type="submit"
          disabled={cooldown > 0}
          className={`w-full py-2 rounded-md ${cooldown > 0
              ? 'bg-gray-400 text-white cursor-not-allowed'
              : 'bg-blue-500 text-white hover:bg-blue-600 transition-colors'
            }`}
        >
          {cooldown > 0 ? `Send Reset Again (${cooldown}s)` : 'Send Reset Link'}
        </button>
      </form>
    </AuthCard>
  );
}

export default ForgotPassword;