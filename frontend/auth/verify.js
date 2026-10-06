const token = new URLSearchParams(window.location.search).get('token');

function showResult(title, text) {
  document.getElementById('verifyTitle').textContent = title;
  document.getElementById('verifyText').textContent  = text;
}

(async function verify() {
  if (!token) return showResult('Invalid link', 'This verification link is missing its token.');
  try {
    const { ok, data } = await ozApi('/auth/verify-email', { method: 'POST', body: { token } });
    if (ok) showResult('Email verified!', 'Your account is active. You can now log in.');
    else    showResult('Link expired', data.error || 'This link is invalid or was already used.');
  } catch {
    showResult('Server unreachable', 'Please try again in a moment.');
  }
})();
