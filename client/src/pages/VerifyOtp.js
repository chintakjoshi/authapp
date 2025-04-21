import React, { useState, useEffect } from 'react';
import axios from '../api/axios';
import { useNavigate } from 'react-router-dom';

function VerifyOtp() {
    const [otp, setOtp] = useState('');
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const navigate = useNavigate();
    const email = localStorage.getItem('pendingEmail');
    const [cooldown, setCooldown] = useState(0);

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

    if (!email) return <p>No pending registration.</p>;

    return (
        <div>
            <h2>Verify Your Email</h2>
            {error && <p style={{ color: 'red' }}>{error}</p>}
            {message && <p style={{ color: 'green' }}>{message}</p>}
            <form onSubmit={handleVerify}>
                <input value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="Enter 4-digit OTP" required />
                <button type="submit">Verify</button>
                <button type="button" onClick={handleResend} disabled={cooldown > 0}>
                    {cooldown > 0 ? `Resend OTP (${cooldown}s)` : 'Resend OTP'}
                </button>
            </form>
        </div>
    );
}

export default VerifyOtp;