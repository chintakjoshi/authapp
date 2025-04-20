import React, { useEffect, useState } from 'react';
import axios from '../api/axios';
import { useNavigate } from 'react-router-dom';

function Protected() {
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    axios.get('/api/secure-endpoint')
      .then((res) => setMessage(res.data))
      .catch((err) => {
        localStorage.removeItem('token');
        navigate('/login');
      });
  }, []);

  const handleLogout = async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    const accessToken = localStorage.getItem('token');

    try {
      await axios.post('/auth/logout', { refreshToken }, {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      });
    } catch (err) {
      console.warn('Logout request failed or token was already removed');
    }

    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    navigate('/login');
  };

  return (
    <div>
      <h2>Protected</h2>
      <p>{message}</p>
      <button onClick={handleLogout}>Logout</button>
    </div>
  );
}

export default Protected;