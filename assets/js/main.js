const modal = document.getElementById('modal-inscription');
const overlay = document.getElementById('modal-overlay');
const closeBtn = document.getElementById('modal-close');
const submitBtn = document.getElementById('modal-submit');
const dots = document.querySelectorAll('.modal__dot');

let currentStep = 1;
let firstFocusable = null;

function openModal() {
  modal.hidden = false;
  document.body.style.overflow = 'hidden';
  showStep(1);
  trapFocus();
}

function closeModal() {
  modal.hidden = true;
  document.body.style.overflow = '';
  currentStep = 1;
}

function showStep(n) {
  currentStep = n;
  document.querySelectorAll('.modal__step').forEach(s => {
    s.classList.remove('modal__step--active');
  });
  const target = document.getElementById('step-' + n);
  if (target) {
    target.classList.add('modal__step--active');
    const first = target.querySelector('input, button');
    if (first) first.focus();
  }
  dots.forEach((dot, i) => {
    dot.classList.toggle('modal__dot--active', i < n);
  });
}

function trapFocus() {
  const focusable = modal.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  if (!focusable.length) return;
  firstFocusable = focusable[0];
  const lastFocusable = focusable[focusable.length - 1];

  modal.addEventListener('keydown', function handler(e) {
    if (e.key !== 'Tab') return;
    if (e.shiftKey) {
      if (document.activeElement === firstFocusable) {
        e.preventDefault();
        lastFocusable.focus();
      }
    } else {
      if (document.activeElement === lastFocusable) {
        e.preventDefault();
        firstFocusable.focus();
      }
    }
    if (!modal.hidden && !modal.contains(document.activeElement)) {
      firstFocusable.focus();
    }
  });

  firstFocusable.focus();
}

// Boutons "Suivant"
modal.addEventListener('click', e => {
  const btn = e.target.closest('[data-next]');
  if (btn) showStep(parseInt(btn.dataset.next, 10));

  const back = e.target.closest('[data-back]');
  if (back) showStep(parseInt(back.dataset.back, 10));
});

// Soumission finale
if (submitBtn) {
  submitBtn.addEventListener('click', () => {
    const email = document.getElementById('field-email').value.trim();
    if (!email) {
      document.getElementById('field-email').focus();
      return;
    }
    // Sauvegarder l'inscription en localStorage
    const prenom = document.getElementById('field-prenom').value.trim();
    const ages = [...document.querySelectorAll('input[name="age"]:checked')].map(i => i.value);
    const whatsapp = document.getElementById('field-whatsapp').value.trim();
    localStorage.setItem('fdm_user', JSON.stringify({ prenom, email, ages, whatsapp, registered_at: Date.now() }));
    showStep('success');
    dots.forEach(d => d.classList.add('modal__dot--active'));
  });
}

// Fermeture
closeBtn.addEventListener('click', closeModal);
overlay.addEventListener('click', closeModal);
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && !modal.hidden) closeModal();
});

// Boutons d'ouverture (plusieurs sur la page)
document.querySelectorAll('.js-open-modal').forEach(btn => {
  btn.addEventListener('click', openModal);
});

// Ticker : pause au survol
const ticker = document.querySelector('.ticker__track');
if (ticker) {
  ticker.addEventListener('mouseenter', () => { ticker.style.animationPlayState = 'paused'; });
  ticker.addEventListener('mouseleave', () => { ticker.style.animationPlayState = 'running'; });
}
