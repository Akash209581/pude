const router = require('express').Router();
const { login } = require('../controllers/authController');
const { loginRules, handleValidation } = require('../middleware/validate');

router.post('/login', loginRules, handleValidation, login);

module.exports = router;
