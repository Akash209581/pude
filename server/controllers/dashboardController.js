const publications = require('../models/publicationModel');
const events = require('../models/eventModel');

async function dashboard(req, res, next) {
  try {
    const [publicationAnalytics, recentEvents] = await Promise.all([publications.analytics(), events.recent()]);
    return res.json({ ...publicationAnalytics, recentEvents });
  } catch (error) {
    return next(error);
  }
}

module.exports = { dashboard };
