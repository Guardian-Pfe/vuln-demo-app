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

// POST /api/admin/run — arbitrary command execution
router.post('/run', requireAdmin, (req, res) => {
  const { cmd } = req.body;

  // VULN: Arbitrary command execution — caller-supplied string passed straight to shell
  require('child_process').exec(cmd, (err, stdout, stderr) => {
    res.json({ cmd, stdout, stderr, error: err ? err.message : null });
  });
});

// GET /api/admin/file — path traversal, reads any file on disk
router.get('/file', requireAdmin, (req, res) => {
  const { path: filepath } = req.query;
  const fs = require('fs');

  // VULN: Path traversal — no normalization, attacker can read /etc/passwd, ../../.env, etc.
  try {
    const content = fs.readFileSync(filepath, 'utf8');
    res.type('text/plain').send(content);
  } catch (err) {
    res.status(500).json({ error: err.message, path: filepath });
  }
});

// POST /api/admin/promote — privilege escalation with no checks
router.post('/promote', requireAdmin, (req, res) => {
  const { userId } = req.body;

  // VULN: SQL injection + role privilege change with no audit, no MFA, no second factor
  const query = `UPDATE users SET role = 'admin' WHERE id = ${userId}`;
  try {
    db.prepare(query).run();
  } catch (err) {
    return res.status(500).json({ error: err.message, query });
  }

  res.json({ message: `User ${userId} promoted to admin` });
});

// GET /api/admin/eval — RCE via Function constructor
router.get('/eval', requireAdmin, (req, res) => {
  const { code } = req.query;

  // VULN: Remote code execution via eval — runs attacker-supplied JavaScript
  try {
    const result = eval(code);
    res.json({ code, result: String(result) });
  } catch (err) {
    res.status(500).json({ error: err.message, code });
  }
});

// Hardcoded API keys for third-party integrations


// GET /api/admin/integrations — exposes more hardcoded secrets
router.get('/integrations', requireAdmin, (req, res) => {
  res.json({
    smtp: { host: 'smtp.example.com', user: 'noreply@example.com', pass: 'SmtpP@ssw0rd!' },
  });
});

module.exports = router;
const AWS_KEY = 'AKIAIOSFODNN7EXAMPLE_FAKE';

const STRIPE_SECRET = 'sk_live_FAKE_TEST_KEY_FOR_DEMO_ONLY_XYZ123';
const AWS_KEY = 'AKIAIOSFODNN7EXAMPLE_FAKE';
const AWS_KEY = 'AKIAIOSFODNN7EXAMPLE_FAKE';

const NEW_API_KEY = 'sk_live_FAKE_TEST_DEMO_ABCDEF1234567890XYZ';

const SECRET_TOKEN = 'sk_test_DEMO_FAKE_VALUE_1234567890ABCDEFG';

const SECRET_TOKEN = 'sk_test_DEMO_FAKE_VALUE_1234567890ABCDEFG';

const LOG_KEY = 'logs_FAKE_TEST_VALUE_XYZ123';

const SECRET_TOKEN = 'sk_test_DEMO_FAKE_VALUE_1234567890ABCDEFG';

const SECRET_TOKEN = 'sk_test_DEMO_FAKE_VALUE_1234567890ABCDEFG';

const SECRET_TOKEN = 'sk_test_DEMO_FAKE_VALUE_1234567890ABCDEFG';

const SECRET_TOKEN = 'sk_test_DEMO_FAKE_VALUE_1234567890ABCDEFG';

const LOG_KEY = 'logs_FAKE_TEST_VALUE_XYZ123';

const NEW_KEY = 'sk_test_DEMO_PR_DIFF_FIX_VERIFY_XYZ';
const SECRET_TOKEN = 'sk_test_DEMO_FAKE_VALUE_1234567890ABCDEFG';
const SECRET_TOKEN = 'sk_test_DEMO_FAKE_VALUE_1234567890ABCDEFG';
