const express = require('express');
const db = require('../config/db');
const { requireAuth } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');
const { splitEqually } = require('../utils/splits');

const router = express.Router();
router.use(requireAuth);

router.get('/', asyncHandler(async (req, res) => {
  const groupId = req.query.groupId ? Number(req.query.groupId) : null;
  const params = [req.user.id];
  let groupFilter = '';
  if (groupId) { groupFilter = ' AND e.group_id = ?'; params.push(groupId); }
  const [items] = await db.execute(`
    SELECT e.id, e.group_id, g.name AS group_name, e.paid_by, payer.name AS paid_by_name,
           e.description, e.amount, e.category, e.expense_date, e.created_at
    FROM expenses e
    JOIN \`groups\` g ON g.id = e.group_id
    JOIN group_members mine ON mine.group_id = g.id AND mine.user_id = ?
    JOIN users payer ON payer.id = e.paid_by
    WHERE 1=1 ${groupFilter}
    ORDER BY e.expense_date DESC, e.id DESC
  `, params);
  res.json({ items });
}));

router.post('/', asyncHandler(async (req, res) => {
  const groupId = Number(req.body.groupId);
  const description = String(req.body.description || '').trim();
  const amount = Number(req.body.amount);
  const category = String(req.body.category || 'Other').trim().slice(0, 50);
  const expenseDate = req.body.expenseDate || new Date().toISOString().slice(0, 10);
  if (!Number.isInteger(groupId) || !description || description.length > 180 || !Number.isFinite(amount) || amount <= 0) {
    return res.status(400).json({ message: 'Provide a valid group, description, and positive amount.' });
  }
  const [membership] = await db.execute('SELECT user_id FROM group_members WHERE group_id = ? AND user_id = ?', [groupId, req.user.id]);
  if (!membership.length) return res.status(403).json({ message: 'You must be a member of this group to add an expense.' });

  const [members] = await db.execute('SELECT user_id FROM group_members WHERE group_id = ? ORDER BY user_id', [groupId]);
  const splits = splitEqually(amount, members.map(m => m.user_id));
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const [result] = await conn.execute(
      'INSERT INTO expenses (group_id, paid_by, description, amount, category, expense_date) VALUES (?, ?, ?, ?, ?, ?)',
      [groupId, req.user.id, description, amount.toFixed(2), category, expenseDate]
    );
    for (const split of splits) {
      await conn.execute('INSERT INTO expense_splits (expense_id, user_id, share_amount) VALUES (?, ?, ?)', [result.insertId, split.userId, split.shareAmount.toFixed(2)]);
    }
    await conn.commit();
    res.status(201).json({ item: { id: result.insertId, group_id: groupId, paid_by: req.user.id, description, amount, category, expense_date: expenseDate, splits } });
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
}));

router.get('/:id/splits', asyncHandler(async (req, res) => {
  const [access] = await db.execute(`
    SELECT e.id FROM expenses e JOIN group_members gm ON gm.group_id = e.group_id
    WHERE e.id = ? AND gm.user_id = ?
  `, [req.params.id, req.user.id]);
  if (!access.length) return res.status(404).json({ message: 'Expense not found.' });
  const [items] = await db.execute(`
    SELECT es.user_id, u.name, es.share_amount
    FROM expense_splits es JOIN users u ON u.id = es.user_id
    WHERE es.expense_id = ? ORDER BY u.name
  `, [req.params.id]);
  res.json({ items });
}));

router.delete('/:id', asyncHandler(async (req, res) => {
  const [result] = await db.execute('DELETE FROM expenses WHERE id = ? AND paid_by = ?', [req.params.id, req.user.id]);
  if (!result.affectedRows) return res.status(404).json({ message: 'Expense not found or only the payer can delete it.' });
  res.json({ message: 'Expense deleted.' });
}));

module.exports = router;
