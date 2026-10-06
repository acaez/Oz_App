/* ─────────────────────────────────────────────────────────────────────────────
   OZ Library — shared config (loaded first by every page)
───────────────────────────────────────────────────────────────────────────── */

const OZ_CONFIG = {

  // ── API ────────────────────────────────────────────────────────────────────
  // Front and API are served by the same server → relative path, cookies just work
  api: '/api',

  // ── Navigation ─────────────────────────────────────────────────────────────
  routes: {
    login: '/auth/',
    home:  '/feed/',
  },

  // ── Branding ───────────────────────────────────────────────────────────────
  brand: 'OZ Library',

};
