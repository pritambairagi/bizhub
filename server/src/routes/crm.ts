import { Router } from 'express';
import * as crmController from '../controllers/crmController.js';
import { authenticate } from '../middleware/index.js';

const router = Router();

router.use(authenticate);

router.get('/customers', crmController.getCustomers);
router.get('/customers/:id', crmController.getCustomerById);
router.post('/customers', crmController.createCustomer);
router.put('/customers/:id', crmController.updateCustomer);
router.delete('/customers/:id', crmController.deleteCustomer);
router.post('/customers/:id/wallet', crmController.addWallet);

export default router;