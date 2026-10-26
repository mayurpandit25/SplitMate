function splitEqually(total, userIds) {
  const ids = [...new Set(userIds.map(Number))];
  if (!ids.length) throw new Error('At least one participant is required.');
  const cents = Math.round(Number(total) * 100);
  const base = Math.floor(cents / ids.length);
  let remainder = cents - base * ids.length;
  return ids.map((userId) => {
    const centsForUser = base + (remainder-- > 0 ? 1 : 0);
    return { userId, shareAmount: centsForUser / 100 };
  });
}

module.exports = { splitEqually };
