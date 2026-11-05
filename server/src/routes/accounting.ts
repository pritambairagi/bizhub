import { Router } from 'express';
import * as accountingController from '../controllers/accountingController.js';
import { authenticate } from '../middleware/index.js';

const router = Router();

router.use(authenticate);

router.get('/accounts', accountingController.getAccounts);
router.post('/accounts', accountingController.createAccount);

router.get('/transactions', accountingController.getTransactions);
router.post('/transactions', accountingController.createTransaction);

router.get('/reports/balance-sheet', accountingController.getBalanceSheet);
router.get('/reports/profit-loss', accountingController.getProfitLoss);
router.get('/reports/cash-flow', accountingController.getCashFlow);

export default router;