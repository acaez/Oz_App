const router = require('express').Router();
const { requireAuth, require2FAPending } = require('../middlewares/authMiddleware');
const { setup, activate, verify, disable } = require('../controllers/tfaController');

// Step 2 of login — requires 2fa_pending cookie
router.post('/verify', require2FAPending, verify);

// Account management — requires full auth
router.post('/setup',    requireAuth, setup);
router.post('/activate', requireAuth, activate);
router.post('/disable',  requireAuth, disable);

module.exports = router;
