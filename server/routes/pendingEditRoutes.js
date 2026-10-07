const router = require('express').Router();
const controller = require('../controllers/pendingEditController');
const { authenticate, requireAdmin } = require('../middleware/auth');

router.get('/pending-edits', authenticate, requireAdmin, controller.listPending);
router.post('/pending-edits/:id/approve', authenticate, requireAdmin, controller.approvePending);
router.post('/pending-edits/:id/reject', authenticate, requireAdmin, controller.rejectPending);

module.exports = router;
