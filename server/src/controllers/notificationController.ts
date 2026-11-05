import { Response } from 'express';
import { Notification } from '../models/Notification.js';
import type { AuthRequest } from '../types/index.js';
import { logger } from '../utils/logger.js';

export const getNotifications = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.businessId && req.user?.role !== 'super_admin') {
      res.status(400).json({ success: false, message: 'No business associated' });
      return;
    }

    const { limit = 20, unreadOnly } = req.query;
    const query: Record<string, unknown> = {};

    if (req.user?.businessId) {
      query.$or = [
        { businessId: req.user.businessId },
        { userId: req.user._id },
      ];
    }

    if (unreadOnly === 'true') {
      query.isRead = false;
    }

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(Number(limit));

    const unreadCount = await Notification.countDocuments({
      ...query,
      isRead: false,
    });

    res.json({
      success: true,
      data: { notifications, unreadCount },
    });
  } catch (error: unknown) {
    const err = error as { message?: string };
    logger.error('Get notifications error:', error);
    res.status(500).json({ success: false, message: err.message || 'Failed to get notifications' });
  }
};

export const markAsRead = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { notificationId } = req.params;

    await Notification.findByIdAndUpdate(notificationId, { isRead: true });

    res.json({ success: true, message: 'Notification marked as read' });
  } catch (error: unknown) {
    const err = error as { message?: string };
    res.status(500).json({ success: false, message: err.message || 'Failed to mark notification' });
  }
};

export const markAllAsRead = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.businessId) {
      res.status(400).json({ success: false, message: 'No business associated' });
      return;
    }

    await Notification.updateMany(
      {
        $or: [
          { businessId: req.user.businessId },
          { userId: req.user._id },
        ],
        isRead: false,
      },
      { isRead: true }
    );

    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error: unknown) {
    const err = error as { message?: string };
    res.status(500).json({ success: false, message: err.message || 'Failed to mark all notifications' });
  }
};

export const createNotification = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { title, message, type, category, userId } = req.body;

    if (!req.user?.businessId) {
      res.status(400).json({ success: false, message: 'No business associated' });
      return;
    }

    const notification = await Notification.create({
      businessId: req.user.businessId,
      userId,
      title,
      message,
      type: type || 'info',
      category: category || 'general',
    });

    res.status(201).json({ success: true, data: notification });
  } catch (error: unknown) {
    const err = error as { message?: string };
    res.status(500).json({ success: false, message: err.message || 'Failed to create notification' });
  }
};
