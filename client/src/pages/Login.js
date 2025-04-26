import React, { useState } from 'react';
import axios from '../api/axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import AuthCard from '../components/AuthCard';
import AnimatedPage from '../components/AnimatedPage';
import { Loader2 } from 'lucide-react';

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
        bottomContent={(
          <div className="flex flex-col sm:flex-row sm:justify-between gap-3 text-sm text-center">
            <button
              onClick={() => navigate('/register')}
              className="text-blue-500 dark:text-blue-400 hover:underline transition"
            >
              Register
            </button>
            <button
              onClick={() => navigate('/forgot-password')}
              className="text-blue-500 dark:text-blue-400 hover:underline transition"
            >
              Forgot Password?
            </button>
          </div>
        )}
      >
        {error && (
          <p className="text-red-500 mb-4 text-sm text-center">{error}</p>
        )}
        <form onSubmit={handleLogin} className="space-y-4">
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Username"
            required
            className="w-full px-4 py-2 border rounded-md bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            placeholder="Password"
            required
            className="w-full px-4 py-2 border rounded-md bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full flex justify-center items-center gap-2 bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600 transition-colors ${isLoading ? 'opacity-60 cursor-not-allowed' : ''
              }`}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Logging In...
              </>
            ) : (
              'Login'
            )}
          </button>
        </form>
      </AuthCard>
    </AnimatedPage>
  );
}

export default Login;