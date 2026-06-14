import { loadIndex, fetchContent } from './content.js';

// ── State ─────────────────────────────────────────────────────────────────────

const state = {
  items: [],
  filters: {
    type: 'all',
    themes: new Set(),
    ages: new Set()
  }
};

// ── DOM refs ──────────────────────────────────────────────────────────────────

const feed          = document.getElementById('content-feed');
const filterBar     = document.getElementById('filter-bar');
const filterToggle  = document.getElementById('btn-filter-toggle');
const overlay       = document.getElementById('article-overlay');
const overlayClose  = document.getElementById('article-close');
const overlayContent = document.getElementById('article-content');

// ── Init ──────────────────────────────────────────────────────────────────────

async function init() {
  try {
    const data = await loadIndex();
    state.items = data.items;
    checkURLFilters();
    renderFeed(state.filters);
  } catch {
    showError();
  }

  initFilterButtons();
  initFilterToggle();
  initOverlayClose();
  initSWUpdate();
}

// ── Reading progress ──────────────────────────────────────────────────────────

export function saveReadingProgress(id) {
  localStorage.setItem('fdm_read_' + id, String(Date.now()));
}

export function getReadItems() {
  const ids = new Set();
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('fdm_read_')) {
      ids.add(key.replace('fdm_read_', ''));
    }
  }
  return ids;
}

// ── Filters ───────────────────────────────────────────────────────────────────

export function applyFilter(type, value) {
  if (type === 'type') {
    state.filters.type = value;
  } else if (type === 'theme') {
    if (state.filters.themes.has(value)) {
      state.filters.themes.delete(value);
    } else {
      state.filters.themes.add(value);
    }
  } else if (type === 'age') {
    if (state.filters.ages.has(value)) {
      state.filters.ages.delete(value);
    } else {
      state.filters.ages.add(value);
    }
  }
  updateFilterUI();
  renderFeed(state.filters);
}

function matchesFilters(item, filters) {
  const typeOk = filters.type === 'all' || item.type === filters.type;
  const themeOk = filters.themes.size === 0 || filters.themes.has(item.theme);
  const ageOk = filters.ages.size === 0 ||
    item.age_range.some(a => filters.ages.has(a));
  return typeOk && themeOk && ageOk;
}

function checkURLFilters() {
  const params = new URLSearchParams(window.location.search);
  const filter = params.get('filter');
  if (filter === 'newsletter' || filter === 'whatsapp') {
    state.filters.type = filter;
  }
}

// ── Render feed ───────────────────────────────────────────────────────────────

export function renderFeed(filters) {
  const readItems = getReadItems();
  const filtered = state.items.filter(item => matchesFilters(item, filters));

  feed.textContent = '';

  if (filtered.length === 0) {
    feed.insertAdjacentHTML('beforeend', '<p class="feed-empty">Aucun contenu pour ces filtres.<br>Essayez d\'élargir votre sélection.</p>');
    return;
  }

  let lastMonth = '';
  filtered.forEach(item => {
    if (item.month !== lastMonth) {
      lastMonth = item.month;
      const label = formatMonth(item.month);
      feed.insertAdjacentHTML('beforeend', `<p class="feed-month-header" aria-hidden="true">${label}</p>`);
    }
    const isRead = readItems.has(item.id);
    if (item.type === 'newsletter') {
      feed.insertAdjacentHTML('beforeend', renderNewsletterCard(item, isRead));
    } else {
      feed.insertAdjacentHTML('beforeend', renderWhatsAppCard(item, isRead));
    }
  });

  feed.querySelectorAll('[data-article-id]').forEach(el => {
    el.addEventListener('click', e => {
      const id = e.currentTarget.dataset.articleId;
      if (id) openArticle(id);
    });
    el.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        const id = e.currentTarget.dataset.articleId;
        if (id) openArticle(id);
      }
    });
  });
}

function renderNewsletterCard(item, isRead) {
  const time = formatMonth(item.month);
  const mins = Math.round(item.read_time_seconds / 60);
  const readClass = isRead ? ' content-card--read' : '';
  return `
    <article
      class="content-card content-card--newsletter${readClass}"
      data-article-id="${item.id}"
      tabindex="0"
      role="button"
      aria-label="Lire : ${escText(item.title)}"
    >
      <div class="content-card__meta">
        <span class="badge badge--email">Newsletter</span>
        <time>${escText(time)}</time>
      </div>
      <h3>${escText(item.title)}</h3>
      <p>${escText(item.summary)}</p>
      <span class="btn-read">Lire · ${mins} min</span>
    </article>`;
}

function renderWhatsAppCard(item, isRead) {
  const secs = item.read_time_seconds;
  const timeLabel = secs < 60 ? secs + 's' : Math.round(secs / 60) + ' min';
  const readClass = isRead ? ' content-card--read' : '';
  return `
    <article
      class="whatsapp-card${readClass}"
      data-article-id="${item.id}"
      tabindex="0"
      role="button"
      aria-label="Lire : ${escText(item.title)}"
    >
      <div class="whatsapp-card__bubble">
        <p class="whatsapp-card__question">${escText(item.title)}</p>
        <p class="whatsapp-card__body">${escText(item.summary)}</p>
        <span class="whatsapp-card__read-time">${timeLabel}</span>
      </div>
    </article>`;
}

// ── Open article ──────────────────────────────────────────────────────────────

export async function openArticle(id) {
  const item = state.items.find(i => i.id === id);
  if (!item) return;

  overlay.hidden = false;
  document.body.style.overflow = 'hidden';
  overlayContent.textContent = '';
  overlayContent.insertAdjacentHTML('beforeend', '<p style="color:var(--color-text-light);padding:2rem 0">Chargement…</p>');
  overlayContent.focus();

  try {
    const data = await fetchContent(item.file);
    renderArticle(data);
    saveReadingProgress(id);
    markAsRead(id);
  } catch {
    overlayContent.textContent = '';
    overlayContent.insertAdjacentHTML('beforeend', '<p class="feed-error">Impossible de charger cet article. Vérifiez votre connexion.</p>');
  }
}

function renderArticle(data) {
  overlayContent.textContent = '';

  if (data.type === 'newsletter') {
    renderNewsletterArticle(data);
  } else {
    renderWAArticle(data);
  }
}

function renderNewsletterArticle(data) {
  const time = data.published_at ? new Date(data.published_at).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long' }) : '';
  overlayContent.insertAdjacentHTML('beforeend', `
    <div class="article-meta">
      <span class="badge badge--email">Newsletter</span>
      ${time ? `<time datetime="${data.published_at}">${time}</time>` : ''}
    </div>
    <h2 class="article-title" id="article-title">${escText(data.title)}</h2>
  `);

  (data.sections || []).forEach(section => {
    if (section.type === 'intro') {
      overlayContent.insertAdjacentHTML('beforeend', `
        <div class="article-section">
          <p>${escText(section.body)}</p>
        </div>`);
    } else if (section.type === 'insight') {
      overlayContent.insertAdjacentHTML('beforeend', `
        <div class="article-section">
          <span class="article-section__label">${escText(section.label)}</span>
          <p>${escText(section.body)}</p>
        </div>`);
    } else if (section.type === 'tip') {
      const items = (section.items || []).map(t => `<li>${escText(t)}</li>`).join('');
      overlayContent.insertAdjacentHTML('beforeend', `
        <div class="article-section">
          <span class="article-section__label">${escText(section.label)}</span>
          <ul class="article-tips">${items}</ul>
        </div>`);
    } else if (section.type === 'resource') {
      const links = (section.links || []).map(l =>
        `<a href="${escAttr(l.url)}" target="_blank" rel="noopener noreferrer">${escText(l.title)}</a>`
      ).join('');
      overlayContent.insertAdjacentHTML('beforeend', `
        <div class="article-section">
          <span class="article-section__label">${escText(section.label)}</span>
          <div class="article-links">${links}</div>
        </div>`);
    }
  });
}

function renderWAArticle(data) {
  const time = data.published_at ? new Date(data.published_at).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' }) : '';
  overlayContent.insertAdjacentHTML('beforeend', `
    <div class="article-meta">
      <span class="badge badge--whatsapp">WhatsApp</span>
      ${time ? `<time datetime="${data.published_at}">${time}</time>` : ''}
    </div>
    <h2 class="article-title" id="article-title">${escText(data.title)}</h2>
    <div class="article-wa">
      <p class="article-wa__body">${escText(data.body)}</p>
      ${data.key_takeaway ? `<p class="article-wa__takeaway">${escText(data.key_takeaway)}</p>` : ''}
    </div>
    ${data.action ? `
    <div class="article-wa__action">
      <span class="article-wa__action-label">À faire aujourd'hui</span>
      <p>${escText(data.action)}</p>
    </div>` : ''}
  `);
}

function closeArticle() {
  overlay.hidden = true;
  document.body.style.overflow = '';
  renderFeed(state.filters);
}

function markAsRead(id) {
  const el = feed.querySelector(`[data-article-id="${id}"]`);
  if (el) el.classList.add('content-card--read');
}

// ── UI helpers ────────────────────────────────────────────────────────────────

function initFilterButtons() {
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const type = btn.dataset.filterType;
      const value = btn.dataset.filterValue;
      if (type && value) applyFilter(type, value);
    });
  });
}

function initFilterToggle() {
  filterToggle.addEventListener('click', () => {
    const open = filterBar.classList.toggle('filter-bar--open');
    filterToggle.setAttribute('aria-expanded', String(open));
  });
}

function initOverlayClose() {
  overlayClose.addEventListener('click', closeArticle);
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && !overlay.hidden) closeArticle();
  });
}

function initSWUpdate() {
  document.addEventListener('sw:update-available', () => {
    const banner = document.createElement('div');
    banner.style.cssText = 'position:fixed;bottom:80px;left:50%;transform:translateX(-50%);background:var(--color-text);color:#fff;padding:12px 20px;border-radius:var(--radius-full);font-size:var(--size-sm);font-weight:600;z-index:999;cursor:pointer;';
    banner.textContent = 'Mise à jour disponible — cliquer pour recharger';
    banner.addEventListener('click', () => window.location.reload());
    document.body.appendChild(banner);
  });
}

function updateFilterUI() {
  document.querySelectorAll('.filter-btn').forEach(btn => {
    const type = btn.dataset.filterType;
    const value = btn.dataset.filterValue;
    let active = false;
    if (type === 'type')  active = state.filters.type === value;
    if (type === 'theme') active = state.filters.themes.has(value);
    if (type === 'age')   active = state.filters.ages.has(value);
    btn.classList.toggle('filter-btn--active', active);
  });
}

function showError() {
  feed.textContent = '';
  feed.insertAdjacentHTML('beforeend', '<p class="feed-error">Impossible de charger les contenus. Vérifiez votre connexion et rechargez la page.</p>');
}

function formatMonth(monthStr) {
  const [y, m] = monthStr.split('-');
  const d = new Date(parseInt(y), parseInt(m) - 1, 1);
  return d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
}

function escText(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function escAttr(str) {
  const s = String(str ?? '');
  if (!/^https?:\/\//i.test(s)) return '#';
  return s.replace(/"/g, '&quot;');
}

// ── Boot ──────────────────────────────────────────────────────────────────────

init();
