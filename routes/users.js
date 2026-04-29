const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { exec } = require('child_process');
const db = require('../db');

// Hardcoded JWT secret (also duplicated from .env to show it in source)
const JWT_SECRET = 'my_super_secret_jwt_key_do_not_share';

// POST /api/login — SQL injection via string concatenation
router.post('/login', (req, res) => {
  const { username, password } = req.body;

  // VULN: SQL injection — username is concatenated directly into the query
  const query = `SELECT * FROM users WHERE username = '${username}'`;
  let user;
  try {
    user = db.prepare(query).get();
  } catch (err) {
    return res.status(500).json({ error: err.message, query });
  }

  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const valid = bcrypt.compareSync(password, user.password);
  if (!valid) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  // VULN: JWT signed with hardcoded secret
  const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '8h' });

  // VULN: Sensitive data exposure — returns full user row including password hash
  res.json({ token, user });
});

// GET /api/users/:id — IDOR, no ownership check
router.get('/:id', (req, res) => {
  const { id } = req.params;

  // VULN: SQL injection — id is concatenated directly
  const query = `SELECT * FROM users WHERE id = ${id}`;
  let user;
  try {
    user = db.prepare(query).get();
  } catch (err) {
    return res.status(500).json({ error: err.message, query });
  }

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  // VULN: IDOR — any caller gets any user's full record (SSN, credit card, password hash)
  res.json(user);
});

// GET /api/users/search?q= — SQL injection via query string
router.get('/search', (req, res) => {
  const q = req.query.q || '';

  // VULN: SQL injection
  const query = `SELECT * FROM users WHERE username LIKE '%${q}%' OR email LIKE '%${q}%'`;
  let users;
  try {
    users = db.prepare(query).all();
  } catch (err) {
    return res.status(500).json({ error: err.message, query });
  }

  // VULN: Sensitive data exposure — full rows returned
  res.json(users);
});

// POST /api/users/ping — command injection via child_process.exec
router.post('/ping', (req, res) => {
  const { host } = req.body;

  // VULN: Command injection — host is passed directly to the shell
  exec(`ping -n 2 ${host}`, (err, stdout, stderr) => {
    res.json({ host, stdout, stderr, error: err ? err.message : null });
  });
});

// POST /api/users/register — no validation, stores plaintext password, returns full row
router.post('/register', (req, res) => {
  const { username, email, password, role } = req.body;

  // VULN: Stores password in plaintext, no hashing
  // VULN: SQL injection via concatenation
  // VULN: Caller can self-assign role='admin'
  const query = `INSERT INTO users (username, email, password, role)
                 VALUES ('${username}', '${email}', '${password}', '${role || 'user'}')`;
  let result;
  try {
    result = db.prepare(query).run();
  } catch (err) {
    return res.status(500).json({ error: err.message, query });
  }

  // VULN: Sensitive data exposure — echoes back plaintext password in response
  res.status(201).json({ id: result.lastInsertRowid, username, email, password, role });
});

// GET /api/users/export — dumps entire users table as CSV with no auth
router.get('/export', (req, res) => {
  const users = db.prepare('SELECT * FROM users').all();
  const csv = [
    'id,username,email,password,role,ssn,credit_card,created_at',
    ...users.map(u =>
      `${u.id},${u.username},${u.email},${u.password},${u.role},${u.ssn},${u.credit_card},${u.created_at}`
    ),
  ].join('\n');

  // VULN: Unauthenticated bulk data export including SSNs, credit cards, password hashes
  res.setHeader('Content-Type', 'text/csv');
  res.send(csv);
});

// POST /api/users/report — second command injection via exec (uses user-supplied filename)
router.post('/report', (req, res) => {
  const { filename } = req.body;

  // VULN: Command injection — filename passed directly to shell
  exec(`cat logs/${filename}`, (err, stdout, stderr) => {
    res.json({ filename, stdout, stderr, error: err ? err.message : null });
  });
});

module.exports = router;
