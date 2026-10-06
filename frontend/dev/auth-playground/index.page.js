function msg(id, text, isError) {
  const el = document.getElementById(id);
  el.textContent  = text;
  el.style.color  = isError ? 'red' : 'green';
}

// Register
document.getElementById('registerForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const f = e.target;
  try {
    const res = await register(f.pseudo.value, f.email.value, f.password.value, f.dob.value);
    msg('registerMsg', res.message, false);
  } catch (err) { msg('registerMsg', err.message, true); }
});

// Login
document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const f = e.target;
  try {
    const res = await login(f.email.value, f.password.value);
    if (res.status === '2FA_REQUIRED') {
      document.getElementById('tfaSection').style.display = 'block';
      msg('loginMsg', '2FA requis — entrez votre code TOTP', false);
    } else {
      msg('loginMsg', `Connecté en tant que ${res.user.pseudo}`, false);
      setTimeout(() => window.location.href = 'dashboard.html', 800);
    }
  } catch (err) { msg('loginMsg', err.message, true); }
});

// 2FA verify
document.getElementById('tfaForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  try {
    const res = await verify2FA(e.target.code.value);
    msg('tfaMsg', `Connecté en tant que ${res.user.pseudo}`, false);
    setTimeout(() => window.location.href = 'dashboard.html', 800);
  } catch (err) { msg('tfaMsg', err.message, true); }
});

// Forgot password
document.getElementById('forgotForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  try {
    const res = await forgotPassword(e.target.email.value);
    msg('forgotMsg', res.message, false);
  } catch (err) { msg('forgotMsg', err.message, true); }
});

// Verify email (token dans l'URL: ?token=xxx)
document.getElementById('verifyBtn').addEventListener('click', async () => {
  const token = new URLSearchParams(window.location.search).get('token');
  if (!token) return msg('verifyMsg', 'Aucun token dans l\'URL (?token=xxx)', true);
  try {
    const res = await verifyEmail(token);
    msg('verifyMsg', res.message, false);
  } catch (err) { msg('verifyMsg', err.message, true); }
});
