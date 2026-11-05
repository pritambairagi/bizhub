import { Response } from 'express';
import { logger } from '../utils/logger.js';
import { Order } from '../models/Order.js';
import { Product } from '../models/Product.js';
import { Customer } from '../models/Customer.js';
import { Transaction } from '../models/Transaction.js';
import { InventoryStock } from '../models/Inventory.js';
import type { AuthRequest } from '../types/index.js';
import mongoose from 'mongoose';

export const getDashboardStats = async (req: AuthRequest, res: Response) => {
  try {
    const businessId = req.user?.businessId ? new mongoose.Types.ObjectId(req.user.businessId) : null;

    const matchQuery: any = {};
    if (businessId) {
      matchQuery.businessId = businessId;
    }

    // Get today's sales
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todaySales = await Order.aggregate([
      { $match: { ...matchQuery, createdAt: { $gte: today }, status: { $ne: 'cancelled' } } },
      { $group: { _id: null, total: { $sum: '$total' }, count: { $sum: 1 } } }
    ]);

    // Get total products
    const totalProducts = await Product.countDocuments(matchQuery);

    // Get total customers
    const totalCustomers = await Customer.countDocuments(matchQuery);

    // Get low stock count - More professional aggregation
    const lowStockProducts = await InventoryStock.aggregate([
      { $match: matchQuery },
      { $group: { _id: '$productId', totalQty: { $sum: '$availableQty' } } },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'product'
        }
      },
      { $unwind: '$product' },
      {
        $match: {
          'product.inventory.trackInventory': true,
          $expr: { $lte: ['$totalQty', '$product.inventory.lowStockAlert'] }
        }
      },
      { $count: 'count' }
    ]);

    const lowStockCount = lowStockProducts[0]?.count || 0;

    // Get sales by category breakdown
    const categorySales = await Order.aggregate([
      { $match: { ...matchQuery, status: { $ne: 'cancelled' } } },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.productId',
          total: { $sum: '$items.total' }
        }
      },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'product'
        }
      },
      { $unwind: '$product' },
      {
        $group: {
          _id: '$product.category',
          total: { $sum: '$total' }
        }
      },
      {
        $lookup: {
          from: 'categories',
          localField: '_id',
          foreignField: '_id',
          as: 'category'
        }
      },
      { $unwind: '$category' },
      {
        $project: {
          name: '$category.name.en',
          value: '$total'
        }
      },
      { $sort: { value: -1 } },
      { $limit: 5 }
    ]);

    res.json({
      success: true,
      data: {
        todaySales: todaySales[0]?.total || 0,
        todayOrders: todaySales[0]?.count || 0,
        totalProducts,
        totalCustomers,
        lowStockCount,
        categorySales
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to get dashboard stats', error });
  }
};

export const getSalesTrends = async (req: AuthRequest, res: Response) => {
  try {
    const businessId = req.user?.businessId ? new mongoose.Types.ObjectId(req.user.businessId) : null;
    const matchQuery: any = {};
    if (businessId) {
      matchQuery.businessId = businessId;
    }
    const days = 7;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const sales = await Order.aggregate([
      { $match: { ...matchQuery, createdAt: { $gte: startDate }, status: { $ne: 'cancelled' } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          sales: { $sum: '$total' },
          orders: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({ success: true, data: sales });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to get sales trends', error });
  }
};

export const getTopProducts = async (req: AuthRequest, res: Response) => {
  try {
    const businessId = req.user?.businessId ? new mongoose.Types.ObjectId(req.user.businessId) : null;
    const matchQuery: any = {};
    if (businessId) {
      matchQuery.businessId = businessId;
    }

    const topProducts = await Order.aggregate([
      { $match: { ...matchQuery, status: 'delivered' } },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.productId',
          name: { $first: '$items.name' },
          totalQty: { $sum: '$items.qty' },
          totalRevenue: { $sum: '$items.total' }
        }
      },
      { $sort: { totalQty: -1 } },
      { $limit: 5 }
    ]);

    res.json({ success: true, data: topProducts });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to get top products', error });
  }
};
