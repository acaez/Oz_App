const OZ_CONFIG = {

  // ── API ────────────────────────────────────────────────────────────────────
  api: window.location.hostname === 'localhost'
    ? '/api'
    : 'https://landing-ab4i.onrender.com/api',

  // ── Navigation ─────────────────────────────────────────────────────────────
  redirectAfterLogin: 'dashboard.html',

  // ── Branding ───────────────────────────────────────────────────────────────
  brand: 'OZ Library',

  // ── Demo mode ──────────────────────────────────────────────────────────────
  // Set enabled: false in production
  demo: {
    enabled:   true,
    email:     'demo@oz.com',
    password:  'Demo123!',
    pseudo:    'DemoUser_42',
    avatarUrl: '/avatars/default.png',
  },

};
