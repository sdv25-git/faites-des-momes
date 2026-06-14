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

// Capture le prompt d'installation Android Chrome
let _installPrompt = null;

window.addEventListener('beforeinstallprompt', e => {
  e.preventDefault();
  _installPrompt = e;
  document.dispatchEvent(new CustomEvent('pwa:installable'));
});

window.addEventListener('appinstalled', () => {
  _installPrompt = null;
  document.dispatchEvent(new CustomEvent('pwa:installed'));
});

// API publique appelable depuis index.html / app.html
window.pwaInstall = async function () {
  if (!_installPrompt) return false;
  _installPrompt.prompt();
  const { outcome } = await _installPrompt.userChoice;
  if (outcome === 'accepted') _installPrompt = null;
  return outcome === 'accepted';
};

window.pwaIsInstallable = function () { return !!_installPrompt; };
