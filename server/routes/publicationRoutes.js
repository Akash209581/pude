const router = require('express').Router();
const controller = require('../controllers/publicationController');
const { excelUpload } = require('../middleware/upload');
const { publicationRules, handleValidation } = require('../middleware/validate');

router.get('/publications', controller.list);
router.post('/publications', publicationRules, handleValidation, controller.create);
router.put('/publications/:id', publicationRules, handleValidation, controller.update);
router.delete('/publications/:id', controller.remove);
router.post('/upload-excel', excelUpload.single('file'), controller.uploadExcel);

module.exports = router;
