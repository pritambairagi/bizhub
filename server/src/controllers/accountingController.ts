import { Request, Response } from 'express';
import { Account } from '../models/Account.js';
import { Transaction } from '../models/Transaction.js';
import type { AuthRequest } from '../types/index.js';
import { logger } from '../utils/logger.js';

export const getAccounts = async (req: AuthRequest, res: Response) => {
  try {
    const { type } = req.query;
    const query: Record<string, unknown> = {};
    if (req.user?.role !== 'super_admin') {
      query.businessId = req.user?.businessId;
    }

    if (type) query.type = type;

    const accounts = await Account.find(query).sort({ code: 1 });

    res.json({ success: true, data: { accounts } });
  } catch (error) {
    logger.error('Get accounts error:', error);
    res.status(500).json({ success: false, message: 'Server error', error });
  }
};

export const createAccount = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.businessId) {
      return res.status(400).json({ success: false, message: 'No business associated with your account' });
    }

    const account = await Account.create({
      ...req.body,
      businessId: req.user.businessId,
    });

    res.status(201).json({ success: true, data: { account } });
  } catch (error) {
    logger.error('Create account error:', error);
    res.status(500).json({ success: false, message: 'Server error', error });
  }
};

export const getTransactions = async (req: AuthRequest, res: Response) => {
  try {
    const { page = 1, limit = 20, accountId, startDate, endDate } = req.query;
    const query: Record<string, unknown> = { businessId: req.user?.businessId };

    if (accountId) query.accountId = accountId;
    if (startDate || endDate) {
      query.date = {};
      if (startDate) (query.date as Record<string, Date>).$gte = new Date(startDate as string);
      if (endDate) (query.date as Record<string, Date>).$lte = new Date(endDate as string);
    }

    const transactions = await Transaction.find(query)
      .populate('accountId', 'name code')
      .populate('contraAccountId', 'name code')
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit))
      .sort({ date: -1, createdAt: -1 });

    const total = await Transaction.countDocuments(query);

    res.json({
      success: true,
      data: {
        transactions,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit)),
        },
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error });
  }
};

export const createTransaction = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.businessId) {
      return res.status(400).json({ success: false, message: 'No business associated with your account' });
    }

    const transaction = await Transaction.create({
      ...req.body,
      businessId: req.user.businessId,
      voucherNumber: `VCH-${Date.now()}`,
      createdBy: req.user._id,
    });

    // Update account balances
    const { type, accountId, contraAccountId, amount } = req.body;

    if (accountId) {
      const account = await Account.findById(accountId);
      if (account) {
        account.currentBalance += type === 'debit' ? amount : -amount;
        await account.save();
      }
    }

    if (contraAccountId) {
      const contraAccount = await Account.findById(contraAccountId);
      if (contraAccount) {
        contraAccount.currentBalance += type === 'credit' ? amount : -amount;
        await contraAccount.save();
      }
    }

    res.status(201).json({ success: true, data: { transaction } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error });
  }
};

export const getBalanceSheet = async (req: AuthRequest, res: Response) => {
  try {
    const accounts = await Account.find({ businessId: req.user?.businessId });

    const assets = accounts.filter((a) => a.type === 'asset');
    const liabilities = accounts.filter((a) => a.type === 'liability');
    const equity = accounts.filter((a) => a.type === 'equity');

    const totalAssets = assets.reduce((sum, a) => sum + (a.currentBalance || 0), 0);
    const totalLiabilities = liabilities.reduce((sum, a) => sum + (a.currentBalance || 0), 0);
    const totalEquity = equity.reduce((sum, a) => sum + (a.currentBalance || 0), 0);

    res.json({
      success: true,
      data: {
        assets: { accounts: assets, total: totalAssets },
        liabilities: { accounts: liabilities, total: totalLiabilities },
        equity: { accounts: equity, total: totalEquity },
        balanced: totalAssets === totalLiabilities + totalEquity,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error });
  }
};

export const getProfitLoss = async (req: AuthRequest, res: Response) => {
  try {
    const { startDate, endDate } = req.query;
    const query: Record<string, unknown> = { businessId: req.user?.businessId };

    if (startDate || endDate) {
      query.date = {};
      if (startDate) (query.date as Record<string, Date>).$gte = new Date(startDate as string);
      if (endDate) (query.date as Record<string, Date>).$lte = new Date(endDate as string);
    }

    const accounts = await Account.find({ businessId: req.user?.businessId });
    const incomeAccounts = accounts.filter((a) => a.type === 'income');
    const expenseAccounts = accounts.filter((a) => a.type === 'expense');

    const totalIncome = incomeAccounts.reduce((sum, a) => sum + (a.currentBalance || 0), 0);
    const totalExpense = expenseAccounts.reduce((sum, a) => sum + (a.currentBalance || 0), 0);
    const netProfit = totalIncome - totalExpense;

    res.json({
      success: true,
      data: {
        income: { accounts: incomeAccounts, total: totalIncome },
        expenses: { accounts: expenseAccounts, total: totalExpense },
        netProfit,
        status: netProfit >= 0 ? 'profit' : 'loss',
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error });
  }
};

export const getCashFlow = async (req: AuthRequest, res: Response) => {
  try {
    res.json({
      success: true,
      data: {
        openingBalance: 0,
        inflows: 0,
        outflows: 0,
        closingBalance: 0,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error });
  }
};