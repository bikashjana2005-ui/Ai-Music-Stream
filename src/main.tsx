import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { initVirtualRefreshEngine } from './utils/virtualRefreshEngine';

// Initialize 165Hz Virtual Ultra-Smooth Refresh Engine across the entire application
initVirtualRefreshEngine();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
