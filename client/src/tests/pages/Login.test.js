import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import Login from '../../pages/Login';
import { useAuth } from '../../contexts/AuthContext';
import axios from '../../api/axios';

jest.mock('../../contexts/AuthContext', () => ({
    useAuth: jest.fn(),
}));

jest.mock('../../api/axios', () => ({
    post: jest.fn(),
}));

jest.mock('react-router-dom', () => {
    const actual = jest.requireActual('react-router-dom');
    return {
        ...actual,
        useNavigate: () => jest.fn(),
    };
});

global.crypto = {
    randomUUID: () => 'mock-device-id',
};

describe('pages/Login.js', () => {
    let mockLogin;
    let mockNavigate;

    beforeEach(() => {
        mockLogin = jest.fn();
        mockNavigate = jest.fn();

        useAuth.mockReturnValue({ login: mockLogin });
        jest.spyOn(require('react-router-dom'), 'useNavigate').mockReturnValue(mockNavigate);

        jest.clearAllMocks();
        localStorage.clear();
    });

    it('renders username and password inputs', () => {
        render(
            <MemoryRouter>
                <Login />
            </MemoryRouter>
        );

        expect(screen.getByPlaceholderText('Username')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Password')).toBeInTheDocument();
    });

    it('submitting form calls /auth/login with correct data', async () => {
        axios.post.mockResolvedValueOnce({
            data: { accessToken: 'access-token', refreshToken: 'refresh-token' },
        });

        render(
            <MemoryRouter>
                <Login />
            </MemoryRouter>
        );

        userEvent.type(screen.getByPlaceholderText('Username'), 'testuser');
        userEvent.type(screen.getByPlaceholderText('Password'), 'testpass');
        userEvent.click(screen.getByRole('button', { name: /login/i }));

        await waitFor(() => {
            expect(axios.post).toHaveBeenCalledWith('/auth/login', {
                username: 'testuser',
                password: 'testpass',
                deviceId: 'mock-device-id',
            });

            expect(mockLogin).toHaveBeenCalledWith('access-token', 'refresh-token');
            expect(mockNavigate).toHaveBeenCalledWith('/protected');
        });
    });

    it('shows error on login failure', async () => {
        axios.post.mockRejectedValueOnce(new Error('Login failed'));

        render(
            <MemoryRouter>
                <Login />
            </MemoryRouter>
        );

        userEvent.type(screen.getByPlaceholderText('Username'), 'wronguser');
        userEvent.type(screen.getByPlaceholderText('Password'), 'wrongpass');
        userEvent.click(screen.getByRole('button', { name: /login/i }));

        expect(await screen.findByText('Invalid credentials')).toBeInTheDocument();
    });

    it('disables button and shows spinner during loading', async () => {
        axios.post.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve({
            data: { accessToken: 'token', refreshToken: 'refresh' }
        }), 500)));

        render(
            <MemoryRouter>
                <Login />
            </MemoryRouter>
        );

        userEvent.type(screen.getByPlaceholderText('Username'), 'user');
        userEvent.type(screen.getByPlaceholderText('Password'), 'pass');
        userEvent.click(screen.getByRole('button', { name: /login/i }));

        expect(screen.getByRole('button', { name: /logging in/i })).toBeDisabled();
        expect(screen.getByText(/logging in/i)).toBeInTheDocument();
    });

    it('navigates to register page when clicking Register button', () => {
        render(
            <MemoryRouter>
                <Login />
            </MemoryRouter>
        );

        userEvent.click(screen.getByText('Register'));
        expect(mockNavigate).toHaveBeenCalledWith('/register');
    });

    it('navigates to forgot-password page when clicking Forgot Password button', () => {
        render(
            <MemoryRouter>
                <Login />
            </MemoryRouter>
        );

        userEvent.click(screen.getByText('Forgot Password?'));
        expect(mockNavigate).toHaveBeenCalledWith('/forgot-password');
    });
});