const router = require('express').Router();
const { dashboard } = require('../controllers/dashboardController');

router.get('/dashboard', dashboard);

module.exports = router;
