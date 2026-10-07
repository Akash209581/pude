const router = require('express').Router();
const rateLimit = require('express-rate-limit');
const { login, getUsers, addUser, removeUser } = require('../controllers/authController');
const { loginRules, handleValidation } = require('../middleware/validate');
const { authenticate, requireAdmin } = require('../middleware/auth');

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many login attempts. Please try again after 15 minutes.' },
});

router.post('/login', loginLimiter, loginRules, handleValidation, login);

// Admin user management
router.get('/users', authenticate, requireAdmin, getUsers);
router.post('/users', authenticate, requireAdmin, addUser);
router.delete('/users/:id', authenticate, requireAdmin, removeUser);

module.exports = router;
