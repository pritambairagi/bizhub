import { Response } from 'express';
import { body, validationResult } from 'express-validator';
import * as supplierService from '../services/supplierService.js';
import type { AuthRequest } from '../types/index.js';
import { logger } from '../utils/logger.js';

export const getSuppliers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.businessId) {
      res.status(400).json({ success: false, message: 'No business associated' });
      return;
    }

    const { page, limit, search } = req.query;

    if (page || limit || search) {
      const result = await supplierService.getSuppliers(req.user.businessId.toString(), {
        page: page ? Number(page) : 1,
        limit: limit ? Number(limit) : 20,
        search: search as string,
      });
      res.json({ success: true, data: result });
    } else {
      const suppliers = await supplierService.getAllSuppliersArray(req.user.businessId.toString());
      res.json({ success: true, data: suppliers });
    }
  } catch (error: unknown) {
    logger.error('Get suppliers error:', error);
    res.status(500).json({ success: false, message: 'Failed to get suppliers' });
  }
};

export const createSupplier = [
  body('name').notEmpty().withMessage('Supplier name is required'),
  body('phone').notEmpty().withMessage('Phone number is required'),

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

      const supplier = await supplierService.createSupplier(req.user.businessId.toString(), req.body);
      res.status(201).json({ success: true, message: 'Supplier created successfully', data: supplier });
    } catch (error: unknown) {
      logger.error('Create supplier error:', error);
      res.status(500).json({ success: false, message: 'Failed to create supplier' });
    }
  },
];

export const updateSupplier = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.businessId) {
      res.status(400).json({ success: false, message: 'No business associated' });
      return;
    }

    const { id } = req.params;
    const supplier = await supplierService.updateSupplier(id as string, req.user.businessId.toString(), req.body);

    if (!supplier) {
      res.status(404).json({ success: false, message: 'Supplier not found' });
      return;
    }

    res.json({ success: true, message: 'Supplier updated successfully', data: supplier });
  } catch (error: unknown) {
    logger.error('Update supplier error:', error);
    res.status(500).json({ success: false, message: 'Failed to update supplier' });
  }
};

export const deleteSupplier = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.businessId) {
      res.status(400).json({ success: false, message: 'No business associated' });
      return;
    }

    const { id } = req.params;
    const success = await supplierService.deleteSupplier(id as string, req.user.businessId.toString());

    if (!success) {
      res.status(404).json({ success: false, message: 'Supplier not found' });
      return;
    }

    res.json({ success: true, message: 'Supplier deleted successfully' });
  } catch (error: unknown) {
    logger.error('Delete supplier error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete supplier' });
  }
};
