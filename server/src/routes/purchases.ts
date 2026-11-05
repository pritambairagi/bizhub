import { Router } from 'express';
import * as c from '../controllers/purchaseController.js';
import { authenticate } from '../middleware/index.js';

const router = Router();

router.use(authenticate);

router.post('/', c.createPurchase);
router.get('/', c.getPurchases);
router.get('/:id', c.getPurchaseById);

export default router;
