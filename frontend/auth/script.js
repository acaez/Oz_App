/* ─────────────────────────────────────────────────────────────────────────────
   OZ Library — Login Plugin
   Depends on: shared/config.js, shared/api.js
───────────────────────────────────────────────────────────────────────────── */

// Already logged in → skip the login page
OZ_SESSION.fetchMe().then(user => {
  if (user) window.location.replace(OZ_CONFIG.routes.home);
});

function onLoggedIn(user) {
  OZ_SESSION.save(user);
  window.location.href = OZ_CONFIG.routes.home;
}

/* ── DOM refs ── */
const card  = document.getElementById('card');
const scene = document.querySelector('.scene');
let isFlipped  = false;
let isAnimating = false;

/* ─────────────────────────────────────────────────────────────────────────────
   CARD — flip & tilt
───────────────────────────────────────────────────────────────────────────── */

document.getElementById('openBtn').addEventListener('click', function () {
  isAnimating = true;
  isFlipped   = true;
  card.style.transform  = '';
  card.style.transition = '';
  card.classList.add('flipped');
  setTimeout(() => { isAnimating = false; }, 900);
});

scene.addEventListener('mousemove', function (e) {
  if (isAnimating || isFlipped) return;
  const rect = scene.getBoundingClientRect();
  const dx   = (e.clientX - rect.left - rect.width  / 2) / (rect.width  / 2);
  const dy   = (e.clientY - rect.top  - rect.height / 2) / (rect.height / 2);
  card.style.transition = 'transform 0.12s ease';
  card.style.transform  = `rotateY(${dx * 8}deg) rotateX(${-dy * 5}deg)`;
});

scene.addEventListener('mouseleave', function () {
  card.style.transition = '';
  card.style.transform  = '';
});

/* ─────────────────────────────────────────────────────────────────────────────
   VIEWS — switch between login / signup / forgot / verify
───────────────────────────────────────────────────────────────────────────── */

function switchView(from, to) {
  document.getElementById(from).classList.remove('active');
  document.getElementById(to).classList.add('active');
}

document.getElementById('goSignup').addEventListener('click', function (e) {
  e.preventDefault();
  switchView('loginView', 'signupView');
});

document.getElementById('goLogin').addEventListener('click', function (e) {
  e.preventDefault();
  switchView('signupView', 'loginView');
});

document.querySelector('.forgot').addEventListener('click', function (e) {
  e.preventDefault();
  switchView('loginView', 'forgotView');
});

document.getElementById('goLoginFromForgot').addEventListener('click', function (e) {
  e.preventDefault();
  switchView('forgotView', 'loginView');
});

document.getElementById('goLoginFromVerify').addEventListener('click', function (e) {
  e.preventDefault();
  switchView('verifyView', 'loginView');
});

document.getElementById('goLoginFromTfa').addEventListener('click', function (e) {
  e.preventDefault();
  switchView('tfaView', 'loginView');
});

/* ─────────────────────────────────────────────────────────────────────────────
   UI HELPERS
───────────────────────────────────────────────────────────────────────────── */

function showError(id, text) {
  const el = document.getElementById(id);
  el.textContent  = text;
  el.style.color  = '#e03c3c';
}

function showSuccess(id, text) {
  const el = document.getElementById(id);
  el.textContent  = text;
  el.style.color  = '#2e9e5b';
}

function clearMessage(id) {
  const el = document.getElementById(id);
  el.textContent = '';
}

/* ─────────────────────────────────────────────────────────────────────────────
   SHOW / HIDE PASSWORD
───────────────────────────────────────────────────────────────────────────── */

document.querySelectorAll('.toggle-pw').forEach(function (btn) {
  btn.addEventListener('click', function () {
    const input  = document.getElementById(this.dataset.target);
    const eyeOn  = this.querySelector('.eye-icon');
    const eyeOff = this.querySelector('.eye-off-icon');
    const show   = input.type === 'password';
    input.type           = show ? 'text' : 'password';
    eyeOn.style.display  = show ? 'none' : '';
    eyeOff.style.display = show ? '' : 'none';
  });
});

/* ─────────────────────────────────────────────────────────────────────────────
   DATE OF BIRTH — native date picker on focus
───────────────────────────────────────────────────────────────────────────── */

const dobInput = document.getElementById('dob');
dobInput.addEventListener('focus', function () { this.type = 'date'; });
dobInput.addEventListener('blur',  function () { if (!this.value) this.type = 'text'; });

/* ─────────────────────────────────────────────────────────────────────────────
   LOGIN
───────────────────────────────────────────────────────────────────────────── */

document.getElementById('loginForm').addEventListener('submit', async function (e) {
  e.preventDefault();
  clearMessage('message');

  const email    = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value;

  if (!email || !password)
    return showError('message', 'Please fill in all fields.');

  try {
    const { ok, data } = await ozApi('/auth/login', {
      method: 'POST',
      body:   { email, password },
    });
    if (!ok)
      return showError('message', data.error || 'Login failed.');

    if (data.status === '2FA_REQUIRED') {
      switchView('loginView', 'tfaView');
      document.getElementById('tfaCode').focus();
      return;
    }
    onLoggedIn(data.user);
  } catch {
    showError('message', 'Cannot reach the server. Please try again.');
  }
});

/* ─────────────────────────────────────────────────────────────────────────────
   2FA — step 2 of login (TOTP code)
───────────────────────────────────────────────────────────────────────────── */

document.getElementById('tfaForm').addEventListener('submit', async function (e) {
  e.preventDefault();
  clearMessage('tfaMessage');

  const code = document.getElementById('tfaCode').value.replace(/\s/g, '');
  if (!/^\d{6}$/.test(code))
    return showError('tfaMessage', 'Enter the 6-digit code from your app.');

  try {
    const { ok, data } = await ozApi('/tfa/verify', { method: 'POST', body: { code } });
    if (ok) onLoggedIn(data.user);
    else    showError('tfaMessage', data.error || 'Invalid code.');
  } catch {
    showError('tfaMessage', 'Cannot reach the server. Please try again.');
  }
});

/* ─────────────────────────────────────────────────────────────────────────────
   SIGN UP
───────────────────────────────────────────────────────────────────────────── */

document.getElementById('signupForm').addEventListener('submit', async function (e) {
  e.preventDefault();
  clearMessage('signupMessage');

  const pseudo   = document.getElementById('pseudo').value.trim();
  const email    = document.getElementById('signupEmail').value.trim();
  const password = document.getElementById('signupPassword').value;
  const dob      = document.getElementById('dob').value;

  if (!pseudo || !email || !password || !dob)
    return showError('signupMessage', 'Please fill in all fields.');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return showError('signupMessage', 'Invalid email address.');
  if (password.length < 8)
    return showError('signupMessage', 'Password must be at least 8 characters.');
  if (!/[A-Z]/.test(password))
    return showError('signupMessage', 'Password must contain at least 1 uppercase letter.');
  if (!/[0-9]/.test(password))
    return showError('signupMessage', 'Password must contain at least 1 number.');
  if (!/[^A-Za-z0-9]/.test(password))
    return showError('signupMessage', 'Password must contain at least 1 special character.');

  const birth = new Date(dob);
  const limit = new Date();
  limit.setFullYear(limit.getFullYear() - 18);
  if (birth > limit)
    return showError('signupMessage', 'You must be at least 18 years old.');

  try {
    const { ok, data } = await ozApi('/auth/register', {
      method: 'POST',
      body:   { pseudo, email, password, dob },
    });
    if (ok && data.verified) {
      // Account already active → back to login, email prefilled
      document.getElementById('username').value = email;
      switchView('signupView', 'loginView');
      showSuccess('message', 'Account created! You can now log in.');
      document.getElementById('password').focus();
    } else if (ok) {
      document.getElementById('verifyEmail').textContent = email;
      switchView('signupView', 'verifyView');
    } else {
      showError('signupMessage', data.error || 'Sign up failed.');
    }
  } catch {
    showError('signupMessage', 'Cannot reach the server. Please try again.');
  }
});

/* ─────────────────────────────────────────────────────────────────────────────
   FORGOT PASSWORD
───────────────────────────────────────────────────────────────────────────── */

document.getElementById('forgotForm').addEventListener('submit', async function (e) {
  e.preventDefault();
  clearMessage('forgotMessage');

  const email = document.getElementById('forgotEmail').value.trim();

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return showError('forgotMessage', 'Invalid email address.');

  try {
    const { ok, data } = await ozApi('/auth/forgot-password', { method: 'POST', body: { email } });
    if (ok && data.resetUrl) {
      window.location.href = data.resetUrl;
    } else if (ok) {
      showSuccess('forgotMessage', 'Reset link sent! Check your inbox.');
      this.reset();
    } else {
      showError('forgotMessage', data.error || 'Request failed.');
    }
  } catch {
    showError('forgotMessage', 'Cannot reach the server. Please try again.');
  }
});

/* ─────────────────────────────────────────────────────────────────────────────
   RESEND VERIFICATION EMAIL
───────────────────────────────────────────────────────────────────────────── */

document.getElementById('resendBtn').addEventListener('click', async function () {
  const email = document.getElementById('verifyEmail').textContent;
  this.textContent = 'Sent!';
  this.disabled    = true;
  setTimeout(() => { this.textContent = 'Resend email'; this.disabled = false; }, 3000);
  ozApi('/auth/resend-verification', { method: 'POST', body: { email } }).catch(() => {});
});
