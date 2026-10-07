const path = require('path');
const fs = require('fs');
const events = require('../models/eventModel');
const pendingEdits = require('../models/pendingEditModel');
const { UPLOADS_DIR } = require('../middleware/upload');

function getFilePath(files, fieldName) {
  if (files && files[fieldName] && files[fieldName][0]) {
    const uploadPrefix = process.env.UPLOAD_URL_PATH || '/uploads';
    return `${uploadPrefix}/${files[fieldName][0].filename}`;
  }
  return null;
}

function deletePhysicalFile(dbPath) {
  if (!dbPath || typeof dbPath !== 'string') return;
  const filename = path.basename(dbPath);
  if (!filename) return;

  const targetPath = path.resolve(UPLOADS_DIR, filename);
  const uploadsResolved = path.resolve(UPLOADS_DIR);

  // Path traversal check: target path MUST be strictly inside UPLOADS_DIR
  if (!targetPath.startsWith(uploadsResolved)) {
    console.warn(`Security Warning: Prevented file deletion outside uploads directory: ${dbPath}`);
    return;
  }

  try {
    if (fs.existsSync(targetPath)) {
      fs.unlinkSync(targetPath);
    }
  } catch (err) {
    console.error(`Failed to delete orphaned file ${targetPath}:`, err.message);
  }
}

async function list(req, res, next) {
  try {
    const rows = await events.list(req.query.type, req.query.academic_year, req.query.event_type);
    return res.json(rows);
  } catch (error) {
    return next(error);
  }
}

async function create(req, res, next) {
  try {
    if (!req.files || !req.files['one_page_report'] || !req.files['one_page_report'][0]) {
      return res.status(422).json({ message: 'Validation failed.', errors: [{ msg: 'One Page Report is required.', path: 'one_page_report' }] });
    }
    const event = await events.create({
      ...req.body,
      poster: getFilePath(req.files, 'poster') || req.body.poster || null,
      one_page_report: getFilePath(req.files, 'one_page_report') || req.body.one_page_report || null,
      winners_list: getFilePath(req.files, 'winners_list') || req.body.winners_list || null,
      sample_certificate: getFilePath(req.files, 'sample_certificate') || req.body.sample_certificate || null,
      budget_report: getFilePath(req.files, 'budget_report') || req.body.budget_report || null,
    });
    return res.status(201).json(event);
  } catch (error) {
    return next(error);
  }
}

async function update(req, res, next) {
  try {
    const eventId = parseInt(req.params.id, 10);
    const existing = await events.findById(eventId);
    if (!existing) {
      return res.status(404).json({ message: 'Event not found.' });
    }

    const newPoster = getFilePath(req.files, 'poster');
    const newReport = getFilePath(req.files, 'one_page_report');
    const newWinners = getFilePath(req.files, 'winners_list');
    const newCert = getFilePath(req.files, 'sample_certificate');
    const newBudget = getFilePath(req.files, 'budget_report');

    const updateData = {
      ...req.body,
      poster: newPoster || req.body.poster || existing.poster || null,
      one_page_report: newReport || req.body.one_page_report || existing.one_page_report || null,
      winners_list: newWinners || req.body.winners_list || existing.winners_list || null,
      sample_certificate: newCert || req.body.sample_certificate || existing.sample_certificate || null,
      budget_report: newBudget || req.body.budget_report || existing.budget_report || null,
    };

    if (req.user?.role === 'admin') {
      const event = await events.update(eventId, updateData);
      if (event) {
        if (newPoster && existing.poster) deletePhysicalFile(existing.poster);
        if (newReport && existing.one_page_report) deletePhysicalFile(existing.one_page_report);
        if (newWinners && existing.winners_list) deletePhysicalFile(existing.winners_list);
        if (newCert && existing.sample_certificate) deletePhysicalFile(existing.sample_certificate);
        if (newBudget && existing.budget_report) deletePhysicalFile(existing.budget_report);
      }
      return res.json(event);
    }

    // TA user edit -> submit for Admin verification
    const pending = await pendingEdits.createPendingEdit(
      'event',
      eventId,
      req.user?.id,
      req.user?.username,
      updateData,
    );

    return res.json({
      message: 'Event edit submitted for Admin verification.',
      requiresApproval: true,
      pending,
    });
  } catch (error) {
    return next(error);
  }
}

async function remove(req, res, next) {
  try {
    const existing = await events.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({ message: 'Event not found.' });
    }

    const deleted = await events.remove(req.params.id);
    if (deleted) {
      const fileFields = ['poster', 'one_page_report', 'winners_list', 'sample_certificate', 'budget_report'];
      for (const field of fileFields) {
        deletePhysicalFile(existing[field]);
      }
    }
    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
}

module.exports = { list, create, update, remove };
