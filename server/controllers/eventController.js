const events = require('../models/eventModel');

function getFilePath(files, fieldName) {
  if (files && files[fieldName] && files[fieldName][0]) {
    const uploadPrefix = process.env.UPLOAD_URL_PATH || '/uploads';
    return `${uploadPrefix}/${files[fieldName][0].filename}`;
  }
  return null;
}

async function list(req, res, next) {
  try {
    const rows = await events.list(req.query.type);
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
    const event = await events.update(req.params.id, {
      ...req.body,
      poster: getFilePath(req.files, 'poster') || req.body.poster || null,
      one_page_report: getFilePath(req.files, 'one_page_report') || req.body.one_page_report || null,
      winners_list: getFilePath(req.files, 'winners_list') || req.body.winners_list || null,
      sample_certificate: getFilePath(req.files, 'sample_certificate') || req.body.sample_certificate || null,
      budget_report: getFilePath(req.files, 'budget_report') || req.body.budget_report || null,
    });
    if (!event) {
      return res.status(404).json({ message: 'Event not found.' });
    }
    return res.json(event);
  } catch (error) {
    return next(error);
  }
}

async function remove(req, res, next) {
  try {
    const deleted = await events.remove(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: 'Event not found.' });
    }
    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
}

module.exports = { list, create, update, remove };
