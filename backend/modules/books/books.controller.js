const db = require('../../config/db');

const SEARCH_URL = 'https://openlibrary.org/search.json';
const COVER_URL  = 'https://covers.openlibrary.org/b/id';
const FIELDS     = 'key,title,author_name,cover_i,first_publish_year';

const searchCache = new Map();
const CACHE_TTL   = 5 * 60 * 1000; // 5 minutes

async function search(req, res) {
  const q = (req.query.q || '').trim().toLowerCase();
  if (!q) return res.json([]);

  const cached = searchCache.get(q);
  if (cached && Date.now() - cached.ts < CACHE_TTL) {
    return res.json(cached.data);
  }

  try {
    const url      = `${SEARCH_URL}?q=${encodeURIComponent(q)}&limit=12&fields=${FIELDS}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Open Library error');

    const raw   = await response.json();
    const books = (raw.docs || [])
      .filter(doc => doc.cover_i)
      .slice(0, 10)
      .map(doc => ({
        id:     doc.key,
        title:  doc.title,
        author: doc.author_name?.[0] || 'Unknown',
        cover:  `${COVER_URL}/${doc.cover_i}-M.jpg`,
        year:   doc.first_publish_year || null,
      }));

    searchCache.set(q, { data: books, ts: Date.now() });
    res.json(books);
  } catch {
    res.status(502).json({ error: 'Search unavailable' });
  }
}

async function addToShelf(req, res) {
  const { id, title, author, cover, year } = req.body;

  if (!id || !title || !author)
    return res.status(400).json({ error: 'id, title and author are required' });

  try {
    await db.query(
      `INSERT INTO shelf (user_id, ol_id, title, author, cover, year)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (user_id, ol_id) DO NOTHING`,
      [req.user.id, id, title, author, cover || null, year || null]
    );
    res.status(201).json({ saved: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
}

async function removeFromShelf(req, res) {
  const olId = req.query.id;

  try {
    await db.query(
      'DELETE FROM shelf WHERE user_id = $1 AND ol_id = $2',
      [req.user.id, olId]
    );
    res.json({ removed: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
}

async function getFeed(req, res) {
  try {
    const result = await db.query(
      `SELECT ol_id AS id, title, author, cover, year, saved_at
       FROM shelf
       WHERE user_id = $1
       ORDER BY saved_at DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
}

module.exports = { search, addToShelf, removeFromShelf, getFeed };
