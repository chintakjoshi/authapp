import React, { useState, useEffect } from 'react';
import axios from '../api/axios';
import { useNavigate } from 'react-router-dom';
import AuthCard from '../components/AuthCard';

function VerifyOtp() {
    const [otp, setOtp] = useState('');
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [cooldown, setCooldown] = useState(0);
    const navigate = useNavigate();
    const email = localStorage.getItem('pendingEmail');

    const handleVerify = async (e) => {
        e.preventDefault();
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
        }
    };

    const handleResend = async () => {
        try {
            await axios.post('/auth/resend-otp', { email });
            setMessage('📨 A new OTP has been sent to your email.');
            setError('');
            setCooldown(180);
        } catch (err) {
            setError(err.response?.data || 'Unable to resend OTP.');
        }
    };

    useEffect(() => {
        if (cooldown === 0) return;
        const interval = setInterval(() => {
            setCooldown((prev) => prev - 1);
        }, 1000);
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
                <p className="text-center text-gray-600">
                    You don't have a pending email verification.
                </p>
            </AuthCard>
        );
    }

    return (
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
                    placeholder="Enter 4-digit OTP"
                    required
                    className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400 text-center"
                />
                <button
                    type="submit"
                    className="w-full bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600 transition-colors"
                >
                    Verify
                </button>
                <button
                    type="button"
                    onClick={handleResend}
                    disabled={cooldown > 0}
                    className={`w-full py-2 rounded-md mt-2 ${cooldown > 0
                            ? 'bg-gray-400 text-white cursor-not-allowed'
                            : 'bg-blue-500 text-white hover:bg-blue-600 transition-colors'
                        }`}
                >
                    {cooldown > 0 ? `Resend OTP (${cooldown}s)` : 'Resend OTP'}
                </button>
            </form>
        </AuthCard>
    );
}

export default VerifyOtp;