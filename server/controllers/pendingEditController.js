const pendingEdits = require('../models/pendingEditModel');
const publications = require('../models/publicationModel');
const events = require('../models/eventModel');

async function listPending(req, res, next) {
  try {
    const list = await pendingEdits.listPendingEdits();
    // Fetch original items for side-by-side comparison in UI
    const enriched = await Promise.all(
      list.map(async (item) => {
        let originalItem = null;
        if (item.target_type === 'publication') {
          originalItem = await publications.findById(item.target_id);
        } else if (item.target_type === 'event') {
          originalItem = await events.findById(item.target_id);
        }
        return {
          ...item,
          originalItem,
        };
      })
    );
    return res.json(enriched);
  } catch (error) {
    return next(error);
  }
}

async function approvePending(req, res, next) {
  try {
    const item = await pendingEdits.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: 'Pending edit request not found.' });
    }

    let updatedItem = null;
    if (item.target_type === 'publication') {
      updatedItem = await publications.update(item.target_id, item.changes_data);
    } else if (item.target_type === 'event') {
      updatedItem = await events.update(item.target_id, item.changes_data);
    }

    await pendingEdits.deletePendingEdit(item.id);

    return res.json({
      message: `${item.target_type === 'event' ? 'Event' : 'Publication'} edit approved and published successfully.`,
      updatedItem,
    });
  } catch (error) {
    return next(error);
  }
}

async function rejectPending(req, res, next) {
  try {
    const item = await pendingEdits.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: 'Pending edit request not found.' });
    }

    await pendingEdits.deletePendingEdit(item.id);

    return res.json({ message: 'Pending edit request rejected.' });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  listPending,
  approvePending,
  rejectPending,
};
