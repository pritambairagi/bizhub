import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import config from '../config/index.js';
import { User } from '../models/index.js';
import type { AuthRequest, IPayload } from '../types/index.js';
import { logger } from '../utils/logger.js';

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.',
      });
      return;
    }

    const token = authHeader.split(' ')[1];

    const decoded = jwt.verify(token, config.jwt.accessSecret) as IPayload;

    const user = await User.findById(decoded.userId)
      .select('-password')
      .populate('customRoleId');

    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Invalid token. User not found.',
      });
      return;
    }

    if (user.status === 'suspended' || user.status === 'locked') {
      res.status(403).json({
        success: false,
        message: 'Account is suspended or locked.',
      });
      return;
    }

    // Merge custom role permissions if exists
    const userAny = user as any;
    if (userAny.customRoleId && userAny.customRoleId.permissions) {
      const rolePermissions = userAny.customRoleId.permissions;
      user.permissions = Array.from(new Set([...(user.permissions || []), ...rolePermissions]));
    }

    // Auto-heal missing branchId for business-associated users (e.g. registered employees)
    if (user.businessId && !user.branchId && user.role !== 'super_admin') {
      const { Branch } = await import('../models/Branch.js');
      const firstBranch = await Branch.findOne({ businessId: user.businessId }).sort({ createdAt: 1 });
      if (firstBranch) {
        user.branchId = firstBranch._id as any;
        await User.findByIdAndUpdate(user._id, { $set: { branchId: firstBranch._id } });
        logger.info(`Self-healed branch association: user ${user._id} assigned to branch ${firstBranch._id}`);
      }
    }

    // Only add role defaults when user has NO explicitly stored permissions.
    // This ensures owner-granted permissions are respected and not overridden.
    if (!user.permissions || user.permissions.length === 0) {
      user.permissions = getDefaultPermissionsForRole(user.role);
    }

    req.user = user as never;
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        success: false,
        message: 'Token expired.',
      });
      return;
    }

    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({
        success: false,
        message: 'Invalid token.',
      });
      return;
    }

    logger.error('Auth middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error.',
    });
  }
};

export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Not authenticated.',
      });
      return;
    }

    // super_admin, owner, and manager always bypass checks and have full access
    const normalizedUserRole = (req.user.role || '').trim().toLowerCase();
    if (
      normalizedUserRole === 'super_admin' ||
      normalizedUserRole === 'owner' ||
      normalizedUserRole === 'manager'
    ) {
      next();
      return;
    }

    logger.info(`Authorizing role: ${req.user.role} against required: ${roles.join(', ')}`);

    // 1. Check if role is directly permitted
    const normalizedRoles = roles.map(r => r.trim().toLowerCase());
    if (normalizedRoles.includes(normalizedUserRole)) {
      next();
      return;
    }

    // 2. Otherwise, check if they have matching direct permissions for this path
    const path = req.originalUrl || req.baseUrl + req.path;
    let requiredPermissions: string[] = [];

    if (path.includes('/products') || path.includes('/purchases') || path.includes('/suppliers')) {
      requiredPermissions.push('manage_inventory');
    }
    if (path.includes('/orders')) {
      requiredPermissions.push('manage_orders');
      requiredPermissions.push('manage_pos');
    }
    if (path.includes('/crm')) {
      requiredPermissions.push('manage_customers');
      requiredPermissions.push('manage_pos');
    }
    if (path.includes('/hrm') || path.includes('/roles')) {
      requiredPermissions.push('manage_employees');
    }
    if (path.includes('/accounting')) {
      requiredPermissions.push('manage_accounting');
    }
    if (path.includes('/analytics')) {
      requiredPermissions.push('manage_dashboard');
      requiredPermissions.push('view_reports');
    }
    if (path.includes('/business/settings')) {
      requiredPermissions.push('manage_settings');
    }
    if (path.includes('/business/branches') || path.includes('/business/warehouses')) {
      requiredPermissions.push('manage_branches');
    }
    if (path.includes('/business/shares')) {
      requiredPermissions.push('manage_settings');
    }

    const userPermissions = req.user.permissions || [];
    
    logger.info(`[Auth Debug] Path: "${path}", Role: "${req.user.role}", UserPerms: ${JSON.stringify(userPermissions)}, RequiredPerms: ${JSON.stringify(requiredPermissions)}`);
    const hasPermission = requiredPermissions.some(
      (perm) => userPermissions.includes(perm) || userPermissions.includes('*')
    );

    if (hasPermission) {
      next();
      return;
    }

    logger.warn(`Access denied for role: ${req.user.role}. Required roles: ${roles.join(', ')} or permissions: ${requiredPermissions.join(', ')}`);
    res.status(403).json({
      success: false,
      message: 'Access denied. Insufficient permissions.',
    });
  };
};




export const checkPermission = (permission: string) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authenticated.' });
      return;
    }

    const role = (req.user.role || '').trim().toLowerCase();

    // Admin roles always bypass permission checks
    if (role === 'super_admin' || role === 'owner' || role === 'manager') {
      next();
      return;
    }

    const userPermissions = req.user.permissions || [];

    // 1. Check explicitly stored/granted permissions
    if (userPermissions.includes(permission) || userPermissions.includes('*')) {
      next();
      return;
    }

    // 2. Fallback: check if their role would grant this permission by default
    //    This covers old accounts created before default permissions were stored.
    const roleDefaults = getDefaultPermissionsForRole(role);
    if (roleDefaults.includes(permission) || roleDefaults.includes('*')) {
      next();
      return;
    }

    res.status(403).json({ success: false, message: 'Permission denied.' });
  };
};

export const getDefaultPermissionsForRole = (role: string): string[] => {
  const normalizedRole = (role || '').trim().toLowerCase();
  switch (normalizedRole) {
    case 'owner':
    case 'super_admin':
      return ['*'];
    case 'manager':
      return ['manage_dashboard', 'manage_pos', 'manage_orders', 'manage_inventory', 'manage_customers', 'manage_employees', 'manage_branches', 'manage_accounting'];
    case 'cashier':
      return ['manage_pos', 'manage_orders', 'manage_customers'];
    case 'accountant':
      return ['manage_accounting', 'manage_orders'];
    case 'salesman':
      return ['manage_pos', 'manage_customers', 'manage_orders'];
    case 'delivery':
      return ['manage_orders'];
    default:
      return ['manage_pos'];
  }
};