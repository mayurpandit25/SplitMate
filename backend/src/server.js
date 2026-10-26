require('dotenv').config();

const express = require('express');
const cors = require('cors');
const db = require('./config/db');

const app = express();
const port = Number(process.env.PORT || 8080);

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  console.error('JWT_SECRET must be set in .env and be at least 32 characters long.');
  process.exit(1);
}

app.use(cors({
  origin: process.env.FRONTEND_ORIGIN ? process.env.FRONTEND_ORIGIN.split(',').map(s => s.trim()) : 'http://localhost:5173'
}));
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', async (req, res) => {
  try {
    await db.query('SELECT 1');
    res.json({ status: 'ok', service: 'splitmate-api', database: 'connected' });
  } catch {
    res.status(503).json({ status: 'error', service: 'splitmate-api', database: 'unavailable' });
  }
});

app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/users', require('./routes/users.routes'));
app.use('/api/groups', require('./routes/groups.routes'));
app.use('/api/expenses', require('./routes/expenses.routes'));
app.use('/api/balances', require('./routes/balances.routes'));
app.use('/api/settlements', require('./routes/settlements.routes'));

app.use((req, res) => res.status(404).json({ message: 'API endpoint not found.' }));

app.use((err, req, res, next) => {
  console.error(err);
  if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ message: 'A record with these details already exists.' });
  if (err.code === 'ER_NO_REFERENCED_ROW_2') return res.status(400).json({ message: 'Referenced user or group does not exist.' });
  res.status(500).json({
    message: process.env.NODE_ENV === 'production' ? 'Internal server error.' : err.message
  });
});

app.listen(port, () => console.log(`SplitMate API listening on http://localhost:${port}`));
