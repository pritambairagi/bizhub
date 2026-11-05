import { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import * as orderService from '../services/orderService.js';
import type { AuthRequest } from '../types/index.js';
import { logger } from '../utils/logger.js';

export const createOrder = [
  body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
  body('items.*.productId').notEmpty(),
  body('items.*.qty').isInt({ min: 1 }),
  body('items.*.unitPrice').isFloat({ min: 0 }),

  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ success: false, errors: errors.array() });
        return;
      }

      if (!req.user?.businessId && req.user?.role !== 'super_admin') {
        res.status(400).json({ success: false, message: 'No business associated with your account' });
        return;
      }

      // Self-heal branch ID if it is missing (fallback to the first branch of the business)
      if (!req.user?.branchId && req.user?.role !== 'super_admin' && req.user?.businessId) {
        const { Branch } = await import('../models/Branch.js');
        const firstBranch = await Branch.findOne({ businessId: req.user.businessId }).sort({ createdAt: 1 });
        if (firstBranch) {
          req.user.branchId = firstBranch._id as any;
          const { User } = await import('../models/User.js');
          await User.findByIdAndUpdate(req.user._id, { $set: { branchId: firstBranch._id } });
          logger.info(`Dynamically self-healed missing branch for user ${req.user._id}: assigned to ${firstBranch._id}`);
        } else {
          res.status(400).json({ success: false, message: 'No business or branch associated' });
          return;
        }
      }

      const businessId = req.user?.role === 'super_admin' ? req.body.businessId : req.user?.businessId?.toString();
      const branchId = req.user?.role === 'super_admin' ? req.body.branchId : req.user?.branchId?.toString();

      if (!businessId || !branchId) {
        res.status(400).json({ success: false, message: 'Business and Branch ID are required' });
        return;
      }

      const order = await orderService.createOrder(
        businessId,
        branchId,
        req.user._id.toString(),
        req.body
      );

      res.status(201).json({
        success: true,
        message: 'Order created',
        data: order,
      });
    } catch (error: unknown) {
      const err = error as { statusCode?: number; message?: string };
      res.status(err.statusCode || 500).json({
        success: false,
        message: err.message || 'Failed to create order',
      });
    }
  },
];

export const getOrders = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.businessId && req.user?.role !== 'super_admin') {
      res.status(400).json({ success: false, message: 'No business associated' });
      return;
    }

    const businessId = req.user?.role === 'super_admin' ? (req.query.businessId as string) : req.user?.businessId?.toString();

    const { page, limit, branchId, status, type, startDate, endDate, search, customerId } = req.query;

    const result = await orderService.getOrders(businessId || '', {
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      branchId: branchId as string,
      status: status as string,
      type: type as string,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
      search: search as string,
      customerId: customerId as string,
    });

    res.json({ success: true, data: result });
  } catch (error: unknown) {
    const err = error as { statusCode?: number; message?: string };
    res.status(err.statusCode || 500).json({
      success: false,
      message: err.message || 'Failed to get orders',
    });
  }
};

export const getOrder = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.businessId) {
      res.status(400).json({ success: false, message: 'No business associated' });
      return;
    }

    const { orderId } = req.params;
    const order = await orderService.getOrder(orderId, req.user.businessId.toString());

    res.json({ success: true, data: order });
  } catch (error: unknown) {
    const err = error as { statusCode?: number; message?: string };
    res.status(err.statusCode || 500).json({
      success: false,
      message: err.message || 'Failed to get order',
    });
  }
};

export const updateOrderStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.businessId) {
      res.status(400).json({ success: false, message: 'No business associated' });
      return;
    }

    const { orderId } = req.params;
    const { status } = req.body;

    const order = await orderService.updateOrderStatus(
      orderId,
      req.user.businessId.toString(),
      status
    );

    res.json({ success: true, message: 'Order status updated', data: order });
  } catch (error: unknown) {
    const err = error as { statusCode?: number; message?: string };
    res.status(err.statusCode || 500).json({
      success: false,
      message: err.message || 'Failed to update order status',
    });
  }
};

export const processPayment = [
  body('payments').isArray({ min: 1 }),
  body('payments.*.method').isIn(['cash', 'card', 'bkash', 'nagad', 'rocket', 'wallet', 'giftcard']),
  body('payments.*.amount').isFloat({ min: 0 }),

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

      const { orderId } = req.params;
      const { payments } = req.body;

      const order = await orderService.processPayment(
        orderId,
        req.user.businessId.toString(),
        payments
      );

      res.json({ success: true, message: 'Payment processed', data: order });
    } catch (error: unknown) {
      const err = error as { statusCode?: number; message?: string };
      res.status(err.statusCode || 500).json({
        success: false,
        message: err.message || 'Failed to process payment',
      });
    }
  },
];

export const createReturn = [
  body('items').isArray({ min: 1 }),
  body('items.*.productId').notEmpty(),
  body('items.*.qty').isInt({ min: 1 }),
  body('refundAmount').isFloat({ min: 0 }),
  body('refundMethod').isIn(['cash', 'card', 'bkash', 'nagad', 'rocket', 'wallet']),

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

      const { orderId } = req.params;
      const order = await orderService.createReturn(
        orderId,
        req.user.businessId.toString(),
        req.user._id.toString(),
        req.body
      );

      res.status(201).json({
        success: true,
        message: 'Return processed',
        data: order,
      });
    } catch (error: unknown) {
      const err = error as { statusCode?: number; message?: string };
      res.status(err.statusCode || 500).json({
        success: false,
        message: err.message || 'Failed to process return',
      });
    }
  },
];

export const getDailySales = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.businessId) {
      res.status(400).json({ success: false, message: 'No business associated' });
      return;
    }

    const { branchId } = req.query;
    const sales = await orderService.getDailySales(
      req.user.businessId.toString(),
      branchId as string
    );

    res.json({ success: true, data: sales });
  } catch (error: unknown) {
    const err = error as { statusCode?: number; message?: string };
    res.status(err.statusCode || 500).json({
      success: false,
      message: err.message || 'Failed to get daily sales',
    });
  }
};

export const getSalesReport = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.businessId) {
      res.status(400).json({ success: false, message: 'No business associated' });
      return;
    }

    const { startDate, endDate, branchId } = req.query;

    if (!startDate || !endDate) {
      res.status(400).json({ success: false, message: 'Start and end dates required' });
      return;
    }

    const report = await orderService.getSalesReport(
      req.user.businessId.toString(),
      new Date(startDate as string),
      new Date(endDate as string),
      branchId as string
    );

    res.json({ success: true, data: report });
  } catch (error: unknown) {
    const err = error as { statusCode?: number; message?: string };
    res.status(err.statusCode || 500).json({
      success: false,
      message: err.message || 'Failed to get sales report',
    });
  }
};