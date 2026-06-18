# OZ Library — Login Plugin

A self-contained, reusable login UI plugin. Drop it into any project by changing a single config file.

---

## Demo

| Field    | Value         |
|----------|---------------|
| Email    | demo@oz.com   |
| Password | Demo123!      |

Demo mode bypasses the backend entirely — no server needed to test the UI flow.

---

## File Structure

```
Login/
├── index.html        # Main entry point (login card)
├── style.css         # All styles
├── script.js         # All interactions & API calls
├── config.js         # ← only file you need to edit per project
├── reset.html        # Password reset page (opened via email link)
├── reset.js          # Reset page logic
├── dashboard.html    # Minimal post-login demo page
└── garden.jpg        # Background image
```

---

## Integration

### 1. Copy the files into your project

### 2. Edit `config.js`

```js
const OZ_CONFIG = {
  api:                'https://your-backend.com/api', // your auth API
  redirectAfterLogin: '/app/dashboard',               // where to go after login
  brand:              'Your App Name',
  demo: {
    enabled:  false,   // set true for local testing
    email:    'demo@yourapp.com',
    password: 'Demo123!',
    name:     'Demo User',
  },
};
```

### 3. Point your backend to the expected endpoints

| Method | Endpoint               | Body                              | Response               |
|--------|------------------------|-----------------------------------|------------------------|
| POST   | `/api/login`           | `{ email, password }`             | `{ token, name }`      |
| POST   | `/api/signup`          | `{ name, email, password, dob }`  | `{ message }`          |
| POST   | `/api/forgot-password` | `{ email }`                       | `{ message }`          |
| POST   | `/api/reset-password`  | `{ token, password }`             | `{ message }`          |
| POST   | `/api/resend-verification` | `{ email }`                   | `{ message }`          |
| GET    | `/api/status`          | —                                 | `{ ok: true }`         |

---

## Auth Flow

```
index.html
  ├── Login view      → on success → redirectAfterLogin
  ├── Sign up view    → on success → Verify Email view
  ├── Forgot Password → on success → (email sent)
  └── Verify Email    → Back to Login

reset.html?token=xxx  → on success → Back to Login
```

---

## Password Rules (enforced client-side on signup)

- Minimum 8 characters
- At least 1 uppercase letter
- At least 1 number
- At least 1 special character
- Must be 18+ years old (date of birth)

---

## Notes

- Auth token is stored in `localStorage` under the key `token`
- User name is stored under `userName`
- The dashboard checks for a valid token on load — no token redirects to `index.html`
- To disable demo mode in production: set `demo.enabled: false` in `config.js`
