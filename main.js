/* ─────────────────────────────────────────
   OZ Library — main.js
───────────────────────────────────────── */

// ── Auth guard ────────────────────────────
(function checkAuth() {
  const token = localStorage.getItem('token');
  if (!token) {
    window.location.href = '/Login/';
    return;
  }
  const name = localStorage.getItem('userName');
  const el   = document.getElementById('nav-username');
  if (el && name) el.textContent = name;
})();

function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('userName');
  window.location.href = '/Login/';
}

// ── Droplet renderer ──────────────────────
function paintDroplets(canvas) {
  const W = canvas.offsetWidth;
  const H = canvas.offsetHeight;
  if (!W || !H) return;

  const dpr = window.devicePixelRatio || 1;
  canvas.width  = W * dpr;
  canvas.height = H * dpr;

  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);

  const count = Math.floor((W * H) / 100);

  for (let i = 0; i < count; i++) {
    const x  = Math.random() * W;
    const y  = Math.random() * H;
    const r  = Math.random() * 5 + 1.5;
    const ry = r * (0.8 + Math.random() * 0.45);

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate((Math.random() - 0.5) * 0.8);

    // drop body — radial gradient for a lens-like look
    const g = ctx.createRadialGradient(-r * 0.3, -ry * 0.35, 0.3, 0, 0, Math.max(r, ry));
    g.addColorStop(0,    'rgba(255,252,248, 0.92)');
    g.addColorStop(0.30, 'rgba(230,224,214, 0.50)');
    g.addColorStop(0.70, 'rgba(175,168,158, 0.14)');
    g.addColorStop(1,    'rgba(120,115,108, 0.03)');
    ctx.beginPath();
    ctx.ellipse(0, 0, r, ry, 0, 0, Math.PI * 2);
    ctx.fillStyle = g;
    ctx.fill();

    // specular highlight
    ctx.beginPath();
    ctx.ellipse(-r * 0.3, -ry * 0.33, r * 0.22, ry * 0.17, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.97)';
    ctx.fill();

    // bottom shadow rim
    ctx.beginPath();
    ctx.ellipse(r * 0.1, ry * 0.42, r * 0.28, ry * 0.14, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(80,72,62, 0.18)';
    ctx.fill();

    ctx.restore();
  }
}

window.addEventListener('load', () => {
  document.querySelectorAll('.droplet-canvas').forEach(paintDroplets);
});


// ── Search toggle ─────────────────────────
let searchOpen = false;

function toggleSearch() {
  searchOpen = !searchOpen;

  const filters    = document.getElementById('filters');
  const searchBar  = document.getElementById('search-bar');
  const iconSearch = document.getElementById('icon-search');
  const iconClose  = document.getElementById('icon-close');
  const input      = document.getElementById('search-input');

  if (searchOpen) {
    filters.classList.add('hidden');
    searchBar.classList.remove('hidden');
    searchBar.classList.add('flex');
    iconSearch.classList.add('hidden');
    iconClose.classList.remove('hidden');
    input.focus();
  } else {
    filters.classList.remove('hidden');
    searchBar.classList.add('hidden');
    searchBar.classList.remove('flex');
    iconSearch.classList.remove('hidden');
    iconClose.classList.add('hidden');
    input.value = '';
    applyFilters();
  }
}


// ── Filter & search ───────────────────────
let activeGenre = 'all';

function applyFilters() {
  const query   = (document.getElementById('search-input').value || '').toLowerCase().trim();
  const cards   = document.querySelectorAll('.book-card');
  const empty   = document.getElementById('empty-state');
  let   visible = 0;

  cards.forEach(card => {
    const genreMatch  = activeGenre === 'all' || card.dataset.genre === activeGenre;
    const title       = card.querySelector('.book-title')?.textContent.toLowerCase()  ?? '';
    const author      = card.querySelector('.book-author')?.textContent.toLowerCase() ?? '';
    const searchMatch = !query || title.includes(query) || author.includes(query);
    const show        = genreMatch && searchMatch;

    card.style.display = show ? '' : 'none';
    if (show) visible++;
  });

  empty.classList.toggle('hidden', visible > 0);
}

function filterBooks(genre) {
  activeGenre = genre;

  document.querySelectorAll('.filter-btn').forEach(btn => {
    const active  = btn.dataset.filter === genre;
    btn.className = active
      ? 'filter-btn shrink-0 px-3.5 py-1 rounded-full text-xs font-medium bg-ink text-cream-50 transition-all duration-200'
      : 'filter-btn shrink-0 px-3.5 py-1 rounded-full text-xs font-medium text-ink-mid hover:bg-cream-200 transition-all duration-200';
  });

  applyFilters();
}
