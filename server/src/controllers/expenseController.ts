import { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { Expense } from '../models/Expense.js';
import type { AuthRequest } from '../types/index.js';
import { logger } from '../utils/logger.js';

export const createExpense = [
  body('title').notEmpty().withMessage('Title is required'),
  body('amount').isNumeric().withMessage('Amount must be a number'),
  body('category').isIn(['bill', 'fee', 'investment', 'cost', 'other']),

  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ success: false, errors: errors.array() });
        return;
      }

      if (!req.user?.businessId) {
        res.status(400).json({ success: false, message: 'No business associated' });
        return;
      }

      const expense = await Expense.create({
        ...req.body,
        businessId: req.user.businessId,
        createdBy: req.user._id,
      });

      res.status(201).json({ success: true, message: 'Expense added', data: expense });
    } catch (error: any) {
      logger.error('Create expense error:', error);
      res.status(500).json({ success: false, message: 'Failed to create expense' });
    }
  },
];

export const getExpenses = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.businessId) {
      res.status(400).json({ success: false, message: 'No business associated' });
      return;
    }

    const { startDate, endDate, category } = req.query;
    const query: any = { businessId: req.user.businessId };

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate as string);
      if (endDate) query.date.$lte = new Date(endDate as string);
    }
    if (category) {
      query.category = category;
    }

    const expenses = await Expense.find(query)
      .populate('createdBy', 'profile.firstName profile.lastName')
      .sort({ date: -1 });

    res.json({ success: true, data: expenses });
  } catch (error: any) {
    logger.error('Get expenses error:', error);
    res.status(500).json({ success: false, message: 'Failed to get expenses' });
  }
};

export const deleteExpense = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.businessId) {
      res.status(400).json({ success: false, message: 'No business associated' });
      return;
    }

    const { id } = req.params;
    await Expense.findOneAndDelete({ _id: id, businessId: req.user.businessId });

    res.json({ success: true, message: 'Expense removed' });
  } catch (error: any) {
    logger.error('Delete expense error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete expense' });
  }
};
