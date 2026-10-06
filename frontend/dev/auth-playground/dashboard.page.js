function msg(id, text, isError) {
  const el = document.getElementById(id);
  el.textContent = text;
  el.style.color = isError ? 'red' : 'green';
}

// Vérifier l'auth au chargement
async function init() {
  try {
    const user = await getMe();
    document.getElementById('userInfo').textContent =
      `Connecté : ${user.name} (${user.email}) — 2FA: ${user.two_fa_enabled ? 'activée' : 'désactivée'}`;
  } catch {
    window.location.href = 'index.html'; // non authentifié → retour login
  }
}
init();

// Logout
document.getElementById('logoutBtn').addEventListener('click', async () => {
  await logout();
  window.location.href = 'index.html';
});

// Setup 2FA
document.getElementById('setup2FABtn').addEventListener('click', async () => {
  try {
    const { qrCode, secret } = await setup2FA();
    document.getElementById('qrImg').src     = qrCode;
    document.getElementById('tfaSecret').textContent = secret;
    document.getElementById('qrSection').style.display = 'block';
  } catch (err) { alert(err.message); }
});

// Activate 2FA
document.getElementById('activateForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  try {
    const res = await activate2FA(e.target.code.value);
    msg('activateMsg', res.message, false);
  } catch (err) { msg('activateMsg', err.message, true); }
});

// Disable 2FA
document.getElementById('disableForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  try {
    const res = await disable2FA(e.target.password.value, e.target.code.value);
    msg('disableMsg', res.message, false);
  } catch (err) { msg('disableMsg', err.message, true); }
});
