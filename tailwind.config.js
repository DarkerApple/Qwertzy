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
        // Driven by CSS variables so the Settings page can swap the accent
        // without every accent-* class in the app needing to change.
        accent: Object.fromEntries(
          [50, 100, 200, 300, 400, 500, 600, 700, 800, 900].map((step) => [
            step,
            `rgb(var(--accent-${step}) / <alpha-value>)`,
          ]),
        ),
      },
      boxShadow: {
        sheet: '0 1px 2px rgb(0 0 0 / 0.04), 0 16px 40px -24px rgb(0 0 0 / 0.35)',
        lift: '0 8px 30px -12px rgb(0 0 0 / 0.35)',
      },
      keyframes: {
        'page-in': {
          '0%': { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'check-pop': {
          '0%': { transform: 'scale(1)' },
          '45%': { transform: 'scale(1.18)' },
          '100%': { transform: 'scale(1)' },
        },
        'ring-pulse': {
          '0%, 100%': { transform: 'scale(1)', opacity: '1' },
          '50%': { transform: 'scale(1.04)', opacity: '0.86' },
        },
        'sheet-up': {
          '0%': { opacity: '0', transform: 'translateY(24px) scale(0.98)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        'toast-in': {
          '0%': { opacity: '0', transform: 'translateY(14px) scale(0.97)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
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
        'page-in': 'page-in 260ms cubic-bezier(0.22, 1, 0.36, 1)',
        'check-pop': 'check-pop 260ms cubic-bezier(0.34, 1.56, 0.64, 1)',
        'ring-pulse': 'ring-pulse 1.6s ease-in-out infinite',
        'sheet-up': 'sheet-up 240ms cubic-bezier(0.22, 1, 0.36, 1)',
        'toast-in': 'toast-in 260ms cubic-bezier(0.22, 1, 0.36, 1)',
        'pop-in': 'pop-in 180ms cubic-bezier(0.2, 0.8, 0.2, 1)',
        'slide-up': 'slide-up 220ms cubic-bezier(0.2, 0.8, 0.2, 1)',
        'fade-in': 'fade-in 200ms ease-out',
      },
    },
  },
  plugins: [],
};
