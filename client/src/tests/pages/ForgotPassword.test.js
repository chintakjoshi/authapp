import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ForgotPassword from '../../pages/ForgotPassword';

global.crypto = {
    randomUUID: () => 'mock-device-id',
};

const mockPost = jest.fn();

jest.mock('../../api/axios', () => ({
    interceptors: {
        request: { handlers: [] },
        response: { handlers: [] },
    },
    post: (...args) => mockPost(...args),
}));

const renderWithRouter = (ui) => render(<BrowserRouter>{ui}</BrowserRouter>);

describe('pages/ForgotPassword.js', () => {
    beforeEach(() => {
        localStorage.clear();
        jest.clearAllMocks();
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it('renders email input', () => {
        renderWithRouter(<ForgotPassword />);
        expect(screen.getByPlaceholderText(/enter your email/i)).toBeInTheDocument();
    });

    it('submits form and triggers /auth/forgot-password API call', async () => {
        mockPost.mockResolvedValueOnce({ data: 'Reset link sent!' });

        renderWithRouter(<ForgotPassword />);
        fireEvent.change(screen.getByPlaceholderText(/enter your email/i), { target: { value: 'test@example.com' } });

        await act(async () => {
            fireEvent.click(screen.getByRole('button', { name: /send reset link/i }));
        });

        await waitFor(() => {
            expect(mockPost).toHaveBeenCalledWith('/auth/forgot-password', null, {
                params: { email: 'test@example.com' },
            });
        });
    });

    it('shows success message and starts cooldown on success', async () => {
        mockPost.mockResolvedValueOnce({ data: 'Reset link sent!' });

        renderWithRouter(<ForgotPassword />);
        fireEvent.change(screen.getByPlaceholderText(/enter your email/i), { target: { value: 'test@example.com' } });

        await act(async () => {
            fireEvent.click(screen.getByRole('button', { name: /send reset link/i }));
        });

        expect(await screen.findByText(/reset link sent!/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /send reset again/i })).toBeDisabled();
    });

    it('shows specific cooldown warning on 429 error', async () => {
        mockPost.mockRejectedValueOnce({
            response: {
                status: 429,
                data: 'Too many requests. Please wait.',
            },
        });

        renderWithRouter(<ForgotPassword />);
        fireEvent.change(screen.getByPlaceholderText(/enter your email/i), { target: { value: 'test@example.com' } });

        await act(async () => {
            fireEvent.click(screen.getByRole('button', { name: /send reset link/i }));
        });

        expect(await screen.findByText(/too many requests/i)).toBeInTheDocument();
    });

    it('shows fallback error message on other errors', async () => {
        mockPost.mockRejectedValueOnce({
            response: {
                status: 500,
            },
        });

        renderWithRouter(<ForgotPassword />);
        fireEvent.change(screen.getByPlaceholderText(/enter your email/i), { target: { value: 'test@example.com' } });

        await act(async () => {
            fireEvent.click(screen.getByRole('button', { name: /send reset link/i }));
        });

        expect(await screen.findByText(/something went wrong/i)).toBeInTheDocument();
    });

    it('disables button during cooldown', async () => {
        mockPost.mockResolvedValueOnce({ data: 'Reset link sent!' });

        renderWithRouter(<ForgotPassword />);
        fireEvent.change(screen.getByPlaceholderText(/enter your email/i), { target: { value: 'test@example.com' } });

        await act(async () => {
            fireEvent.click(screen.getByRole('button', { name: /send reset link/i }));
        });

        expect(await screen.findByRole('button', { name: /send reset again/i })).toBeDisabled();
    });

    it('cooldown decrements every second correctly', async () => {
        mockPost.mockResolvedValueOnce({ data: 'Reset link sent!' });

        renderWithRouter(<ForgotPassword />);
        fireEvent.change(screen.getByPlaceholderText(/enter your email/i), { target: { value: 'test@example.com' } });

        await act(async () => {
            fireEvent.click(screen.getByRole('button', { name: /send reset link/i }));
        });

        expect(await screen.findByText(/send reset again \(180s\)/i)).toBeInTheDocument();

        act(() => {
            jest.advanceTimersByTime(1000);
        });

        expect(await screen.findByText(/send reset again \(179s\)/i)).toBeInTheDocument();

        act(() => {
            jest.advanceTimersByTime(2000);
        });

        expect(await screen.findByText(/send reset again \(177s\)/i)).toBeInTheDocument();
    });
});