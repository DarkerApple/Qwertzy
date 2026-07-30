/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        // Month titles read as a notebook page rather than a UI header.
        display: ['ui-serif', 'Iowan Old Style', 'Palatino', 'Georgia', 'serif'],
      },
      colors: {
        // Surfaces live in CSS variables (see index.css) so light and dark are
        // one definition; these ramps are for accents and hairline greys.
        ink: {
          50: '#f7f5f1',
          100: '#eeebe4',
          200: '#ddd8cd',
          300: '#c2bbab',
          400: '#9d9485',
          500: '#7d7466',
          600: '#615a4f',
          700: '#494540',
          800: '#302e2b',
          900: '#1d1c1a',
          950: '#131211',
        },
        accent: {
          50: '#eef0ff',
          100: '#e0e3ff',
          200: '#c7cbfe',
          300: '#a6a9fa',
          400: '#8785f3',
          500: '#6e69e8',
          600: '#5b51d8',
          700: '#4c41bd',
          800: '#3f3798',
          900: '#363179',
        },
      },
      boxShadow: {
        sheet: '0 1px 2px rgb(0 0 0 / 0.04), 0 16px 40px -24px rgb(0 0 0 / 0.35)',
        lift: '0 8px 30px -12px rgb(0 0 0 / 0.35)',
      },
      keyframes: {
        'pop-in': {
          '0%': { opacity: '0', transform: 'translateY(-4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
      animation: {
        'pop-in': 'pop-in 180ms cubic-bezier(0.2, 0.8, 0.2, 1)',
        'slide-up': 'slide-up 220ms cubic-bezier(0.2, 0.8, 0.2, 1)',
        'fade-in': 'fade-in 200ms ease-out',
      },
    },
  },
  plugins: [],
};
