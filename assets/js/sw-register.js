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

// Détecte si l'app tourne déjà en mode standalone (= installée et lancée depuis l'écran d'accueil)
function _isInstalled() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true ||
    localStorage.getItem('fdm_pwa_installed') === '1'
  );
}

let _installPrompt = null;

window.addEventListener('beforeinstallprompt', e => {
  e.preventDefault();
  if (_isInstalled()) return; // déjà installée — bannière inutile
  _installPrompt = e;
  document.dispatchEvent(new CustomEvent('pwa:installable'));
});

window.addEventListener('appinstalled', () => {
  _installPrompt = null;
  localStorage.setItem('fdm_pwa_installed', '1');
  document.dispatchEvent(new CustomEvent('pwa:installed'));
  // Cacher toutes les bannières présentes
  const b = document.getElementById('pwa-banner');
  if (b) b.style.display = 'none';
});

window.pwaInstall = async function () {
  if (!_installPrompt) return false;
  _installPrompt.prompt();
  const { outcome } = await _installPrompt.userChoice;
  if (outcome === 'accepted') {
    _installPrompt = null;
    localStorage.setItem('fdm_pwa_installed', '1');
  }
  return outcome === 'accepted';
};

window.pwaIsInstallable = function () { return !!_installPrompt; };

// Au chargement : cacher la bannière si déjà installée
document.addEventListener('DOMContentLoaded', () => {
  if (_isInstalled()) {
    const b = document.getElementById('pwa-banner');
    if (b) b.style.display = 'none';
  }
});
