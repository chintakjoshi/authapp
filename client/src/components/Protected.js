import React, { useEffect, useState } from 'react';
import axios from '../api/axios';
import { useNavigate } from 'react-router-dom';
import AnimatedPage from '../components/AnimatedPage';
import { useAuth } from '../contexts/AuthContext';
import AuthCard from './AuthCard';
import { Lock, LogOut, Sparkles } from 'lucide-react';

function Protected() {
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    axios.get('/api/secure-endpoint')
      .then((res) => setMessage(res.data))
      .catch(() => {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        navigate('/login');
      });
  }, [navigate]);

  const { logout } = useAuth();
  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <AnimatedPage>
      <AuthCard
        title="Protected Page"
        badge="Authorized Zone"
        headline="You are inside a secure protected space."
        description="This section confirms your valid session and protected API access."
        points={['JWT-protected route', 'Session-aware navbar', 'Graceful fallback to login']}
      >
        <div className="ui-card border-none p-6 text-left shadow-none">
          <p className="mb-3 inline-flex items-center gap-2 rounded-full bg-[var(--brand-primary)]/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--brand-primary)]">
            <Sparkles className="h-3.5 w-3.5" />
            Authenticated Session
          </p>
          <h3 className="mb-3 text-2xl font-semibold text-[var(--text-primary)]">
            Access granted
          </h3>
          <p className="mb-6 inline-flex items-start gap-2 text-sm text-[var(--text-secondary)]">
            <Lock className="mt-0.5 h-4 w-4 shrink-0" />
            {message || 'You are successfully authenticated and viewing protected content.'}
          </p>
          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-2 rounded-md bg-red-500 px-5 py-2.5 font-semibold text-white transition hover:bg-red-600"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </AuthCard>
    </AnimatedPage>
  );
}

export default Protected;
