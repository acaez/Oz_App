-- Run: npm run db:init  (or: psql "$DATABASE_URL" -f db/schema.sql)

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS users (
  id              SERIAL        PRIMARY KEY,
  pseudo          VARCHAR(50)   UNIQUE NOT NULL,
  email           VARCHAR(255)  UNIQUE NOT NULL,
  password_hash   VARCHAR(255)  NOT NULL,
  avatar_url      VARCHAR(255)  NOT NULL DEFAULT '/avatars/default.png',

  is_verified     BOOLEAN       NOT NULL DEFAULT FALSE,
  verify_token    VARCHAR(255),

  reset_token     VARCHAR(255),
  reset_expires   TIMESTAMPTZ,

  two_fa_secret   VARCHAR(255),
  two_fa_enabled  BOOLEAN       NOT NULL DEFAULT FALSE,

  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION fn_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_users_updated_at ON users;
CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION fn_updated_at();

-- ── Books module ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS shelf (
  id        SERIAL      PRIMARY KEY,
  user_id   INTEGER     NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  ol_id     TEXT        NOT NULL,
  title     TEXT        NOT NULL,
  author    TEXT        NOT NULL,
  cover     TEXT,
  year      INTEGER,
  saved_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, ol_id)
);
