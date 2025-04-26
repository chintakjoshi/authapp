import React from 'react';
import { render, act } from '@testing-library/react';
import { AuthProvider, useAuth } from '../../contexts/AuthContext';
import axios from '../../api/axios';

function TestComponent() {
    const { isAuthenticated, login, logout } = useAuth();

    return (
        <div>
            <button onClick={() => login('access-token', 'refresh-token')}>Login</button>
            <button onClick={logout}>Logout</button>
            <div>Authenticated: {isAuthenticated ? 'true' : 'false'}</div>
        </div>
    );
}

describe('contexts/AuthContext.js', () => {
    beforeEach(() => {
        localStorage.clear();
        jest.clearAllMocks();
        delete window.location;
        window.location = { href: '' };
    });

    it('initializes isAuthenticated from localStorage', () => {
        localStorage.setItem('token', 'some-token');
        const { getByText } = render(
            <AuthProvider>
                <TestComponent />
            </AuthProvider>
        );
        expect(getByText('Authenticated: true')).toBeInTheDocument();
    });

    it('login() stores accessToken + refreshToken and sets isAuthenticated', () => {
        const { getByText } = render(
            <AuthProvider>
                <TestComponent />
            </AuthProvider>
        );

        expect(getByText('Authenticated: false')).toBeInTheDocument();

        act(() => {
            getByText('Login').click();
        });

        expect(localStorage.getItem('token')).toBe('access-token');
        expect(localStorage.getItem('refreshToken')).toBe('refresh-token');
        expect(getByText('Authenticated: true')).toBeInTheDocument();
    });

    it('logout() removes tokens and sets isAuthenticated to false', async () => {
        localStorage.setItem('token', 'existing-token');
        localStorage.setItem('refreshToken', 'existing-refresh-token');

        jest.spyOn(axios, 'post').mockResolvedValueOnce({});

        const { getByText } = render(
            <AuthProvider>
                <TestComponent />
            </AuthProvider>
        );

        expect(getByText('Authenticated: true')).toBeInTheDocument();

        await act(async () => {
            getByText('Logout').click();
        });

        expect(localStorage.getItem('token')).toBeNull();
        expect(localStorage.getItem('refreshToken')).toBeNull();
        expect(getByText('Authenticated: false')).toBeInTheDocument();
        expect(axios.post).toHaveBeenCalledWith('/auth/logout', { refreshToken: 'existing-refresh-token' }, expect.any(Object));
    });

    it('logout() handles error if /auth/logout fails gracefully', async () => {
        localStorage.setItem('token', 'existing-token');
        localStorage.setItem('refreshToken', 'existing-refresh-token');

        jest.spyOn(axios, 'post').mockRejectedValueOnce(new Error('Server error'));

        const { getByText } = render(
            <AuthProvider>
                <TestComponent />
            </AuthProvider>
        );

        expect(getByText('Authenticated: true')).toBeInTheDocument();

        await act(async () => {
            getByText('Logout').click();
        });

        expect(localStorage.getItem('token')).toBeNull();
        expect(localStorage.getItem('refreshToken')).toBeNull();
        expect(getByText('Authenticated: false')).toBeInTheDocument();
    });

    it('updates isAuthenticated on storage event (cross-tab sync)', () => {
        const { getByText } = render(
            <AuthProvider>
                <TestComponent />
            </AuthProvider>
        );

        expect(getByText('Authenticated: false')).toBeInTheDocument();

        act(() => {
            localStorage.setItem('token', 'new-token');
            window.dispatchEvent(new Event('storage'));
        });

        expect(getByText('Authenticated: true')).toBeInTheDocument();

        act(() => {
            localStorage.removeItem('token');
            window.dispatchEvent(new Event('storage'));
        });

        expect(getByText('Authenticated: false')).toBeInTheDocument();
    });
});