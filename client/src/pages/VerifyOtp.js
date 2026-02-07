import React, { useState, useEffect } from 'react';
import axios from '../api/axios';
import { useNavigate } from 'react-router-dom';
import AuthCard from '../components/AuthCard';
import AnimatedPage from '../components/AnimatedPage';
import { Loader2 } from 'lucide-react';

const COOLDOWN_SECONDS = 180;
const COOLDOWN_STORAGE_KEY = 'verifyOtpCooldown';

const getRemainingSeconds = (expiresAt) => {
    if (!Number.isFinite(expiresAt)) return 0;
    return Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000));
};

function VerifyOtp() {
    const [otp, setOtp] = useState('');
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [cooldownExpiresAt, setCooldownExpiresAt] = useState(null);
    const [cooldown, setCooldown] = useState(0);
    const navigate = useNavigate();
    const email = localStorage.getItem('pendingEmail');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (!email) return;

        const storedValue = localStorage.getItem(COOLDOWN_STORAGE_KEY);
        if (!storedValue) return;

        try {
            const parsed = JSON.parse(storedValue);
            const expiresAt = Number(parsed?.expiresAt);
            const storedEmail = parsed?.email;
            if (storedEmail !== email || !Number.isFinite(expiresAt) || expiresAt <= Date.now()) {
                localStorage.removeItem(COOLDOWN_STORAGE_KEY);
                return;
            }
            setCooldownExpiresAt(expiresAt);
        } catch {
            localStorage.removeItem(COOLDOWN_STORAGE_KEY);
        }
    }, [email]);

    const handleVerify = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const params = new URLSearchParams({ email, otp });
            await axios.post(`/auth/verify?${params.toString()}`);
            setMessage('Your account is verified! Redirecting...');
            setTimeout(() => {
                localStorage.removeItem('pendingEmail');
                localStorage.removeItem(COOLDOWN_STORAGE_KEY);
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
            setMessage('A new OTP has been sent to your email.');
            setError('');
            const expiresAt = Date.now() + COOLDOWN_SECONDS * 1000;
            localStorage.setItem(COOLDOWN_STORAGE_KEY, JSON.stringify({ email, expiresAt }));
            setCooldownExpiresAt(expiresAt);
        } catch (err) {
            setError(err.response?.data || 'Unable to resend OTP.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (!cooldownExpiresAt) {
            setCooldown(0);
            return;
        }

        const updateCooldown = () => {
            const remainingSeconds = getRemainingSeconds(cooldownExpiresAt);
            setCooldown(remainingSeconds);
            if (remainingSeconds === 0) {
                localStorage.removeItem(COOLDOWN_STORAGE_KEY);
                setCooldownExpiresAt(null);
            }
        };

        updateCooldown();
        const interval = setInterval(updateCooldown, 1000);
        return () => clearInterval(interval);
    }, [cooldownExpiresAt]);

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
