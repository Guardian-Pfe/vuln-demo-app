require('dotenv').config();
const Database = require('better-sqlite3');

const db = new Database(process.env.DATABASE_URL || './users.db');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'user',
    ssn TEXT,
    credit_card TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );
`);

// Seed some users if the table is empty
const count = db.prepare('SELECT COUNT(*) as c FROM users').get();
if (count.c === 0) {
  const bcrypt = require('bcryptjs');
  const hash = (p) => bcrypt.hashSync(p, 10);

  db.prepare(`INSERT INTO users (username, email, password, role, ssn, credit_card) VALUES (?, ?, ?, ?, ?, ?)`).run(
    'admin', 'admin@example.com', hash('Admin1234!'), 'admin', '123-45-6789', '4111111111111111'
  );
  db.prepare(`INSERT INTO users (username, email, password, role, ssn, credit_card) VALUES (?, ?, ?, ?, ?, ?)`).run(
    'alice', 'alice@example.com', hash('password123'), 'user', '987-65-4321', '4222222222222222'
  );
  db.prepare(`INSERT INTO users (username, email, password, role, ssn, credit_card) VALUES (?, ?, ?, ?, ?, ?)`).run(
    'bob', 'bob@example.com', hash('qwerty'), 'user', '111-22-3333', '4333333333333333'
  );
}

module.exports = db;
