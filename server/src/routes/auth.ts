import { Router } from 'express';
import * as authController from '../controllers/authController.js';
import { authenticate } from '../middleware/index.js';

const router = Router();

router.post('/register', authController.register);
router.post('/employee-register', authController.employeeRegister);
router.post('/login', authController.login);
router.post('/refresh', authController.refreshToken);
router.post('/logout', authenticate, authController.logout);
router.get('/profile', authenticate, authController.getProfile);
router.put('/profile', authenticate, authController.updateProfile);
router.post('/change-password', authenticate, authController.changePassword);
router.post('/unlock-account', authenticate, authController.unlockAccount);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);

export default router;