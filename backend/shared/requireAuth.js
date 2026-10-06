const jwt  = require('jsonwebtoken');
const User = require('../modules/auth/user.model');

// ── requireAuth ────────────────────────────────────────────────────────────────
// Verifies the auth_token HttpOnly cookie.
// On success: attaches req.user = { id, name, email, two_fa_enabled }

async function requireAuth(req, res, next) {
  const token = req.cookies?.auth_token;
  if (!token)
    return res.status(401).json({ error: 'Not authenticated' });

  try {
    const { userId } = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findUserById(userId);
    if (!user)
      return res.status(401).json({ error: 'User not found' });

    req.user = user;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired session' });
  }
}

// ── require2FAPending ──────────────────────────────────────────────────────────
// Verifies the temporary 2fa_pending HttpOnly cookie (issued at login step 1).
// Path-restricted to /api/tfa/verify — expires in 5 minutes.
// On success: attaches req.pendingUserId

function require2FAPending(req, res, next) {
  const token = req.cookies?.['2fa_pending'];
  if (!token)
    return res.status(401).json({ error: '2FA session missing — please log in again' });

  try {
    const { userId, scope } = jwt.verify(token, process.env.JWT_2FA_SECRET);
    if (scope !== '2fa')
      return res.status(401).json({ error: 'Invalid token scope' });

    req.pendingUserId = userId;
    next();
  } catch {
    return res.status(401).json({ error: '2FA session expired — please log in again' });
  }
}

module.exports = { requireAuth, require2FAPending };
