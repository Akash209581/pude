const db = require('../config/db');

const sortableColumns = {
  serial_no: 'p.serial_no',
  paper_title: 'p.paper_title',
  conference_or_journal: 'p.conference_or_journal',
  paper_type: 'p.paper_type',
  year: 'p.year',
  created_at: 'p.created_at',
  student_name: 'primary_author',
};

function normalizeAuthors(data) {
  const incoming = Array.isArray(data.authors) && data.authors.length
    ? data.authors
    : [{ student_name: data.student_name, registration_number: data.registration_number }];

  const seen = new Set();
  return incoming
    .map((author, index) => ({
      student_name: String(author.student_name || '').trim(),
      registration_number: String(author.registration_number || '').trim(),
      author_order: Number(author.author_order) || index + 1,
    }))
    .filter((author) => {
      const key = author.registration_number.toLowerCase();
      if (!author.student_name || !author.registration_number || seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .map((author, index) => ({ ...author, author_order: index + 1 }));
}

function publicationSelect() {
  return `
    SELECT
      p.id,
      p.serial_no,
      p.paper_title,
      p.conference_or_journal,
      p.paper_name,
      p.paper_type,
      p.year,
      p.faculty_guide,
      p.created_at,
      COALESCE(
        JSON_AGG(
          JSON_BUILD_OBJECT(
            'id', pa.id,
            'student_name', pa.student_name,
            'registration_number', pa.registration_number,
            'author_order', pa.author_order
          )
          ORDER BY pa.author_order
        ) FILTER (WHERE pa.id IS NOT NULL),
        '[]'
      ) AS authors,
      STRING_AGG(pa.student_name || ' (' || pa.registration_number || ')', ', ' ORDER BY pa.author_order) AS authors_text,
      MIN(pa.student_name) FILTER (WHERE pa.author_order = 1) AS primary_author
    FROM publications p
    LEFT JOIN publication_authors pa ON pa.publication_id = p.id
  `;
}

function buildFilters(query) {
  const values = [];
  const where = [];

  if (query.search) {
    values.push(`%${query.search}%`);
    const i = values.length;
    where.push(`(
      p.paper_title ILIKE $${i}
      OR p.paper_name ILIKE $${i}
      OR p.paper_type ILIKE $${i}
      OR CAST(p.year AS TEXT) ILIKE $${i}
      OR EXISTS (
        SELECT 1 FROM publication_authors search_author
        WHERE search_author.publication_id = p.id
          AND (search_author.student_name ILIKE $${i} OR search_author.registration_number ILIKE $${i})
      )
    )`);
  }

  if (query.category) {
    values.push(query.category);
    where.push(`p.conference_or_journal = $${values.length}`);
  }

  if (query.paper_type) {
    values.push(query.paper_type);
    where.push(`p.paper_type = $${values.length}`);
  }

  if (query.year) {
    values.push(Number(query.year));
    where.push(`p.year = $${values.length}`);
  }

  return {
    clause: where.length ? `WHERE ${where.join(' AND ')}` : '',
    values,
  };
}

async function list(query) {
  const page = Math.max(Number(query.page) || 1, 1);
  const all = query.all === 'true' || query.all === true;
  const limit = all ? 100000 : Math.min(Math.max(Number(query.limit) || 10, 1), 100);
  const offset = all ? 0 : (page - 1) * limit;
  const sortBy = sortableColumns[query.sortBy] || 'p.created_at';
  const order = String(query.order).toLowerCase() === 'asc' ? 'ASC' : 'DESC';
  const filters = buildFilters(query);

  const params = [...filters.values, limit, offset];
  const { rows } = await db.query(
    `${publicationSelect()}
     ${filters.clause}
     GROUP BY p.id
     ORDER BY ${sortBy} ${order}
     LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params,
  );
  const count = await db.query(`SELECT COUNT(*)::INT AS total FROM publications p ${filters.clause}`, filters.values);

  return { rows, total: count.rows[0].total, page, limit };
}

async function findById(id, client = db) {
  const { rows } = await client.query(
    `${publicationSelect()}
     WHERE p.id = $1
     GROUP BY p.id`,
    [id],
  );
  return rows[0];
}

async function insertAuthors(client, publicationId, authors) {
  for (const author of authors) {
    await client.query(
      `INSERT INTO publication_authors (publication_id, student_name, registration_number, author_order)
       VALUES ($1, $2, $3, $4)`,
      [publicationId, author.student_name, author.registration_number, author.author_order],
    );
  }
}

async function ensureUniquePublication(client, data, ignoredId = null) {
  const params = [
    data.paper_title,
    data.conference_or_journal,
    data.paper_name,
    Number(data.year),
  ];
  const ignoredClause = ignoredId ? `AND id <> $5` : '';
  if (ignoredId) params.push(ignoredId);

  const { rows } = await client.query(
    `SELECT id FROM publications
     WHERE LOWER(paper_title) = LOWER($1)
       AND conference_or_journal = $2
       AND LOWER(paper_name) = LOWER($3)
       AND year = $4
       ${ignoredClause}
     LIMIT 1`,
    params,
  );

  if (rows[0]) {
    const error = new Error('A publication with the same title, venue, category, and year already exists.');
    error.code = '23505';
    throw error;
  }
}

async function create(data) {
  const authors = normalizeAuthors(data);
  if (!authors.length) {
    const error = new Error('At least one author is required.');
    error.status = 422;
    throw error;
  }

  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');
    await ensureUniquePublication(client, data);

    const maxRes = await client.query('SELECT COALESCE(MAX(serial_no), 0) AS max FROM publications');
    const newSerial = parseInt(maxRes.rows[0].max, 10) + 1;

    const { rows } = await client.query(
      `INSERT INTO publications
       (serial_no, paper_title, conference_or_journal, paper_name, paper_type, year, faculty_guide)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       RETURNING id`,
      [
        newSerial,
        data.paper_title,
        data.conference_or_journal,
        data.paper_name,
        data.paper_type,
        Number(data.year),
        data.faculty_guide || null,
      ],
    );
    await insertAuthors(client, rows[0].id, authors);
    const publication = await findById(rows[0].id, client);
    await client.query('COMMIT');
    return publication;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function update(id, data) {
  const authors = normalizeAuthors(data);
  if (!authors.length) {
    const error = new Error('At least one author is required.');
    error.status = 422;
    throw error;
  }

  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');
    await ensureUniquePublication(client, data, id);
    const { rows } = await client.query(
      `UPDATE publications SET
        serial_no = $1,
        paper_title = $2,
        conference_or_journal = $3,
        paper_name = $4,
        paper_type = $5,
        year = $6,
        faculty_guide = $7
       WHERE id = $8
       RETURNING id`,
      [
        data.serial_no || null,
        data.paper_title,
        data.conference_or_journal,
        data.paper_name,
        data.paper_type,
        Number(data.year),
        data.faculty_guide || null,
        id,
      ],
    );

    if (!rows[0]) {
      await client.query('ROLLBACK');
      return null;
    }

    await client.query('DELETE FROM publication_authors WHERE publication_id = $1', [id]);
    await insertAuthors(client, id, authors);
    const publication = await findById(id, client);
    await client.query('COMMIT');
    return publication;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function remove(id) {
  const { rowCount } = await db.query('DELETE FROM publications WHERE id = $1', [id]);
  return rowCount > 0;
}

async function analytics() {
  const queries = await Promise.all([
    db.query(`SELECT COUNT(*)::INT total_publications,
      (SELECT COUNT(DISTINCT registration_number)::INT FROM publication_authors) total_students,
      COUNT(*) FILTER (WHERE conference_or_journal = 'Conference')::INT total_conference_papers,
      COUNT(*) FILTER (WHERE conference_or_journal = 'Journal')::INT total_journal_papers,
      COUNT(*) FILTER (WHERE faculty_guide IS NOT NULL AND faculty_guide <> '')::INT total_faculty_publications,
      COUNT(*) FILTER (WHERE year = EXTRACT(YEAR FROM CURRENT_DATE)::INT)::INT publications_this_year
      FROM publications`),
    db.query('SELECT year, COUNT(*)::INT count FROM publications GROUP BY year ORDER BY year'),
    db.query('SELECT conference_or_journal AS name, COUNT(*)::INT value FROM publications GROUP BY conference_or_journal ORDER BY name'),
    db.query(`SELECT pa.student_name, pa.registration_number, COUNT(DISTINCT pa.publication_id)::INT publications
      FROM publication_authors pa
      GROUP BY pa.student_name, pa.registration_number
      ORDER BY publications DESC, pa.student_name
      LIMIT 5`),
    db.query(`SELECT TO_CHAR(created_at, 'Mon YYYY') AS month, DATE_TRUNC('month', created_at) AS month_date, COUNT(*)::INT count
      FROM publications GROUP BY month, month_date ORDER BY month_date`),
    db.query('SELECT paper_name, COUNT(*)::INT count FROM publications WHERE conference_or_journal = $1 GROUP BY paper_name ORDER BY count DESC, paper_name LIMIT 5', ['Conference']),
    db.query(`${publicationSelect()} GROUP BY p.id ORDER BY p.created_at DESC LIMIT 8`),
    db.query("SELECT year, COUNT(*)::INT count FROM publications WHERE conference_or_journal = 'Conference' GROUP BY year ORDER BY year"),
    db.query("SELECT year, COUNT(*)::INT count FROM publications WHERE conference_or_journal = 'Journal' GROUP BY year ORDER BY year"),
    db.query("SELECT p.year, COUNT(DISTINCT pa.registration_number)::INT count FROM publications p JOIN publication_authors pa ON pa.publication_id = p.id GROUP BY p.year ORDER BY p.year"),
  ]);

  return {
    stats: queries[0].rows[0],
    byYear: queries[1].rows,
    byCategory: queries[2].rows,
    topStudents: queries[3].rows,
    monthly: queries[4].rows.map(({ month, count }) => ({ month, count })),
    topConferences: queries[5].rows,
    recentPublications: queries[6].rows,
    confByYear: queries[7].rows,
    journalByYear: queries[8].rows,
    studentsByYear: queries[9].rows,
  };
}

async function insertMany(items) {
  if (!items || items.length === 0) {
    return { inserted: [], duplicates: [], failed: [] };
  }

  const inserted = [];
  const duplicates = [];
  const failed = [];

  // 1. Normalize authors and filter out invalid rows
  const toProcess = [];
  for (const item of items) {
    try {
      const authors = normalizeAuthors(item);
      if (!authors.length) {
        failed.push({ row: item, error: 'At least one author is required after normalization.' });
        continue;
      }
      toProcess.push({
        ...item,
        normalizedAuthors: authors,
        uniqueKey: [
          String(item.paper_title || '').trim().toLowerCase(),
          String(item.conference_or_journal || '').trim().toLowerCase().includes('journal') ? 'Journal' : 'Conference',
          String(item.paper_name || '').trim().toLowerCase(),
          Number(item.year)
        ].join('::')
      });
    } catch (err) {
      failed.push({ row: item, error: err.message });
    }
  }

  if (toProcess.length === 0) {
    return { inserted, duplicates, failed };
  }

  // Define batch chunk size
  const CHUNK_SIZE = 250;

  for (let c = 0; c < toProcess.length; c += CHUNK_SIZE) {
    const chunk = toProcess.slice(c, c + CHUNK_SIZE);
    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');

      const maxRes = await client.query('SELECT COALESCE(MAX(serial_no), 0) AS max FROM publications');
      let currentMax = parseInt(maxRes.rows[0].max, 10);

      // 2. Identify duplicates in this chunk
      const checkParams = [];
      const checkPlaceholders = [];
      chunk.forEach((item, index) => {
        checkParams.push(
          String(item.paper_title || '').trim().toLowerCase(),
          item.conference_or_journal === 'Journal' || String(item.conference_or_journal).toLowerCase().includes('journal') ? 'Journal' : 'Conference',
          String(item.paper_name || '').trim().toLowerCase(),
          Number(item.year)
        );
        const base = index * 4;
        checkPlaceholders.push(`($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4})`);
      });

      const checkQuery = `
        SELECT id, LOWER(paper_title) as title, conference_or_journal as category, LOWER(paper_name) as venue, year
        FROM publications
        WHERE (LOWER(paper_title), conference_or_journal, LOWER(paper_name), year) IN (${checkPlaceholders.join(', ')})
      `;

      const { rows: existingRows } = await client.query(checkQuery, checkParams);

      const existingKeys = new Set(
        existingRows.map(r => [
          String(r.title || '').trim().toLowerCase(),
          String(r.category || '').trim(),
          String(r.venue || '').trim().toLowerCase(),
          Number(r.year)
        ].join('::'))
      );

      const toInsert = [];
      for (const item of chunk) {
        if (existingKeys.has(item.uniqueKey)) {
          duplicates.push(item);
        } else {
          toInsert.push(item);
        }
      }

      // 3. Insert publications in this chunk
      if (toInsert.length > 0) {
        const pubParams = [];
        const pubPlaceholders = [];
        toInsert.forEach((item, index) => {
          currentMax++;
          pubParams.push(
            currentMax,
            item.paper_title,
            item.conference_or_journal === 'Journal' || String(item.conference_or_journal).toLowerCase().includes('journal') ? 'Journal' : 'Conference',
            item.paper_name,
            item.paper_type,
            Number(item.year),
            item.faculty_guide || null
          );
          const base = index * 7;
          pubPlaceholders.push(`($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}, $${base + 6}, $${base + 7})`);
        });

        const insertPubsQuery = `
          INSERT INTO publications
          (serial_no, paper_title, conference_or_journal, paper_name, paper_type, year, faculty_guide)
          VALUES ${pubPlaceholders.join(', ')}
          RETURNING id, LOWER(paper_title) as title, conference_or_journal as category, LOWER(paper_name) as venue, year
        `;

        const { rows: insertedPubs } = await client.query(insertPubsQuery, pubParams);

        const pubIdMap = new Map();
        insertedPubs.forEach(row => {
          const key = [
            String(row.title || '').trim().toLowerCase(),
            String(row.category || '').trim(),
            String(row.venue || '').trim().toLowerCase(),
            Number(row.year)
          ].join('::');
          pubIdMap.set(key, row.id);
        });

        // 4. Insert authors in this chunk
        const authorParams = [];
        const authorPlaceholders = [];
        let authorCount = 0;

        toInsert.forEach(item => {
          const pubId = pubIdMap.get(item.uniqueKey);
          if (pubId) {
            inserted.push({ id: pubId });
            item.normalizedAuthors.forEach(author => {
              authorParams.push(pubId, author.student_name, author.registration_number, author.author_order);
              const base = authorCount * 4;
              authorPlaceholders.push(`($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4})`);
              authorCount++;
            });
          }
        });

        if (authorPlaceholders.length > 0) {
          const insertAuthorsQuery = `
            INSERT INTO publication_authors (publication_id, student_name, registration_number, author_order)
            VALUES ${authorPlaceholders.join(', ')}
          `;
          await client.query(insertAuthorsQuery, authorParams);
        }
      }

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      console.error(`Error during batch insertion chunk ${c}-${c + CHUNK_SIZE}:`, error);
      chunk.forEach(item => {
        failed.push({ row: item, error: error.message });
      });
    } finally {
      client.release();
    }
  }

  return { inserted, duplicates, failed };
}

async function listStudents() {
  const { rows } = await db.query(`
    SELECT pa.student_name, pa.registration_number, COUNT(DISTINCT pa.publication_id)::INT publications
    FROM publication_authors pa
    GROUP BY pa.student_name, pa.registration_number
    ORDER BY publications DESC, pa.student_name
  `);
  return rows;
}

module.exports = { list, create, update, remove, analytics, insertMany, listStudents };
