const db = require('../config/db');

async function createPendingEdit(targetType, targetId, userId, username, changesData) {
  const { rows } = await db.query(
    `INSERT INTO pending_edits (target_type, target_id, requested_by, requested_by_username, changes_data, status)
     VALUES ($1, $2, $3, $4, $5, 'pending')
     RETURNING *`,
    [targetType, targetId, userId || null, username || null, JSON.stringify(changesData)],
  );
  return rows[0];
}

async function listPendingEdits() {
  const { rows } = await db.query(
    `SELECT * FROM pending_edits WHERE status = 'pending' ORDER BY created_at DESC`,
  );
  return rows;
}

async function findById(id) {
  const { rows } = await db.query(`SELECT * FROM pending_edits WHERE id = $1`, [id]);
  return rows[0];
}

async function deletePendingEdit(id) {
  const { rowCount } = await db.query(`DELETE FROM pending_edits WHERE id = $1`, [id]);
  return rowCount > 0;
}

module.exports = {
  createPendingEdit,
  listPendingEdits,
  findById,
  deletePendingEdit,
};
