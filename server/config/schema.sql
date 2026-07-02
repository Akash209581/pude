CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(120) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role VARCHAR(30) NOT NULL DEFAULT 'admin',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS publications (
  id SERIAL PRIMARY KEY,
  serial_no INTEGER,
  paper_title TEXT NOT NULL,
  conference_or_journal VARCHAR(40) NOT NULL,
  paper_name TEXT NOT NULL,
  paper_type VARCHAR(120) NOT NULL,
  year INTEGER NOT NULL,
  faculty_guide VARCHAR(180),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT publications_unique_details UNIQUE (paper_title, conference_or_journal, paper_name, year)
);

ALTER TABLE publications DROP CONSTRAINT IF EXISTS publications_unique_registration_title;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'publications' AND column_name = 'student_name'
  ) THEN
    ALTER TABLE publications ALTER COLUMN student_name DROP NOT NULL;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'publications' AND column_name = 'registration_number'
  ) THEN
    ALTER TABLE publications ALTER COLUMN registration_number DROP NOT NULL;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS publication_authors (
  id SERIAL PRIMARY KEY,
  publication_id INTEGER NOT NULL REFERENCES publications(id) ON DELETE CASCADE,
  student_name VARCHAR(180) NOT NULL,
  registration_number VARCHAR(120) NOT NULL,
  author_order INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT publication_authors_unique_registration UNIQUE (publication_id, registration_number)
);

CREATE INDEX IF NOT EXISTS idx_publication_authors_publication_id ON publication_authors(publication_id);
CREATE INDEX IF NOT EXISTS idx_publication_authors_registration_number ON publication_authors(registration_number);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'publications' AND column_name = 'student_name'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'publications' AND column_name = 'registration_number'
  ) THEN
    EXECUTE $migration$
      WITH old_rows AS (
        SELECT
          p.id,
          MIN(p.id) OVER (
            PARTITION BY LOWER(p.paper_title), p.conference_or_journal, LOWER(p.paper_name), p.year
          ) AS keep_id,
          p.student_name,
          p.registration_number,
          ROW_NUMBER() OVER (
            PARTITION BY LOWER(p.paper_title), p.conference_or_journal, LOWER(p.paper_name), p.year
            ORDER BY p.id
          ) AS author_order
        FROM publications p
        WHERE p.student_name IS NOT NULL
          AND p.student_name <> ''
          AND p.registration_number IS NOT NULL
          AND p.registration_number <> ''
      )
      INSERT INTO publication_authors (publication_id, student_name, registration_number, author_order)
      SELECT keep_id, student_name, registration_number, author_order
      FROM old_rows
      WHERE NOT EXISTS (
        SELECT 1
        FROM publication_authors pa
        WHERE pa.publication_id = old_rows.keep_id
          AND pa.registration_number = old_rows.registration_number
      )
      ON CONFLICT DO NOTHING;

      WITH old_rows AS (
        SELECT
          p.id,
          MIN(p.id) OVER (
            PARTITION BY LOWER(p.paper_title), p.conference_or_journal, LOWER(p.paper_name), p.year
          ) AS keep_id
        FROM publications p
        WHERE p.student_name IS NOT NULL
          AND p.student_name <> ''
          AND p.registration_number IS NOT NULL
          AND p.registration_number <> ''
      )
      DELETE FROM publications p
      USING old_rows
      WHERE p.id = old_rows.id
        AND old_rows.id <> old_rows.keep_id;
    $migration$;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS events (
  id SERIAL PRIMARY KEY,
  employee_id VARCHAR(120) NOT NULL,
  coordinator_name VARCHAR(180) NOT NULL,
  event_name VARCHAR(220) NOT NULL,
  event_type VARCHAR(120),
  academic_year VARCHAR(30) NOT NULL,
  from_date DATE NOT NULL,
  to_date DATE,
  venue VARCHAR(220) NOT NULL,
  budget NUMERIC(12, 2),
  description TEXT NOT NULL,
  outcome TEXT,
  poster TEXT,
  one_page_report TEXT,
  winners_list TEXT,
  sample_certificate TEXT,
  budget_report TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

