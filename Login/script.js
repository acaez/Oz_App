const card     = document.getElementById('card');
const scene    = document.querySelector('.scene');
let isFlipped  = false;
let isAnimating = false;

/* ── FLIP ── */
document.getElementById('openBtn').addEventListener('click', function() {
  isAnimating = true;
  isFlipped   = true;
  card.style.transform  = '';
  card.style.transition = '';
  card.classList.add('flipped');
  setTimeout(() => { isAnimating = false; }, 900);
});

/* ── TILT ── */
scene.addEventListener('mousemove', function(e) {
  if (isAnimating || isFlipped) return;
  const rect = scene.getBoundingClientRect();
  const dx   = (e.clientX - rect.left - rect.width  / 2) / (rect.width  / 2);
  const dy   = (e.clientY - rect.top  - rect.height / 2) / (rect.height / 2);
  card.style.transition = 'transform 0.12s ease';
  card.style.transform  = `rotateY(${dx * 8}deg) rotateX(${-dy * 5}deg)`;
});

scene.addEventListener('mouseleave', function() {
  card.style.transition = '';
  card.style.transform  = '';
});

/* ── DATE OF BIRTH ── */
const dobInput = document.getElementById('dob');
dobInput.addEventListener('focus', function() { this.type = 'date'; });
dobInput.addEventListener('blur',  function() { if (!this.value) this.type = 'text'; });

/* ── SWITCH VIEWS ── */
document.getElementById('goSignup').addEventListener('click', function(e) {
  e.preventDefault();
  document.getElementById('loginView').classList.remove('active');
  document.getElementById('signupView').classList.add('active');
});

document.getElementById('goLogin').addEventListener('click', function(e) {
  e.preventDefault();
  document.getElementById('signupView').classList.remove('active');
  document.getElementById('loginView').classList.add('active');
});

/* ── HELPERS ── */
function afficherErreur(id, texte) {
  const el = document.getElementById(id);
  el.textContent = texte;
  el.style.color = '#ff4444';
}

function afficherSucces(id, texte) {
  const el = document.getElementById(id);
  el.textContent = texte;
  el.style.color = '#44ff88';
}

const API = window.location.hostname === 'localhost'
  ? '/api'
  : 'https://landing-ab4i.onrender.com/api';

// Wake up Render before the user submits the form
fetch(`${API}/status`).catch(() => {});

/* ── LOGIN ── */
document.getElementById('loginForm').addEventListener('submit', async function(e) {
  e.preventDefault();
  const email    = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value;

  if (!email || !password)
    return afficherErreur('message', 'Remplis tous les champs.');
  if (email.includes('@') && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return afficherErreur('message', 'Adresse e-mail invalide.');
  if (password.length < 8)
    return afficherErreur('message', 'Mot de passe trop court (8 min).');
  if (!/[A-Z]/.test(password))
    return afficherErreur('message', 'Mot de passe : au moins 1 majuscule.');
  if (!/[0-9]/.test(password))
    return afficherErreur('message', 'Mot de passe : au moins 1 chiffre.');
  if (!/[^A-Za-z0-9]/.test(password))
    return afficherErreur('message', 'Mot de passe : au moins 1 caractère spécial.');

  try {
    const res  = await fetch(`${API}/login`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (res.ok) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('userName', data.name);
      window.location.href = '/Feed/';
    } else {
      afficherErreur('message', data.error);
    }
  } catch {
    afficherErreur('message', 'Impossible de joindre le serveur.');
  }
});

/* ── SIGN UP ── */
document.getElementById('signupForm').addEventListener('submit', async function(e) {
  e.preventDefault();
  const name     = document.getElementById('fullname').value.trim();
  const email    = document.getElementById('signupEmail').value.trim();
  const password = document.getElementById('signupPassword').value;
  const dob      = document.getElementById('dob').value;

  if (!name || !email || !password || !dob)
    return afficherErreur('signupMessage', 'Remplis tous les champs.');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return afficherErreur('signupMessage', 'Adresse e-mail invalide.');
  if (password.length < 8)
    return afficherErreur('signupMessage', 'Mot de passe trop court (8 min).');
  if (!/[A-Z]/.test(password))
    return afficherErreur('signupMessage', 'Mot de passe : au moins 1 majuscule.');
  if (!/[0-9]/.test(password))
    return afficherErreur('signupMessage', 'Mot de passe : au moins 1 chiffre.');
  if (!/[^A-Za-z0-9]/.test(password))
    return afficherErreur('signupMessage', 'Mot de passe : au moins 1 caractère spécial.');

  const birth = new Date(dob);
  const limit = new Date();
  limit.setFullYear(limit.getFullYear() - 18);
  if (birth > limit)
    return afficherErreur('signupMessage', 'Vous devez avoir au moins 18 ans.');

  try {
    const res  = await fetch(`${API}/signup`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ name, email, password, dob }),
    });
    const data = await res.json();
    if (res.ok) {
      afficherSucces('signupMessage', data.message);
      setTimeout(() => {
        document.getElementById('signupView').classList.remove('active');
        document.getElementById('loginView').classList.add('active');
      }, 1200);
    } else {
      afficherErreur('signupMessage', data.error);
    }
  } catch {
    afficherErreur('signupMessage', 'Impossible de joindre le serveur.');
  }
});
