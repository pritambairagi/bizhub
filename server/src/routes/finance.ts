import { Router } from 'express';
import * as ctrl from '../controllers/financeController.js';
import { authenticate } from '../middleware/index.js';

const router = Router();

router.use(authenticate);

// EMI / Installment routes
router.get('/emi', ctrl.getEMIRecords);
router.post('/emi', ctrl.createEMI);
router.post('/emi/:id/pay', ctrl.payEMI);
router.delete('/emi/:id', ctrl.deleteEMI);

// Dues routes
router.get('/dues', ctrl.getDues);
router.post('/dues', ctrl.createDue);
router.post('/dues/:id/pay', ctrl.payDue);
router.delete('/dues/:id', ctrl.deleteDue);

// Association routes
router.get('/association', ctrl.getAssociations);
router.post('/association', ctrl.createAssociation);
router.post('/association/:id/member', ctrl.addAssociationMember);
router.post('/association/:id/transaction', ctrl.addAssociationTransaction);
router.delete('/association/:id', ctrl.deleteAssociation);

export default router;
