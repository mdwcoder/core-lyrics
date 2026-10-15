import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Register PWA Service Worker for offline support and installability
if ('serviceWorker' in navigator && typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    // Relative registration to support both root and subpath deployments
    const swPath = import.meta.env.BASE_URL ? `${import.meta.env.BASE_URL.replace(/\/$/, '')}/sw.js` : './sw.js';
    navigator.serviceWorker.register(swPath).catch((err) => {
      console.warn('Service Worker registration skipped or failed:', err);
    });
  });
}

createRoot(document.getElementById('root')!).render(<App />);
