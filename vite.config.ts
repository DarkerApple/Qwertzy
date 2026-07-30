import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// GitHub Pages serves a project site from /<repo>/, so a production build needs a
// matching base or every asset 404s. The deploy workflow passes BASE_PATH=/<repo>/;
// local dev and preview stay at '/'.
export default defineConfig(({ mode }) => ({
  base: process.env.BASE_PATH ?? (mode === 'production' ? '/Qwertzy/' : '/'),
  plugins: [react()],
}));
