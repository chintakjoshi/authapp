import React, { useState, useEffect } from 'react';
import axios from '../api/axios';
import { useNavigate } from 'react-router-dom';
import AuthCard from '../components/AuthCard';
import AnimatedPage from '../components/AnimatedPage';
import { Loader2 } from 'lucide-react';

function VerifyOtp() {
    const [otp, setOtp] = useState('');
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [cooldown, setCooldown] = useState(0);
    const navigate = useNavigate();
    const email = localStorage.getItem('pendingEmail');
    const [isLoading, setIsLoading] = useState(false);

    const handleVerify = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const params = new URLSearchParams({ email, otp });
            await axios.post(`/auth/verify?${params.toString()}`);
            setMessage('✅ Your account is verified! Redirecting...');
            setTimeout(() => {
                localStorage.removeItem('pendingEmail');
                navigate('/login');
            }, 2000);
        } catch (err) {
            setError(err.response?.data || 'Invalid OTP');
        } finally {
            setIsLoading(false);
        }
    };

    const handleResend = async () => {
        setIsLoading(true);
        try {
            await axios.post('/auth/resend-otp', { email });
            setMessage('📨 A new OTP has been sent to your email.');
            setError('');
            setCooldown(180);
        } catch (err) {
            setError(err.response?.data || 'Unable to resend OTP.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (cooldown === 0) return;
        const interval = setInterval(() => setCooldown((prev) => prev - 1), 1000);
        return () => clearInterval(interval);
    }, [cooldown]);

    if (!email) {
        return (
            <AuthCard title="No Pending Registration" bottomContent={(
                <button
                    onClick={() => navigate('/register')}
                    className="text-blue-500 hover:underline text-sm"
                >
                    Back to Register
                </button>
            )}>
                <p className="text-center text-gray-600 dark:text-gray-400">
                    You don't have a pending email verification.
                </p>
            </AuthCard>
        );
    }

    return (
        <AnimatedPage>
            <AuthCard
                title="Verify Your Email"
                bottomContent={(
                    <button
                        onClick={() => navigate('/register')}
                        className="text-blue-500 hover:underline text-sm"
                    >
                        Back to Register
                    </button>
                )}
            >
                {error && <p className="text-red-500 mb-4 text-sm text-center">{error}</p>}
                {message && <p className="text-green-500 mb-4 text-sm text-center">{message}</p>}
                <form onSubmit={handleVerify} className="space-y-4">
                    <input
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        placeholder="Enter 6-digit OTP"
                        required
                        className="w-full px-4 py-2 border rounded-md bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 text-center"
                    />
                    {/* Verify Button */}
                    <button
                        type="submit"
                        disabled={isLoading}
                        className={`w-full flex justify-center items-center gap-2 bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600 transition-colors
    ${isLoading ? 'opacity-60 cursor-not-allowed' : ''}
  `}
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="h-5 w-5 animate-spin" />
                                Verifying...
                            </>
                        ) : (
                            'Verify'
                        )}
                    </button>

                    {/* Resend OTP Button */}
                    <button
                        type="button"
                        onClick={handleResend}
                        disabled={isLoading || cooldown > 0}
                        className={`w-full flex justify-center items-center gap-2 py-2 rounded-md mt-2 transition-colors
    ${isLoading || cooldown > 0
                                ? 'bg-blue-500 text-white opacity-60 cursor-not-allowed'
                                : 'bg-blue-500 text-white hover:bg-blue-600'
                            }`}
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="h-5 w-5 animate-spin" />
                                Resending...
                            </>
                        ) : cooldown > 0 ? (
                            `Resend OTP (${cooldown}s)`
                        ) : (
                            'Resend OTP'
                        )}
                    </button>
                </form>
            </AuthCard>
        </AnimatedPage>
    );
}

export default VerifyOtp;