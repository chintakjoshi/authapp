import React, { useState } from 'react';
import axios from '../api/axios';
import { useNavigate } from 'react-router-dom';

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('/auth/login', { username, password });
      localStorage.setItem('token', res.data.accessToken);
      localStorage.setItem('refreshToken', res.data.refreshToken);
      navigate('/protected');
    } catch (err) {
      setError('Invalid credentials');
    }
  };

  const handleRegister = () => {
    navigate('/register');
  };

  const handleForgotPassword = () => {
    navigate('/forgot-password');
  };

  return (
    <div>
      <h2>Login</h2>
      {error && <p>{error}</p>}
      <form onSubmit={handleLogin}>
        <input 
          value={username} 
          onChange={(e) => setUsername(e.target.value)} 
          placeholder="Username" 
          required 
        />
        <input 
          value={password} 
          onChange={(e) => setPassword(e.target.value)} 
          type="password" 
          placeholder="Password" 
          required 
        />
        <button type="submit">Login</button>
      </form>
      
      <div>
        <button onClick={handleRegister}>Register</button>
        <button onClick={handleForgotPassword}>Forgot Password?</button>
      </div>
    </div>
  );
}

export default Login;