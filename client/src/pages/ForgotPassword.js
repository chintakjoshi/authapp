import React, { useState } from 'react';
import axios from '../api/axios';

function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('/auth/forgot-password', null, {
        params: { email },
      });
      setMessage(res.data || 'If the email exists, a reset link has been sent.');
    } catch (err) {
      setMessage('Something went wrong. Please try again.');
    }
  };

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
        <button type="submit">Send Reset Link</button>
      </form>
    </div>
  );
}

export default ForgotPassword;