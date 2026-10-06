const { Router }     = require('express');
const { requireAuth } = require('../middleware/auth');
const { search, addToShelf, removeFromShelf, getFeed } = require('../controllers/booksController');

const router = Router();

router.get('/search',              search);
router.get('/feed',                requireAuth, getFeed);
router.post('/shelf',              requireAuth, addToShelf);
router.delete('/shelf',            requireAuth, removeFromShelf);

module.exports = router;
