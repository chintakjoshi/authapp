import React, { useState, useEffect } from 'react';
import axios from '../api/axios';
import { useNavigate } from 'react-router-dom';
import AuthCard from '../components/AuthCard';
import AnimatedPage from '../components/AnimatedPage';
import { ArrowRight, Loader2, RefreshCw, ShieldCheck } from 'lucide-react';

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
                    className="ui-link text-sm"
                >
                    Back to Register
                </button>
            )}>
                <p className="text-center text-sm text-[var(--text-secondary)]">
                    You don't have a pending email verification.
                </p>
            </AuthCard>
        );
    }

    return (
        <AnimatedPage>
            <AuthCard
                title="Verify Your Email"
                badge="Verification"
                headline="Confirm your email and activate your account."
                description="Enter the OTP sent to your inbox. Need a new one? Resend with cooldown protection."
                points={['Secure one-time code flow', 'Resend cooldown persistence', 'Smooth redirect after success']}
                bottomContent={(
                    <button
                        onClick={() => navigate('/register')}
                        className="ui-link text-sm"
                    >
                        Back to Register
                    </button>
                )}
            >
                {error && <p role="alert" className="ui-alert ui-alert-error mb-4 text-center">{error}</p>}
                {message && <p role="status" className="ui-alert ui-alert-success mb-4 text-center">{message}</p>}
                <form onSubmit={handleVerify} className="space-y-4">
                    <label className="block space-y-2">
                        <span className="text-sm font-medium text-[var(--text-primary)]">Verification Code</span>
                        <span className="relative block">
                            <ShieldCheck className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-secondary)]" />
                            <input
                                value={otp}
                                onChange={(e) => setOtp(e.target.value)}
                                placeholder="Enter 6-digit OTP"
                                required
                                className="ui-input pl-10 text-center tracking-[0.2em]"
                            />
                        </span>
                    </label>
                    {/* Verify Button */}
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="ui-button"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="h-5 w-5 animate-spin" />
                                Verifying...
                            </>
                        ) : (
                            <>
                                Verify
                                <ArrowRight className="h-4 w-4" />
                            </>
                        )}
                    </button>

                    {/* Resend OTP Button */}
                    <button
                        type="button"
                        onClick={handleResend}
                        disabled={isLoading || cooldown > 0}
                        className="ui-button !bg-[linear-gradient(140deg,#0d9488,#0f766e)] mt-2"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="h-5 w-5 animate-spin" />
                                Resending...
                            </>
                        ) : cooldown > 0 ? (
                            `Resend OTP (${cooldown}s)`
                        ) : (
                            <>
                                <RefreshCw className="h-4 w-4" />
                                Resend OTP
                            </>
                        )}
                    </button>
                </form>
            </AuthCard>
        </AnimatedPage>
    );
}

export default VerifyOtp;
