const db = require('../config/db');

async function list(type, academicYear) {
  const conditions = [];
  const values = [];
  
  if (type === 'upcoming') {
    conditions.push('from_date >= CURRENT_DATE');
  } else if (type === 'past') {
    conditions.push('from_date < CURRENT_DATE');
  }
  
  if (academicYear) {
    values.push(academicYear);
    conditions.push(`academic_year = $${values.length}`);
  }
  
  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const { rows } = await db.query(`SELECT * FROM events ${where} ORDER BY from_date ASC, created_at DESC`, values);
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

async function analytics() {
  const [totalRes, typeRes, yearRes, monthRes] = await Promise.all([
    db.query('SELECT COUNT(*) AS count, COALESCE(SUM(budget), 0) AS budget FROM events'),
    db.query('SELECT COALESCE(event_type, \'Other\') AS name, COUNT(*) AS value FROM events GROUP BY event_type'),
    db.query('SELECT academic_year AS year, COUNT(*) AS count, COALESCE(SUM(budget), 0) AS budget FROM events GROUP BY academic_year ORDER BY academic_year ASC'),
    db.query(`SELECT TO_CHAR(from_date, 'Mon YYYY') AS month, DATE_TRUNC('month', from_date) AS month_date, COUNT(*)::INT count FROM events GROUP BY DATE_TRUNC('month', from_date), TO_CHAR(from_date, 'Mon YYYY') ORDER BY month_date`)
  ]);

  return {
    totalEvents: parseInt(totalRes.rows[0].count, 10),
    totalBudget: parseFloat(totalRes.rows[0].budget),
    eventsByType: typeRes.rows.map(r => ({ name: r.name, value: parseInt(r.value, 10) })),
    eventsByYear: yearRes.rows.map(r => ({ year: r.year, count: parseInt(r.count, 10), budget: parseFloat(r.budget) })),
    eventsByMonth: monthRes.rows.map(r => ({ month: r.month, count: parseInt(r.count, 10) }))
  };
}

module.exports = { list, create, update, remove, recent, analytics };
