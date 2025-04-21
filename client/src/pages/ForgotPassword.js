import React, { useState, useEffect } from 'react';
import axios from '../api/axios';

function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [cooldown, setCooldown] = useState(0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('/auth/forgot-password', null, {
        params: { email },
      });
      setMessage(res.data || 'If the email exists, a reset link has been sent.');
      setCooldown(180); // Start 3 min cooldown
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
      setCooldown(prev => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldown]);

  return (
    <div>
      <h2>Forgot Password</h2>
      {message && <p>{message}</p>}
      <form onSubmit={handleSubmit}>
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email"
          type="email"
          required
        />
        <button type="submit" disabled={cooldown > 0}>
          {cooldown > 0 ? `Send Reset Link Again (${cooldown}s)` : 'Send Reset Link'}
        </button>
      </form>
    </div>
  );
}

export default ForgotPassword;