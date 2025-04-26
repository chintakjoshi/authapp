/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        darkSans: ['Poppins', 'sans-serif'],
      },
      colors: {
        brand: {
          light: '#1e40af',
          dark: '#60a5fa',
        },
      },
      keyframes: {
        'fade-in': { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        'fade-in-scale': { '0%': { opacity: '0', transform: 'scale(0.95)' }, '100%': { opacity: '1', transform: 'scale(1)' } },
        'navbar': { '0%': { opacity: '0', transform: 'translateY(-10px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        'fade-slide-down': {
          '0%': { opacity: '0', transform: 'translateY(-10px)' }, '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.4s ease-out forwards',
        'fade-in-scale': 'fade-in-scale 0.4s ease-out',
        'fade-slide-down': 'fade-slide-down 0.2s ease-out',
        'navbar': 'navbar 0.5s ease-out forwards',
      },
    },
  },
  plugins: [],
};