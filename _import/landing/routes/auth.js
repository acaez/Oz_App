const { Router }     = require('express');
const { requireAuth } = require('../middleware/auth');
const { signup, login, me } = require('../controllers/authController');

const router = Router();

router.post('/signup', signup);
router.post('/login',  login);
router.get('/me',      requireAuth, me);

module.exports = router;
