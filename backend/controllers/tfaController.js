const speakeasy = require('speakeasy');
const qrcode    = require('qrcode');
const bcrypt    = require('bcrypt');
const jwt       = require('jsonwebtoken');
const User      = require('../models/userModel');

function setAuthCookie(res, userId) {
  const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES || '7d',
  });
  res.cookie('auth_token', token, {
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge:   7 * 24 * 60 * 60 * 1000,
  });
}

// ── POST /api/tfa/setup ────────────────────────────────────────────────────────
// Generates TOTP secret + QR code. Stores secret (not enabled yet).
// Requires: auth_token cookie.

async function setup(req, res) {
  try {
    const secret = speakeasy.generateSecret({
      name:   `${process.env.TOTP_APP_NAME || 'App'}:${req.user.email}`,
      length: 20,
    });

    await User.update2FASecret(req.user.id, secret.base32);

    const qrCodeDataUrl = await qrcode.toDataURL(secret.otpauth_url);

    return res.json({
      secret:  secret.base32,      // manual entry key
      qrCode:  qrCodeDataUrl,      // base64 PNG → <img src="...">
      otpauth: secret.otpauth_url,
    });
  } catch (err) {
    console.error('[tfa/setup]', err.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// ── POST /api/tfa/activate ─────────────────────────────────────────────────────
// Confirms first TOTP code → enables 2FA on the account.
// Body: { code }
// Requires: auth_token cookie + setup called first.

async function activate(req, res) {
  const { code } = req.body;
  if (!code) return res.status(400).json({ error: 'TOTP code is required' });

  try {
    const user = await User.findUserByIdFull(req.user.id);

    if (!user.two_fa_secret)
      return res.status(400).json({ error: 'Call /api/tfa/setup first' });
    if (user.two_fa_enabled)
      return res.status(400).json({ error: '2FA is already enabled' });

    const valid = speakeasy.totp.verify({
      secret:   user.two_fa_secret,
      encoding: 'base32',
      token:    code,
      window:   1, // ±30s tolerance
    });
    if (!valid)
      return res.status(401).json({ error: 'Invalid TOTP code' });

    await User.enable2FA(req.user.id);
    return res.json({ message: '2FA successfully enabled' });
  } catch (err) {
    console.error('[tfa/activate]', err.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// ── POST /api/tfa/verify ───────────────────────────────────────────────────────
// Step 2 of login: validates TOTP code → issues full auth cookie.
// Requires: 2fa_pending cookie (set at login step 1).
// Body: { code }

async function verify(req, res) {
  const { code } = req.body;
  if (!code) return res.status(400).json({ error: 'TOTP code is required' });

  try {
    const user = await User.findUserByIdFull(req.pendingUserId);
    if (!user) return res.status(401).json({ error: 'User not found' });

    const valid = speakeasy.totp.verify({
      secret:   user.two_fa_secret,
      encoding: 'base32',
      token:    code,
      window:   1,
    });
    if (!valid)
      return res.status(401).json({ error: 'Invalid or expired TOTP code' });

    res.clearCookie('2fa_pending', { httpOnly: true, sameSite: 'strict', path: '/api/tfa/verify' });
    setAuthCookie(res, user.id);

    return res.json({ status: 'OK', name: user.name });
  } catch (err) {
    console.error('[tfa/verify]', err.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// ── POST /api/tfa/disable ──────────────────────────────────────────────────────
// Disables 2FA. Requires current password + valid TOTP code.
// Body: { password, code }
// Requires: auth_token cookie.

async function disable(req, res) {
  const { password, code } = req.body;
  if (!password || !code)
    return res.status(400).json({ error: 'Password and TOTP code are required' });

  try {
    const user = await User.findUserByIdFull(req.user.id);

    if (!user.two_fa_enabled)
      return res.status(400).json({ error: '2FA is not enabled' });

    const passwordOk = await bcrypt.compare(password, user.password_hash);
    if (!passwordOk)
      return res.status(401).json({ error: 'Invalid password' });

    const totpOk = speakeasy.totp.verify({
      secret:   user.two_fa_secret,
      encoding: 'base32',
      token:    code,
      window:   1,
    });
    if (!totpOk)
      return res.status(401).json({ error: 'Invalid TOTP code' });

    await User.disable2FA(req.user.id);
    return res.json({ message: '2FA disabled successfully' });
  } catch (err) {
    console.error('[tfa/disable]', err.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = { setup, activate, verify, disable };
