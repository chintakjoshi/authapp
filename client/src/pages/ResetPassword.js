import React, { useState, useEffect } from 'react';
import axios from '../api/axios';
import { useSearchParams, useNavigate } from 'react-router-dom';
import AuthCard from '../components/AuthCard';
import AnimatedPage from '../components/AnimatedPage';
import { ArrowRight, CheckCircle2, KeyRound, Loader2, XCircle } from 'lucide-react';
import { evaluatePasswordStrength } from '../utils/passwordStrength';

function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('error');
  const [validToken, setValidToken] = useState(false);
  const [checked, setChecked] = useState(false);
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const passwordEvaluation = evaluatePasswordStrength(newPassword);
  const isPasswordTouched = newPassword.length > 0;
  const hasConfirmValue = confirm.length > 0;
  const isMatch = hasConfirmValue && newPassword === confirm;

  const strengthTone = {
    'Very Weak': 'text-red-600 dark:text-red-400',
    Weak: 'text-red-600 dark:text-red-400',
    Fair: 'text-amber-600 dark:text-amber-300',
    Good: 'text-sky-600 dark:text-sky-300',
    Strong: 'text-emerald-600 dark:text-emerald-300',
  }[passwordEvaluation.label];

  useEffect(() => {
    if (!token) {
      setMessage('Missing reset token.');
      setMessageType('error');
      setChecked(true);
      return;
    }

    axios.get('/auth/validate-reset-token', { params: { token } })
      .then(() => setValidToken(true))
      .catch((err) => {
        setMessageType('error');
        setMessage(err.response?.data || 'Invalid or expired token.');
      })
      .finally(() => setChecked(true));
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    if (newPassword !== confirm) {
      setMessageType('error');
      setMessage('Passwords do not match.');
      setIsLoading(false);
      return;
    }

    try {
      const res = await axios.post('/auth/reset-password', { token, newPassword });
      setMessageType('success');
      setMessage(res.data || 'Password has been reset.');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setMessageType('error');
      setMessage(err.response?.data || 'Reset failed.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!checked) {
    return (
      <AuthCard title="Checking Token...">
        <p className="text-center text-sm text-[var(--text-secondary)]">Please wait while we verify your link.</p>
      </AuthCard>
    );
  }

  return (
    <AnimatedPage>
      <AuthCard
        title="Reset Password"
        badge="Password Reset"
        headline="Create a new password for your account."
        description="We validate your token first, then apply your new password instantly."
        points={['Token validation status', 'Clear mismatch handling', 'Fast return to login']}
        bottomContent={(
          <button
            onClick={() => navigate('/login')}
            className="ui-link text-sm"
          >
            Back to Login
          </button>
        )}
      >
        {message && (
          <p role={messageType === 'success' ? 'status' : 'alert'} className={`ui-alert mb-4 text-center ${messageType === 'success' ? 'ui-alert-success' : 'ui-alert-error'}`}>
            {message}
          </p>
        )}
        {validToken && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block space-y-2">
              <span className="text-sm font-medium text-[var(--text-primary)]">New Password</span>
              <span className="relative block">
                <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-secondary)]" />
                <input
                  type="password"
                  placeholder="New Password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  className="ui-input pl-10"
                />
              </span>
            </label>
            {isPasswordTouched && (
              <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface-soft)] p-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[var(--text-secondary)]">Strength</span>
                  <span className={`font-semibold ${strengthTone}`}>{passwordEvaluation.label}</span>
                </div>
                <div className="mt-2 grid grid-cols-5 gap-1.5" aria-hidden="true">
                  {[1, 2, 3, 4, 5].map((idx) => (
                    <span
                      key={idx}
                      className={`h-1.5 rounded-full ${idx <= passwordEvaluation.passedCount
                        ? 'bg-[var(--brand-primary)]'
                        : 'bg-[var(--border-default)]'
                        }`}
                    />
                  ))}
                </div>
                <p className="mt-2 text-xs text-[var(--text-secondary)]">
                  Strong enough: <span className={passwordEvaluation.meetsMinimum ? 'text-emerald-600 dark:text-emerald-300' : 'text-amber-600 dark:text-amber-300'}>{passwordEvaluation.meetsMinimum ? 'Yes' : 'Not yet'}</span>
                </p>
                <ul className="mt-2 space-y-1.5 text-xs text-[var(--text-secondary)]">
                  {passwordEvaluation.checks.map((rule) => (
                    <li key={rule.key} className="inline-flex items-center gap-1.5">
                      {rule.passed ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-300" />
                      ) : (
                        <XCircle className="h-3.5 w-3.5 text-[var(--text-secondary)]" />
                      )}
                      {rule.label}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <label className="block space-y-2">
              <span className="text-sm font-medium text-[var(--text-primary)]">Confirm Password</span>
              <span className="relative block">
                <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-secondary)]" />
                <input
                  type="password"
                  placeholder="Confirm Password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                  className="ui-input pl-10"
                />
              </span>
            </label>
            {hasConfirmValue && (
              <p
                role={isMatch ? 'status' : 'alert'}
                className={`text-xs font-medium ${isMatch ? 'text-emerald-600 dark:text-emerald-300' : 'text-red-600 dark:text-red-400'}`}
              >
                {isMatch ? 'Passwords match.' : 'Passwords do not match.'}
              </p>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="ui-button"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Resetting...
                </>
              ) : (
                <>
                  Reset Password
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>
        )}
      </AuthCard>
    </AnimatedPage>
  );
}

export default ResetPassword;
