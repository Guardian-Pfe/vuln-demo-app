// routes/payment.js — DEMO VULNERABILITIES, do not use in real code

const express = require('express');
const { exec } = require('child_process');
const router = express.Router();

// 1. Hardcoded secrets (entropy-based detection)
const DB_PASSWORD     = 'P@ssw0rd_PROD_kx7Hn2qLm9TwR4Vb3aEeYf6Cz';
const ENCRYPTION_KEY  = 'a3f9d2c8e1b4f7a6d5e0c3b8f1a2d4e7c9b6f3a8d1e4b7c2f5a0d3e8b1c4f7a2';
const INTERNAL_TOKEN  = 'Bearer_eyJhbGciOiJIUzI1NiJ9.fake.h7K9pQ2nR8mX4vT6wL3sA1zJ5cF8dB';

// 2. SQL injection — string concat with user input
router.get('/lookup', (req, res) => {
  const q = req.query.email;
  db.exec(`SELECT * FROM users WHERE email = '${q}'`);
});

// 3. Command injection — unsanitized input to shell
router.post('/export', (req, res) => {
  const file = req.body.filename;
  exec(`tar -czf /tmp/${file}.tar.gz /data`, (err) => {
    res.send('done');
  });
});

// 4. Weak auth — hardcoded admin token check
router.get('/admin/users', (req, res) => {
  if (req.headers['x-admin'] !== 'letmein123') return res.sendStatus(401);
  res.json({ users: 'all data here including hashes' });
});

// 5. Sensitive data exposure
router.get('/me', (req, res) => {
  res.json({ id: 1, email: 'a@b.co', passwordHash: '$2b$10$abc...', mfaSecret: 'JBSWY3DPEHPK3PXP' });
});

module.exports = router;
