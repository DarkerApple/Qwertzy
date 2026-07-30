import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

const root = document.getElementById('root');
if (!root) throw new Error('Missing #root element');

// The app is running, so the "didn't load" notice in index.html has done its job.
document.getElementById('boot-fallback')?.remove();

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
