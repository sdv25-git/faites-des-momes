# CLAUDE.md — Faites des mômes × HuggingFace PWA

## Contexte du projet

Application web progressive (PWA) hébergée sur HuggingFace Spaces (SDK static),
répliquant la Direction Artistique exacte de https://faitesdesmomes.org et
construisant l'infrastructure de consultation de contenu parental (newsletters +
cartes WhatsApp) pour les enfants de 0 à 5 ans.

Éditeur : Fondation AlphaOmega.
Stack : HTML/CSS/JS vanilla. Zéro framework. Zéro dépendance npm.
Cible mobile-first. Offline-capable via service worker.

---

## Stack & contraintes techniques

- **Langage** : HTML5 sémantique + CSS custom properties + JS ES2020 (modules natifs)
- **Dépendances** : aucune. Pas de React, Vue, Tailwind, Bootstrap.
- **Fonts** : Google Fonts chargées via `<link rel="preconnect">` uniquement.
  - Display / headings : **Playfair Display** (italic pour les mots en emphase)
  - Body : **Inter** (weights 400, 500, 600)
- **Images** : SVG inline pour le logo et les icônes UI. Photos en `<img>` avec
  `loading="lazy"` et `decoding="async"`. Toujours fournir `alt`.
- **Icônes** : SVG inline dans le HTML, pas de font-icon.
- **HuggingFace SDK** : `static`. Pas de build step. `index.html` à la racine.
- **PWA** : `manifest.json` + `sw.js` à la racine. HTTPS fourni par HF.

---

## Structure de fichiers

```
/
├── README.md              ← frontmatter YAML HuggingFace Space
├── index.html             ← landing page (page d'inscription)
├── app.html               ← shell de l'app (post-inscription, consultation contenu)
├── manifest.json          ← PWA manifest
├── sw.js                  ← service worker
├── assets/
│   ├── css/
│   │   ├── tokens.css     ← variables CSS (couleurs, typographie, spacing)
│   │   ├── base.css       ← reset + éléments de base
│   │   ├── components.css ← boutons, cards, modal, ticker, badge
│   │   └── app.css        ← layout spécifique à app.html
│   ├── js/
│   │   ├── main.js        ← landing : modal inscription, ticker
│   │   ├── app.js         ← app : navigation, filtres, lecture contenu
│   │   ├── content.js     ← gestionnaire de contenu (chargement, cache local)
│   │   └── sw-register.js ← enregistrement du service worker
│   ├── icons/
│   │   ├── icon-72.png
│   │   ├── icon-96.png
│   │   ├── icon-128.png
│   │   ├── icon-144.png
│   │   ├── icon-152.png
│   │   ├── icon-192.png
│   │   ├── icon-384.png
│   │   └── icon-512.png
│   ├── logo.svg           ← logo Faites des mômes vectoriel
│   └── og-image.jpg       ← Open Graph (1200×630)
└── content/
    ├── index.json         ← catalogue de tous les contenus publiés
    └── 2025/
        └── 01/
            ├── newsletter.json
            ├── whatsapp-1.json
            ├── whatsapp-2.json
            └── whatsapp-3.json
```

---

## README.md (HuggingFace frontmatter)

```yaml
---
title: Faites des mômes
emoji: 👶
colorFrom: orange
colorTo: yellow
sdk: static
pinned: false
license: other
---
```

---

## Design System — DA exacte de faitesdesmomes.org

### Tokens CSS (`assets/css/tokens.css`)

```css
:root {
  /* Couleurs */
  --color-bg:          #FFF8F2;   /* fond crème chaud — fond général */
  --color-bg-section:  #FFFFFF;   /* sections alternées */
  --color-accent:      #F97316;   /* orange principal — CTAs, highlights */
  --color-accent-dark: #EA6C0B;   /* orange hover */
  --color-text:        #1A1A1A;   /* corps de texte */
  --color-text-light:  #6B6B6B;   /* sous-titres, méta */
  --color-border:      #E8DDD4;   /* séparateurs */
  --color-whatsapp:    #25D366;   /* badge WhatsApp */
  --color-overlay:     rgba(26,26,26,0.55); /* fond modal */

  /* Typographie */
  --font-display: 'Playfair Display', Georgia, serif;
  --font-body:    'Inter', system-ui, sans-serif;

  --size-xs:   0.75rem;   /*  12px */
  --size-sm:   0.875rem;  /*  14px */
  --size-base: 1rem;      /*  16px */
  --size-md:   1.125rem;  /*  18px */
  --size-lg:   1.375rem;  /*  22px */
  --size-xl:   1.75rem;   /*  28px */
  --size-2xl:  2.25rem;   /*  36px */
  --size-3xl:  3rem;      /*  48px */
  --size-4xl:  3.75rem;   /*  60px */
  --size-5xl:  4.5rem;    /*  72px */

  /* Spacing */
  --space-1:  0.25rem;
  --space-2:  0.5rem;
  --space-3:  0.75rem;
  --space-4:  1rem;
  --space-6:  1.5rem;
  --space-8:  2rem;
  --space-12: 3rem;
  --space-16: 4rem;
  --space-24: 6rem;
  --space-32: 8rem;

  /* Radius */
  --radius-sm:   4px;
  --radius-md:   8px;
  --radius-lg:   16px;
  --radius-full: 999px;

  /* Shadows */
  --shadow-card: 0 2px 12px rgba(0,0,0,0.06);
  --shadow-modal: 0 8px 40px rgba(0,0,0,0.18);

  /* Transitions */
  --transition-fast: 150ms ease;
  --transition-base: 250ms ease;
}
```

### Typographie — règles exactes

Les headings (`h1` à `h3`) utilisent `font-family: var(--font-display)`.
Les mots mis en emphase dans les headings sont dans `<em>` avec `font-style: italic`
et `color: var(--color-accent)`. Exemple :

```html
<h2>15 ans d'engagement, <em>une conviction.</em></h2>
```

Appliquer `line-height: 1.1` sur `h1`, `1.2` sur `h2`, `1.3` sur `h3`.
`letter-spacing: -0.02em` sur tous les headings display.

Le corps de texte utilise `font-family: var(--font-body)`, `line-height: 1.65`,
`font-size: var(--size-md)` sur desktop, `var(--size-base)` sur mobile.

### Composants — inventaire complet

#### Bouton primaire `.btn-primary`
```css
.btn-primary {
  display: inline-flex;
  align-items: center;
  padding: var(--space-4) var(--space-8);
  background: var(--color-text);
  color: #FFFFFF;
  font-family: var(--font-body);
  font-size: var(--size-base);
  font-weight: 600;
  border-radius: var(--radius-full);
  border: none;
  cursor: pointer;
  transition: background var(--transition-fast),
              transform var(--transition-fast);
}
.btn-primary:hover {
  background: var(--color-accent);
  transform: translateY(-1px);
}
```

#### Badge de canal `.badge`
```css
.badge {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-1) var(--space-3);
  font-size: var(--size-xs);
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  border-radius: var(--radius-full);
  border: 1.5px solid currentColor;
}
.badge--email     { color: var(--color-text); }
.badge--whatsapp  { color: var(--color-whatsapp); }
```

#### Ticker horizontal `.ticker`
Le ticker est une bande qui scrolle horizontalement en boucle :
"Faites.Des.Mômes." répété. Utiliser CSS `animation: ticker-scroll linear infinite`.
```html
<div class="ticker" aria-hidden="true">
  <div class="ticker__track">
    <span>Faites.Des.Mômes.</span>
    <!-- répéter 8× pour couvrir tout écran large -->
  </div>
</div>
```
```css
@keyframes ticker-scroll {
  from { transform: translateX(0); }
  to   { transform: translateX(-50%); }
}
.ticker { overflow: hidden; background: var(--color-accent); color: #FFF; }
.ticker__track {
  display: flex;
  gap: var(--space-8);
  white-space: nowrap;
  animation: ticker-scroll 18s linear infinite;
  font-family: var(--font-display);
  font-style: italic;
  font-size: var(--size-lg);
  padding: var(--space-3) 0;
}
```

#### Carte contenu `.content-card`
Utilisée pour newsletter et messages WhatsApp dans `app.html` :
```html
<article class="content-card content-card--newsletter">
  <div class="content-card__meta">
    <span class="badge badge--email">Newsletter</span>
    <time>Janvier 2025</time>
  </div>
  <h3>Interagir avec les autres avant 5 ans</h3>
  <p>Résumé court du contenu...</p>
  <button class="btn-read">Lire · 10 min</button>
</article>
```

#### Carte WhatsApp `.whatsapp-card`
```html
<article class="whatsapp-card">
  <div class="whatsapp-card__bubble">
    <p class="whatsapp-card__question">Mon enfant ne veut pas partager : je fais quoi ?</p>
    <p class="whatsapp-card__body">La vraie réponse, en 90 secondes.</p>
    <span class="whatsapp-card__read-time">90s</span>
  </div>
</article>
```
Reproduire l'esthétique bulle WhatsApp : fond `#DCF8C6`, radius `var(--radius-lg)`,
coin bas-gauche carré, padding `var(--space-4) var(--space-6)`.

#### Section numérotée `.step`
```html
<div class="step">
  <span class="step__number">01</span>
  <h3 class="step__title">Comprendre</h3>
  <p class="step__body">...</p>
</div>
```
`step__number` : font-size `var(--size-4xl)`, color `var(--color-border)`,
font-family display, font-weight 700. Effet décoratif, pas sémantique.

#### Modal d'inscription (4 étapes) `.modal`
- Overlay plein écran : `position: fixed`, `inset: 0`, fond `var(--color-overlay)`
- Panneau centré : max-width `480px`, background blanc, radius `var(--radius-lg)`,
  shadow `var(--shadow-modal)`, padding `var(--space-8)`
- Indicateur de progression : 4 tirets en haut, le tiret actif en `var(--color-accent)`
- Étapes :
  1. Prénom + situation (parent / grand-parent / futur parent / autre)
  2. Âge(s) de l'enfant (cases à cocher : 0-1, 1-2, 2-3, 3-4, 4-5 ans)
  3. Adresse email
  4. Numéro WhatsApp (format international, optionnel)
- Bouton "Suivant" → `btn-primary`. Bouton "Retour" → lien texte.
- Fermeture : croix en haut à droite + clic sur l'overlay.

### Layout — sections de la landing `index.html`

Ordre exact des sections :

```
1. <nav>          — logo gauche + bouton "Je m'inscris" droite
2. <section#hero> — h1 géant, sous-titre, double CTA, 2 photos
3. <div.ticker>   — bande orangée animée
4. <section#why>  — "15 ans d'engagement, une conviction." + photo
5. <section#format> — "1 + 3 = Faites des mômes." avec compteur visuel
6. <section#example> — mois-exemple avec timeline newsletter + 3 cartes WA
7. <section#ages> — "0 - 5 ans." avec grille de 5 domaines
8. <section#commitment> — 3 verbes numérotés (01 Comprendre 02 Repérer 03 Agir)
9. <section#cta-final> — "Pas de spam. Juste du soutien."
10. <section#instagram> — lien Instagram
11. <footer>      — liens légaux + copyright
```

La section hero (`#hero`) :
- `h1` en Playfair Display, `font-size` fluid entre `var(--size-3xl)` et `var(--size-5xl)`
- Mot "mômes" en `<em>` italic orange
- Layout desktop : texte à gauche (55%), photo-stack à droite (45%)
- Photo-stack : 2 images superposées avec décalage vertical léger, border-radius `var(--radius-lg)`

---

## Architecture de contenu (consultation future)

### Format JSON des contenus

**`content/index.json`** — catalogue maître :
```json
{
  "version": 1,
  "last_updated": "2025-01-01",
  "items": [
    {
      "id": "2025-01-newsletter",
      "type": "newsletter",
      "month": "2025-01",
      "theme": "interactions-sociales",
      "age_range": ["0-5"],
      "title": "Interagir avec les autres avant 5 ans",
      "summary": "Résumé court (140 caractères max)",
      "read_time_seconds": 600,
      "published_at": "2025-01-01",
      "file": "content/2025/01/newsletter.json"
    },
    {
      "id": "2025-01-wa-1",
      "type": "whatsapp",
      "month": "2025-01",
      "theme": "interactions-sociales",
      "age_range": ["2-5"],
      "title": "Mon enfant ne veut pas partager : je fais quoi ?",
      "summary": "La vraie réponse, en 90 secondes.",
      "read_time_seconds": 90,
      "published_at": "2025-01-06",
      "file": "content/2025/01/whatsapp-1.json"
    }
  ]
}
```

**`content/2025/01/newsletter.json`** — contenu complet :
```json
{
  "id": "2025-01-newsletter",
  "type": "newsletter",
  "title": "Interagir avec les autres avant 5 ans",
  "theme": "interactions-sociales",
  "age_range": ["0-5"],
  "published_at": "2025-01-01",
  "read_time_seconds": 600,
  "sections": [
    {
      "type": "intro",
      "body": "Texte d'introduction..."
    },
    {
      "type": "insight",
      "label": "Ce que dit la recherche",
      "body": "..."
    },
    {
      "type": "tip",
      "label": "À tester ce week-end",
      "items": ["Conseil 1", "Conseil 2", "Conseil 3"]
    },
    {
      "type": "resource",
      "label": "Pour aller plus loin",
      "links": [
        { "title": "Titre de la ressource", "url": "https://..." }
      ]
    }
  ]
}
```

**`content/2025/01/whatsapp-1.json`** :
```json
{
  "id": "2025-01-wa-1",
  "type": "whatsapp",
  "title": "Mon enfant ne veut pas partager : je fais quoi ?",
  "theme": "interactions-sociales",
  "age_range": ["2-5"],
  "published_at": "2025-01-06",
  "read_time_seconds": 90,
  "body": "Texte court, ton WhatsApp, 90 secondes de lecture.",
  "key_takeaway": "La phrase à retenir.",
  "action": "Ce que vous pouvez faire aujourd'hui."
}
```

### Taxonomie des thèmes
```
interactions-sociales
langage-communication
cognition-apprentissage
confiance-en-soi
curiosite-naturelle
emotions-regulation
motricite-corps
sommeil-routine
alimentation
sante-bien-etre
```

### Taxonomie des tranches d'âge
```
0-1   (bébé, 0-12 mois)
1-2   (tout-petit, 12-24 mois)
2-3   (éveil, 24-36 mois)
3-4   (langage, 36-48 mois)
4-5   (avant école, 48-60 mois)
```

---

## `app.html` — Shell de consultation de contenu

Structure de la vue parent (post-inscription) :

```
┌─────────────────────────────────────────┐
│ <header>  logo + nav icons (home/filtre)│
├─────────────────────────────────────────┤
│ <div.filter-bar>                        │
│   Filtres type : Tous | Newsletter | WA │
│   Filtres thème : scrollable horizontal │
│   Filtres âge  : 0-1 | 1-2 | ... | 4-5 │
├─────────────────────────────────────────┤
│ <main.content-feed>                     │
│   content-card (newsletter)             │
│   whatsapp-card × 3                     │
│   content-card (newsletter)             │
│   whatsapp-card × 3                     │
│   ...                                   │
├─────────────────────────────────────────┤
│ <nav.bottom-nav>  (mobile)              │
│   Accueil | Bibliothèque | Profil       │
└─────────────────────────────────────────┘
```

**`assets/js/app.js`** doit implémenter :
1. `loadContentIndex()` — fetch `content/index.json`, mise en cache `sessionStorage`
2. `renderFeed(filters)` — filtre les items et injecte dans `.content-feed`
3. `openArticle(id)` — fetch le JSON de l'article, rendu inline (pas de navigation)
4. `applyFilter(type, value)` — gestion des filtres actifs (multi-sélection possible)
5. `saveReadingProgress(id)` — localStorage : `fdm_read_${id}` = timestamp
6. `getReadItems()` — retourne la liste des IDs lus pour l'indicateur visuel

La vue article s'ouvre en **overlay full-screen** (pas de nouvelle page) pour
préserver l'état des filtres. Bouton "Fermer" en haut à gauche.

---

## `manifest.json`

```json
{
  "name": "Faites des mômes",
  "short_name": "FdM",
  "description": "Repères pratiques pour accompagner votre enfant de 0 à 5 ans.",
  "start_url": "/app.html",
  "scope": "/",
  "display": "standalone",
  "orientation": "portrait-primary",
  "background_color": "#FFF8F2",
  "theme_color": "#F97316",
  "lang": "fr",
  "dir": "ltr",
  "categories": ["education", "parenting"],
  "icons": [
    { "src": "assets/icons/icon-72.png",  "sizes": "72x72",   "type": "image/png" },
    { "src": "assets/icons/icon-96.png",  "sizes": "96x96",   "type": "image/png" },
    { "src": "assets/icons/icon-128.png", "sizes": "128x128", "type": "image/png" },
    { "src": "assets/icons/icon-144.png", "sizes": "144x144", "type": "image/png" },
    { "src": "assets/icons/icon-152.png", "sizes": "152x152", "type": "image/png" },
    { "src": "assets/icons/icon-192.png", "sizes": "192x192", "type": "image/png", "purpose": "any maskable" },
    { "src": "assets/icons/icon-384.png", "sizes": "384x384", "type": "image/png" },
    { "src": "assets/icons/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any maskable" }
  ],
  "shortcuts": [
    {
      "name": "Dernière newsletter",
      "short_name": "Newsletter",
      "url": "/app.html?filter=newsletter",
      "icons": [{ "src": "assets/icons/icon-96.png", "sizes": "96x96" }]
    },
    {
      "name": "Messages WhatsApp",
      "short_name": "WhatsApp",
      "url": "/app.html?filter=whatsapp",
      "icons": [{ "src": "assets/icons/icon-96.png", "sizes": "96x96" }]
    }
  ]
}
```

---

## `sw.js` — Service Worker

Stratégie : **Cache First** pour assets statiques, **Network First** pour `content/`.

```javascript
const CACHE_STATIC = 'fdm-static-v1';
const CACHE_CONTENT = 'fdm-content-v1';

const PRECACHE = [
  '/',
  '/index.html',
  '/app.html',
  '/manifest.json',
  '/assets/css/tokens.css',
  '/assets/css/base.css',
  '/assets/css/components.css',
  '/assets/css/app.css',
  '/assets/js/main.js',
  '/assets/js/app.js',
  '/assets/js/content.js',
  '/assets/logo.svg',
  '/assets/icons/icon-192.png',
  '/assets/icons/icon-512.png',
  '/content/index.json'
];

// Install : précache des assets statiques
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_STATIC)
      .then(cache => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  );
});

// Activate : nettoyage des anciens caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(k => k !== CACHE_STATIC && k !== CACHE_CONTENT)
          .map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// Fetch : Cache First pour static, Network First pour content/
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  if (url.pathname.startsWith('/content/')) {
    // Network First pour le contenu (fresh > offline)
    event.respondWith(
      fetch(event.request)
        .then(response => {
          const clone = response.clone();
          caches.open(CACHE_CONTENT).then(cache => cache.put(event.request, clone));
          return response;
        })
        .catch(() => caches.match(event.request))
    );
  } else {
    // Cache First pour les assets statiques
    event.respondWith(
      caches.match(event.request)
        .then(cached => cached || fetch(event.request))
    );
  }
});
```

---

## `assets/js/sw-register.js`

```javascript
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js', { scope: '/' })
      .then(reg => {
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // Nouvelle version disponible — afficher un bandeau de mise à jour
              document.dispatchEvent(new CustomEvent('sw:update-available'));
            }
          });
        });
      })
      .catch(err => console.warn('SW registration failed:', err));
  });
}
```

---

## `<head>` — balises obligatoires (toutes les pages)

```html
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="theme-color" content="#F97316">
<meta name="description" content="Newsletter parentalité pour les 0-5 ans. Par la Fondation AlphaOmega.">

<!-- PWA -->
<link rel="manifest" href="/manifest.json">
<link rel="apple-touch-icon" href="/assets/icons/icon-152.png">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
<meta name="apple-mobile-web-app-title" content="Faites des mômes">

<!-- Open Graph -->
<meta property="og:title" content="Faites des mômes">
<meta property="og:description" content="1 email + 3 WhatsApp par mois. 100% gratuit.">
<meta property="og:image" content="/assets/og-image.jpg">
<meta property="og:type" content="website">
<meta name="twitter:card" content="summary_large_image">

<!-- Fonts -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;1,700&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">

<!-- CSS -->
<link rel="stylesheet" href="/assets/css/tokens.css">
<link rel="stylesheet" href="/assets/css/base.css">
<link rel="stylesheet" href="/assets/css/components.css">
```

---

## Accessibilité — règles minimales non négociables

- Tous les `<img>` ont un `alt` (vide `alt=""` si décoratif).
- Focus visible sur tous les éléments interactifs : `outline: 2px solid var(--color-accent)`.
- Modal : focus trap actif, `aria-modal="true"`, `role="dialog"`, fermeture via `Escape`.
- Ticker : `aria-hidden="true"` (contenu décoratif).
- Bottom nav mobile : `aria-label` sur `<nav>`, `aria-current="page"` sur l'item actif.
- `prefers-reduced-motion` : stopper toutes les animations CSS si actif.

```css
@media (prefers-reduced-motion: reduce) {
  * { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
}
```

---

## Responsive — breakpoints

```css
/* Mobile first */
/* base : 0–599px (smartphone portrait) */
@media (min-width: 600px)  { /* tablette portrait */ }
@media (min-width: 900px)  { /* tablette paysage / petit desktop */ }
@media (min-width: 1200px) { /* desktop standard */ }
@media (min-width: 1600px) { /* grand écran */ }
```

Le site original est **fortement mobile-first**. Sur mobile :
- `h1` : `clamp(2.25rem, 8vw, 4.5rem)`
- Sections en colonne unique, pleine largeur
- Photos pleine largeur (pas de float)
- Ticker toujours actif (même vitesse)
- Bottom nav fixe en bas sur `app.html` (hauteur `64px`, `safe-area-inset-bottom`)

---

## Déploiement HuggingFace

```bash
# Cloner le Space (créé manuellement sur huggingface.co/new-space)
git clone https://huggingface.co/spaces/VOTRE_USERNAME/faites-des-momes
cd faites-des-momes

# ... développement local ...

# Push
git add .
git commit -m "feat: description"
git push

# URL finale
# https://VOTRE_USERNAME-faites-des-momes.hf.space
```

**IMPORTANT** : `sw.js` doit être à la **racine** du repo (pas dans un sous-dossier)
pour que son scope soit `/` et qu'il contrôle toutes les pages.

Test post-déploiement :
1. Chrome DevTools → Application → Manifest : vérifier que tout charge sans erreur
2. Chrome DevTools → Application → Service Workers : vérifier status "activated and is running"
3. Lighthouse → Progressive Web App : viser score ≥ 90
4. Tester "Ajouter à l'écran d'accueil" sur Android Chrome

---

## Ordre de build recommandé

```
1. README.md                        → frontmatter HF
2. assets/css/tokens.css            → variables (source de vérité DA)
3. assets/css/base.css              → reset + typographie globale
4. assets/css/components.css        → tous les composants
5. index.html                       → landing complète avec DA exacte
6. assets/js/main.js                → ticker + modal inscription
7. manifest.json                    → PWA manifest complet
8. assets/icons/                    → générer les PNGs (Python + Pillow)
9. sw.js                            → service worker
10. assets/js/sw-register.js        → registration
11. content/index.json              → catalogue de contenu (données de test)
12. content/2025/01/newsletter.json → premier contenu de test
13. content/2025/01/whatsapp-*.json → 3 cartes WhatsApp de test
14. app.html                        → shell de consultation
15. assets/css/app.css              → styles spécifiques app
16. assets/js/app.js                → logique de l'app
17. assets/js/content.js            → gestionnaire de contenu
```

---

## Données de test

Quand des contenus réels ne sont pas disponibles, peupler avec des données
réalistes (pas "Lorem ipsum") couvrant au moins 3 mois × 4 contenus = 12 items,
répartis sur au moins 4 thèmes et 3 tranches d'âge différentes.

Les titres des WhatsApp doivent toujours être une **question** (format exact du
site original) : "Mon enfant ne veut pas partager : je fais quoi ?"

---

## Ce qu'il ne faut PAS faire

- Pas de `document.write()`.
- Pas de `innerHTML` avec du contenu non sanitisé (utiliser `textContent` ou
  `insertAdjacentHTML` avec données JSON propres).
- Pas d'import de CDN extérieurs sauf Google Fonts (déjà préconnecté).
- Pas de `alert()`, `confirm()`, `prompt()`.
- Pas de navigation `window.location.href =` pour ouvrir les articles
  (tout se passe en overlay).
- Ne pas mettre `sw.js` dans un sous-dossier.
- Ne pas omettre `lang="fr"` sur `<html>`.
- Ne pas hardcoder des couleurs hors de `tokens.css`.
