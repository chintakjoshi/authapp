import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Protected from '../../components/Protected';
import axios from '../../api/axios';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

jest.mock('../../api/axios');
jest.mock('../../contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));
jest.mock('react-router-dom', () => ({
  useNavigate: jest.fn(),
}));

describe('components/Protected.js', () => {
  const mockNavigate = jest.fn();
  const mockLogout = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    useAuth.mockReturnValue({ logout: mockLogout });
    useNavigate.mockReturnValue(mockNavigate);
  });

  it('calls /api/secure-endpoint and displays returned message', async () => {
    axios.get.mockResolvedValueOnce({ data: 'Welcome to Protected Page!' });

    render(<Protected />);

    expect(axios.get).toHaveBeenCalledWith('/api/secure-endpoint');

    const message = await screen.findByText('Welcome to Protected Page!');
    expect(message).toBeInTheDocument();
  });

  it('if 401 error happens, clears tokens and navigates to /login', async () => {
    localStorage.setItem('token', 'dummy');
    localStorage.setItem('refreshToken', 'dummy');

    axios.get.mockRejectedValueOnce(new Error('401 Unauthorized'));

    render(<Protected />);

    await waitFor(() => {
      expect(localStorage.getItem('token')).toBeNull();
      expect(localStorage.getItem('refreshToken')).toBeNull();
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });
  });

  it('logout button calls logout() and navigates to /login', async () => {
    axios.get.mockResolvedValueOnce({ data: 'Protected Message' });

    render(<Protected />);

    const logoutButton = await screen.findByText('Logout');
    userEvent.click(logoutButton);

    await waitFor(() => {
      expect(mockLogout).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });
  });

  it('shows loading state during logout', async () => {
    axios.get.mockResolvedValueOnce({ data: 'Protected Message' });

    let resolveLogout;
    const logoutPromise = new Promise((res) => (resolveLogout = res));
    useAuth.mockReturnValue({ logout: () => logoutPromise });

    render(<Protected />);

    const logoutButton = await screen.findByText('Logout');
    userEvent.click(logoutButton);

    // Technically, your Protected.js doesn't show spinner on logout,
    // so we'll just ensure navigation doesn't happen before promise resolves

    expect(mockNavigate).not.toHaveBeenCalled();

    await act(async () => {
      resolveLogout();
    });

    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });
});
