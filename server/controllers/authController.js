const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const users = require('../models/userModel');

async function login(req, res, next) {
  try {
    const { username, password } = req.body;
    const user = await users.findByUsername(username);

    if (!user || !['admin', 'ta'].includes(user.role)) {
      return res.status(401).json({ message: 'Invalid username or password.' });
    }

    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ message: 'Invalid username or password.' });
    }

    const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '8h',
    });

    return res.json({
      token,
      user: { id: user.id, username: user.username, role: user.role },
    });
  } catch (error) {
    return next(error);
  }
}

async function getUsers(req, res, next) {
  try {
    const list = await users.listUsers();
    return res.json(list);
  } catch (error) {
    return next(error);
  }
}

async function addUser(req, res, next) {
  try {
    const { username, password, role } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required.' });
    }

    const targetRole = role === 'admin' ? 'admin' : 'ta';
    const existing = await users.findByUsername(username);

    if (existing) {
      return res.status(400).json({ message: 'User with this username already exists.' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const newUser = await users.createUser(username, passwordHash, targetRole);

    return res.status(201).json(newUser);
  } catch (error) {
    return next(error);
  }
}

async function removeUser(req, res, next) {
  try {
    const userId = parseInt(req.params.id, 10);
    if (req.user?.id === userId) {
      return res.status(400).json({ message: 'You cannot delete your own logged-in account.' });
    }

    const deleted = await users.deleteUser(userId);
    if (!deleted) {
      return res.status(404).json({ message: 'User not found.' });
    }

    return res.json({ message: 'User deleted successfully.' });
  } catch (error) {
    return next(error);
  }
}

module.exports = { login, getUsers, addUser, removeUser };
