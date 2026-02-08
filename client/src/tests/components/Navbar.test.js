import React from 'react';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Navbar from '../../components/Navbar';
import { useAuth } from '../../contexts/AuthContext';
import { useDarkMode } from '../../contexts/DarkModeContext';
import { useNavigate } from 'react-router-dom';

jest.mock('../../contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));

jest.mock('../../contexts/DarkModeContext', () => ({
  useDarkMode: jest.fn(),
}));

jest.mock('react-router-dom', () => ({
  useNavigate: jest.fn(),
}));

describe('components/Navbar.js', () => {
  const mockNavigate = jest.fn();
  const mockToggleDarkMode = jest.fn();
  const mockLogout = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    useNavigate.mockReturnValue(mockNavigate);
    useDarkMode.mockReturnValue({ darkMode: false, toggleDarkMode: mockToggleDarkMode });
    useAuth.mockReturnValue({ isAuthenticated: false, logout: mockLogout });
  });

  it('renders correct controls when not authenticated', () => {
    render(<Navbar />);

    expect(screen.getByText('MyApp')).toBeInTheDocument();
    expect(screen.getByText('Dark Mode')).toBeInTheDocument();
    expect(screen.queryByText('Logout')).toBeNull();
  });

  it('renders Logout button when authenticated', () => {
    useAuth.mockReturnValue({ isAuthenticated: true, logout: mockLogout });
    render(<Navbar />);

    expect(screen.getByText('Logout')).toBeInTheDocument();
  });

  it('clicking logo navigates to "/"', async () => {
    render(<Navbar />);

    userEvent.click(screen.getByText('MyApp'));
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  it('dark mode toggle calls toggleDarkMode()', async () => {
    render(<Navbar />);

    userEvent.click(screen.getByText('Dark Mode'));
    expect(mockToggleDarkMode).toHaveBeenCalled();
  });

  it('clicking Logout calls logout() and navigates to /login', async () => {
    useAuth.mockReturnValue({ isAuthenticated: true, logout: mockLogout });
    render(<Navbar />);

    await act(async () => {
      userEvent.click(screen.getByText('Logout'));
    });

    expect(mockLogout).toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  it('displays loading spinner on logout', async () => {
    let resolveLogout;
    const logoutPromise = new Promise((res) => { resolveLogout = res; });
    useAuth.mockReturnValue({ isAuthenticated: true, logout: () => logoutPromise });

    render(<Navbar />);

    await act(async () => {
      userEvent.click(screen.getByText('Logout'));
    });

    expect(screen.getByText(/logging out/i)).toBeInTheDocument();

    await act(async () => {
      resolveLogout();
    });
  });

  it('displays error if logout fails', async () => {
    const failingLogout = jest.fn(() => Promise.reject(new Error('Logout error')));
    useAuth.mockReturnValue({ isAuthenticated: true, logout: failingLogout });

    render(<Navbar />);

    await act(async () => {
      userEvent.click(screen.getByText('Logout'));
    });

    await waitFor(() => {
      expect(screen.getByText('Logout Failed')).toBeInTheDocument();
    });
  });

  it('clicking outside mobile menu closes it with animation', async () => {
    render(<Navbar />);

    userEvent.click(screen.getByLabelText(/toggle menu/i));

    const mobileDarkModeButtons = await screen.findAllByText('Dark Mode');
    expect(mobileDarkModeButtons.length).toBeGreaterThan(1);

    fireEvent.mouseDown(document);
    await act(() => new Promise((resolve) => setTimeout(resolve, 250)));

    const buttons = screen.queryAllByText('Dark Mode');
    expect(buttons.length).toBe(1);
  });
});
