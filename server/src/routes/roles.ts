import { Router } from 'express';
import * as roleController from '../controllers/roleController.js';
import { authenticate, authorize } from '../middleware/index.js';

const router = Router();

router.use(authenticate);

// Only owners and managers can manage roles
router.use(authorize('owner', 'manager'));

router.get('/', roleController.getRoles);
router.post('/', roleController.createRole);
router.put('/:id', roleController.updateRole);
router.delete('/:id', roleController.deleteRole);

export default router;
