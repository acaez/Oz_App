const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const db     = require('../database/db');
const { validateEmail, validatePassword, validateDob } = require('../utils/validators');

async function signup(req, res) {
  const { name, email, password, dob } = req.body;

  if (!name || !email || !password || !dob)
    return res.status(400).json({ error: 'Tous les champs sont requis.' });
  if (name.trim().length < 2)
    return res.status(400).json({ error: 'Nom trop court.' });

  const emailErr    = validateEmail(email);
  const passwordErr = validatePassword(password);
  const dobErr      = validateDob(dob);
  if (emailErr)    return res.status(400).json({ error: emailErr });
  if (passwordErr) return res.status(400).json({ error: passwordErr });
  if (dobErr)      return res.status(400).json({ error: dobErr });

  try {
    const existing = await db.query(
      'SELECT id FROM users WHERE email = $1',
      [email.trim().toLowerCase()]
    );
    if (existing.rows.length > 0)
      return res.status(409).json({ error: 'Cet email est déjà utilisé.' });

    const hash = await bcrypt.hash(password, 12);
    await db.query(
      'INSERT INTO users (name, email, password, dob) VALUES ($1, $2, $3, $4)',
      [name.trim(), email.trim().toLowerCase(), hash, dob]
    );

    res.status(201).json({ message: `Compte créé ! Bienvenue, ${name.trim()}.` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
}

async function login(req, res) {
  const { email, password } = req.body;

  const emailErr    = validateEmail(email);
  const passwordErr = validatePassword(password);
  if (emailErr || passwordErr)
    return res.status(400).json({ error: 'Email ou mot de passe invalide.' });

  try {
    const result = await db.query(
      'SELECT * FROM users WHERE email = $1',
      [email.trim().toLowerCase()]
    );

    if (result.rows.length === 0)
      return res.status(401).json({ error: 'Email ou mot de passe incorrect.' });

    const user  = result.rows[0];
    const match = await bcrypt.compare(password, user.password);

    if (!match)
      return res.status(401).json({ error: 'Email ou mot de passe incorrect.' });

    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({ success: true, token, name: user.name });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
}

function me(req, res) {
  res.json({ id: req.user.id, email: req.user.email, name: req.user.name });
}

module.exports = { signup, login, me };
