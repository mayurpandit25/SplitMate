const express = require('express');
const db = require('../config/db');
const { requireAuth } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();
router.use(requireAuth);

// Find registered users by email so a group owner can add existing accounts.
router.get('/search', asyncHandler(async (req, res) => {
  const email = String(req.query.email || '').trim().toLowerCase();
  if (!email || email.length < 3) return res.status(400).json({ message: 'Provide at least 3 characters of an email.' });
  const [rows] = await db.execute(
    'SELECT id, name, email FROM users WHERE email LIKE ? AND id <> ? ORDER BY name LIMIT 10',
    [`%${email}%`, req.user.id]
  );
  res.json({ items: rows });
}));

module.exports = router;
