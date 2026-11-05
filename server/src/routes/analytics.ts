import { Router } from 'express';
import * as analyticsController from '../controllers/analyticsController.js';
import { authenticate, checkPermission } from '../middleware/index.js';

const router = Router();

router.use(authenticate);
// Allow any verified employee with manage_dashboard permission (not just owner/manager)
router.use(checkPermission('manage_dashboard'));

router.get('/dashboard-stats', analyticsController.getDashboardStats);
router.get('/sales-trends', analyticsController.getSalesTrends);
router.get('/top-products', analyticsController.getTopProducts);

export default router;

