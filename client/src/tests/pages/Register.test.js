import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Register from '../../pages/Register';

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

describe('pages/Register.js', () => {
    beforeEach(() => {
        localStorage.clear();
        jest.clearAllMocks();
    });

    it('renders email, username, password, and confirmPassword inputs', () => {
        renderWithRouter(<Register />);
        expect(screen.getByPlaceholderText(/email/i)).toBeInTheDocument();
        expect(screen.getByPlaceholderText(/username/i)).toBeInTheDocument();
        expect(screen.getByPlaceholderText(/^password$/i)).toBeInTheDocument();
        expect(screen.getByPlaceholderText(/confirm password/i)).toBeInTheDocument();
    });

    it('shows error if passwords do not match', async () => {
        renderWithRouter(<Register />);
        fireEvent.change(screen.getByPlaceholderText(/^password$/i), { target: { value: 'password1' } });
        fireEvent.change(screen.getByPlaceholderText(/confirm password/i), { target: { value: 'password2' } });

        await act(async () => {
            fireEvent.click(screen.getByRole('button', { name: /register/i }));
        });

        expect(await screen.findByText(/passwords do not match/i)).toBeInTheDocument();
    });

    it('submits form and calls /auth/register API on valid input', async () => {
        mockPost.mockResolvedValueOnce({});

        renderWithRouter(<Register />);
        fireEvent.change(screen.getByPlaceholderText(/email/i), { target: { value: 'test@example.com' } });
        fireEvent.change(screen.getByPlaceholderText(/username/i), { target: { value: 'testuser' } });
        fireEvent.change(screen.getByPlaceholderText(/^password$/i), { target: { value: 'password' } });
        fireEvent.change(screen.getByPlaceholderText(/confirm password/i), { target: { value: 'password' } });

        await act(async () => {
            fireEvent.click(screen.getByRole('button', { name: /register/i }));
        });

        await waitFor(() => {
            expect(mockPost).toHaveBeenCalledWith('/auth/register', {
                email: 'test@example.com',
                username: 'testuser',
                password: 'password',
                confirmPassword: 'password',
            });
        });
    });

    it('on success, stores pendingEmail and navigates to /verify', async () => {
        mockPost.mockResolvedValueOnce({});

        renderWithRouter(<Register />);
        fireEvent.change(screen.getByPlaceholderText(/email/i), { target: { value: 'test@example.com' } });
        fireEvent.change(screen.getByPlaceholderText(/username/i), { target: { value: 'testuser' } });
        fireEvent.change(screen.getByPlaceholderText(/^password$/i), { target: { value: 'password' } });
        fireEvent.change(screen.getByPlaceholderText(/confirm password/i), { target: { value: 'password' } });

        await act(async () => {
            fireEvent.click(screen.getByRole('button', { name: /register/i }));
        });

        await waitFor(() => {
            expect(localStorage.getItem('pendingEmail')).toBe('test@example.com');
        });
    });

    it('shows server error on failure', async () => {
        mockPost.mockRejectedValueOnce({ response: { data: 'Email already taken' } });

        renderWithRouter(<Register />);
        fireEvent.change(screen.getByPlaceholderText(/email/i), { target: { value: 'test@example.com' } });
        fireEvent.change(screen.getByPlaceholderText(/username/i), { target: { value: 'testuser' } });
        fireEvent.change(screen.getByPlaceholderText(/^password$/i), { target: { value: 'password' } });
        fireEvent.change(screen.getByPlaceholderText(/confirm password/i), { target: { value: 'password' } });

        await act(async () => {
            fireEvent.click(screen.getByRole('button', { name: /register/i }));
        });

        expect(await screen.findByText(/email already taken/i)).toBeInTheDocument();
    });

    it('disables button and shows spinner during loading', async () => {
        let resolvePost;
        mockPost.mockImplementation(
            () => new Promise((resolve) => { resolvePost = resolve; })
        );

        renderWithRouter(<Register />);
        fireEvent.change(screen.getByPlaceholderText(/email/i), { target: { value: 'test@example.com' } });
        fireEvent.change(screen.getByPlaceholderText(/username/i), { target: { value: 'testuser' } });
        fireEvent.change(screen.getByPlaceholderText(/^password$/i), { target: { value: 'password' } });
        fireEvent.change(screen.getByPlaceholderText(/confirm password/i), { target: { value: 'password' } });

        await act(async () => {
            fireEvent.click(screen.getByRole('button', { name: /register/i }));
        });

        expect(screen.getByRole('button', { name: /registering/i })).toBeDisabled();

        await act(async () => {
            resolvePost();
        });
    });

    it('navigates back to login when clicking Back to Login', async () => {
        renderWithRouter(<Register />);
        await act(async () => {
            fireEvent.click(screen.getByText(/back to login/i));
        });
        expect(window.location.pathname).toBe('/login');
    });
});