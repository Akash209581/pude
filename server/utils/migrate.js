const db = require('../config/db');

async function migrate() {
  console.log('Starting database migration...');
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');

    const checkColumn = async (tableName, columnName) => {
      const res = await client.query(
        `SELECT 1 FROM information_schema.columns 
         WHERE table_name = $1 AND column_name = $2`,
        [tableName, columnName]
      );
      return res.rowCount > 0;
    };

    // Rename event_date to from_date if event_date exists
    if (await checkColumn('events', 'event_date')) {
      console.log('Renaming event_date to from_date...');
      await client.query('ALTER TABLE events RENAME COLUMN event_date TO from_date');
    }

    // Rename organizer to coordinator_name if organizer exists
    if (await checkColumn('events', 'organizer')) {
      console.log('Renaming organizer to coordinator_name...');
      await client.query('ALTER TABLE events RENAME COLUMN organizer TO coordinator_name');
    }

    // Rename image to poster if image exists
    if (await checkColumn('events', 'image')) {
      console.log('Renaming image to poster...');
      await client.query('ALTER TABLE events RENAME COLUMN image TO poster');
    }

    // Add employee_id
    if (!(await checkColumn('events', 'employee_id'))) {
      console.log('Adding employee_id column...');
      await client.query("ALTER TABLE events ADD COLUMN employee_id VARCHAR(120) NOT NULL DEFAULT 'VU2021001'");
    }

    // Add event_type
    if (!(await checkColumn('events', 'event_type'))) {
      console.log('Adding event_type column...');
      await client.query('ALTER TABLE events ADD COLUMN event_type VARCHAR(120)');
    }

    // Add academic_year
    if (!(await checkColumn('events', 'academic_year'))) {
      console.log('Adding academic_year column...');
      await client.query("ALTER TABLE events ADD COLUMN academic_year VARCHAR(30) NOT NULL DEFAULT '2023-2024'");
    }

    // Add to_date
    if (!(await checkColumn('events', 'to_date'))) {
      console.log('Adding to_date column...');
      await client.query('ALTER TABLE events ADD COLUMN to_date DATE');
    }

    // Add budget
    if (!(await checkColumn('events', 'budget'))) {
      console.log('Adding budget column...');
      await client.query('ALTER TABLE events ADD COLUMN budget NUMERIC(12,2)');
    }

    // Add outcome
    if (!(await checkColumn('events', 'outcome'))) {
      console.log('Adding outcome column...');
      await client.query('ALTER TABLE events ADD COLUMN outcome TEXT');
    }

    // Add one_page_report
    if (!(await checkColumn('events', 'one_page_report'))) {
      console.log('Adding one_page_report column...');
      await client.query('ALTER TABLE events ADD COLUMN one_page_report TEXT');
    }

    // Add winners_list
    if (!(await checkColumn('events', 'winners_list'))) {
      console.log('Adding winners_list column...');
      await client.query('ALTER TABLE events ADD COLUMN winners_list TEXT');
    }

    // Add sample_certificate
    if (!(await checkColumn('events', 'sample_certificate'))) {
      console.log('Adding sample_certificate column...');
      await client.query('ALTER TABLE events ADD COLUMN sample_certificate TEXT');
    }

    // Add budget_report
    if (!(await checkColumn('events', 'budget_report'))) {
      console.log('Adding budget_report column...');
      await client.query('ALTER TABLE events ADD COLUMN budget_report TEXT');
    }

    // Re-index publications serial_no to be fully sequential starting from 1
    console.log('Re-indexing existing publications serial numbers sequentially...');
    await client.query(`
      WITH numbered_pubs AS (
        SELECT id, ROW_NUMBER() OVER (ORDER BY created_at ASC, id ASC) as rn
        FROM publications
      )
      UPDATE publications p
      SET serial_no = np.rn
      FROM numbered_pubs np
      WHERE p.id = np.id
    `);

    await client.query('COMMIT');
    console.log('Migration completed successfully!');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Migration failed:', error);
  } finally {
    client.release();
    await db.pool.end();
  }
}

migrate();
