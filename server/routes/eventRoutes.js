const router = require('express').Router();
const controller = require('../controllers/eventController');
const { eventUpload } = require('../middleware/upload');
const { eventRules, handleValidation } = require('../middleware/validate');

router.get('/events', controller.list);
router.post('/events', eventUpload, eventRules, handleValidation, controller.create);
router.put('/events/:id', eventUpload, eventRules, handleValidation, controller.update);
router.delete('/events/:id', controller.remove);

module.exports = router;
