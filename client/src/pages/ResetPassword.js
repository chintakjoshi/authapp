import React, { useState, useEffect } from 'react';
import axios from '../api/axios';
import { useSearchParams, useNavigate } from 'react-router-dom';
import AuthCard from '../components/AuthCard';
import AnimatedPage from '../components/AnimatedPage';
import { Loader2 } from 'lucide-react';

function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [message, setMessage] = useState('');
  const [validToken, setValidToken] = useState(false);
  const [checked, setChecked] = useState(false);
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!token) {
      setMessage('Missing reset token.');
      setChecked(true);
      return;
    }

    axios.get('/auth/validate-reset-token', { params: { token } })
      .then(() => setValidToken(true))
      .catch((err) => setMessage(err.response?.data || 'Invalid or expired token.'))
      .finally(() => setChecked(true));
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
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
    } finally {
      setIsLoading(false);
    }
  };

  if (!checked) {
    return (
      <AuthCard title="Checking Token...">
        <p className="text-center text-gray-500">Please wait while we verify your link.</p>
      </AuthCard>
    );
  }

  return (
    <AnimatedPage>
      <AuthCard
        title="Reset Password"
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
          <p className={`mb-4 text-sm text-center ${validToken ? 'text-green-500' : 'text-red-500'}`}>
            {message}
          </p>
        )}
        {validToken && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="password"
              placeholder="New Password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              className="w-full px-4 py-2 border rounded-md bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <input
              type="password"
              placeholder="Confirm Password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              className="w-full px-4 py-2 border rounded-md bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full flex justify-center items-center gap-2 bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600 transition-colors
    ${isLoading ? 'opacity-60 cursor-not-allowed' : ''}
  `}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Resetting...
                </>
              ) : (
                'Reset Password'
              )}
            </button>
          </form>
        )}
      </AuthCard>
    </AnimatedPage>
  );
}

export default ResetPassword;