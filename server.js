require('dotenv').config();

const express = require('express');
const cors    = require('cors');
const path    = require('path');

// ── Env check ──────────────────────────────
const REQUIRED_ENV = ['DATABASE_URL', 'JWT_SECRET'];
const missing = REQUIRED_ENV.filter(k => !process.env[k]);
if (missing.length) {
  console.error(`Missing env variables: ${missing.join(', ')}`);
  process.exit(1);
}

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Middleware ─────────────────────────────
app.use(cors({
  origin: process.env.FRONTEND_URL
    ? [process.env.FRONTEND_URL, 'http://localhost:3000']
    : true,
}));
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// ── Routes ─────────────────────────────────
app.get('/api/status', (req, res) => {
  res.json({ status: 'ok', message: 'OZ Library API is running' });
});

app.use('/api', require('./routes/auth'));

// ── Start ──────────────────────────────────
app.listen(PORT, () => {
  console.log(`Server running → http://localhost:${PORT}`);
});
