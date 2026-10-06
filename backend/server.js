require('dotenv').config();

const path         = require('path');
const express      = require('express');
const helmet       = require('helmet');
const cors         = require('cors');
const cookieParser = require('cookie-parser');

// ── Env check ──────────────────────────────────────────────────────────────────
const REQUIRED_ENV = ['JWT_SECRET', 'JWT_2FA_SECRET'];
const missing = REQUIRED_ENV.filter(k => !process.env[k]);
if (missing.length) {
  console.error(`Missing env variables: ${missing.join(', ')}`);
  process.exit(1);
}

const app      = express();
const FRONTEND = path.join(__dirname, '..', 'frontend');
const IS_PROD  = process.env.NODE_ENV === 'production';

// ── Middleware ─────────────────────────────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      'img-src': ["'self'", 'data:', 'https://covers.openlibrary.org'],
      'upgrade-insecure-requests': IS_PROD ? [] : null,
    },
  },
}));
// Front is served by this same server → same origin, CORS only needed for an external front
if (process.env.FRONTEND_URL)
  app.use(cors({ origin: process.env.FRONTEND_URL, credentials: true }));
app.use(express.json());
app.use(cookieParser());

// ── API modules ────────────────────────────────────────────────────────────────
app.get('/api/status', (_req, res) => res.json({ ok: true }));

app.use('/api/auth',  require('./modules/auth/auth.routes'));
app.use('/api/tfa',   require('./modules/auth/tfa.routes'));
app.use('/api/books', require('./modules/books/books.routes'));

app.use('/api', (_req, res) => res.status(404).json({ error: 'Not found' }));

// ── Frontend ───────────────────────────────────────────────────────────────────
if (IS_PROD) app.use('/dev', (_req, res) => res.status(404).end());
app.use(express.static(FRONTEND));
app.get('/', (_req, res) => res.redirect('/feed/'));

// ── Errors ─────────────────────────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error('[Error]', err.message);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`[Server] http://localhost:${PORT}`));
