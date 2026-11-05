import { Router } from 'express';
import authRoutes from './auth.js';
import businessRoutes from './business.js';
import productRoutes from './products.js';
import orderRoutes from './orders.js';
import customerRoutes from './crm.js';
import employeeRoutes from './hrm.js';
import roleRoutes from './roles.js';
import accountRoutes from './accounting.js';
import shopRoutes from './shop.js';
import analyticsRoutes from './analytics.js';
import superAdminRoutes from './superAdmin.js';
import notificationRoutes from './notifications.js';
import purchaseRoutes from './purchases.js';
import supplierRoutes from './suppliers.js';
import couponRoutes from './coupons.js';
import chatRoutes from './chat.js';
import financeRoutes from './finance.js';
import uploadRoutes from './upload.js';
import { PlatformSettings } from '../models/PlatformSettings.js';

const router = Router();

// Public: get essential platform settings (VAT, service charge, etc.) for POS frontend
router.get('/public/settings', async (_req, res) => {
  try {
    let settings = await PlatformSettings.findOne().select(
      'taxEnabled defaultTaxRate serviceCharge deliveryCharge marqueeMessage defaultCurrency'
    );
    if (!settings) settings = await PlatformSettings.create({});
    res.json({ success: true, data: settings });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to get public settings' });
  }
});

// API Routes
router.use('/auth', authRoutes);
router.use('/business', businessRoutes);
router.use('/products', productRoutes);
router.use('/orders', orderRoutes);
router.use('/crm', customerRoutes);
router.use('/hrm', employeeRoutes);
router.use('/roles', roleRoutes);
router.use('/accounting', accountRoutes);
router.use('/shop', shopRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/admin', superAdminRoutes);
router.use('/notifications', notificationRoutes);
router.use('/purchases', purchaseRoutes);
router.use('/suppliers', supplierRoutes);
router.use('/coupons', couponRoutes);
router.use('/chat', chatRoutes);
router.use('/finance', financeRoutes);
router.use('/upload', uploadRoutes);

export default router;