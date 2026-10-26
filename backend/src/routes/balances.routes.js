const express = require('express');
const db = require('../config/db');
const { requireAuth } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();
router.use(requireAuth);

// Pairwise balance from the signed-in user's perspective:
// positive = the other person owes the signed-in user; negative = the signed-in user owes them.
router.get('/', asyncHandler(async (req, res) => {
  const [people] = await db.execute(`
    SELECT DISTINCT u.id AS user_id, u.name, u.email
    FROM users u
    JOIN group_members theirs ON theirs.user_id = u.id
    JOIN group_members mine ON mine.group_id = theirs.group_id AND mine.user_id = ?
    WHERE u.id <> ?
    ORDER BY u.name
  `, [req.user.id, req.user.id]);

  const [expenseRows] = await db.execute(`
    SELECT e.paid_by, es.user_id, es.share_amount
    FROM expenses e
    JOIN expense_splits es ON es.expense_id = e.id
    JOIN group_members mine ON mine.group_id = e.group_id AND mine.user_id = ?
  `, [req.user.id]);
  const [settlementRows] = await db.execute(`
    SELECT s.paid_by, s.paid_to, s.amount
    FROM settlements s
    WHERE (s.paid_by = ? OR s.paid_to = ?)
      AND (s.group_id IS NULL OR EXISTS (
        SELECT 1 FROM group_members gm WHERE gm.group_id = s.group_id AND gm.user_id = ?
      ))
  `, [req.user.id, req.user.id, req.user.id]);

  const balances = new Map(people.map(p => [Number(p.user_id), 0]));
  for (const row of expenseRows) {
    const payer = Number(row.paid_by);
    const participant = Number(row.user_id);
    const share = Number(row.share_amount);
    if (payer === Number(req.user.id) && participant !== Number(req.user.id) && balances.has(participant)) {
      balances.set(participant, balances.get(participant) + share);
    }
    if (participant === Number(req.user.id) && payer !== Number(req.user.id) && balances.has(payer)) {
      balances.set(payer, balances.get(payer) - share);
    }
  }
  for (const s of settlementRows) {
    const from = Number(s.paid_by), to = Number(s.paid_to), amount = Number(s.amount);
    if (from === Number(req.user.id) && balances.has(to)) balances.set(to, balances.get(to) + amount);
    if (to === Number(req.user.id) && balances.has(from)) balances.set(from, balances.get(from) - amount);
  }
  const items = people.map(p => ({
    userId: Number(p.user_id), name: p.name, email: p.email,
    netBalance: Number((balances.get(Number(p.user_id)) || 0).toFixed(2))
  }));
  res.json({ items, note: 'Positive means the person owes you; negative means you owe the person. Balances are calculated across shared groups.' });
}));

module.exports = router;
