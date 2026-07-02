const xlsx = require('xlsx');

const aliases = {
  serial_no: ['S.No', 'S No', 'Serial No', 'serial_no'],
  student_name: ['Student Name', 'student_name'],
  registration_number: ['Regd.No', 'Regd No', 'Registration Number', 'registration_number'],
  paper_title: ['Title of the Paper', 'Paper Title', 'paper_title'],
  conference_or_journal: ['Conference/Journal', 'Conference / Journal', 'conference_or_journal'],
  paper_name: ['Name of the Paper', 'Name of the Conference/Journal', 'paper_name'],
  paper_type: ['Type of Paper', 'Paper Type', 'paper_type'],
  year: ['Year', 'year'],
  faculty_guide: ['Faculty Guide', 'faculty_guide'],
};

function pick(row, key) {
  const header = aliases[key].find((name) => row[name] !== undefined);
  return header ? row[header] : undefined;
}

function text(value) {
  return String(value || '').trim();
}

function normalizeCategory(value) {
  const raw = text(value).toLowerCase();
  if (raw.includes('journal')) return 'Journal';
  return 'Conference';
}

function hasPublicationDetails(row) {
  return ['serial_no', 'paper_title', 'conference_or_journal', 'paper_name', 'paper_type', 'year', 'faculty_guide']
    .some((key) => text(pick(row, key)));
}

function getAuthor(row, rowNumber) {
  return {
    rowNumber,
    student_name: text(pick(row, 'student_name')),
    registration_number: text(pick(row, 'registration_number')),
  };
}

function publicationKey(publication) {
  return [
    publication.paper_title,
    publication.conference_or_journal,
    publication.paper_name,
    publication.year,
  ].map((value) => String(value || '').toLowerCase()).join('::');
}

function createPublication(row, rowNumber, fallbackYear) {
  return {
    startRow: rowNumber,
    serial_no: Number(pick(row, 'serial_no')) || null,
    paper_title: text(pick(row, 'paper_title')),
    conference_or_journal: normalizeCategory(pick(row, 'conference_or_journal')),
    paper_name: text(pick(row, 'paper_name')),
    paper_type: text(pick(row, 'paper_type')),
    year: Number(pick(row, 'year')) || fallbackYear || new Date().getFullYear(),
    faculty_guide: text(pick(row, 'faculty_guide')) || null,
    authors: [],
  };
}

function validatePublication(publication) {
  const missing = ['paper_title', 'paper_name', 'paper_type'].filter((key) => !publication[key]);
  if (!publication.authors.length) missing.push('authors');
  if (missing.length) return `Missing ${missing.join(', ')}`;
  if (publication.year < 1900 || publication.year > 2100) return 'Invalid year';
  return null;
}

function addAuthor(publication, author, duplicateRows, failedRows) {
  if (!author.student_name || !author.registration_number) {
    failedRows.push({ rowNumber: author.rowNumber, reason: 'Missing student_name or registration_number' });
    return;
  }

  const key = author.registration_number.toLowerCase();
  if (publication.authors.some((existing) => existing.registration_number.toLowerCase() === key)) {
    duplicateRows.push({ rowNumber: author.rowNumber, ...author, reason: 'Duplicate author inside publication' });
    return;
  }

  publication.authors.push({
    student_name: author.student_name,
    registration_number: author.registration_number,
    author_order: publication.authors.length + 1,
  });
}

function findHeaderIndex(matrix) {
  return matrix.findIndex((row) => {
    const normalized = row.map((cell) => text(cell).toLowerCase());
    return normalized.includes('student name') && normalized.some((cell) => cell === 'title of the paper' || cell === 'paper title');
  });
}

function rowsFromSheet(sheet) {
  const matrix = xlsx.utils.sheet_to_json(sheet, { header: 1, defval: '' });
  const headerIndex = findHeaderIndex(matrix);
  if (headerIndex === -1) return [];

  const headers = matrix[headerIndex].map((header) => text(header));
  return matrix.slice(headerIndex + 1).map((row, index) => ({
    rowNumber: headerIndex + index + 2,
    row: Object.fromEntries(headers.map((header, cellIndex) => [header, row[cellIndex] ?? ''])),
  }));
}

function sheetYear(sheetName) {
  const match = String(sheetName).match(/\b(19|20)\d{2}\b/);
  return match ? Number(match[0]) : null;
}

function parseExcel(filePath) {
  const workbook = xlsx.readFile(filePath);
  const seenPublications = new Set();
  const validRows = [];
  const duplicateRows = [];
  const failedRows = [];
  let current = null;

  function finalizeCurrent() {
    if (!current) return;
    const reason = validatePublication(current);
    if (reason) {
      failedRows.push({ rowNumber: current.startRow, paper_title: current.paper_title, reason });
    } else {
      const key = publicationKey(current);
      if (seenPublications.has(key)) {
        duplicateRows.push({ rowNumber: current.startRow, paper_title: current.paper_title, reason: 'Duplicate publication inside uploaded file' });
      } else {
        seenPublications.add(key);
        const { startRow, ...publication } = current;
        validRows.push(publication);
      }
    }
    current = null;
  }

  workbook.SheetNames.forEach((sheetName) => {
    const fallbackYear = sheetYear(sheetName);
    const rows = rowsFromSheet(workbook.Sheets[sheetName]);

    rows.forEach(({ row, rowNumber }) => {
      const author = getAuthor(row, rowNumber);

      if (hasPublicationDetails(row)) {
        finalizeCurrent();
        current = createPublication(row, rowNumber, fallbackYear);
        addAuthor(current, author, duplicateRows, failedRows);
        return;
      }

      if (author.student_name || author.registration_number) {
        if (!current) {
          failedRows.push({ rowNumber, reason: 'Author row appears before publication details' });
          return;
        }
        addAuthor(current, author, duplicateRows, failedRows);
      }
    });

    finalizeCurrent();
  });

  return { validRows, duplicateRows, failedRows };
}

module.exports = { parseExcel };
