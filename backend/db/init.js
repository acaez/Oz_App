// Run: npm run db:init — applies schema.sql (idempotent)
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const fs = require('fs');
const db = require('../config/db');

(async () => {
  const sql = fs.readFileSync(require('path').join(__dirname, 'schema.sql'), 'utf8');
  try {
    await db.query(sql);
    console.log('[DB] Schema applied');
  } catch (err) {
    console.error('[DB] Schema failed:', err.message);
    process.exitCode = 1;
  } finally {
    await db.end();
  }
})();
