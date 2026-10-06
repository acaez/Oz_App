# OZ Library

Monorepo : un seul serveur Express sert l'API **et** le front (même origine → les cookies HttpOnly fonctionnent sans config CORS).

```
Oz_App/
├── package.json              # scripts racine (proxy vers backend/)
├── backend/
│   ├── server.js             # monte les modules API + sert ../frontend
│   ├── config/db.js          # pool Postgres (DATABASE_URL ou DB_*)
│   ├── db/
│   │   ├── schema.sql        # users + shelf
│   │   └── init.js           # npm run db:init
│   ├── shared/
│   │   └── requireAuth.js    # middlewares requireAuth / require2FAPending
│   └── modules/
│       ├── auth/             # /api/auth/*  /api/tfa/*   (ex plug-Auth-back)
│       └── books/            # /api/books/*              (ex Landing)
└── frontend/
    ├── shared/
    │   ├── config.js         # OZ_CONFIG : base API + routes (login, home)
    │   └── api.js            # ozApi(), OZ_SESSION, ozLogout()
    ├── auth/                 # /auth/   login, signup, 2FA, reset, verify (ex plug-Auth-front)
    ├── feed/                 # /feed/   page après connexion (ex Landing/Feed)
    └── dev/auth-playground/  # /dev/auth-playground/  test brut de l'API auth + setup 2FA (désactivé en prod)
```

## Démarrer

```bash
npm run setup                 # installe les deps du backend
cp backend/.env.example backend/.env   # puis remplir la DB + secrets JWT
npm run db:init               # crée les tables (idempotent)
npm run dev                   # http://localhost:3000 — redémarre si backend/ ou frontend/ change
```

## Flux

```
/  → /feed/
/auth/  ── login ──┬── OK ───────────────→ /feed/
                   └── 2FA_REQUIRED → code TOTP → /feed/
        ── signup → lien de vérification (loggé dans la console du serveur) → /auth/verify.html
        ── forgot → lien de reset (loggé)                                   → /auth/reset.html
/feed/  → GET /api/auth/me ; si 401 → mode invité (bouton "Sign in")
```

Pas encore d'envoi d'email : les liens de vérification / reset sont affichés dans les logs du serveur (`[Auth] Verify link …`).

## API

| Module | Méthode | Route | Auth |
|---|---|---|---|
| auth | POST | `/api/auth/register` `{ pseudo, email, password, dob }` | — |
| auth | POST | `/api/auth/login` `{ email, password }` → `{ status: 'OK', user }` ou `{ status: '2FA_REQUIRED' }` | — |
| auth | POST | `/api/auth/logout` | — |
| auth | GET  | `/api/auth/me` | cookie |
| auth | POST | `/api/auth/verify-email` `/forgot-password` `/reset-password` `/resend-verification` | — |
| tfa  | POST | `/api/tfa/verify` `{ code }` | cookie `2fa_pending` |
| tfa  | POST | `/api/tfa/setup` `/activate` `/disable` | cookie |
| books | GET | `/api/books/search?q=` | — |
| books | GET | `/api/books/feed` | cookie |
| books | POST / DELETE | `/api/books/shelf` | cookie |

## Ajouter un module

**Backend** : créer `backend/modules/<nom>/` avec `<nom>.routes.js` + `<nom>.controller.js`, protéger les routes avec `require('../../shared/requireAuth').requireAuth` (→ `req.user`), puis une ligne dans `server.js` :

```js
app.use('/api/<nom>', require('./modules/<nom>/<nom>.routes'));
```

**Frontend** : créer `frontend/<nom>/index.html` (servi sur `/<nom>/`) et charger le socle commun :

```html
<script src="/shared/config.js"></script>
<script src="/shared/api.js"></script>
<script src="/<nom>/<nom>.js"></script>
```

Puis `await ozApi('/<nom>/...')` — le cookie de session est envoyé automatiquement. Pas de `<script>` inline ni de `onclick=` : la CSP (helmet) les bloque.
