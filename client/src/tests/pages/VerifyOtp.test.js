import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import VerifyOtp from '../../pages/VerifyOtp';

jest.mock('../../api/axios', () => ({
    post: jest.fn(),
    interceptors: {
        request: { handlers: [] },
        response: { handlers: [] },
    },
}));

import axios from '../../api/axios';

const renderWithRoute = (ui) => {
    return render(<MemoryRouter>{ui}</MemoryRouter>);
};

describe('pages/VerifyOtp.js', () => {
    beforeEach(() => {
        localStorage.clear();
        jest.clearAllMocks();
    });

    it('shows error if no pending email', () => {
        renderWithRoute(<VerifyOtp />);
        expect(screen.getByText(/no pending registration/i)).toBeInTheDocument();
        expect(screen.getByText(/back to register/i)).toBeInTheDocument();
    });

    it('submits correct OTP and navigates to /login on success', async () => {
        localStorage.setItem('pendingEmail', 'test@example.com');
        axios.post.mockResolvedValueOnce({});

        renderWithRoute(<VerifyOtp />);

        fireEvent.change(screen.getByPlaceholderText(/enter 6-digit otp/i), { target: { value: '123456' } });

        await act(async () => {
            fireEvent.click(screen.getByRole('button', { name: /verify/i }));
        });

        expect(axios.post).toHaveBeenCalledWith(
            expect.stringMatching(/^\/auth\/verify\?email=.*&otp=\d+$/)
        );

        expect(await screen.findByText(/your account is verified/i)).toBeInTheDocument();
    });


    it('displays error if OTP verification fails', async () => {
        localStorage.setItem('pendingEmail', 'test@example.com');
        axios.post.mockRejectedValueOnce({ response: { data: 'Invalid OTP' } });

        renderWithRoute(<VerifyOtp />);

        fireEvent.change(screen.getByPlaceholderText(/enter 6-digit otp/i), { target: { value: '000000' } });

        await act(async () => {
            fireEvent.click(screen.getByRole('button', { name: /verify/i }));
        });

        expect(await screen.findByText(/invalid otp/i)).toBeInTheDocument();
    });

    it('resend OTP triggers API call and shows success message', async () => {
        localStorage.setItem('pendingEmail', 'test@example.com');
        axios.post.mockResolvedValueOnce({});

        renderWithRoute(<VerifyOtp />);

        await act(async () => {
            fireEvent.click(screen.getByRole('button', { name: /resend otp/i }));
        });

        expect(axios.post).toHaveBeenCalledWith('/auth/resend-otp', { email: 'test@example.com' });
        expect(await screen.findByText(/a new otp has been sent/i)).toBeInTheDocument();
    });

    it('shows cooldown countdown after resending OTP', async () => {
        jest.useFakeTimers();
        localStorage.setItem('pendingEmail', 'test@example.com');
        axios.post.mockResolvedValueOnce({});

        renderWithRoute(<VerifyOtp />);

        await act(async () => {
            fireEvent.click(screen.getByRole('button', { name: /resend otp/i }));
        });

        expect(screen.getByText(/resend otp \(180s\)/i)).toBeInTheDocument();

        act(() => {
            jest.advanceTimersByTime(1000);
        });

        expect(screen.getByText(/resend otp \(179s\)/i)).toBeInTheDocument();

        jest.useRealTimers();
    });

    it('disables buttons during loading', async () => {
        localStorage.setItem('pendingEmail', 'test@example.com');
        axios.post.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 1000)));

        renderWithRoute(<VerifyOtp />);

        fireEvent.change(screen.getByPlaceholderText(/enter 6-digit otp/i), { target: { value: '654321' } });

        act(() => {
            fireEvent.click(screen.getByRole('button', { name: /verify/i }));
        });

        expect(screen.getByRole('button', { name: /verifying/i })).toBeDisabled();
    });
});