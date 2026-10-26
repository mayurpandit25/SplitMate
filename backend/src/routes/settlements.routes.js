const express = require('express');
const db = require('../config/db');
const { requireAuth } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();
router.use(requireAuth);

router.get('/', asyncHandler(async (req, res) => {
  const [items] = await db.execute(`
    SELECT s.id, s.group_id, g.name AS group_name, s.paid_by, payer.name AS paid_by_name,
           s.paid_to, receiver.name AS paid_to_name, s.amount, s.note, s.settled_at
    FROM settlements s
    LEFT JOIN \`groups\` g ON g.id = s.group_id
    JOIN users payer ON payer.id = s.paid_by
    JOIN users receiver ON receiver.id = s.paid_to
    WHERE (s.paid_by = ? OR s.paid_to = ?)
      AND (s.group_id IS NULL OR EXISTS (
        SELECT 1 FROM group_members gm WHERE gm.group_id = s.group_id AND gm.user_id = ?
      ))
    ORDER BY s.settled_at DESC
  `, [req.user.id, req.user.id, req.user.id]);
  res.json({ items });
}));

router.post('/', asyncHandler(async (req, res) => {
  const paidTo = Number(req.body.paidTo);
  const groupId = req.body.groupId ? Number(req.body.groupId) : null;
  const amount = Number(req.body.amount);
  const note = String(req.body.note || '').trim().slice(0, 180) || null;
  if (!Number.isInteger(paidTo) || paidTo === req.user.id || !Number.isFinite(amount) || amount <= 0) {
    return res.status(400).json({ message: 'Provide a valid recipient and positive amount.' });
  }
  const [shared] = await db.execute(`
    SELECT 1 FROM group_members a JOIN group_members b ON a.group_id = b.group_id
    WHERE a.user_id = ? AND b.user_id = ? ${groupId ? 'AND a.group_id = ?' : ''} LIMIT 1
  `, groupId ? [req.user.id, paidTo, groupId] : [req.user.id, paidTo]);
  if (!shared.length) return res.status(400).json({ message: 'You and the recipient must share a group.' });
  const [result] = await db.execute(
    'INSERT INTO settlements (group_id, paid_by, paid_to, amount, note) VALUES (?, ?, ?, ?, ?)',
    [groupId, req.user.id, paidTo, amount.toFixed(2), note]
  );
  res.status(201).json({ item: { id: result.insertId, group_id: groupId, paid_by: req.user.id, paid_to: paidTo, amount, note } });
}));

module.exports = router;
