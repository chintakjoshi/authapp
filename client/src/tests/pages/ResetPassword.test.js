import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ResetPassword from '../../pages/ResetPassword';

jest.mock('../../api/axios', () => ({
    get: jest.fn(),
    post: jest.fn(),
    interceptors: {
        request: { handlers: [] },
        response: { handlers: [] },
    },
}));

import axios from '../../api/axios';

const renderWithRoute = (ui, route = '/') => {
    window.history.pushState({}, 'Test page', route);
    return render(<MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>);
};

describe('pages/ResetPassword.js', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('shows missing token message when no token is present', async () => {
        renderWithRoute(<ResetPassword />, '/reset-password');

        expect(await screen.findByText(/missing reset token/i)).toBeInTheDocument();
    });

    it('calls validate-reset-token and handles valid token', async () => {
        axios.get.mockResolvedValueOnce({});

        renderWithRoute(<ResetPassword />, '/reset-password?token=valid-token');

        expect(await screen.findByRole('heading', { name: /reset password/i })).toBeInTheDocument();
        expect(axios.get).toHaveBeenCalledWith('/auth/validate-reset-token', {
            params: { token: 'valid-token' },
        });
    });

    it('shows error if validate-reset-token fails', async () => {
        axios.get.mockRejectedValueOnce({ response: { data: 'Invalid token' } });

        renderWithRoute(<ResetPassword />, '/reset-password?token=invalid-token');

        expect(await screen.findByText(/invalid token/i)).toBeInTheDocument();
    });

    it('shows error if passwords do not match', async () => {
        axios.get.mockResolvedValueOnce({});

        renderWithRoute(<ResetPassword />, '/reset-password?token=valid-token');

        expect(await screen.findByRole('heading', { name: /reset password/i })).toBeInTheDocument();

        fireEvent.change(screen.getByPlaceholderText(/new password/i), { target: { value: 'pass1' } });
        fireEvent.change(screen.getByPlaceholderText(/confirm password/i), { target: { value: 'pass2' } });

        fireEvent.click(screen.getByRole('button', { name: /reset password/i }));

        expect(await screen.findByText(/passwords do not match/i)).toBeInTheDocument();
    });

    it('calls /auth/reset-password API and redirects on success', async () => {
        axios.get.mockResolvedValueOnce({});
        axios.post.mockResolvedValueOnce({ data: 'Password reset successfully' });

        renderWithRoute(<ResetPassword />, '/reset-password?token=valid-token');

        expect(await screen.findByRole('heading', { name: /reset password/i })).toBeInTheDocument();

        fireEvent.change(screen.getByPlaceholderText(/new password/i), { target: { value: 'newpass' } });
        fireEvent.change(screen.getByPlaceholderText(/confirm password/i), { target: { value: 'newpass' } });

        await act(async () => {
            fireEvent.click(screen.getByRole('button', { name: /reset password/i }));
        });

        expect(await screen.findByText(/password reset successfully/i)).toBeInTheDocument();
    });

    it('shows reset failed if API errors out', async () => {
        axios.get.mockResolvedValueOnce({});
        axios.post.mockRejectedValueOnce({ response: { data: 'Reset failed' } });

        renderWithRoute(<ResetPassword />, '/reset-password?token=valid-token');

        expect(await screen.findByRole('heading', { name: /reset password/i })).toBeInTheDocument();

        fireEvent.change(screen.getByPlaceholderText(/new password/i), { target: { value: 'newpass' } });
        fireEvent.change(screen.getByPlaceholderText(/confirm password/i), { target: { value: 'newpass' } });

        await act(async () => {
            fireEvent.click(screen.getByRole('button', { name: /reset password/i }));
        });

        expect(await screen.findByText(/reset failed/i)).toBeInTheDocument();
    });

    it('disables button and shows spinner while submitting', async () => {
        axios.get.mockResolvedValueOnce({});
        let resolvePost;
        axios.post.mockImplementation(() => new Promise((resolve) => { resolvePost = resolve; }));

        renderWithRoute(<ResetPassword />, '/reset-password?token=valid-token');

        expect(await screen.findByRole('heading', { name: /reset password/i })).toBeInTheDocument();

        fireEvent.change(screen.getByPlaceholderText(/new password/i), { target: { value: 'newpass' } });
        fireEvent.change(screen.getByPlaceholderText(/confirm password/i), { target: { value: 'newpass' } });

        fireEvent.click(screen.getByRole('button', { name: /reset password/i }));

        expect(screen.getByRole('button', { name: /resetting/i })).toBeDisabled();

        act(() => resolvePost());
    });
});