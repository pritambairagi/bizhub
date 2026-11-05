import { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import * as productService from '../services/productService.js';
import type { AuthRequest } from '../types/index.js';
import { logger } from '../utils/logger.js';

export const createProduct = [
  body('name.en').notEmpty().withMessage('Product name is required'),
  body('sku').notEmpty().withMessage('SKU is required'),
  body('category').notEmpty().withMessage('Category is required'),

  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ success: false, errors: errors.array() });
        return;
      }

      if (!req.user?.businessId && req.user?.role !== 'super_admin') {
        res.status(400).json({ success: false, message: 'No business associated' });
        return;
      }

      const businessId = req.user?.role === 'super_admin' ? req.body.businessId : req.user?.businessId?.toString();
      if (!businessId) {
        res.status(400).json({ success: false, message: 'Business ID is required' });
        return;
      }

      // Enforce subscription plan limits
      const { Business } = await import('../models/Business.js');
      const { Product } = await import('../models/Product.js');
      const businessObj = await Business.findById(businessId);
      if (businessObj) {
        const plan = businessObj.subscription?.plan || 'free';
        let limitVal = 100;
        if (plan === 'standard') limitVal = 1000;
        else if (plan === 'professional') limitVal = Infinity;

        if (limitVal !== Infinity) {
          const currentCount = await Product.countDocuments({ businessId });
          if (currentCount >= limitVal) {
            res.status(403).json({
              success: false,
              message: `Plan limit reached. Your subscription plan (${plan.toUpperCase()}) supports a maximum of ${limitVal} products. Please upgrade your plan in settings to list more.`
            });
            return;
          }
        }
      }

      const product = await productService.createProduct(
        businessId,
        { ...req.body, createdBy: req.user?._id?.toString() }
      );

      res.status(201).json({
        success: true,
        message: 'Product created',
        data: product,
      });
    } catch (error: unknown) {
      const err = error as { statusCode?: number; message?: string };
      res.status(err.statusCode || 500).json({
        success: false,
        message: err.message || 'Failed to create product',
      });
    }
  },
];

export const getProducts = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.businessId && req.user?.role !== 'super_admin') {
      res.status(400).json({ success: false, message: 'No business associated' });
      return;
    }

    const { page, limit, category, search, status } = req.query;
    // For super_admin: if businessId is provided in query, use it; otherwise return all products
    // For other roles: use their assigned businessId
    const businessId = req.user?.role === 'super_admin'
      ? (req.query.businessId as string || undefined)
      : req.user?.businessId?.toString();

    const result = await productService.getProducts(businessId, {
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      category: category as string,
      search: search as string,
      status: status as string,
    });

    res.json({ success: true, data: result });
  } catch (error: unknown) {
    const err = error as { statusCode?: number; message?: string };
    res.status(err.statusCode || 500).json({
      success: false,
      message: err.message || 'Failed to get products',
    });
  }
};

export const getProduct = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.businessId && req.user?.role !== 'super_admin') {
      res.status(400).json({ success: false, message: 'No business associated' });
      return;
    }

    const { productId } = req.params;
    const businessId = req.user?.role === 'super_admin'
      ? (req.query.businessId as string || undefined)
      : req.user?.businessId?.toString();
    const product = await productService.getProduct(productId, businessId);

    res.json({ success: true, data: product });
  } catch (error: unknown) {
    const err = error as { statusCode?: number; message?: string };
    res.status(err.statusCode || 500).json({
      success: false,
      message: err.message || 'Failed to get product',
    });
  }
};

export const updateProduct = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.businessId && req.user?.role !== 'super_admin') {
      res.status(400).json({ success: false, message: 'No business associated' });
      return;
    }

    const { productId } = req.params;
    const businessId = req.user?.role === 'super_admin'
      ? (req.body.businessId as string || undefined)
      : req.user?.businessId?.toString();
    const product = await productService.updateProduct(productId, businessId, req.body);

    res.json({ success: true, message: 'Product updated', data: product });
  } catch (error: unknown) {
    const err = error as { statusCode?: number; message?: string };
    res.status(err.statusCode || 500).json({
      success: false,
      message: err.message || 'Failed to update product',
    });
  }
};

export const deleteProduct = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.businessId && req.user?.role !== 'super_admin') {
      res.status(400).json({ success: false, message: 'No business associated' });
      return;
    }

    const { productId } = req.params;
    const businessId = req.user?.role === 'super_admin'
      ? (req.query.businessId as string || undefined)
      : req.user?.businessId?.toString();
    await productService.deleteProduct(productId, businessId);

    res.json({ success: true, message: 'Product deleted' });
  } catch (error: unknown) {
    const err = error as { statusCode?: number; message?: string };
    res.status(err.statusCode || 500).json({
      success: false,
      message: err.message || 'Failed to delete product',
    });
  }
};

export const getProductStock = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.businessId && req.user?.role !== 'super_admin') {
      res.status(400).json({ success: false, message: 'No business associated' });
      return;
    }

    const { productId } = req.params;
    const businessId = req.user?.role === 'super_admin'
      ? (req.query.businessId as string || undefined)
      : req.user?.businessId?.toString();
    const stock = await productService.getProductStock(productId, businessId);

    res.json({ success: true, data: stock });
  } catch (error: unknown) {
    const err = error as { statusCode?: number; message?: string };
    res.status(err.statusCode || 500).json({
      success: false,
      message: err.message || 'Failed to get stock',
    });
  }
};

export const adjustStock = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.businessId && req.user?.role !== 'super_admin') {
      res.status(400).json({ success: false, message: 'No business associated' });
      return;
    }

    const { productId } = req.params;
    const businessId = req.user?.role === 'super_admin'
      ? (req.body.businessId as string || undefined)
      : req.user?.businessId?.toString();
    const stock = await productService.adjustStock(productId, businessId, req.body);

    res.json({ success: true, message: 'Stock adjusted', data: stock });
  } catch (error: unknown) {
    const err = error as { statusCode?: number; message?: string };
    res.status(err.statusCode || 500).json({
      success: false,
      message: err.message || 'Failed to adjust stock',
    });
  }
};

export const createCategory = [
  body('name.en').notEmpty(),

  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ success: false, errors: errors.array() });
        return;
      }

      if (!req.user?.businessId && req.user?.role !== 'super_admin') {
        res.status(400).json({ success: false, message: 'No business associated' });
        return;
      }

      const businessId = req.user?.role === 'super_admin' ? req.body.businessId : req.user?.businessId?.toString();
      if (!businessId) {
        res.status(400).json({ success: false, message: 'Business ID is required' });
        return;
      }

      const category = await productService.createCategory(
        businessId,
        req.body
      );

      res.status(201).json({
        success: true,
        message: 'Category created',
        data: category,
      });
    } catch (error: unknown) {
      const err = error as { statusCode?: number; message?: string };
      logger.error('Create category error:', error);
      res.status(err.statusCode || 500).json({
        success: false,
        message: err.message || 'Failed to create category',
      });
    }
  },
];

export const getCategories = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.businessId && req.user?.role !== 'super_admin') {
      res.status(400).json({ success: false, message: 'No business associated' });
      return;
    }

    const { parentId } = req.query;
    const businessId = req.user?.role === 'super_admin'
      ? (req.query.businessId as string || undefined)
      : req.user?.businessId?.toString();
    const categories = await productService.getCategories(businessId, parentId as string);

    res.json({ success: true, data: categories });
  } catch (error: unknown) {
    const err = error as { statusCode?: number; message?: string };
    res.status(err.statusCode || 500).json({
      success: false,
      message: err.message || 'Failed to get categories',
    });
  }
};

export const getCategoryTree = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.businessId && req.user?.role !== 'super_admin') {
      res.status(400).json({ success: false, message: 'No business associated' });
      return;
    }

    const businessId = req.user?.role === 'super_admin'
      ? (req.query.businessId as string || undefined)
      : req.user?.businessId?.toString();
    const categories = await productService.getCategoryTree(businessId);

    res.json({ success: true, data: categories });
  } catch (error: unknown) {
    const err = error as { statusCode?: number; message?: string };
    res.status(err.statusCode || 500).json({
      success: false,
      message: err.message || 'Failed to get category tree',
    });
  }
};

export const getAllCategories = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.businessId && req.user?.role !== 'super_admin') {
      res.status(400).json({ success: false, message: 'No business associated' });
      return;
    }

    const businessId = req.user?.role === 'super_admin'
      ? (req.query.businessId as string || undefined)
      : req.user?.businessId?.toString();
    const categories = await productService.getAllCategories(businessId);

    res.json({ success: true, data: { categories } });
  } catch (error: unknown) {
    const err = error as { statusCode?: number; message?: string };
    res.status(err.statusCode || 500).json({
      success: false,
      message: err.message || 'Failed to get all categories',
    });
  }
};

export const getInventoryStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.businessId && req.user?.role !== 'super_admin') {
      res.status(400).json({ success: false, message: 'No business associated' });
      return;
    }

    const businessId = req.user?.role === 'super_admin'
      ? (req.query.businessId as string || undefined)
      : req.user?.businessId?.toString();

    if (!businessId) {
      res.status(400).json({ success: false, message: 'Business ID required' });
      return;
    }

    const stats = await productService.getInventoryStats(businessId);

    res.json({ success: true, data: stats });
  } catch (error: unknown) {
    const err = error as { statusCode?: number; message?: string };
    res.status(err.statusCode || 500).json({
      success: false,
      message: err.message || 'Failed to get inventory stats',
    });
  }
};