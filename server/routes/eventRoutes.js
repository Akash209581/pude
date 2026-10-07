const router = require('express').Router();
const controller = require('../controllers/eventController');
const { eventUpload, validateEventFileSignatures } = require('../middleware/upload');
const { eventRules, handleValidation } = require('../middleware/validate');
const { requireAdmin } = require('../middleware/auth');

router.get('/events', controller.list);
router.post('/events', eventUpload, validateEventFileSignatures, eventRules, handleValidation, controller.create);
router.put('/events/:id', eventUpload, validateEventFileSignatures, eventRules, handleValidation, controller.update);
router.delete('/events/:id', requireAdmin, controller.remove);

module.exports = router;
