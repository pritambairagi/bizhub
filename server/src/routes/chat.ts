import { Router } from 'express';
import { authenticate } from '../middleware/index.js';
import * as chatController from '../controllers/chatController.js';

const router = Router();

router.use(authenticate);

router.get('/messages', chatController.getMessages);
router.get('/users', chatController.getChatUsers);
router.post('/messages', chatController.sendMessage);
router.post('/mark-read', chatController.markRead);
router.get('/unread-count', chatController.getUnreadCount);

export default router;
