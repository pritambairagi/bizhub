import { Router } from 'express';
import { authenticate, authorize } from '../middleware/index.js';
import * as couponController from '../controllers/couponController.js';

const router = Router();

// Public: validate/apply coupon (requires auth but any role)
router.post('/apply', authenticate, couponController.applyCoupon);

// Admin/Owner: manage coupons
router.get('/', authenticate, couponController.getCoupons);
router.post('/', authenticate, authorize('super_admin', 'owner'), couponController.createCoupon);
router.put('/:id', authenticate, authorize('super_admin', 'owner'), couponController.updateCoupon);
router.delete('/:id', authenticate, authorize('super_admin', 'owner'), couponController.deleteCoupon);

export default router;
