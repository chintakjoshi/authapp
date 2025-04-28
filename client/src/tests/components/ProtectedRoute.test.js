import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ProtectedRoute from '../../components/ProtectedRoute';
import { useAuth } from '../../contexts/AuthContext';

jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    Navigate: ({ to }) => <div>Redirecting to {to}</div>,
}));

jest.mock('../../contexts/AuthContext', () => ({
    useAuth: jest.fn(),
}));

describe('components/ProtectedRoute.js', () => {
    it('renders Outlet when authenticated', () => {
        useAuth.mockReturnValue({ isAuthenticated: true });

        render(
            <MemoryRouter>
                <ProtectedRoute />
            </MemoryRouter>
        );

        expect(screen.queryByText(/Redirecting/i)).not.toBeInTheDocument();
    });

    it('redirects to /login when unauthenticated', () => {
        useAuth.mockReturnValue({ isAuthenticated: false });

        render(
            <MemoryRouter>
                <ProtectedRoute />
            </MemoryRouter>
        );

        expect(screen.getByText('Redirecting to /login')).toBeInTheDocument();
    });
});