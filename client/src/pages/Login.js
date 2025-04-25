import React, { useState } from 'react';
import axios from '../api/axios';
import { useNavigate } from 'react-router-dom';
import AuthCard from '../components/AuthCard'; // Adjust path if needed

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

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('/auth/login', {
        username,
        password,
        deviceId: getDeviceId(),
      });
      localStorage.setItem('token', res.data.accessToken);
      localStorage.setItem('refreshToken', res.data.refreshToken);
      navigate('/protected');
    } catch (err) {
      setError('Invalid credentials');
    }
  };

  return (
    <AuthCard
      title="Login"
      bottomContent={(
        <div className="flex flex-col sm:flex-row sm:justify-between gap-3 text-sm">
          <button onClick={() => navigate('/register')} className="text-blue-500 hover:underline">
            Register
          </button>
          <button onClick={() => navigate('/forgot-password')} className="text-blue-500 hover:underline">
            Forgot Password?
          </button>
        </div>
      )}
    >
      {error && <p className="text-red-500 mb-4 text-sm text-center">{error}</p>}
      <form onSubmit={handleLogin} className="space-y-4">
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Username"
          required
          className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
        <input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          type="password"
          placeholder="Password"
          required
          className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
        <button
          type="submit"
          className="w-full bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600 transition-colors"
        >
          Login
        </button>
      </form>
    </AuthCard>
  );
}

export default Login;