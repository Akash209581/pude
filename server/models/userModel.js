const db = require('../config/db');

async function findByUsername(username) {
  const { rows } = await db.query('SELECT * FROM users WHERE username = $1', [username]);
  return rows[0];
}

async function findById(id) {
  const { rows } = await db.query('SELECT id, username, role, created_at FROM users WHERE id = $1', [id]);
  return rows[0];
}

async function listUsers() {
  const { rows } = await db.query('SELECT id, username, role, created_at FROM users ORDER BY created_at DESC');
  return rows;
}

async function createUser(username, passwordHash, role = 'ta') {
  const { rows } = await db.query(
    `INSERT INTO users (username, password_hash, role)
     VALUES ($1, $2, $3)
     RETURNING id, username, role, created_at`,
    [username, passwordHash, role],
  );
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

async function deleteUser(id) {
  const { rows } = await db.query('DELETE FROM users WHERE id = $1 RETURNING id, username', [id]);
  return rows[0];
}

module.exports = { findByUsername, findById, listUsers, createUser, createAdmin, deleteUser };

