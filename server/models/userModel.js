const db = require('../config/db');

async function findByUsername(username) {
  const { rows } = await db.query('SELECT * FROM users WHERE username = $1', [username]);
  return rows[0];
}

async function createAdmin(username, passwordHash) {
  const { rows } = await db.query(
    `INSERT INTO users (username, password_hash, role)
     VALUES ($1, $2, 'admin')
     ON CONFLICT (username) DO UPDATE SET password_hash = EXCLUDED.password_hash, role = 'admin'
     RETURNING id, username, role`,
    [username, passwordHash],
  );
  return rows[0];
}

module.exports = { findByUsername, createAdmin };
