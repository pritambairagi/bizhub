import { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import * as businessService from '../services/businessService.js';
import type { AuthRequest } from '../types/index.js';
import { logger } from '../utils/logger.js';

export const createBusiness = [
  body('name').notEmpty().withMessage('Business name is required'),
  body('type').isIn(['retail', 'wholesale', 'restaurant', 'pharmacy', 'franchise', 'marketplace']),
  body('contact.email').isEmail(),
  body('contact.phone').notEmpty(),
  body('contact.address').notEmpty(),

  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ success: false, errors: errors.array() });
        return;
      }

      if (!req.user) {
        res.status(401).json({ success: false, message: 'Not authenticated' });
        return;
      }

      const result = await businessService.createBusiness(req.user._id.toString(), req.body);

      res.status(201).json({
        success: true,
        message: 'Business created successfully',
        data: result,
      });
    } catch (error: unknown) {
      const err = error as { statusCode?: number; message?: string };
      logger.error('Create business error:', error);
      res.status(err.statusCode || 500).json({
        success: false,
        message: err.message || 'Failed to create business',
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  },
];

export const getBusiness = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.businessId) {
      if (req.user?.role === 'super_admin') {
        // Super admin might not have a businessId associated, return a placeholder or empty success
        res.json({ success: true, data: null, message: 'Super Admin: No business selected' });
        return;
      }
      res.status(400).json({ success: false, message: 'No business associated' });
      return;
    }

    const businessId = req.user.businessId.toString();
    
    // Sync default data (warehouses, accounts) if missing
    await businessService.syncDefaults(businessId);
    
    const business = await businessService.getBusiness(businessId);

    res.json({ success: true, data: business });
  } catch (error: unknown) {
    const err = error as { statusCode?: number; message?: string };
    res.status(err.statusCode || 500).json({
      success: false,
      message: err.message || 'Failed to get business',
    });
  }
};

export const updateBusiness = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.businessId) {
      res.status(400).json({ success: false, message: 'No business associated' });
      return;
    }

    const business = await businessService.updateBusiness(
      req.user.businessId.toString(),
      req.user._id.toString(),
      req.body
    );

    res.json({ success: true, message: 'Business updated', data: business });
  } catch (error: unknown) {
    const err = error as { statusCode?: number; message?: string };
    res.status(err.statusCode || 500).json({
      success: false,
      message: err.message || 'Failed to update business',
    });
  }
};

export const getBranches = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    let businessId = req.user?.businessId?.toString();
    
    if (req.user?.role === 'super_admin' && req.query.businessId) {
      businessId = req.query.businessId as string;
    }

    if (!businessId) {
      res.status(400).json({ success: false, message: 'No business associated' });
      return;
    }

    const branches = await businessService.getBranches(businessId);

    res.json({ success: true, data: branches });
  } catch (error: unknown) {
    const err = error as { statusCode?: number; message?: string };
    res.status(err.statusCode || 500).json({
      success: false,
      message: err.message || 'Failed to get branches',
    });
  }
};

export const createBranch = [
  body('name').notEmpty(),
  body('code').notEmpty(),
  body('contact.phone').notEmpty(),

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

      const branch = await businessService.createBranch(req.user.businessId.toString(), req.body);

      res.status(201).json({
        success: true,
        message: 'Branch created',
        data: branch,
      });
    } catch (error: unknown) {
      const err = error as { statusCode?: number; message?: string };
      res.status(err.statusCode || 500).json({
        success: false,
        message: err.message || 'Failed to create branch',
      });
    }
  },
];

export const updateBranch = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.businessId) {
      res.status(400).json({ success: false, message: 'No business associated' });
      return;
    }

    const { branchId } = req.params;
    const branch = await businessService.updateBranch(branchId, req.user.businessId.toString(), req.body);

    res.json({ success: true, message: 'Branch updated', data: branch });
  } catch (error: unknown) {
    const err = error as { statusCode?: number; message?: string };
    res.status(err.statusCode || 500).json({
      success: false,
      message: err.message || 'Failed to update branch',
    });
  }
};

export const deleteBranch = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.businessId) {
      res.status(400).json({ success: false, message: 'No business associated' });
      return;
    }

    const { branchId } = req.params;
    await businessService.deleteBranch(branchId, req.user.businessId.toString());

    res.json({ success: true, message: 'Branch deleted' });
  } catch (error: unknown) {
    const err = error as { statusCode?: number; message?: string };
    res.status(err.statusCode || 500).json({
      success: false,
      message: err.message || 'Failed to delete branch',
    });
  }
};

export const getSettings = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.businessId) {
      res.status(400).json({ success: false, message: 'No business associated' });
      return;
    }

    const settings = await businessService.getBusinessSettings(req.user.businessId.toString());

    res.json({ success: true, data: settings });
  } catch (error: unknown) {
    const err = error as { statusCode?: number; message?: string };
    res.status(err.statusCode || 500).json({
      success: false,
      message: err.message || 'Failed to get settings',
    });
  }
};

export const updateSettings = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.businessId) {
      res.status(400).json({ success: false, message: 'No business associated' });
      return;
    }

    const settings = await businessService.updateBusinessSettings(
      req.user.businessId.toString(),
      req.user._id.toString(),
      req.body
    );

    res.json({ success: true, message: 'Settings updated', data: settings });
  } catch (error: unknown) {
    const err = error as { statusCode?: number; message?: string };
    res.status(err.statusCode || 500).json({
      success: false,
      message: err.message || 'Failed to update settings',
    });
  }
};

export const getWarehouses = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.businessId) {
      res.status(400).json({ success: false, message: 'No business associated' });
      return;
    }

    const warehouses = await businessService.getWarehouses(req.user.businessId.toString());

    res.json({ success: true, data: warehouses });
  } catch (error: unknown) {
    const err = error as { statusCode?: number; message?: string };
    res.status(err.statusCode || 500).json({
      success: false,
      message: err.message || 'Failed to get warehouses',
    });
  }
};

export const createWarehouse = [
  body('name').notEmpty(),
  body('code').notEmpty(),
  body('branchId').notEmpty(),

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

      const warehouse = await businessService.createWarehouse(req.user.businessId.toString(), req.body);

      res.status(201).json({
        success: true,
        message: 'Warehouse created',
        data: warehouse,
      });
    } catch (error: unknown) {
      const err = error as { statusCode?: number; message?: string };
      res.status(err.statusCode || 500).json({
        success: false,
        message: err.message || 'Failed to create warehouse',
      });
    }
  },
];

export const getBusinessShares = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.businessId) {
      res.status(400).json({ success: false, message: 'No business associated' });
      return;
    }

    const shares = await businessService.getBusinessShares(req.user.businessId.toString());
    res.json({ success: true, data: shares });
  } catch (error: unknown) {
    logger.error('Get business shares error:', error);
    res.status(500).json({ success: false, message: 'Failed to get business shares' });
  }
};

export const createBusinessShare = [
  body('partnerName').notEmpty(),
  body('phone').notEmpty(),
  body('sharePercentage').isNumeric(),

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

      const share = await businessService.createBusinessShare(req.user.businessId.toString(), req.body);
      res.status(201).json({ success: true, message: 'Share registered successfully', data: share });
    } catch (error: unknown) {
      logger.error('Create business share error:', error);
      res.status(500).json({ success: false, message: 'Failed to register share' });
    }
  },
];

export const updateBusinessShare = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.businessId) {
      res.status(400).json({ success: false, message: 'No business associated' });
      return;
    }

    const { id } = req.params;
    const share = await businessService.updateBusinessShare(id, req.user.businessId.toString(), req.body);

    if (!share) {
      res.status(404).json({ success: false, message: 'Share not found' });
      return;
    }

    res.json({ success: true, message: 'Share updated successfully', data: share });
  } catch (error: unknown) {
    logger.error('Update business share error:', error);
    res.status(500).json({ success: false, message: 'Failed to update share' });
  }
};

export const deleteBusinessShare = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.businessId) {
      res.status(400).json({ success: false, message: 'No business associated' });
      return;
    }

    const { id } = req.params;
    await businessService.deleteBusinessShare(id, req.user.businessId.toString());

    res.json({ success: true, message: 'Share removed successfully' });
  } catch (error: unknown) {
    logger.error('Delete business share error:', error);
    res.status(500).json({ success: false, message: 'Failed to remove share' });
  }
};

export const requestPlanUpgrade = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.businessId) {
      res.status(400).json({ success: false, message: 'No business associated' });
      return;
    }

    const { requestedPlan, amount, paymentMethod, transactionId, notes } = req.body;
    if (!requestedPlan || !amount || !paymentMethod || !transactionId) {
      res.status(400).json({ success: false, message: 'Required fields: requestedPlan, amount, paymentMethod, transactionId' });
      return;
    }

    const { BillingRequest } = await import('../models/BillingRequest.js');

    // Check if duplicate transactionId
    const existing = await BillingRequest.findOne({ transactionId });
    if (existing) {
      res.status(400).json({ success: false, message: 'Transaction ID already used or submitted.' });
      return;
    }

    const request = await BillingRequest.create({
      businessId: req.user.businessId,
      requestedPlan,
      amount,
      paymentMethod,
      transactionId,
      status: 'pending',
      notes,
    });

    res.status(201).json({
      success: true,
      message: 'Upgrade request submitted to Super Admin for verification',
      data: request,
    });
  } catch (error) {
    logger.error('Request plan upgrade error:', error);
    res.status(500).json({ success: false, message: 'Failed to request plan upgrade' });
  }
};

export const getBusinessBillingRequests = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.businessId) {
      res.status(400).json({ success: false, message: 'No business associated' });
      return;
    }
    const { BillingRequest } = await import('../models/BillingRequest.js');
    const requests = await BillingRequest.find({ businessId: req.user.businessId }).sort({ createdAt: -1 });
    res.json({ success: true, data: requests });
  } catch (error) {
    logger.error('Get business billing requests error:', error);
    res.status(500).json({ success: false, message: 'Failed to get billing requests' });
  }
};