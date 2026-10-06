const bcrypt = require('bcrypt');
const jwt    = require('jsonwebtoken');
const crypto = require('crypto');
const User   = require('../models/userModel');

const SALT_ROUNDS = 12;

// ── Cookie helpers ─────────────────────────────────────────────────────────────

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

function set2FAPendingCookie(res, userId) {
  const token = jwt.sign({ userId, scope: '2fa' }, process.env.JWT_2FA_SECRET, {
    expiresIn: process.env.JWT_2FA_EXPIRES || '5m',
  });
  res.cookie('2fa_pending', token, {
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge:   5 * 60 * 1000,
    path:     '/api/tfa/verify', // restricted to this route only
  });
}

// ── POST /api/auth/register ────────────────────────────────────────────────────

async function register(req, res) {
  const { pseudo, email, password, dob } = req.body;

  if (!pseudo || !email || !password || !dob)
    return res.status(400).json({ error: 'All fields are required' });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return res.status(400).json({ error: 'Invalid email address' });
  if (
    password.length < 8       ||
    !/[A-Z]/.test(password)   ||
    !/[0-9]/.test(password)   ||
    !/[^A-Za-z0-9]/.test(password)
  ) return res.status(400).json({ error: 'Password: 8+ chars, 1 uppercase, 1 number, 1 special character' });

  const birth = new Date(dob);
  const limit = new Date();
  limit.setFullYear(limit.getFullYear() - 18);
  if (birth > limit)
    return res.status(400).json({ error: 'You must be at least 18 years old' });

  try {
    const existing = await User.findUserByEmail(email);
    if (existing)
      return res.status(409).json({ error: 'Email already registered' });

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const verifyToken  = crypto.randomBytes(32).toString('hex');

    await User.createUser({ pseudo, email, passwordHash, verifyToken });

    // TODO: send verification email with verifyToken
    console.log(`[Auth] Verify token for ${email}: ${verifyToken}`);

    return res.status(201).json({ message: 'Account created. Please check your email to verify.' });
  } catch (err) {
    console.error('[register]', err.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// ── POST /api/auth/login ───────────────────────────────────────────────────────

async function login(req, res) {
  const { email, password } = req.body;

  if (!email || !password)
    return res.status(400).json({ error: 'Email and password are required' });

  try {
    const user = await User.findUserByEmail(email);

    // Generic error — no user enumeration
    if (!user || !(await bcrypt.compare(password, user.password_hash)))
      return res.status(401).json({ error: 'Invalid credentials' });

    if (!user.is_verified)
      return res.status(403).json({ error: 'Please verify your email before logging in' });

    // 2FA enabled → step 1: issue temp cookie, front must call /api/tfa/verify
    if (user.two_fa_enabled) {
      set2FAPendingCookie(res, user.id);
      return res.json({ status: '2FA_REQUIRED' });
    }

    setAuthCookie(res, user.id);
    return res.json({
      status: 'OK',
      user: {
        id:        user.id,
        pseudo:    user.pseudo,
        avatarUrl: user.avatar_url,
      },
    });
  } catch (err) {
    console.error('[login]', err.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// ── POST /api/auth/logout ──────────────────────────────────────────────────────

function logout(req, res) {
  res.clearCookie('auth_token',  { httpOnly: true, sameSite: 'strict' });
  res.clearCookie('2fa_pending', { httpOnly: true, sameSite: 'strict', path: '/api/tfa/verify' });
  return res.json({ message: 'Logged out' });
}

// ── GET /api/auth/me ───────────────────────────────────────────────────────────

function me(req, res) {
  const { id, pseudo, email, avatar_url, two_fa_enabled } = req.user;
  return res.json({
    id,
    pseudo,
    email,
    avatarUrl:    avatar_url,
    twoFaEnabled: two_fa_enabled,
  });
}

// ── POST /api/auth/verify-email ────────────────────────────────────────────────

async function verifyEmail(req, res) {
  const { token } = req.body;
  if (!token) return res.status(400).json({ error: 'Token is required' });

  try {
    const user = await User.setEmailVerified(token);
    if (!user)
      return res.status(400).json({ error: 'Invalid or already used token' });

    return res.json({ message: 'Email verified. You can now log in.' });
  } catch (err) {
    console.error('[verifyEmail]', err.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// ── POST /api/auth/forgot-password ────────────────────────────────────────────

async function forgotPassword(req, res) {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required' });

  try {
    const user = await User.findUserByEmail(email);
    if (user) {
      const resetToken   = crypto.randomBytes(32).toString('hex');
      const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1h
      await User.setResetToken(email, resetToken, resetExpires);
      // TODO: sendResetEmail(email, resetToken)
      console.log(`[Auth] Reset token for ${email}: ${resetToken}`);
    }
    // Always return success — no user enumeration
    return res.json({ message: 'If this email exists, a reset link has been sent.' });
  } catch (err) {
    console.error('[forgotPassword]', err.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// ── POST /api/auth/reset-password ─────────────────────────────────────────────

async function resetPassword(req, res) {
  const { token, password } = req.body;
  if (!token || !password)
    return res.status(400).json({ error: 'Token and password are required' });

  if (
    password.length < 8       ||
    !/[A-Z]/.test(password)   ||
    !/[0-9]/.test(password)   ||
    !/[^A-Za-z0-9]/.test(password)
  ) return res.status(400).json({ error: 'Password: 8+ chars, 1 uppercase, 1 number, 1 special character' });

  try {
    const user = await User.findUserByResetToken(token);
    if (!user)
      return res.status(400).json({ error: 'Invalid or expired reset token' });

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    await User.updatePassword(user.id, passwordHash);

    return res.json({ message: 'Password updated successfully.' });
  } catch (err) {
    console.error('[resetPassword]', err.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// ── POST /api/auth/resend-verification ────────────────────────────────────────

async function resendVerification(req, res) {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required' });

  try {
    const user = await User.findUserByEmail(email);
    if (user && !user.is_verified) {
      const verifyToken = crypto.randomBytes(32).toString('hex');
      await User.setNewVerifyToken(user.id, verifyToken);
      // TODO: sendVerificationEmail(email, verifyToken)
      console.log(`[Auth] New verify token for ${email}: ${verifyToken}`);
    }
    return res.json({ message: 'If this email is pending verification, a new link has been sent.' });
  } catch (err) {
    console.error('[resendVerification]', err.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = { register, login, logout, me, verifyEmail, forgotPassword, resetPassword, resendVerification };
