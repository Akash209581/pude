const router = require('express').Router();
const { login, getUsers, addUser, removeUser } = require('../controllers/authController');
const { loginRules, handleValidation } = require('../middleware/validate');
const { authenticate, requireAdmin } = require('../middleware/auth');

router.post('/login', loginRules, handleValidation, login);

// Admin user management
router.get('/users', authenticate, requireAdmin, getUsers);
router.post('/users', authenticate, requireAdmin, addUser);
router.delete('/users/:id', authenticate, requireAdmin, removeUser);

module.exports = router;
