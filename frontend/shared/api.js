/* ─────────────────────────────────────────────────────────────────────────────
   OZ Library — shared API client + session helpers
   Depends on: shared/config.js

   - Auth lives in an HttpOnly cookie (auth_token): JS never sees the JWT.
   - localStorage only caches pseudo/avatar for instant UI, never trusted.
───────────────────────────────────────────────────────────────────────────── */

async function ozApi(path, { method = 'GET', body } = {}) {
  const res = await fetch(`${OZ_CONFIG.api}${path}`, {
    method,
    credentials: 'include',
    headers:     body ? { 'Content-Type': 'application/json' } : undefined,
    body:        body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}

const OZ_SESSION = {
  save(user) {
    localStorage.setItem('userPseudo',    user.pseudo);
    localStorage.setItem('userAvatarUrl', user.avatarUrl || '');
  },
  cached() {
    const pseudo = localStorage.getItem('userPseudo');
    return pseudo ? { pseudo, avatarUrl: localStorage.getItem('userAvatarUrl') } : null;
  },
  clear() {
    localStorage.removeItem('userPseudo');
    localStorage.removeItem('userAvatarUrl');
  },
  // Source of truth: asks the server who is logged in (null if nobody)
  async fetchMe() {
    try {
      const { ok, data } = await ozApi('/auth/me');
      if (!ok) { this.clear(); return null; }
      this.save(data);
      return data;
    } catch {
      return this.cached();
    }
  },
};

async function ozLogout() {
  await ozApi('/auth/logout', { method: 'POST' }).catch(() => {});
  OZ_SESSION.clear();
  window.location.href = OZ_CONFIG.routes.login;
}
