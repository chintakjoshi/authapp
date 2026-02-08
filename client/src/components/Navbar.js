import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, LogOut, Menu, Moon, ShieldCheck, Sun, X } from 'lucide-react';
import { useDarkMode } from '../contexts/DarkModeContext';
import { useAuth } from '../contexts/AuthContext';

function Navbar() {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const menuRef = useRef(null);

  const { darkMode, toggleDarkMode } = useDarkMode();
  const { isAuthenticated, logout } = useAuth();

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      await logout();
      navigate('/login');
    } catch (err) {
      setError('Logout Failed');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isMenuOpen) return;
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsClosing(true);
        setTimeout(() => {
          setIsMenuOpen(false);
          setIsClosing(false);
        }, 180);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMenuOpen]);

  return (
    <nav className="sticky top-0 z-50 px-4 py-4 sm:px-6">
      <div className="mx-auto w-full max-w-6xl">
        <div className="ui-card flex items-center justify-between px-4 py-3 sm:px-5">
          <button
            className="ui-display inline-flex items-center gap-2 rounded-full px-2 py-1 text-sm font-semibold text-[var(--text-primary)] transition hover:bg-black/5 dark:hover:bg-white/10"
            onClick={() => navigate('/')}
          >
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[var(--brand-primary)]/15 text-[var(--brand-primary)]">
              <ShieldCheck className="h-4 w-4" />
            </span>
            MyApp
          </button>

          <div className="hidden items-center gap-3 md:flex">
            <button
              onClick={toggleDarkMode}
              className="inline-flex items-center gap-2 rounded-full border border-[var(--border-default)] bg-[var(--bg-surface-soft)] px-3 py-2 text-sm font-medium text-[var(--text-primary)] transition hover:brightness-95"
            >
              {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              {darkMode ? 'Light Mode' : 'Dark Mode'}
            </button>

            {isAuthenticated && (
              <button
                onClick={handleLogout}
                disabled={isLoading}
                className="inline-flex items-center gap-2 rounded-full border border-red-300 bg-red-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Logging out...
                  </>
                ) : (
                  <>
                    <LogOut className="h-4 w-4" />
                    Logout
                  </>
                )}
              </button>
            )}
          </div>

          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="inline-flex rounded-full border border-[var(--border-default)] bg-[var(--bg-surface-soft)] p-2 text-[var(--text-primary)] md:hidden"
            aria-label="Toggle menu"
            aria-expanded={isMenuOpen}
          >
            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {error && (
          <p role="alert" className="ui-alert ui-alert-error mt-3 text-center">{error}</p>
        )}

        {isMenuOpen && (
          <div
            ref={menuRef}
            className={`ui-card mt-3 flex flex-col gap-2 p-3 md:hidden ${isClosing ? 'animate-fade-slide-up' : 'animate-fade-slide-down'}`}
          >
            <button
              onClick={toggleDarkMode}
              className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-medium text-[var(--text-primary)] hover:bg-black/5 dark:hover:bg-white/10"
            >
              {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              {darkMode ? 'Light Mode' : 'Dark Mode'}
            </button>

            {isAuthenticated && (
              <button
                onClick={handleLogout}
                disabled={isLoading}
                className="inline-flex items-center justify-center gap-2 rounded-md bg-red-500 px-3 py-2 text-sm font-semibold text-white hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Logging out...
                  </>
                ) : (
                  <>
                    <LogOut className="h-4 w-4" />
                    Logout
                  </>
                )}
              </button>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
