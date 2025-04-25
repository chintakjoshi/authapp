import React, { useState } from 'react';
import axios from '../api/axios';
import { useNavigate } from 'react-router-dom';
import AuthCard from '../components/AuthCard';

function Register() {
  const [form, setForm] = useState({
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    try {
      await axios.post('/auth/register', form);
      localStorage.setItem('pendingEmail', form.email);
      navigate('/verify');
    } catch (err) {
      setError(err.response?.data || 'Registration failed');
    }
  };

  return (
    <AuthCard
      title="Register"
      bottomContent={(
        <button onClick={() => navigate('/login')} className="text-blue-500 hover:underline text-sm">
          Back to Login
        </button>
      )}
    >
      {error && <p className="text-red-500 mb-4 text-sm text-center">{error}</p>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          name="email"
          type="email"
          placeholder="Email"
          onChange={handleChange}
          required
          className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
        <input
          name="username"
          placeholder="Username"
          onChange={handleChange}
          required
          className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
        <input
          type="password"
          name="password"
          placeholder="Password"
          onChange={handleChange}
          required
          className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
        <input
          type="password"
          name="confirmPassword"
          placeholder="Confirm Password"
          onChange={handleChange}
          required
          className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
        <button
          type="submit"
          className="w-full bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600 transition-colors"
        >
          Register
        </button>
      </form>
    </AuthCard>
  );
}

export default Register;