import { Router } from 'express';
import * as orderController from '../controllers/orderController.js';
import { authenticate, authorize } from '../middleware/index.js';

const router = Router();

router.use(authenticate);

// salesman & cashier & delivery can all create/manage orders (POS)
router.post('/', authorize('cashier', 'salesman', 'delivery', 'manager', 'owner'), orderController.createOrder);
router.get('/', orderController.getOrders);
router.get('/daily-sales', orderController.getDailySales);
router.get('/report', authorize('owner', 'manager', 'accountant'), orderController.getSalesReport);
router.get('/:orderId', orderController.getOrder);
router.put('/:orderId/status', authorize('cashier', 'salesman', 'delivery', 'manager', 'owner'), orderController.updateOrderStatus);
router.post('/:orderId/pay', authorize('cashier', 'salesman', 'delivery', 'manager', 'owner'), orderController.processPayment);
router.post('/:orderId/return', authorize('cashier', 'salesman', 'manager', 'owner'), orderController.createReturn);

export default router;