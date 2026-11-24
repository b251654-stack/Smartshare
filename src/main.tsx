import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    void navigator.serviceWorker.register('/Smartshare/sw.js').then(registration => {
      void registration.update();
    });
  });

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      void navigator.serviceWorker.getRegistrations().then(registrations => {
        registrations.forEach(registration => void registration.update());
      });
    }
  })
}
