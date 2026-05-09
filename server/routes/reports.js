const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');
const { protect } = require('../middleware/auth');

router.use(protect);

// @route GET /api/reports/monthly
router.get('/monthly', async (req, res) => {
  try {
    const { year } = req.query;
    const targetYear = parseInt(year) || new Date().getFullYear();

    const data = await Transaction.aggregate([
      {
        $match: {
          user: req.user._id,
          date: {
            $gte: new Date(targetYear, 0, 1),
            $lte: new Date(targetYear, 11, 31, 23, 59, 59),
          },
        },
      },
      {
        $group: {
          _id: { month: { $month: '$date' }, type: '$type' },
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.month': 1 } },
    ]);

    // Format into months array
    const months = Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      monthName: new Date(targetYear, i, 1).toLocaleString('default', { month: 'short' }),
      income: 0,
      expense: 0,
    }));

    data.forEach(({ _id, total }) => {
      const monthData = months[_id.month - 1];
      if (_id.type === 'income') monthData.income = total;
      else monthData.expense = total;
    });

    months.forEach((m) => {
      m.balance = m.income - m.expense;
    });

    res.json(months);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route GET /api/reports/category-breakdown
router.get('/category-breakdown', async (req, res) => {
  try {
    const { type = 'expense', month, year } = req.query;
    const now = new Date();
    const targetMonth = parseInt(month) || now.getMonth() + 1;
    const targetYear = parseInt(year) || now.getFullYear();

    const startDate = new Date(targetYear, targetMonth - 1, 1);
    const endDate = new Date(targetYear, targetMonth, 0, 23, 59, 59);

    const data = await Transaction.aggregate([
      {
        $match: {
          user: req.user._id,
          type,
          date: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: '$category',
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { total: -1 } },
    ]);

    const totalAmount = data.reduce((sum, item) => sum + item.total, 0);
    const result = data.map((item) => ({
      category: item._id,
      total: item.total,
      count: item.count,
      percentage: totalAmount > 0 ? ((item.total / totalAmount) * 100).toFixed(1) : 0,
    }));

    res.json({ breakdown: result, total: totalAmount });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route GET /api/reports/daily-trend
router.get('/daily-trend', async (req, res) => {
  try {
    const { month, year } = req.query;
    const now = new Date();
    const targetMonth = parseInt(month) || now.getMonth() + 1;
    const targetYear = parseInt(year) || now.getFullYear();

    const startDate = new Date(targetYear, targetMonth - 1, 1);
    const endDate = new Date(targetYear, targetMonth, 0, 23, 59, 59);

    const data = await Transaction.aggregate([
      {
        $match: {
          user: req.user._id,
          date: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: { day: { $dayOfMonth: '$date' }, type: '$type' },
          total: { $sum: '$amount' },
        },
      },
      { $sort: { '_id.day': 1 } },
    ]);

    const daysInMonth = new Date(targetYear, targetMonth, 0).getDate();
    const days = Array.from({ length: daysInMonth }, (_, i) => ({
      day: i + 1,
      income: 0,
      expense: 0,
    }));

    data.forEach(({ _id, total }) => {
      const dayData = days[_id.day - 1];
      if (_id.type === 'income') dayData.income = total;
      else dayData.expense = total;
    });

    res.json(days);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route GET /api/reports/top-expenses
router.get('/top-expenses', async (req, res) => {
  try {
    const { limit = 5, month, year } = req.query;
    const now = new Date();
    const targetMonth = parseInt(month) || now.getMonth() + 1;
    const targetYear = parseInt(year) || now.getFullYear();

    const startDate = new Date(targetYear, targetMonth - 1, 1);
    const endDate = new Date(targetYear, targetMonth, 0, 23, 59, 59);

    const transactions = await Transaction.find({
      user: req.user._id,
      type: 'expense',
      date: { $gte: startDate, $lte: endDate },
    })
      .sort({ amount: -1 })
      .limit(parseInt(limit));

    res.json(transactions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route GET /api/reports/balance-history
router.get('/balance-history', async (req, res) => {
  try {
    const { months = 6 } = req.query;
    const now = new Date();
    const result = [];

    for (let i = parseInt(months) - 1; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const startDate = new Date(date.getFullYear(), date.getMonth(), 1);
      const endDate = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59);

      const stats = await Transaction.aggregate([
        {
          $match: {
            user: req.user._id,
            date: { $gte: startDate, $lte: endDate },
          },
        },
        {
          $group: {
            _id: '$type',
            total: { $sum: '$amount' },
          },
        },
      ]);

      const income = stats.find((s) => s._id === 'income')?.total || 0;
      const expense = stats.find((s) => s._id === 'expense')?.total || 0;

      result.push({
        month: date.toLocaleString('default', { month: 'short' }),
        year: date.getFullYear(),
        income,
        expense,
        balance: income - expense,
      });
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
