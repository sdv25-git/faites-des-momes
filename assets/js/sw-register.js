if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js', { scope: '/' })
      .then(reg => {
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              document.dispatchEvent(new CustomEvent('sw:update-available'));
            }
          });
        });
      })
      .catch(err => console.warn('SW registration failed:', err));
  });
}
