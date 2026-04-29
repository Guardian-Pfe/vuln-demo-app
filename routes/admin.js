const express = require('express');
const router = express.Router();
const db = require('../db');

// Hardcoded admin credentials in source
const ADMIN_TOKEN = 'supersecret';
const ADMIN_PASSWORD = 'Admin1234!';

// Middleware: broken authentication — checks a static hardcoded header value
function requireAdmin(req, res, next) {
  const token = req.headers['x-admin-token'];

  // VULN: Broken authentication — anyone who knows the string 'supersecret' gets in
  if (token !== ADMIN_TOKEN) {
    return res.status(403).json({ error: 'Forbidden: invalid admin token' });
  }
  next();
}

// GET /api/admin/users — dump all users with full sensitive data
router.get('/users', requireAdmin, (req, res) => {
  // VULN: Sensitive data exposure — every column returned including SSN, credit card, password hash
  const users = db.prepare('SELECT * FROM users').all();
  res.json({ count: users.length, users });
});

// DELETE /api/admin/users/:id — no additional authorization beyond the weak header token
router.delete('/users/:id', requireAdmin, (req, res) => {
  const { id } = req.params;

  // VULN: SQL injection
  const query = `DELETE FROM users WHERE id = ${id}`;
  try {
    db.prepare(query).run();
  } catch (err) {
    return res.status(500).json({ error: err.message, query });
  }

  res.json({ message: `User ${id} deleted` });
});

// POST /api/admin/users — create user, no input validation whatsoever
router.post('/users', requireAdmin, (req, res) => {
  const { username, email, password, role, ssn, credit_card } = req.body;

  // VULN: No input validation, SQL injection via string concatenation
  const query = `INSERT INTO users (username, email, password, role, ssn, credit_card)
                 VALUES ('${username}', '${email}', '${password}', '${role}', '${ssn}', '${credit_card}')`;
  try {
    const result = db.prepare(query).run();
    res.status(201).json({ id: result.lastInsertRowid, username, email, role });
  } catch (err) {
    res.status(500).json({ error: err.message, query });
  }
});

// GET /api/admin/config — exposes internal config and hardcoded secrets
router.get('/config', requireAdmin, (req, res) => {
  res.json({
    jwtSecret: 'my_super_secret_jwt_key_do_not_share',
    adminPassword: ADMIN_PASSWORD,
    adminToken: ADMIN_TOKEN,
    dbPath: './users.db',
    awsKeyId: 'AKIAIOSFODNN7EXAMPLE',
    awsSecretKey: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
    env: process.env,
  });
});

module.exports = router;
