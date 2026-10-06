/* ─────────────────────────────────────────────────────────
   OZ Feed — feed.js
───────────────────────────────────────────────────────── */

const API   = window.location.hostname === 'localhost'
  ? '/api'
  : 'https://landing-ab4i.onrender.com/api';

const token = localStorage.getItem('token');

// Wake up Render on page load
fetch(`${API}/status`).catch(() => {});

// ── HTML escape helpers ───────────────────────────────
function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ── Auth / header init ────────────────────────────────
(function initHeader() {
  const name    = localStorage.getItem('userName') || 'Guest';
  const initial = name.trim()[0]?.toUpperCase() || '?';
  document.getElementById('btn-profile').textContent = initial;
  document.getElementById('dropdown-name').textContent = name;

  if (!token) {
    document.getElementById('btn-login').classList.remove('hidden');
  } else {
    document.getElementById('btn-login').classList.add('hidden');
  }
})();

function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('userName');
  window.location.href = '/Login/';
}

// ── Sidebar ───────────────────────────────────────────
const btnMenu        = document.getElementById('btn-menu');
const sidebar        = document.getElementById('sidebar');
const sidebarOverlay = document.getElementById('sidebar-overlay');

function openSidebar() {
  sidebar.classList.add('open');
  sidebarOverlay.classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeSidebar() {
  sidebar.classList.remove('open');
  sidebarOverlay.classList.remove('open');
  document.body.style.overflow = '';
}

btnMenu.addEventListener('click', () =>
  sidebar.classList.contains('open') ? closeSidebar() : openSidebar()
);
document.getElementById('sidebar-close').addEventListener('click', closeSidebar);
sidebarOverlay.addEventListener('click', closeSidebar);
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeSidebar(); });

// ── Profile dropdown ──────────────────────────────────
const btnProfile  = document.getElementById('btn-profile');
const profileDrop = document.getElementById('profile-dropdown');

btnProfile.addEventListener('click', e => {
  e.stopPropagation();
  profileDrop.classList.toggle('open');
});
document.addEventListener('click', () => profileDrop.classList.remove('open'));

// ── Search ─────────────────────────────────────────────
const searchInput  = document.getElementById('search-input');
const searchClear  = document.getElementById('search-clear');
const searchDrop   = document.getElementById('search-dropdown');
const filtersStrip = document.querySelector('.filters-strip');

let searchTimer = null;

searchInput.addEventListener('focus', () => {
  filtersStrip.classList.add('hidden-strip');
  if (searchInput.value.trim()) searchDrop.hidden = false;
});

searchInput.addEventListener('blur', () => {
  setTimeout(() => {
    searchDrop.hidden = true;
    if (!searchInput.value) filtersStrip.classList.remove('hidden-strip');
  }, 200);
});

searchInput.addEventListener('input', () => {
  const q = searchInput.value.trim();
  searchClear.classList.toggle('hidden', !q);
  clearTimeout(searchTimer);
  if (!q) { searchDrop.hidden = true; return; }
  searchTimer = setTimeout(() => fetchSearch(q), 350);
});

searchClear.addEventListener('click', () => {
  searchInput.value = '';
  searchClear.classList.add('hidden');
  searchDrop.hidden = true;
  searchInput.focus();
});

document.addEventListener('keydown', e => {
  if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
    e.preventDefault();
    searchInput.focus();
    searchInput.select();
  }
  if (e.key === 'Escape' && document.activeElement === searchInput) {
    searchInput.blur();
    searchInput.value = '';
    searchClear.classList.add('hidden');
    searchDrop.hidden = true;
  }
});

async function fetchSearch(q) {
  searchDrop.hidden = false;
  searchDrop.innerHTML = '<div class="drop-loading">Searching…</div>';
  try {
    const res   = await fetch(`${API}/search?q=${encodeURIComponent(q)}`);
    const books = await res.json();
    renderDropdown(books);
  } catch {
    searchDrop.innerHTML = '<div class="drop-empty">Search unavailable.</div>';
  }
}

function renderDropdown(books) {
  if (!books.length) {
    searchDrop.innerHTML = '<div class="drop-empty">No results found.</div>';
    return;
  }

  searchDrop.innerHTML = books.map((b, i) => `
    <div class="drop-item" data-index="${i}">
      ${b.cover
        ? `<img class="drop-cover" src="${esc(b.cover)}" alt="" loading="lazy">`
        : '<div class="drop-cover"></div>'}
      <div class="drop-info">
        <span class="drop-title">${esc(b.title)}</span>
        <span class="drop-meta">${esc(b.author)}${b.year ? ' · ' + b.year : ''}</span>
      </div>
      <button class="drop-add" aria-label="Add to shelf">
        <svg viewBox="0 0 20 20" fill="none"><path d="M5 3h10a1 1 0 011 1v13l-6-3-6 3V4a1 1 0 011-1z" stroke="currentColor" stroke-width="1.6"/></svg>
      </button>
    </div>
  `).join('');

  searchDrop.querySelectorAll('.drop-add').forEach((btn, i) => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      if (!token) { window.location.href = '/Login/'; return; }

      // Optimistic UI — update button instantly
      btn.disabled = true;
      btn.innerHTML = '<svg viewBox="0 0 20 20" fill="currentColor"><path d="M5 3h10a1 1 0 011 1v13l-6-3-6 3V4a1 1 0 011-1z"/></svg>';
      btn.classList.add('drop-add--saved');

      // Add card to feed instantly
      const grid  = document.getElementById('feed-masonry');
      const empty = document.getElementById('empty-state');
      const tmp   = document.createElement('div');
      tmp.innerHTML = cardHTML(books[i]);
      const newCard = tmp.firstElementChild;
      grid.prepend(newCard);
      initCard(newCard);
      empty.classList.add('hidden');

      addToShelf(books[i]); // fire and forget
    });
  });
}

// ── Shelf API ─────────────────────────────────────────
async function addToShelf(book) {
  await fetch(`${API}/shelf`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body:    JSON.stringify(book),
  });
}

async function removeFromShelf(olId) {
  await fetch(`${API}/shelf?id=${encodeURIComponent(olId)}`, {
    method:  'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
}

// ── Feed ──────────────────────────────────────────────
const PALETTES = [
  ['#c9a055','#8c5c22','#3a200a'],
  ['#0f2d52','#091d38','#040d1a'],
  ['#b85c38','#7c3a1e','#361508'],
  ['#065f46','#03402e','#011d14'],
  ['#5e6e50','#3d4d34','#1a2213'],
  ['#1d4ed8','#1239a8','#081460'],
  ['#c47c18','#8c520a','#3d2004'],
  ['#2a2828','#1a1818','#080606'],
];

function pickPalette(id) {
  let h = 0;
  for (const c of String(id)) h = (h * 31 + c.charCodeAt(0)) | 0;
  return PALETTES[Math.abs(h) % PALETTES.length];
}

function cardHTML(book) {
  const [ca, cb, cc] = pickPalette(book.id);
  const title  = esc(book.title);
  const author = esc(book.author);
  const year   = book.year || '';

  return `
    <article class="book-card type-cover"
      data-id="${esc(book.id)}"
      data-title="${title}"
      data-author="${author}"
      style="--ca:${ca};--cb:${cb};--cc:${cc}">
      <div class="card-inner">
        <div class="card-front">
          <div class="book-cover">
            ${book.cover
              ? `<img class="cover-img" src="${esc(book.cover)}" alt="${title}" loading="lazy">`
              : `<div class="cover-bg"></div>
                 <div class="cover-content">
                   <p class="cover-author">${author}</p>
                   <h2 class="cover-title">${title}</h2>
                   ${year ? `<p class="cover-year">${year}</p>` : ''}
                 </div>`}
          </div>
        </div>
        <div class="card-back">
          <div class="back-body">
            <h3 class="back-title">${title}</h3>
            <p class="back-author">${author}${year ? ' · ' + year : ''}</p>
          </div>
          <button class="save-btn saved" aria-label="Remove from shelf">
            <svg viewBox="0 0 20 20" fill="currentColor"><path d="M5 3h10a1 1 0 011 1v13l-6-3-6 3V4a1 1 0 011-1z"/></svg>
          </button>
        </div>
      </div>
    </article>
  `;
}

function initCard(card) {
  card.addEventListener('click', e => {
    if (e.target.closest('.save-btn')) return;
    card.classList.toggle('revealed');
  });

  card.addEventListener('mousemove', e => {
    const r = card.getBoundingClientRect();
    card.style.setProperty('--mx', ((e.clientX - r.left) / r.width  * 100) + '%');
    card.style.setProperty('--my', ((e.clientY - r.top)  / r.height * 100) + '%');
  });

  const btn = card.querySelector('.save-btn');
  if (btn) {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      card.style.transition = 'opacity 0.3s';
      card.style.opacity    = '0';
      removeFromShelf(card.dataset.id); // fire and forget
      setTimeout(() => {
        card.remove();
        if (!document.querySelector('.book-card'))
          document.getElementById('empty-state').classList.remove('hidden');
      }, 300);
    });
  }
}

async function loadFeed() {
  const grid  = document.getElementById('feed-masonry');
  const empty = document.getElementById('empty-state');

  if (!token) {
    grid.innerHTML = '';
    empty.querySelector('p').textContent = 'Sign in to build your shelf.';
    empty.classList.remove('hidden');
    return;
  }

  try {
    const res   = await fetch(`${API}/feed`, { headers: { Authorization: `Bearer ${token}` } });
    const books = await res.json();

    if (!books.length) {
      grid.innerHTML = '';
      empty.querySelector('p').textContent = 'Your shelf is empty — search for a book to add one.';
      empty.classList.remove('hidden');
      return;
    }

    empty.classList.add('hidden');
    grid.innerHTML = books.map(cardHTML).join('');
    grid.querySelectorAll('.book-card').forEach(initCard);
  } catch {
    // silent fail, keep current state
  }
}

// ── Add to shelf modal ────────────────────────────────
const btnAdd       = document.getElementById('btn-add');
const modalOverlay = document.getElementById('modal-overlay');
const modalClose   = document.getElementById('modal-close');

btnAdd.addEventListener('click', () => modalOverlay.classList.remove('hidden'));
modalClose.addEventListener('click', () => modalOverlay.classList.add('hidden'));
modalOverlay.addEventListener('click', e => {
  if (e.target === modalOverlay) modalOverlay.classList.add('hidden');
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') modalOverlay.classList.add('hidden');
});

// ── Boot ──────────────────────────────────────────────
loadFeed();
