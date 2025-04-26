import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDarkMode } from '../contexts/DarkModeContext';
import { useAuth } from '../contexts/AuthContext';
import { Loader2 } from 'lucide-react';

function Navbar() {
    const navigate = useNavigate();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [error, setError] = useState('');
    const { darkMode, toggleDarkMode } = useDarkMode();
    const [isLoading, setIsLoading] = useState(false);
    const menuRef = useRef(null);

    const { isAuthenticated, logout } = useAuth();
    const handleLogout = () => {
        setIsLoading(true);
        try {
            logout();
            navigate('/login');
        } catch (err) {
            setError('Logout Failed');
        } finally {
            setIsLoading(false);
        }
    }

    const [isClosing, setIsClosing] = useState(false);
    useEffect(() => {
        if (!isMenuOpen) return;
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setIsClosing(true);
                setTimeout(() => {
                    setIsMenuOpen(false);
                    setIsClosing(false);
                }, 200);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isMenuOpen]);

    return (
        <nav className="relative z-50 bg-white dark:bg-gray-800 shadow-md animate-navbar">
            <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
                <div className="text-lg font-bold text-gray-800 dark:text-white cursor-pointer" onClick={() => navigate('/')}>
                    MyApp
                </div>

                {error && (
                    <p className="text-red-500 mb-4 text-sm text-center">{error}</p>
                )}

                {/* Desktop Menu */}
                <div className="hidden md:flex space-x-4 items-center">
                    <button
                        onClick={toggleDarkMode}
                        className="text-gray-800 dark:text-white hover:underline"
                    >
                        {darkMode ? 'Light Mode' : 'Dark Mode'}
                    </button>
                    {isAuthenticated && (
                        <button
                            onClick={handleLogout}
                            disabled={isLoading}
                            className={`flex justify-center items-center gap-2 px-4 py-2 rounded transition-colors
    ${isLoading
                                    ? 'bg-red-500 text-white opacity-60 cursor-not-allowed'
                                    : 'bg-red-500 text-white hover:bg-red-600'
                                }`}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                    Logging out...
                                </>
                            ) : (
                                'Logout'
                            )}
                        </button>
                    )}
                </div>

                {/* Mobile Menu Button */}
                <button
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className="md:hidden text-gray-800 dark:text-white focus:outline-none"
                >
                    ☰
                </button>
            </div>

            {/* Mobile dropdown */}
            {isMenuOpen && (
                <div
                    ref={menuRef}
                    className={`md:hidden absolute top-full right-4 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg py-2 z-50 flex flex-col space-y-2
    ${isClosing ? 'animate-fade-slide-up' : 'animate-fade-slide-down'}`}
                >
                    <button
                        onClick={toggleDarkMode}
                        className="px-4 py-2 text-left text-gray-800 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                        {darkMode ? 'Light Mode' : 'Dark Mode'}
                    </button>
                    {isAuthenticated && (
                        <button
                            onClick={handleLogout}
                            disabled={isLoading}
                            className={`flex justify-center items-center gap-2 px-4 py-2 text-left rounded transition-colors
    ${isLoading
                                    ? 'text-red-600 dark:text-red-400 opacity-60 cursor-not-allowed'
                                    : 'text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                                }`}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                    Logging out...
                                </>
                            ) : (
                                'Logout'
                            )}
                        </button>
                    )}
                </div>
            )}
        </nav>
    );
}

export default Navbar;