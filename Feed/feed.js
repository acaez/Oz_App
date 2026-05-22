/* ─────────────────────────────────────────────────────────
   OZ Feed — feed.js
───────────────────────────────────────────────────────── */

// ── Auth (mock — reconnect to backend later) ──────────
const MOCK_USER = { name: 'August' };

(function init() {
  const name = localStorage.getItem('userName') || MOCK_USER.name;

  const initial = name.trim()[0]?.toUpperCase() || '?';
  document.getElementById('btn-profile').textContent = initial;
  document.getElementById('dropdown-name').textContent = name;
  document.getElementById('btn-login').classList.add('hidden');
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

btnMenu.addEventListener('click', () => {
  sidebar.classList.contains('open') ? closeSidebar() : openSidebar();
});

document.getElementById('sidebar-close').addEventListener('click', closeSidebar);

sidebarOverlay.addEventListener('click', closeSidebar);

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeSidebar();
});

// ── Profile dropdown ──────────────────────────────────
const btnProfile  = document.getElementById('btn-profile');
const profileDrop = document.getElementById('profile-dropdown');

btnProfile.addEventListener('click', e => {
  e.stopPropagation();
  profileDrop.classList.toggle('open');
});

document.addEventListener('click', () => {
  profileDrop.classList.remove('open');
});

// ── Search ─────────────────────────────────────────────
const searchInput = document.getElementById('search-input');
const searchClear = document.getElementById('search-clear');

const filtersStrip = document.querySelector('.filters-strip');

searchInput.addEventListener('focus', () => {
  filtersStrip.classList.add('hidden-strip');
});
searchInput.addEventListener('blur', () => {
  if (!searchInput.value) filtersStrip.classList.remove('hidden-strip');
});

searchInput.addEventListener('input', () => {
  const hasValue = searchInput.value.length > 0;
  searchClear.classList.toggle('hidden', !hasValue);
  applyFilters();
});

searchClear.addEventListener('click', () => {
  searchInput.value = '';
  searchClear.classList.add('hidden');
  searchInput.focus();
  applyFilters();
});

// Keyboard: Cmd/Ctrl+K focuses search
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
    applyFilters();
  }
});

// ── Filters ───────────────────────────────────────────
let activeGenre = 'all';

document.querySelectorAll('.filter-pill').forEach(btn => {
  btn.addEventListener('click', () => {
    activeGenre = btn.dataset.genre;
    document.querySelectorAll('.filter-pill').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    applyFilters();
  });
});

function applyFilters() {
  const q     = searchInput.value.toLowerCase().trim();
  const cards = document.querySelectorAll('.book-card');
  let visible = 0;

  cards.forEach(card => {
    const genre  = card.dataset.genre  || '';
    const title  = card.dataset.title  || '';
    const author = card.dataset.author || '';
    const genreMatch  = activeGenre === 'all' || genre === activeGenre;
    const searchMatch = !q || title.toLowerCase().includes(q) || author.toLowerCase().includes(q) || genre.includes(q);
    const show = genreMatch && searchMatch;
    card.style.display = show ? '' : 'none';
    if (show) visible++;
  });

  document.getElementById('empty-state').classList.toggle('hidden', visible > 0);
}

// ── Add to shelf modal ────────────────────────────────
const btnAdd       = document.getElementById('btn-add');
const modalOverlay = document.getElementById('modal-overlay');
const modalClose   = document.getElementById('modal-close');

btnAdd.addEventListener('click', () => {
  modalOverlay.classList.remove('hidden');
});
modalClose.addEventListener('click', () => {
  modalOverlay.classList.add('hidden');
});
modalOverlay.addEventListener('click', e => {
  if (e.target === modalOverlay) modalOverlay.classList.add('hidden');
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') modalOverlay.classList.add('hidden');
});

// ── Cursor glow tracking ──────────────────────────────
document.querySelectorAll('.book-card').forEach(card => {
  card.addEventListener('mousemove', e => {
    const r = card.getBoundingClientRect();
    card.style.setProperty('--mx', ((e.clientX - r.left) / r.width  * 100) + '%');
    card.style.setProperty('--my', ((e.clientY - r.top)  / r.height * 100) + '%');
  });
});

// ── Card flip (clic = face 2, re-clic = face 1) ───────
document.querySelectorAll('.book-card').forEach(card => {
  card.addEventListener('click', e => {
    if (e.target.closest('.save-btn')) return;
    card.classList.toggle('revealed');
  });
});

// ── Save to shelf — sync toutes les faces de la carte ─
const ICON_EMPTY = `<svg viewBox="0 0 20 20" fill="none"><path d="M5 3h10a1 1 0 011 1v13l-6-3-6 3V4a1 1 0 011-1z" stroke="currentColor" stroke-width="1.6"/></svg>`;
const ICON_FULL  = `<svg viewBox="0 0 20 20" fill="currentColor"><path d="M5 3h10a1 1 0 011 1v13l-6-3-6 3V4a1 1 0 011-1z"/></svg>`;

document.querySelectorAll('.save-btn').forEach(btn => {
  btn.addEventListener('click', e => {
    e.stopPropagation();
    const card    = btn.closest('.book-card');
    const isSaved = card.dataset.saved === 'true';
    const newState = !isSaved;

    card.dataset.saved = newState;
    card.querySelectorAll('.save-btn').forEach(b => {
      b.classList.toggle('saved', newState);
      b.innerHTML = newState ? ICON_FULL : ICON_EMPTY;
    });
  });
});
