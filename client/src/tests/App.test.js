import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from '../App';
import { useAuth } from '../contexts/AuthContext';

jest.mock('../contexts/AuthContext', () => ({
    useAuth: jest.fn(),
}));

jest.mock('../pages/Login', () => () => <div>Login Page</div>);
jest.mock('../pages/Register', () => () => <div>Register Page</div>);
jest.mock('../pages/ForgotPassword', () => () => <div>Forgot Password Page</div>);
jest.mock('../pages/ResetPassword', () => () => <div>Reset Password Page</div>);
jest.mock('../pages/VerifyOtp', () => () => <div>Verify OTP Page</div>);
jest.mock('../components/Protected', () => () => <div>Protected Page</div>);
jest.mock('../components/Navbar', () => () => <div>Navbar</div>);

describe('App.js', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders public routes correctly', () => {
        useAuth.mockReturnValue({ isAuthenticated: false });

        render(
            <MemoryRouter initialEntries={['/login']}>
                <App />
            </MemoryRouter>
        );
        expect(screen.getByText('Login Page')).toBeInTheDocument();
    });

    it('renders /register', () => {
        useAuth.mockReturnValue({ isAuthenticated: false });

        render(
            <MemoryRouter initialEntries={['/register']}>
                <App />
            </MemoryRouter>
        );
        expect(screen.getByText('Register Page')).toBeInTheDocument();
    });

    it('renders /forgot-password', () => {
        useAuth.mockReturnValue({ isAuthenticated: false });

        render(
            <MemoryRouter initialEntries={['/forgot-password']}>
                <App />
            </MemoryRouter>
        );
        expect(screen.getByText('Forgot Password Page')).toBeInTheDocument();
    });

    it('renders /reset-password', () => {
        useAuth.mockReturnValue({ isAuthenticated: false });

        render(
            <MemoryRouter initialEntries={['/reset-password']}>
                <App />
            </MemoryRouter>
        );
        expect(screen.getByText('Reset Password Page')).toBeInTheDocument();
    });

    it('renders /verify', () => {
        useAuth.mockReturnValue({ isAuthenticated: false });

        render(
            <MemoryRouter initialEntries={['/verify']}>
                <App />
            </MemoryRouter>
        );
        expect(screen.getByText('Verify OTP Page')).toBeInTheDocument();
    });

    it('redirects unauthenticated users trying to access /protected', () => {
        useAuth.mockReturnValue({ isAuthenticated: false });

        render(
            <MemoryRouter initialEntries={['/protected']}>
                <App />
            </MemoryRouter>
        );

        expect(screen.getByText('Login Page')).toBeInTheDocument();
    });

    it('redirects unknown routes to /login', () => {
        useAuth.mockReturnValue({ isAuthenticated: false });

        render(
            <MemoryRouter initialEntries={['/unknown']}>
                <App />
            </MemoryRouter>
        );

        expect(screen.getByText('Login Page')).toBeInTheDocument();
    });
});