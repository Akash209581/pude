const publications = require('../models/publicationModel');

async function list(req, res, next) {
  try {
    const result = await publications.list(req.query);
    return res.json(result);
  } catch (error) {
    return next(error);
  }
}

async function create(req, res, next) {
  try {
    const publication = await publications.create(req.body);
    return res.status(201).json(publication);
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ message: 'A publication with the same title, venue, category, and year already exists.' });
    }
    return next(error);
  }
}

async function update(req, res, next) {
  try {
    const publication = await publications.update(req.params.id, req.body);
    if (!publication) {
      return res.status(404).json({ message: 'Publication not found.' });
    }
    return res.json(publication);
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ message: 'A publication with the same title, venue, category, and year already exists.' });
    }
    return next(error);
  }
}

async function remove(req, res, next) {
  try {
    const deleted = await publications.remove(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: 'Publication not found.' });
    }
    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
}

async function uploadExcel(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Excel file is required.' });
    }

    const { parseExcel } = require('../utils/excelParser');
    const parsed = parseExcel(req.file.path);
    const inserted = await publications.insertMany(parsed.validRows);

    return res.status(201).json({
      insertedRows: inserted.inserted.length,
      duplicateRows: [...parsed.duplicateRows, ...inserted.duplicates],
      failedRows: [...parsed.failedRows, ...inserted.failed],
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = { list, create, update, remove, uploadExcel };
