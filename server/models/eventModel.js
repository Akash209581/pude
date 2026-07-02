const db = require('../config/db');

async function list(type) {
  const where = type === 'upcoming' ? 'WHERE from_date >= CURRENT_DATE' : type === 'past' ? 'WHERE from_date < CURRENT_DATE' : '';
  const { rows } = await db.query(`SELECT * FROM events ${where} ORDER BY from_date ASC, created_at DESC`);
  return rows;
}

async function create(data) {
  const { rows } = await db.query(
    `INSERT INTO events (
      employee_id, coordinator_name, event_name, event_type, academic_year,
      from_date, to_date, venue, budget, description, outcome,
      poster, one_page_report, winners_list, sample_certificate, budget_report
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16) RETURNING *`,
    [
      data.employee_id,
      data.coordinator_name,
      data.event_name,
      data.event_type || null,
      data.academic_year,
      data.from_date,
      data.to_date || null,
      data.venue,
      data.budget || null,
      data.description,
      data.outcome || null,
      data.poster || null,
      data.one_page_report || null,
      data.winners_list || null,
      data.sample_certificate || null,
      data.budget_report || null,
    ],
  );
  return rows[0];
}

async function update(id, data) {
  const { rows } = await db.query(
    `UPDATE events SET
      employee_id = $1,
      coordinator_name = $2,
      event_name = $3,
      event_type = $4,
      academic_year = $5,
      from_date = $6,
      to_date = $7,
      venue = $8,
      budget = $9,
      description = $10,
      outcome = $11,
      poster = COALESCE($12, poster),
      one_page_report = COALESCE($13, one_page_report),
      winners_list = COALESCE($14, winners_list),
      sample_certificate = COALESCE($15, sample_certificate),
      budget_report = COALESCE($16, budget_report)
     WHERE id = $17 RETURNING *`,
    [
      data.employee_id,
      data.coordinator_name,
      data.event_name,
      data.event_type || null,
      data.academic_year,
      data.from_date,
      data.to_date || null,
      data.venue,
      data.budget || null,
      data.description,
      data.outcome || null,
      data.poster || null,
      data.one_page_report || null,
      data.winners_list || null,
      data.sample_certificate || null,
      data.budget_report || null,
      id,
    ],
  );
  return rows[0];
}

async function remove(id) {
  const { rowCount } = await db.query('DELETE FROM events WHERE id = $1', [id]);
  return rowCount > 0;
}

async function recent() {
  const { rows } = await db.query('SELECT * FROM events ORDER BY from_date DESC LIMIT 6');
  return rows;
}

module.exports = { list, create, update, remove, recent };
