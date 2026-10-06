const { Pool } = require('pg');

// DATABASE_URL (Render, Neon…) takes precedence over the DB_* variables (local Postgres)
const ssl = process.env.NODE_ENV === 'production' || process.env.DB_SSL === 'true'
  ? { rejectUnauthorized: false }
  : false;

const pool = process.env.DATABASE_URL
  ? new Pool({ connectionString: process.env.DATABASE_URL, ssl })
  : new Pool({
      host:     process.env.DB_HOST,
      port:     parseInt(process.env.DB_PORT) || 5432,
      database: process.env.DB_NAME,
      user:     process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      ssl,
    });

pool.on('error', (err) => {
  console.error('[DB] Idle client error:', err.message);
  process.exit(1);
});

module.exports = pool;
