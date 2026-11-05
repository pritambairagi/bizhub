import { Request, Response } from 'express';
import { Customer } from '../models/Customer.js';
import type { AuthRequest } from '../types/index.js';
import { logger } from '../utils/logger.js';

export const getCustomers = async (req: AuthRequest, res: Response) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const query: Record<string, unknown> = {};

    // For super_admin: if businessId is provided in query, use it; otherwise return all customers
    // For all other roles (including customer): use their assigned businessId
    if (req.user?.role === 'super_admin' && req.query.businessId) {
      query.businessId = req.query.businessId as string;
    } else if (req.user?.businessId) {
      query.businessId = req.user.businessId;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const customers = await Customer.find(query)
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit))
      .sort({ createdAt: -1 });

    const total = await Customer.countDocuments(query);

    res.json({
      success: true,
      data: {
        customers,
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

export const getCustomerById = async (req: AuthRequest, res: Response) => {
  try {
    const query: Record<string, unknown> = { _id: req.params['id'] as string };
    if (req.user?.role === 'super_admin' && req.query.businessId) {
      query.businessId = req.query.businessId as string;
    } else if (req.user?.role !== 'super_admin') {
      query.businessId = req.user?.businessId;
    }

    const customer = await Customer.findOne(query);

    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    res.json({ success: true, data: { customer } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error });
  }
};

export const createCustomer = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.businessId && req.user?.role !== 'super_admin') {
      logger.warn(`Attempt to create customer without businessId: User ${req.user?._id}`);
      return res.status(400).json({ success: false, message: 'No business associated with your account' });
    }

    const businessId = req.user?.role === 'super_admin' ? req.body.businessId : req.user?.businessId;
    if (!businessId) {
      return res.status(400).json({ success: false, message: 'Business ID is required' });
    }

    const customer = await Customer.create({
      ...req.body,
      businessId,
      code: `CUS-${Date.now()}`,
    });

    logger.info(`Customer created: ${customer._id} for business ${req.user.businessId}`);
    res.status(201).json({ success: true, data: { customer } });
  } catch (error) {
    logger.error('Create customer error:', error);
    res.status(500).json({ success: false, message: 'Server error', error });
  }
};

export const updateCustomer = async (req: AuthRequest, res: Response) => {
  try {
    const query: Record<string, unknown> = { _id: req.params['id'] as string };
    if (req.user?.role === 'super_admin' && req.body.businessId) {
      query.businessId = req.body.businessId;
    } else if (req.user?.role !== 'super_admin') {
      query.businessId = req.user?.businessId;
    }

    const customer = await Customer.findOneAndUpdate(query, req.body, { new: true });

    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    res.json({ success: true, data: { customer } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error });
  }
};

export const addWallet = async (req: AuthRequest, res: Response) => {
  try {
    const { amount, type, description, businessId } = req.body;

    const query: Record<string, unknown> = { _id: req.params['id'] as string };
    if (req.user?.role === 'super_admin' && businessId) {
      query.businessId = businessId;
    } else if (req.user?.role !== 'super_admin') {
      query.businessId = req.user?.businessId;
    }

    const customer = await Customer.findOne(query);

    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    customer.wallet.balance += amount;
    if (type === 'debit') {
      customer.wallet.balance -= amount;
    }
    customer.wallet.transactions.push({
      type,
      amount,
      description,
      createdAt: new Date(),
    });

    await customer.save();

    res.json({ success: true, data: { customer } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error });
  }
};

export const deleteCustomer = async (req: AuthRequest, res: Response) => {
  try {
    const query: Record<string, unknown> = { _id: req.params['id'] as string };
    if (req.user?.role === 'super_admin' && req.query.businessId) {
      query.businessId = req.query.businessId as string;
    } else if (req.user?.role !== 'super_admin') {
      query.businessId = req.user?.businessId;
    }

    const customer = await Customer.findOneAndDelete(query);

    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    res.json({ success: true, message: 'Customer deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error });
  }
};