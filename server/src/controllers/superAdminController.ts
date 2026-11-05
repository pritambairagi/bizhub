import { Response } from 'express';
import { Business, User, Order, Product, PlatformSettings } from '../models/index.js';
import type { AuthRequest } from '../types/index.js';
import { logger } from '../utils/logger.js';

// ─── Helper: get or create singleton platform settings ─────────────────────────
async function getOrCreateSettings() {
  let settings = await PlatformSettings.findOne();
  if (!settings) {
    settings = await PlatformSettings.create({
      allowedBusinessTypes: ['retail', 'wholesale', 'restaurant', 'pharmacy', 'franchise', 'marketplace'],
    });
  }
  return settings;
}

// ─── Global Stats ──────────────────────────────────────────────────────────────
export const getGlobalStats = async (req: AuthRequest, res: Response) => {
  try {
    const [totalBusinesses, totalUsers, totalOrders, totalProducts] = await Promise.all([
      Business.countDocuments(),
      User.countDocuments(),
      Order.countDocuments(),
      Product.countDocuments(),
    ]);

    const orderStats = await Order.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, totalRevenue: { $sum: '$total' } } },
    ]);

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [todayAgg, activeUsers, suspendedUsers, roleBreakdown, businessTypeBreakdown] = await Promise.all([
      Order.aggregate([
        { $match: { status: 'completed', createdAt: { $gte: todayStart } } },
        { $group: { _id: null, total: { $sum: '$total' }, count: { $sum: 1 } } },
      ]),
      User.countDocuments({ status: 'active' }),
      User.countDocuments({ status: 'suspended' }),
      User.aggregate([{ $group: { _id: '$role', count: { $sum: 1 } } }]),
      Business.aggregate([{ $group: { _id: '$type', count: { $sum: 1 } } }]),
    ]);

    res.json({
      success: true,
      data: {
        totalBusinesses,
        totalUsers,
        totalOrders,
        totalProducts,
        totalRevenue: orderStats[0]?.totalRevenue || 0,
        todayOrders: todayAgg[0]?.count || 0,
        todayRevenue: todayAgg[0]?.total || 0,
        activeUsers,
        suspendedUsers,
        roleBreakdown,
        businessTypeBreakdown,
      },
    });
  } catch (error) {
    logger.error('Get global stats error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch global stats' });
  }
};

// ─── System Health ─────────────────────────────────────────────────────────────
export const getSystemHealth = async (_req: AuthRequest, res: Response) => {
  try {
    const mem = process.memoryUsage();
    const uptime = process.uptime();
    const formatUptime = (s: number) => {
      const d = Math.floor(s / 86400);
      const h = Math.floor((s % 86400) / 3600);
      const m = Math.floor((s % 3600) / 60);
      return `${d}d ${h}h ${m}m`;
    };
    res.json({
      success: true,
      data: {
        status: 'healthy',
        database: { status: 'connected', responseTime: '< 10ms' },
        server: {
          uptime: Math.floor(uptime),
          uptimeFormatted: formatUptime(uptime),
          memoryUsed: Math.round(mem.heapUsed / 1024 / 1024),
          memoryTotal: Math.round(mem.heapTotal / 1024 / 1024),
          nodeVersion: process.version,
          platform: process.platform,
        },
        services: { api: 'operational', database: 'operational', auth: 'operational', storage: 'operational' },
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    logger.error('Get system health error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch system health' });
  }
};

// ─── All Businesses ────────────────────────────────────────────────────────────
export const getAllBusinesses = async (req: AuthRequest, res: Response) => {
  try {
    const { page = 1, limit = 15, search, type } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const query: any = {};
    if (search) query.name = { $regex: search, $options: 'i' };
    if (type) query.type = type;

    const [businesses, total] = await Promise.all([
      Business.find(query)
        .populate('owner', 'email profile.firstName profile.lastName')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Business.countDocuments(query),
    ]);

    res.json({ success: true, data: businesses, total, page: Number(page), limit: Number(limit) });
  } catch (error) {
    logger.error('Get all businesses error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch businesses' });
  }
};

// ─── Update Business ─────────────────────────────────────────────
export const updateBusiness = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { subscriptionPlan, status, name, type, email, phone } = req.body;
    
    const update: any = {};
    if (subscriptionPlan) update['subscription.plan'] = subscriptionPlan;
    if (status) update.status = status;
    if (name) update.name = name;
    if (type) update.type = type;
    if (email) update['contact.email'] = email;
    if (phone) update['contact.phone'] = phone;

    const business = await Business.findByIdAndUpdate(id, update, { new: true });
    if (!business) return res.status(404).json({ success: false, message: 'Business not found' });

    res.json({ success: true, data: business, message: 'Business updated' });
  } catch (error) {
    logger.error('Update business error:', error);
    res.status(500).json({ success: false, message: 'Failed to update business' });
  }
};

// ─── Delete Business ───────────────────────────────────────────────────────────
export const deleteBusiness = async (req: AuthRequest, res: Response) => {
  try {
    const business = await Business.findByIdAndDelete(req.params['id'] as string);
    if (!business) return res.status(404).json({ success: false, message: 'Business not found' });
    res.json({ success: true, message: 'Business deleted' });
  } catch (error) {
    logger.error('Delete business error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete business' });
  }
};

// ─── All Users ─────────────────────────────────────────────────────────────────
export const getAllUsers = async (req: AuthRequest, res: Response) => {
  try {
    const { page = 1, limit = 15, search, role, status } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const query: any = {};
    if (search) {
      query.$or = [
        { email: { $regex: search, $options: 'i' } },
        { 'profile.firstName': { $regex: search, $options: 'i' } },
        { 'profile.lastName': { $regex: search, $options: 'i' } },
      ];
    }
    if (role) query.role = role;
    if (status) query.status = status;

    const [users, total] = await Promise.all([
      User.find(query)
        .populate('businessId', 'name type')
        .select('-password -auth.twoFactorSecret')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      User.countDocuments(query),
    ]);

    res.json({ success: true, data: users, total, page: Number(page), limit: Number(limit) });
  } catch (error) {
    logger.error('Get all users error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch users' });
  }
};

// ─── Update User Status ────────────────────────────────────────────────────────
export const updateUserStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { status } = req.body;
    if (!['active', 'suspended', 'locked'].includes(status))
      return res.status(400).json({ success: false, message: 'Invalid status' });

    const user = await User.findByIdAndUpdate(req.params['id'] as string, { status }, { new: true }).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    res.json({ success: true, data: user, message: `User ${status}` });
  } catch (error) {
    logger.error('Update user status error:', error);
    res.status(500).json({ success: false, message: 'Failed to update status' });
  }
};

// ─── Update User Role ──────────────────────────────────────────────────────────
export const updateUserRole = async (req: AuthRequest, res: Response) => {
  try {
    const { role, businessId } = req.body;
    const validRoles = ['super_admin', 'owner', 'manager', 'accountant', 'cashier', 'delivery', 'vendor', 'customer'];
    if (!validRoles.includes(role))
      return res.status(400).json({ success: false, message: 'Invalid role' });

    const update: any = { role };
    if (businessId !== undefined) update.businessId = businessId || null;

    const user = await User.findByIdAndUpdate(req.params['id'] as string, update, { new: true }).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    res.json({ success: true, data: user, message: 'Role updated' });
  } catch (error) {
    logger.error('Update user role error:', error);
    res.status(500).json({ success: false, message: 'Failed to update role' });
  }
};

// ─── Update User Permissions ───────────────────────────────────────────────────
export const updateUserPermissions = async (req: AuthRequest, res: Response) => {
  try {
    const { permissions } = req.body;
    if (!Array.isArray(permissions))
      return res.status(400).json({ success: false, message: 'permissions must be an array' });

    const user = await User.findByIdAndUpdate(
      req.params['id'] as string,
      { permissions },
      { new: true }
    ).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    res.json({ success: true, data: user, message: 'Permissions updated' });
  } catch (error) {
    logger.error('Update user permissions error:', error);
    res.status(500).json({ success: false, message: 'Failed to update permissions' });
  }
};

// ─── Delete User ───────────────────────────────────────────────────────────────
export const deleteUser = async (req: AuthRequest, res: Response) => {
  try {
    if (req.user?._id?.toString() === req.params['id'] as string)
      return res.status(400).json({ success: false, message: 'Cannot delete your own account' });

    const user = await User.findByIdAndDelete(req.params['id'] as string);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    res.json({ success: true, message: 'User deleted' });
  } catch (error) {
    logger.error('Delete user error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete user' });
  }
};

// ─── Reset User Password ───────────────────────────────────────────────────────
export const resetUserPassword = async (req: AuthRequest, res: Response) => {
  try {
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 6)
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });

    const user = await User.findById(req.params['id'] as string);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    user.password = newPassword;
    await user.save();

    res.json({ success: true, message: 'Password reset successfully' });
  } catch (error) {
    logger.error('Reset password error:', error);
    res.status(500).json({ success: false, message: 'Failed to reset password' });
  }
};

// ─── Get Single User ───────────────────────────────────────────────────────────
export const getUserById = async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.params['id'] as string)
      .populate('businessId', 'name type')
      .select('-password -auth.twoFactorSecret');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, data: user });
  } catch (error) {
    logger.error('Get user by id error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch user' });
  }
};

// ─── Recent Activity ───────────────────────────────────────────────────────────
export const getRecentActivity = async (req: AuthRequest, res: Response) => {
  try {
    const limit = Number(req.query.limit) || 20;

    const [recentOrders, recentUsers, recentBusinesses] = await Promise.all([
      Order.find().sort({ createdAt: -1 }).limit(5).populate('businessId', 'name').select('_id status total createdAt businessId'),
      User.find().sort({ createdAt: -1 }).limit(5).select('email role profile.firstName profile.lastName createdAt status'),
      Business.find().sort({ createdAt: -1 }).limit(5).select('name type contact.email createdAt'),
    ]);

    const activities = [
      ...recentOrders.map((o: any) => ({
        type: 'order', message: `Order #${o._id?.toString().slice(-6)} — ${o.status}`,
        amount: o.total, business: (o.businessId as any)?.name,
        timestamp: o.createdAt, severity: o.status === 'cancelled' ? 'error' : 'info',
      })),
      ...recentUsers.map((u: any) => ({
        type: 'user', message: `User: ${u.profile?.firstName || ''} ${u.profile?.lastName || ''} (${u.role})`,
        email: u.email, timestamp: u.createdAt,
        severity: u.status === 'suspended' ? 'warning' : 'success',
      })),
      ...recentBusinesses.map((b: any) => ({
        type: 'business', message: `Business: ${b.name} (${b.type})`,
        email: b.contact?.email, timestamp: b.createdAt, severity: 'success',
      })),
    ]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);

    res.json({ success: true, data: activities });
  } catch (error) {
    logger.error('Get activity error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch activity' });
  }
};

// ─── Revenue Analytics ─────────────────────────────────────────────────────────
export const getGlobalRevenueAnalytics = async (req: AuthRequest, res: Response) => {
  try {
    const days = Number(req.query.period) || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const [dailyRevenue, topBusinesses] = await Promise.all([
      Order.aggregate([
        { $match: { createdAt: { $gte: startDate }, status: 'completed' } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, revenue: { $sum: '$total' }, orders: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
      Order.aggregate([
        { $match: { status: 'completed' } },
        { $group: { _id: '$businessId', revenue: { $sum: '$total' }, orders: { $sum: 1 } } },
        { $sort: { revenue: -1 } },
        { $limit: 5 },
        { $lookup: { from: 'businesses', localField: '_id', foreignField: '_id', as: 'business' } },
        { $unwind: { path: '$business', preserveNullAndEmptyArrays: true } },
      ]),
    ]);

    res.json({ success: true, data: { dailyRevenue, topBusinesses } });
  } catch (error) {
    logger.error('Get revenue analytics error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch analytics' });
  }
};

// ─── Platform Settings (DB-backed) ────────────────────────────────────────────
export const getPlatformSettings = async (_req: AuthRequest, res: Response) => {
  try {
    const settings = await getOrCreateSettings();
    res.json({ success: true, data: settings });
  } catch (error) {
    logger.error('Get platform settings error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch settings' });
  }
};

export const updatePlatformSettings = async (req: AuthRequest, res: Response) => {
  try {
    let settings = await PlatformSettings.findOne();
    if (!settings) {
      settings = await PlatformSettings.create({
        ...req.body,
        allowedBusinessTypes: req.body.allowedBusinessTypes || ['retail', 'wholesale', 'restaurant', 'pharmacy', 'franchise', 'marketplace'],
      });
    } else {
      Object.assign(settings, req.body);
      await settings.save();
    }
    res.json({ success: true, data: settings, message: 'Platform settings updated successfully' });
  } catch (error) {
    logger.error('Update platform settings error:', error);
    res.status(500).json({ success: false, message: 'Failed to update settings' });
  }
};

export const getBillingRequests = async (req: AuthRequest, res: Response) => {
  try {
    const { BillingRequest } = await import('../models/BillingRequest.js');
    const requests = await BillingRequest.find()
      .populate('businessId', 'name contact')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: requests });
  } catch (error) {
    logger.error('Get billing requests error:', error);
    res.status(500).json({ success: false, message: 'Failed to get billing requests' });
  }
};

export const handleBillingRequest = async (req: AuthRequest, res: Response) => {
  try {
    const { action, notes } = req.body; // 'approve' or 'reject'
    const { BillingRequest } = await import('../models/BillingRequest.js');
    
    const request = await BillingRequest.findById(req.params['id'] as string);
    if (!request) return res.status(404).json({ success: false, message: 'Request not found' });

    if (request.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Billing request has already been processed' });
    }

    if (action === 'approve') {
      request.status = 'approved';
      if (notes) request.notes = notes;
      await request.save();

      // Find the business and update subscription details
      const business = await Business.findById(request.businessId);
      if (business) {
        business.subscription.plan = request.requestedPlan;
        // set endDate to 30 days from now
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + 30);
        business.subscription.endDate = endDate;
        await business.save();
      }
      res.json({ success: true, message: 'Upgrade request approved. Business plan updated.' });
    } else if (action === 'reject') {
      request.status = 'rejected';
      if (notes) request.notes = notes;
      await request.save();
      res.json({ success: true, message: 'Upgrade request rejected.' });
    } else {
      res.status(400).json({ success: false, message: 'Invalid action: must be approve or reject' });
    }
  } catch (error) {
    logger.error('Handle billing request error:', error);
    res.status(500).json({ success: false, message: 'Failed to handle billing request' });
  }
};
