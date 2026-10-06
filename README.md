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
│   │   ├── requireAuth.js    # middlewares requireAuth / require2FAPending
│   │   └── mailer.js         # Gmail SMTP (nodemailer)
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

L'app tourne en **service macOS** : elle démarre à l'ouverture de session, redémarre si elle plante, et se recharge à chaque modif de `backend/` ou `frontend/`. Postgres tourne aussi en service (`brew services`).

→ **http://localhost:3000**

```bash
./scripts/service.sh logs       # voir les logs (logs/app.log)
./scripts/service.sh restart    # après une modif du .env
./scripts/service.sh status | stop | uninstall
```

Première installation sur une autre machine :

```bash
brew install postgresql@17 && brew services start postgresql@17 && createdb oz_db
npm run setup
cp backend/.env.example backend/.env   # DB_USER = ton user mac, secrets JWT, EMAIL_VERIFICATION=false en local
npm run db:init
./scripts/service.sh install
```

### Emails (Gmail SMTP)

Dans `backend/.env` : `SMTP_USER` (ton adresse Gmail) + `SMTP_PASS` (un [mot de passe d'application](https://myaccount.google.com/apppasswords), validation en 2 étapes requise), puis `./scripts/service.sh restart`. Les logs doivent afficher `[Mail] Gmail SMTP ready`.

| | SMTP configuré | Sans SMTP |
|---|---|---|
| Inscription | email de vérification (sauf `EMAIL_VERIFICATION=false`) | compte actif tout de suite |
| Forgot password | email avec lien de reset (1 h) | redirection directe vers la page de reset (hors prod) |

Pour envoyer un email depuis un autre module : `require('../../shared/mailer').sendMail({ to, subject, html })`.

## Flux

```
/  → /feed/
/auth/  ── login ──┬── OK ───────────────→ /feed/
                   └── 2FA_REQUIRED → code TOTP → /feed/
        ── signup → email de vérification → /auth/verify.html
        ── forgot → email de reset          → /auth/reset.html
/feed/  → GET /api/auth/me ; si 401 → mode invité (bouton "Sign in")
```

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
