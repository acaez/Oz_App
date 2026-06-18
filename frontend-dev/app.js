/* =============================================================================
   app.js — Auth API client
   Toutes les fonctions fetch() pour consommer le backend.
   👉 C'est CE FICHIER que ton pote récupère pour son SPA.

   - credentials: 'include' est OBLIGATOIRE → le browser envoie les cookies
   - Le token JWT est HttpOnly : le JS ne peut pas le lire, c'est voulu
   - Modifier uniquement BASE_URL selon l'environnement
============================================================================= */

const BASE_URL = 'http://localhost:3000'; // ← changer en prod

async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers:     { 'Content-Type': 'application/json', ...options.headers },
    credentials: 'include', // envoie les cookies HttpOnly automatiquement
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

// =============================================================================
// AUTH
// =============================================================================

/**
 * Créer un compte.
 * POST /api/auth/register
 * @param {{ name: string, email: string, password: string, dob: string }} body
 * @returns {{ message: string }}
 */
async function register(name, email, password, dob) {
  return request('/api/auth/register', {
    method: 'POST',
    body:   JSON.stringify({ name, email, password, dob }),
  });
}

/**
 * Se connecter.
 * POST /api/auth/login
 * Deux cas possibles :
 *   → { status: 'OK', name }          : connecté, cookie auth_token posé
 *   → { status: '2FA_REQUIRED' }      : cookie 2fa_pending posé, appeler verify2FA()
 * @param {{ email: string, password: string }} body
 */
async function login(email, password) {
  return request('/api/auth/login', {
    method: 'POST',
    body:   JSON.stringify({ email, password }),
  });
}

/**
 * Se déconnecter. Efface les cookies côté serveur.
 * POST /api/auth/logout
 */
async function logout() {
  return request('/api/auth/logout', { method: 'POST' });
}

/**
 * Récupérer l'utilisateur connecté.
 * GET /api/auth/me
 * @returns {{ id, name, email, two_fa_enabled }}
 */
async function getMe() {
  return request('/api/auth/me');
}

/**
 * Vérifier l'email via le token reçu par email.
 * POST /api/auth/verify-email
 * @param {string} token
 */
async function verifyEmail(token) {
  return request('/api/auth/verify-email', {
    method: 'POST',
    body:   JSON.stringify({ token }),
  });
}

/**
 * Demander un lien de réinitialisation de mot de passe.
 * POST /api/auth/forgot-password
 * @param {string} email
 */
async function forgotPassword(email) {
  return request('/api/auth/forgot-password', {
    method: 'POST',
    body:   JSON.stringify({ email }),
  });
}

/**
 * Réinitialiser le mot de passe avec le token reçu par email.
 * POST /api/auth/reset-password
 * @param {string} token
 * @param {string} password
 */
async function resetPassword(token, password) {
  return request('/api/auth/reset-password', {
    method: 'POST',
    body:   JSON.stringify({ token, password }),
  });
}

/**
 * Renvoyer l'email de vérification.
 * POST /api/auth/resend-verification
 * @param {string} email
 */
async function resendVerification(email) {
  return request('/api/auth/resend-verification', {
    method: 'POST',
    body:   JSON.stringify({ email }),
  });
}

// =============================================================================
// 2FA / TOTP
// =============================================================================

/**
 * [ÉTAPE 2 DU LOGIN] Soumettre le code TOTP après status: '2FA_REQUIRED'.
 * Le cookie 2fa_pending doit être présent (posé automatiquement au login).
 * POST /api/tfa/verify
 * @param {string} code  — code à 6 chiffres de Google Authenticator
 * @returns {{ status: 'OK', name: string }}
 */
async function verify2FA(code) {
  return request('/api/tfa/verify', {
    method: 'POST',
    body:   JSON.stringify({ code }),
  });
}

/**
 * Générer un secret TOTP + QR code pour activer la 2FA.
 * Doit être appelé avant activate2FA().
 * POST /api/tfa/setup
 * @returns {{ secret: string, qrCode: string, otpauth: string }}
 *   qrCode = base64 PNG → afficher avec <img src={qrCode}>
 *   secret = clé manuelle pour Google Authenticator
 */
async function setup2FA() {
  return request('/api/tfa/setup', { method: 'POST' });
}

/**
 * Activer la 2FA en confirmant le premier code TOTP.
 * POST /api/tfa/activate
 * @param {string} code
 */
async function activate2FA(code) {
  return request('/api/tfa/activate', {
    method: 'POST',
    body:   JSON.stringify({ code }),
  });
}

/**
 * Désactiver la 2FA (confirmation par mot de passe + code TOTP).
 * POST /api/tfa/disable
 * @param {string} password
 * @param {string} code
 */
async function disable2FA(password, code) {
  return request('/api/tfa/disable', {
    method: 'POST',
    body:   JSON.stringify({ password, code }),
  });
}

// =============================================================================
// EXEMPLES D'UTILISATION
// =============================================================================

/*

// ─── Login standard ───────────────────────────────────────────────────────────
async function handleLogin() {
  try {
    const res = await login('user@example.com', 'Password1!');

    if (res.status === '2FA_REQUIRED') {
      afficher2FAInput(); // montrer le champ code TOTP
    } else {
      window.location.href = '/dashboard.html';
    }
  } catch (err) {
    afficherErreur(err.message);
  }
}

// ─── Validation 2FA (step 2) ──────────────────────────────────────────────────
async function handleTOTPSubmit(code) {
  try {
    await verify2FA(code);
    window.location.href = '/dashboard.html';
  } catch (err) {
    afficherErreur(err.message); // 'Invalid or expired TOTP code'
  }
}

// ─── Activer la 2FA ───────────────────────────────────────────────────────────
async function handleSetup2FA() {
  const { qrCode, secret } = await setup2FA();

  document.getElementById('qr').src = qrCode;   // <img id="qr">
  document.getElementById('secret').textContent = secret; // clé manuelle

  // L'utilisateur scanne le QR, puis entre son premier code
  const code = document.getElementById('totp-code').value;
  await activate2FA(code);
}

*/
