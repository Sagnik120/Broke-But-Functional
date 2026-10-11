import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
// Self-hosted fonts: no third-party requests, so the strict CSP stays intact.
import '@fontsource/instrument-serif/latin-400.css';
import '@fontsource/instrument-serif/latin-400-italic.css';
import '@fontsource-variable/figtree/wght.css';
import '@fontsource/kalam/latin-400.css';
import '@fontsource/kalam/latin-700.css';
import App from '@/App';
import { registerServiceWorker } from '@/services/serviceWorker';
import { reportWebVitals } from '@/services/webVitals';
import '@/styles/index.css';

const root = document.getElementById('root');
if (!root) throw new Error('Root element #root is missing from index.html.');

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

registerServiceWorker();
reportWebVitals();
