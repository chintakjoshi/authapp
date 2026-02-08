import React, { useState } from 'react';
import axios from '../api/axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import AuthCard from '../components/AuthCard';
import AnimatedPage from '../components/AnimatedPage';
import { ArrowRight, KeyRound, Loader2, User } from 'lucide-react';

function getDeviceId() {
  let id = localStorage.getItem('deviceId');
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem('deviceId', id);
  }
  return id;
}

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await axios.post('/auth/login', {
        username,
        password,
        deviceId: getDeviceId(),
      });
      login(res.data.accessToken, res.data.refreshToken);
      navigate('/protected');
    } catch (err) {
      setError('Invalid credentials');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatedPage>
      <AuthCard
        title="Login"
        badge="Returning User"
        headline="Welcome back. Continue where you left off."
        description="Sign in with your secure credentials and manage your account with a refreshed interface."
        points={['Fast sign-in', 'Smart token refresh', 'Accessible form controls']}
        bottomContent={(
          <div className="flex flex-col gap-3 text-sm text-center sm:flex-row sm:justify-between">
            <button
              onClick={() => navigate('/register')}
              className="ui-link"
            >
              Register
            </button>
            <button
              onClick={() => navigate('/forgot-password')}
              className="ui-link"
            >
              Forgot Password?
            </button>
          </div>
        )}
      >
        {error && (
          <p role="alert" className="ui-alert ui-alert-error mb-4 text-center">{error}</p>
        )}
        <form onSubmit={handleLogin} className="space-y-4">
          <label className="block space-y-2">
            <span className="text-sm font-medium text-[var(--text-primary)]">Username</span>
            <span className="relative block">
              <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-secondary)]" />
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Username"
                required
                className="ui-input pl-10"
              />
            </span>
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-[var(--text-primary)]">Password</span>
            <span className="relative block">
              <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-secondary)]" />
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                placeholder="Password"
                required
                className="ui-input pl-10"
              />
            </span>
          </label>

          <button
            type="submit"
            disabled={isLoading}
            className="ui-button"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Logging In...
              </>
            ) : (
              <>
                Login
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>
      </AuthCard>
    </AnimatedPage>
  );
}

export default Login;
