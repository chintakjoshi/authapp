import React, { useState, useEffect } from 'react';
import axios from '../api/axios';
import { useSearchParams, useNavigate } from 'react-router-dom';

function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [message, setMessage] = useState('');
  const [validToken, setValidToken] = useState(false);
  const [checked, setChecked] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    if (!token) {
      setMessage('Missing reset token.');
      setChecked(true);
      return;
    }

    axios.get('/auth/validate-reset-token', { params: { token } })
      .then(() => {
        setValidToken(true);
      })
      .catch((err) => {
        setMessage(err.response?.data || 'Invalid or expired token.');
      })
      .finally(() => {
        setChecked(true);
      });
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newPassword !== confirm) {
      setMessage('Passwords do not match.');
      return;
    }

    try {
      const res = await axios.post('/auth/reset-password', null, {
        params: { token, newPassword },
      });
      setMessage(res.data || 'Password has been reset.');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setMessage(err.response?.data || 'Reset failed.');
    }
  };

  if (!checked) return <p>Checking token...</p>;

  return (
    <div>
      <h2>Reset Password</h2>
      {message && <p style={{ color: validToken ? 'green' : 'red' }}>{message}</p>}
      {validToken && (
        <form onSubmit={handleSubmit}>
          <input
            type="password"
            placeholder="New Password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Confirm Password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
          />
          <button type="submit" disabled={!token}>Reset Password</button>
        </form>
      )}
    </div>
  );
}

export default ResetPassword;