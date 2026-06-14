const SESSION_PREFIX = 'fdm_content_';

export async function fetchContent(file) {
  const key = SESSION_PREFIX + file;
  const cached = sessionStorage.getItem(key);
  if (cached) return JSON.parse(cached);

  const res = await fetch('/' + file);
  if (!res.ok) throw new Error('Impossible de charger ' + file);
  const data = await res.json();
  sessionStorage.setItem(key, JSON.stringify(data));
  return data;
}

export async function loadIndex() {
  const cached = sessionStorage.getItem('fdm_content_index');
  if (cached) return JSON.parse(cached);

  const res = await fetch('/content/index.json');
  if (!res.ok) throw new Error('Impossible de charger le catalogue');
  const data = await res.json();
  sessionStorage.setItem('fdm_content_index', JSON.stringify(data));
  return data;
}
