const db = require('./db');

async function initDB() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS shelf (
      id        SERIAL PRIMARY KEY,
      user_id   INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      ol_id     TEXT NOT NULL,
      title     TEXT NOT NULL,
      author    TEXT NOT NULL,
      cover     TEXT,
      year      INTEGER,
      saved_at  TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE (user_id, ol_id)
    )
  `);
}

module.exports = initDB;
