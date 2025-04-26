import React from 'react';
import { render, act } from '@testing-library/react';
import { DarkModeProvider, useDarkMode } from '../../contexts/DarkModeContext';

function TestComponent() {
    const { darkMode, toggleDarkMode } = useDarkMode();

    return (
        <div>
            <button onClick={toggleDarkMode}>Toggle</button>
            <div>Dark Mode: {darkMode ? 'true' : 'false'}</div>
        </div>
    );
}

describe('contexts/DarkModeContext.js', () => {
    beforeEach(() => {
        document.documentElement.className = '';
        localStorage.clear();
        jest.clearAllMocks();
    });

    it('loads stored theme from localStorage on mount', () => {
        localStorage.setItem('theme', 'dark');

        const { getByText } = render(
            <DarkModeProvider>
                <TestComponent />
            </DarkModeProvider>
        );

        expect(document.documentElement.classList.contains('dark')).toBe(true);
        expect(getByText('Dark Mode: true')).toBeInTheDocument();
    });

    it('toggleDarkMode() switches from light to dark and vice versa', () => {
        const { getByText } = render(
            <DarkModeProvider>
                <TestComponent />
            </DarkModeProvider>
        );

        expect(document.documentElement.classList.contains('dark')).toBe(false);
        expect(getByText('Dark Mode: false')).toBeInTheDocument();

        act(() => {
            getByText('Toggle').click();
        });
        expect(document.documentElement.classList.contains('dark')).toBe(true);
        expect(getByText('Dark Mode: true')).toBeInTheDocument();
        expect(localStorage.getItem('theme')).toBe('dark');

        act(() => {
            getByText('Toggle').click();
        });
        expect(document.documentElement.classList.contains('dark')).toBe(false);
        expect(getByText('Dark Mode: false')).toBeInTheDocument();
        expect(localStorage.getItem('theme')).toBe('light');
    });

    it('persists theme correctly in localStorage', () => {
        const { getByText } = render(
            <DarkModeProvider>
                <TestComponent />
            </DarkModeProvider>
        );

        act(() => {
            getByText('Toggle').click();
        });

        expect(localStorage.getItem('theme')).toBe('dark');

        act(() => {
            getByText('Toggle').click();
        });

        expect(localStorage.getItem('theme')).toBe('light');
    });
});