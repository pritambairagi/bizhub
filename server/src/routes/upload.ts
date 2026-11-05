import { Router, Response } from 'express';
import multer from 'multer';
import { authenticate } from '../middleware/index.js';
import { uploadImageBuffer } from '../services/cloudinaryService.js';
import type { AuthRequest } from '../types/index.js';

const router = Router();

// Use memory storage — no filesystem writes (required for Vercel serverless)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!') as any, false);
    }
  },
});

// POST /api/v1/upload
router.post('/', authenticate, upload.single('image'), async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      res.status(400).json({ success: false, message: 'Please upload an image' });
      return;
    }

    const folder = req.user?.businessId ? `business-${req.user.businessId}` : 'bizhub';
    const imageUrl = await uploadImageBuffer(req.file.buffer, req.file.mimetype, folder);

    res.json({
      success: true,
      message: 'Image uploaded successfully',
      data: {
        url: imageUrl,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Image upload failed',
    });
  }
});

export default router;
