const db = require('../../config/db');

// All SQL queries live here — controllers never call db directly

// Emails are stored and looked up lowercase/trimmed → login is case-insensitive
const normEmail = (email) => String(email).trim().toLowerCase();

async function createUser({ pseudo, email, passwordHash, verifyToken }) {
  const { rows } = await db.query(
    `INSERT INTO users (pseudo, email, password_hash, verify_token)
     VALUES ($1, $2, $3, $4) RETURNING id`,
    [pseudo.trim(), normEmail(email), passwordHash, verifyToken]
  );
  return rows[0];
}

async function findUserByEmail(email) {
  const { rows } = await db.query('SELECT * FROM users WHERE email = $1', [normEmail(email)]);
  return rows[0] || null;
}

async function findUserById(id) {
  const { rows } = await db.query(
    'SELECT id, pseudo, email, avatar_url, two_fa_enabled, is_verified FROM users WHERE id = $1',
    [id]
  );
  return rows[0] || null;
}

async function findUserByIdFull(id) {
  const { rows } = await db.query('SELECT * FROM users WHERE id = $1', [id]);
  return rows[0] || null;
}

async function setEmailVerified(verifyToken) {
  const { rows } = await db.query(
    `UPDATE users SET is_verified = TRUE, verify_token = NULL
     WHERE verify_token = $1 AND is_verified = FALSE RETURNING id`,
    [verifyToken]
  );
  return rows[0] || null;
}

async function setNewVerifyToken(userId, verifyToken) {
  await db.query('UPDATE users SET verify_token = $1 WHERE id = $2', [verifyToken, userId]);
}

async function setResetToken(email, resetToken, resetExpires) {
  await db.query(
    'UPDATE users SET reset_token = $1, reset_expires = $2 WHERE email = $3',
    [resetToken, resetExpires, normEmail(email)]
  );
}

async function findUserByResetToken(token) {
  const { rows } = await db.query(
    'SELECT id FROM users WHERE reset_token = $1 AND reset_expires > NOW()',
    [token]
  );
  return rows[0] || null;
}

async function updatePassword(userId, passwordHash) {
  await db.query(
    'UPDATE users SET password_hash = $1, reset_token = NULL, reset_expires = NULL WHERE id = $2',
    [passwordHash, userId]
  );
}

async function update2FASecret(userId, secret) {
  await db.query('UPDATE users SET two_fa_secret = $1 WHERE id = $2', [secret, userId]);
}

async function enable2FA(userId) {
  await db.query('UPDATE users SET two_fa_enabled = TRUE WHERE id = $1', [userId]);
}

async function disable2FA(userId) {
  await db.query(
    'UPDATE users SET two_fa_enabled = FALSE, two_fa_secret = NULL WHERE id = $1',
    [userId]
  );
}

module.exports = {
  createUser,
  findUserByEmail,
  findUserById,
  findUserByIdFull,
  setEmailVerified,
  setNewVerifyToken,
  setResetToken,
  findUserByResetToken,
  updatePassword,
  update2FASecret,
  enable2FA,
  disable2FA,
};
