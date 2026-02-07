import React, { useState, useEffect } from 'react';
import axios from '../api/axios';
import { useNavigate } from 'react-router-dom';
import AuthCard from '../components/AuthCard';
import AnimatedPage from '../components/AnimatedPage';
import { Loader2 } from 'lucide-react';

const COOLDOWN_SECONDS = 180;
const COOLDOWN_STORAGE_KEY = 'forgotPasswordCooldownUntil';

const getRemainingSeconds = (expiresAt) => {
  if (!Number.isFinite(expiresAt)) return 0;
  return Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000));
};

function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('success');
  const [cooldownExpiresAt, setCooldownExpiresAt] = useState(null);
  const [cooldown, setCooldown] = useState(0);
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const storedValue = localStorage.getItem(COOLDOWN_STORAGE_KEY);
    if (!storedValue) return;
    const expiresAt = Number(storedValue);
    if (!Number.isFinite(expiresAt)) {
      localStorage.removeItem(COOLDOWN_STORAGE_KEY);
      return;
    }
    if (expiresAt <= Date.now()) {
      localStorage.removeItem(COOLDOWN_STORAGE_KEY);
      return;
    }
    setCooldownExpiresAt(expiresAt);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await axios.post('/auth/forgot-password', null, {
        params: { email },
      });
      setMessage(res.data || 'If the email exists, a reset link has been sent.');
      setMessageType('success');
      const expiresAt = Date.now() + COOLDOWN_SECONDS * 1000;
      localStorage.setItem(COOLDOWN_STORAGE_KEY, String(expiresAt));
      setCooldownExpiresAt(expiresAt);
    } catch (err) {
      const status = err.response?.status;
      setMessage(
        status === 429
          ? err.response?.data || 'Please wait before requesting again.'
          : 'Something went wrong. Please try again.'
      );
      setMessageType('error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!cooldownExpiresAt) {
      setCooldown(0);
      return;
    }

    const updateCooldown = () => {
      const remainingSeconds = getRemainingSeconds(cooldownExpiresAt);
      setCooldown(remainingSeconds);
      if (remainingSeconds === 0) {
        localStorage.removeItem(COOLDOWN_STORAGE_KEY);
        setCooldownExpiresAt(null);
      }
    };

    updateCooldown();
    const interval = setInterval(updateCooldown, 1000);
    return () => clearInterval(interval);
  }, [cooldownExpiresAt]);

  return (
    <AnimatedPage>
      <AuthCard
        title="Forgot Password"
        bottomContent={(
          <button
            onClick={() => navigate('/login')}
            className="text-brand-light dark:text-brand-dark hover:underline transition"
          >
            Back to Login
          </button>
        )}
      >
        {message && (
          <p
            className={`mb-4 text-sm text-center ${messageType === 'error'
              ? 'text-red-500 dark:text-red-400'
              : 'text-green-500 dark:text-green-400'
              }`}
          >
            {message}
          </p>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            type="email"
            required
            className="w-full px-4 py-2 border rounded-md bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <button
            type="submit"
            disabled={isLoading || cooldown > 0}
            className={`w-full flex justify-center items-center gap-2 py-2 rounded-md transition-colors
    ${isLoading || cooldown > 0
                ? 'bg-blue-500 text-white opacity-60 cursor-not-allowed'
                : 'bg-blue-500 text-white hover:bg-blue-600'
              }`}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Sending...
              </>
            ) : cooldown > 0 ? (
              `Send Reset Again (${cooldown}s)`
            ) : (
              'Send Reset Link'
            )}
          </button>
        </form>
      </AuthCard>
    </AnimatedPage>
  );
}

export default ForgotPassword;
