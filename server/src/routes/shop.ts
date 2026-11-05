import { Router } from 'express';
import * as shopController from '../controllers/shopController.js';

const router = Router();

router.get('/products', shopController.getProducts);
router.get('/categories', shopController.getCategories);

router.get('/cart', shopController.getCart);
router.post('/cart', shopController.addToCart);
router.put('/cart/:itemId', shopController.updateCartItem);
router.delete('/cart/:itemId', shopController.removeCartItem);

router.post('/checkout', shopController.checkout);
router.get('/orders', shopController.getOrders);
router.get('/orders/:id', shopController.getOrderById);

export default router;