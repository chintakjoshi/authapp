import React, { useState } from 'react';
import axios from '../api/axios';
import { useNavigate } from 'react-router-dom';
import AuthCard from '../components/AuthCard';
import AnimatedPage from '../components/AnimatedPage';
import { ArrowRight, CheckCircle2, Loader2, Mail, ShieldCheck, User, XCircle } from 'lucide-react';
import { evaluatePasswordStrength } from '../utils/passwordStrength';

function Register() {
  const [form, setForm] = useState({
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const passwordEvaluation = evaluatePasswordStrength(form.password);
  const isPasswordTouched = form.password.length > 0;
  const hasConfirmValue = form.confirmPassword.length > 0;
  const isMatch = hasConfirmValue && form.password === form.confirmPassword;

  const strengthTone = {
    'Very Weak': 'text-red-600 dark:text-red-400',
    Weak: 'text-red-600 dark:text-red-400',
    Fair: 'text-amber-600 dark:text-amber-300',
    Good: 'text-sky-600 dark:text-sky-300',
    Strong: 'text-emerald-600 dark:text-emerald-300',
  }[passwordEvaluation.label];

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }
    try {
      await axios.post('/auth/register', form);
      localStorage.setItem('pendingEmail', form.email);
      navigate('/verify');
    } catch (err) {
      setError(err.response?.data || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatedPage>
      <AuthCard
        title="Register"
        badge="New Account"
        headline="Create your secure account in a minute."
        description="Set your credentials and verify your email to unlock protected app features."
        points={['Email verification flow', 'Clear validation states', 'Safe credential setup']}
        bottomContent={(
          <button onClick={() => navigate('/login')} className="ui-link">
            Back to Login
          </button>
        )}
      >
        {error && <p role="alert" className="ui-alert ui-alert-error mb-4 text-center">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block space-y-2">
            <span className="text-sm font-medium text-[var(--text-primary)]">Email</span>
            <span className="relative block">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-secondary)]" />
              <input
                name="email"
                placeholder="Email"
                onChange={handleChange}
                required
                className="ui-input pl-10"
              />
            </span>
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-[var(--text-primary)]">Username</span>
            <span className="relative block">
              <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-secondary)]" />
              <input
                name="username"
                placeholder="Username"
                onChange={handleChange}
                required
                className="ui-input pl-10"
              />
            </span>
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-[var(--text-primary)]">Password</span>
            <span className="relative block">
              <ShieldCheck className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-secondary)]" />
              <input
                type="password"
                name="password"
                placeholder="Password"
                onChange={handleChange}
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
              <ShieldCheck className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-secondary)]" />
              <input
                type="password"
                name="confirmPassword"
                placeholder="Confirm Password"
                onChange={handleChange}
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
                Registering...
              </>
            ) : (
              <>
                Register
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>
      </AuthCard>
    </AnimatedPage>
  );
}

export default Register;
