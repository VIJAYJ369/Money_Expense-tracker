const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Category = require('../models/Category');
const { protect } = require('../middleware/auth');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'fallback_secret', {
    expiresIn: '30d',
  });
};

const defaultCategories = [
  { name: 'Salary', type: 'income', icon: '💼', color: '#10b981' },
  { name: 'Freelance', type: 'income', icon: '💻', color: '#06b6d4' },
  { name: 'Investment', type: 'income', icon: '📈', color: '#8b5cf6' },
  { name: 'Other Income', type: 'income', icon: '💰', color: '#f59e0b' },
  { name: 'Food & Dining', type: 'expense', icon: '🍔', color: '#ef4444' },
  { name: 'Transport', type: 'expense', icon: '🚗', color: '#f97316' },
  { name: 'Shopping', type: 'expense', icon: '🛍️', color: '#ec4899' },
  { name: 'Entertainment', type: 'expense', icon: '🎬', color: '#a855f7' },
  { name: 'Healthcare', type: 'expense', icon: '🏥', color: '#14b8a6' },
  { name: 'Education', type: 'expense', icon: '📚', color: '#3b82f6' },
  { name: 'Utilities', type: 'expense', icon: '⚡', color: '#eab308' },
  { name: 'Rent', type: 'expense', icon: '🏠', color: '#84cc16' },
  { name: 'Travel', type: 'expense', icon: '✈️', color: '#06b6d4' },
  { name: 'Subscriptions', type: 'expense', icon: '📱', color: '#6366f1' },
  { name: 'Other Expense', type: 'expense', icon: '💸', color: '#94a3b8' },
];

// @route POST /api/auth/register
router.post(
  '/register',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ message: errors.array()[0].msg });
      }

      const { name, email, password } = req.body;

      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: 'User already exists with this email' });
      }

      const user = await User.create({ name, email, password });

      // Create default categories for user
      const userCategories = defaultCategories.map((cat) => ({
        ...cat,
        user: user._id,
        isDefault: true,
      }));
      await Category.insertMany(userCategories);

      const token = generateToken(user._id);

      res.status(201).json({
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          currency: user.currency,
          monthlyBudget: user.monthlyBudget,
        },
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

// @route POST /api/auth/login
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ message: errors.array()[0].msg });
      }

      const { email, password } = req.body;

      const user = await User.findOne({ email }).select('+password');
      if (!user || !(await user.comparePassword(password))) {
        return res.status(401).json({ message: 'Invalid email or password' });
      }

      const token = generateToken(user._id);

      res.json({
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          currency: user.currency,
          monthlyBudget: user.monthlyBudget,
        },
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

// @route GET /api/auth/me
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      currency: user.currency,
      monthlyBudget: user.monthlyBudget,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route PUT /api/auth/profile
router.put('/profile', protect, async (req, res) => {
  try {
    const { name, currency, monthlyBudget } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name, currency, monthlyBudget },
      { new: true, runValidators: true }
    );
    res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      currency: user.currency,
      monthlyBudget: user.monthlyBudget,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
