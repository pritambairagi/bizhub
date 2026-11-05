import { Router } from 'express';
import * as businessController from '../controllers/businessController.js';
import { authenticate, authorize } from '../middleware/index.js';

const router = Router();

router.use(authenticate);

router.post('/', authorize('owner', 'super_admin'), businessController.createBusiness);
router.get('/', businessController.getBusiness);
router.put('/', authorize('owner'), businessController.updateBusiness);
router.get('/settings', businessController.getSettings);
router.put('/settings', authorize('owner'), businessController.updateSettings);
router.post('/upgrade-plan', authorize('owner'), businessController.requestPlanUpgrade);
router.get('/billing-requests', authorize('owner'), businessController.getBusinessBillingRequests);

router.get('/branches', businessController.getBranches);
router.post('/branches', authorize('owner', 'manager'), businessController.createBranch);
router.put('/branches/:branchId', authorize('owner', 'manager'), businessController.updateBranch);
router.delete('/branches/:branchId', authorize('owner'), businessController.deleteBranch);

router.get('/warehouses', businessController.getWarehouses);
router.post('/warehouses', authorize('owner', 'manager'), businessController.createWarehouse);

router.get('/shares', businessController.getBusinessShares);
router.post('/shares', authorize('owner'), businessController.createBusinessShare);
router.put('/shares/:id', authorize('owner'), businessController.updateBusinessShare);
router.delete('/shares/:id', authorize('owner'), businessController.deleteBusinessShare);

import * as expenseController from '../controllers/expenseController.js';

router.get('/expenses', expenseController.getExpenses);
router.post('/expenses', authorize('owner', 'manager'), expenseController.createExpense);
router.delete('/expenses/:id', authorize('owner', 'manager'), expenseController.deleteExpense);

export default router;