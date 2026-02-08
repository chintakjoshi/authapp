import React, { useState, useEffect } from 'react';
import axios from '../api/axios';
import { useNavigate } from 'react-router-dom';
import AuthCard from '../components/AuthCard';
import AnimatedPage from '../components/AnimatedPage';
import { ArrowRight, Loader2, Mail } from 'lucide-react';

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
        badge="Recovery"
        headline="Regain account access safely."
        description="Request a reset link and set a new password through your verified inbox."
        points={['Rate-limited requests', 'Clear success/error feedback', 'No backend changes required']}
        bottomContent={(
          <button
            onClick={() => navigate('/login')}
            className="ui-link"
          >
            Back to Login
          </button>
        )}
      >
        {message && (
          <p
            role="status"
            className={`ui-alert mb-4 text-center ${messageType === 'error'
              ? 'ui-alert-error'
              : 'ui-alert-success'
              }`}
          >
            {message}
          </p>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block space-y-2">
            <span className="text-sm font-medium text-[var(--text-primary)]">Email Address</span>
            <span className="relative block">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-secondary)]" />
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                type="email"
                required
                className="ui-input pl-10"
              />
            </span>
          </label>
          <button
            type="submit"
            disabled={isLoading || cooldown > 0}
            className="ui-button"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Sending...
              </>
            ) : cooldown > 0 ? (
              `Send Reset Again (${cooldown}s)`
            ) : (
              <>
                Send Reset Link
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>
      </AuthCard>
    </AnimatedPage>
  );
}

export default ForgotPassword;
