import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { DarkModeProvider } from './contexts/DarkModeContext';
import { AuthProvider } from './contexts/AuthContext';
import App from './App';

const customRender = (ui) => {
  return render(
    <MemoryRouter>
      <AuthProvider>
        <DarkModeProvider>
          {ui}
        </DarkModeProvider>
      </AuthProvider>
    </MemoryRouter>
  );
};

test('renders login heading', () => {
  customRender(<App />);
  expect(screen.getByRole('heading', { name: /login/i })).toBeInTheDocument();
});

test('renders login button', () => {
  customRender(<App />);
  expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
});