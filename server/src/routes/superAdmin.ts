import { Router } from 'express';
import * as c from '../controllers/superAdminController.js';
import { authenticate, authorize } from '../middleware/index.js';

const router = Router();
router.use(authenticate, authorize('super_admin'));

// Stats & Monitoring
router.get('/stats',            c.getGlobalStats);
router.get('/system-health',    c.getSystemHealth);
router.get('/activity',         c.getRecentActivity);
router.get('/revenue-analytics', c.getGlobalRevenueAnalytics);

// Business Management
router.get('/businesses',              c.getAllBusinesses);
router.put('/businesses/:id',          c.updateBusiness);
router.delete('/businesses/:id',       c.deleteBusiness);

// User Management
router.get('/users',                        c.getAllUsers);
router.get('/users/:id',                    c.getUserById);
router.patch('/users/:id/status',           c.updateUserStatus);
router.patch('/users/:id/role',             c.updateUserRole);
router.patch('/users/:id/permissions',      c.updateUserPermissions);
router.delete('/users/:id',                 c.deleteUser);
router.post('/users/:id/reset-password',    c.resetUserPassword);

// Platform Settings (DB-backed)
router.get('/settings',  c.getPlatformSettings);
router.put('/settings',  c.updatePlatformSettings);

// Billing Request Workflows
router.get('/billing-requests', c.getBillingRequests);
router.post('/billing-requests/:id/action', c.handleBillingRequest);

export default router;
