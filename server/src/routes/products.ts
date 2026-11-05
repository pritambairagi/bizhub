import { Router } from 'express';
import * as productController from '../controllers/productController.js';
import { authenticate, authorize } from '../middleware/index.js';

const router = Router();

router.use(authenticate);

router.post('/', authorize('owner', 'manager', 'accountant'), productController.createProduct);
router.get('/', productController.getProducts);
router.get('/categories', productController.getCategories);
router.get('/categories/all', productController.getAllCategories);
router.get('/categories/tree', productController.getCategoryTree);
router.post('/categories', authorize('owner', 'manager'), productController.createCategory);
router.get('/inventory-stats', productController.getInventoryStats);
router.get('/:productId', productController.getProduct);
router.put('/:productId', authorize('owner', 'manager', 'accountant'), productController.updateProduct);
router.delete('/:productId', authorize('owner', 'manager'), productController.deleteProduct);
router.get('/:productId/stock', productController.getProductStock);
router.post('/:productId/adjust-stock', authorize('owner', 'manager', 'accountant', 'cashier'), productController.adjustStock);

export default router;