const express = require('express');
const db = require('../config/db');
const { requireAuth } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();
router.use(requireAuth);

router.get('/', asyncHandler(async (req, res) => {
  const [rows] = await db.execute(`
    SELECT g.id, g.name, g.description, g.icon, g.created_by, g.created_at,
           COUNT(DISTINCT gm2.user_id) AS member_count,
           COALESCE(exp.total_spend, 0) AS total_spend
    FROM \`groups\` g
    JOIN group_members mine ON mine.group_id = g.id AND mine.user_id = ?
    JOIN group_members gm2 ON gm2.group_id = g.id
    LEFT JOIN (SELECT group_id, SUM(amount) AS total_spend FROM expenses GROUP BY group_id) exp ON exp.group_id = g.id
    GROUP BY g.id, exp.total_spend
    ORDER BY g.created_at DESC
  `, [req.user.id]);
  res.json({ items: rows });
}));

router.post('/', asyncHandler(async (req, res) => {
  const name = String(req.body.name || '').trim();
  const description = String(req.body.description || '').trim() || null;
  const icon = String(req.body.icon || 'users').trim().slice(0, 50);
  if (name.length < 2 || name.length > 120) {
    return res.status(400).json({ message: 'Group name must be 2–120 characters.' });
  }

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const [result] = await conn.execute(
      'INSERT INTO `groups` (name, description, icon, created_by) VALUES (?, ?, ?, ?)',
      [name, description, icon, req.user.id]
    );
    await conn.execute(
      'INSERT INTO group_members (group_id, user_id, role) VALUES (?, ?, ?)',
      [result.insertId, req.user.id, 'owner']
    );
    await conn.commit();
    res.status(201).json({
      item: {
        id: result.insertId,
        name,
        description,
        icon,
        created_by: req.user.id,
        member_count: 1,
        total_spend: 0
      }
    });
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
}));

router.get('/:id/members', asyncHandler(async (req, res) => {
  const [access] = await db.execute(
    'SELECT 1 FROM group_members WHERE group_id = ? AND user_id = ?',
    [req.params.id, req.user.id]
  );
  if (!access.length) return res.status(404).json({ message: 'Group not found.' });

  const [items] = await db.execute(`
    SELECT u.id, u.name, u.email, gm.role, gm.joined_at
    FROM group_members gm
    JOIN users u ON u.id = gm.user_id
    WHERE gm.group_id = ?
    ORDER BY gm.role = 'owner' DESC, u.name
  `, [req.params.id]);
  res.json({ items });
}));

router.post('/:id/members', asyncHandler(async (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  const [owner] = await db.execute(
    'SELECT id FROM `groups` WHERE id = ? AND created_by = ?',
    [req.params.id, req.user.id]
  );
  if (!owner.length) {
    return res.status(403).json({ message: 'Only the group creator can add members.' });
  }

  const [users] = await db.execute(
    'SELECT id, name, email FROM users WHERE email = ?',
    [email]
  );
  if (!users.length) {
    return res.status(404).json({ message: 'No registered user found with that email.' });
  }

  try {
    await db.execute(
      'INSERT INTO group_members (group_id, user_id, role) VALUES (?, ?, ?)',
      [req.params.id, users[0].id, 'member']
    );
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'This user is already a group member.' });
    }
    throw err;
  }
  res.status(201).json({ item: users[0] });
}));

router.delete('/:id', asyncHandler(async (req, res) => {
  const [result] = await db.execute(
    'DELETE FROM `groups` WHERE id = ? AND created_by = ?',
    [req.params.id, req.user.id]
  );
  if (!result.affectedRows) {
    return res.status(404).json({ message: 'Group not found or you are not its creator.' });
  }
  res.json({ message: 'Group deleted.' });
}));

module.exports = router;
