import { Response } from 'express';
import * as purchaseService from '../services/purchaseService.js';
import type { AuthRequest } from '../types/index.js';
import { logger } from '../utils/logger.js';

export const createPurchase = async (req: AuthRequest, res: Response) => {
  try {
    const businessId = req.user?.businessId?.toString();
    const userId = req.user?._id.toString();

    if (!businessId || !userId) {
      return res.status(400).json({ success: false, message: 'Missing session info' });
    }

    const purchase = await purchaseService.createPurchase(businessId, userId, req.body);

    res.status(201).json({
      success: true,
      message: 'Purchase recorded successfully',
      data: purchase,
    });
  } catch (error: any) {
    logger.error('Create purchase error:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to create purchase',
    });
  }
};

export const getPurchases = async (req: AuthRequest, res: Response) => {
  try {
    const businessId = req.user?.businessId?.toString();
    if (!businessId) {
      return res.status(400).json({ success: false, message: 'Business ID required' });
    }

    const { page, limit, search, startDate, endDate } = req.query;

    const result = await purchaseService.getPurchases(businessId, {
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
      search: search as string,
      startDate: startDate as string,
      endDate: endDate as string,
    });

    res.json({ success: true, data: result });
  } catch (error: any) {
    logger.error('Get purchases error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch purchases' });
  }
};

export const getPurchaseById = async (req: AuthRequest, res: Response) => {
  try {
    const businessId = req.user?.businessId?.toString();
    if (!businessId) {
      return res.status(400).json({ success: false, message: 'Business ID required' });
    }

    const purchase = await purchaseService.getPurchaseById(req.params['i'] as string, businessId);
    res.json({ success: true, data: purchase });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};
