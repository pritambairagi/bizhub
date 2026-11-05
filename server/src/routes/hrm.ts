import { Router } from 'express';
import * as hrmController from '../controllers/hrmController.js';
import { authenticate } from '../middleware/index.js';

const router = Router();

router.use(authenticate);

router.get('/employees', hrmController.getEmployees);
router.get('/employees/:id', hrmController.getEmployeeById);
router.post('/employees', hrmController.createEmployee);
router.put('/employees/:id', hrmController.updateEmployee);
router.patch('/employees/users/:id/permissions', hrmController.updateEmployeePermissions);
router.delete('/employees/:id', hrmController.deleteEmployee);

router.get('/attendance', hrmController.getAttendance);
router.post('/attendance', hrmController.recordAttendance);

export default router;