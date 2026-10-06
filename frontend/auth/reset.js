
const token = new URLSearchParams(window.location.search).get('token');

if (!token) {
  window.location.href = OZ_CONFIG.routes.login;
}

/* ── SHOW / HIDE PASSWORD ── */
document.querySelectorAll('.toggle-pw').forEach(function(btn) {
  btn.addEventListener('click', function() {
    const input  = document.getElementById(this.dataset.target);
    const eyeOn  = this.querySelector('.eye-icon');
    const eyeOff = this.querySelector('.eye-off-icon');
    const visible = input.type === 'text';
    input.type           = visible ? 'password' : 'text';
    eyeOn.style.display  = visible ? '' : 'none';
    eyeOff.style.display = visible ? 'none' : '';
  });
});

/* ── HELPERS ── */
function afficherErreur(id, texte) {
  const el = document.getElementById(id);
  el.textContent = texte;
  el.style.color = '#ff4444';
}

/* ── RESET FORM ── */
document.getElementById('resetForm').addEventListener('submit', async function(e) {
  e.preventDefault();
  const password = document.getElementById('newPassword').value;
  const confirm  = document.getElementById('confirmPassword').value;

  if (password.length < 8)
    return afficherErreur('resetMessage', 'Mot de passe trop court (8 min).');
  if (!/[A-Z]/.test(password))
    return afficherErreur('resetMessage', 'Mot de passe : au moins 1 majuscule.');
  if (!/[0-9]/.test(password))
    return afficherErreur('resetMessage', 'Mot de passe : au moins 1 chiffre.');
  if (!/[^A-Za-z0-9]/.test(password))
    return afficherErreur('resetMessage', 'Mot de passe : au moins 1 caractère spécial.');
  if (password !== confirm)
    return afficherErreur('resetMessage', 'Les mots de passe ne correspondent pas.');

  try {
    const { ok, data } = await ozApi('/auth/reset-password', { method: 'POST', body: { token, password } });
    if (ok) {
      document.getElementById('resetView').classList.remove('active');
      document.getElementById('resetSuccessView').classList.add('active');
    } else {
      afficherErreur('resetMessage', data.error || 'Lien invalide ou expiré.');
    }
  } catch {
    afficherErreur('resetMessage', 'Impossible de joindre le serveur.');
  }
});
