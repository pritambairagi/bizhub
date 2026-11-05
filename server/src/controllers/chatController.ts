import { Request, Response } from 'express';
import { ChatMessage } from '../models/ChatMessage.js';
import type { AuthRequest } from '../types/index.js';
import { logger } from '../utils/logger.js';

// Get conversation messages between two users (or global notices)
export const getMessages = async (req: AuthRequest, res: Response) => {
  try {
    const businessId = req.user?.businessId;
    const { peerId, limit = 50 } = req.query;

    if (!businessId) return res.status(400).json({ success: false, message: 'No business' });

    let query: any = { businessId };

    if (peerId) {
      query.$or = [
        { senderId: req.user?._id, receiverId: peerId },
        { senderId: peerId, receiverId: req.user?._id },
      ];
    } else {
      query.isGlobal = true;
    }

    const messages = await ChatMessage.find(query)
      .populate('senderId', 'email profile role')
      .sort({ createdAt: -1 })
      .limit(Number(limit));

    res.json({ success: true, data: messages.reverse() });
  } catch (error) {
    logger.error('Get messages error:', error);
    res.status(500).json({ success: false, message: 'Failed to get messages' });
  }
};

// Get list of users in same business for conversation list
export const getChatUsers = async (req: AuthRequest, res: Response) => {
  try {
    const { User } = await import('../models/User.js');
    const businessId = req.user?.businessId;

    const users = await User.find({
      businessId,
      _id: { $ne: req.user?._id },
      status: 'active',
    }).select('email profile role status');

    res.json({ success: true, data: users });
  } catch (error) {
    logger.error('Get chat users error:', error);
    res.status(500).json({ success: false, message: 'Failed to get chat users' });
  }
};

// Send a message (REST fallback — real-time via socket)
export const sendMessage = async (req: AuthRequest, res: Response) => {
  try {
    const { receiverId, message, isGlobal } = req.body;
    const businessId = req.user?.businessId;

    if (!businessId) return res.status(400).json({ success: false, message: 'No business' });
    if (!message?.trim()) return res.status(400).json({ success: false, message: 'Message required' });

    const msg = await ChatMessage.create({
      businessId,
      senderId: req.user?._id,
      receiverId: receiverId || undefined,
      isGlobal: isGlobal || false,
      message: message.trim(),
      type: isGlobal ? 'notice' : 'text',
    });

    await msg.populate('senderId', 'email profile role');

    // Emit via socket if available
    const io = (req as any).app.get('io');
    if (io) {
      const room = `business:${businessId}`;
      io.to(room).emit('chat:message', msg);
    }

    res.status(201).json({ success: true, data: msg });
  } catch (error) {
    logger.error('Send message error:', error);
    res.status(500).json({ success: false, message: 'Failed to send message' });
  }
};

// Mark messages as read
export const markRead = async (req: AuthRequest, res: Response) => {
  try {
    const { peerId } = req.body;
    await ChatMessage.updateMany(
      {
        senderId: peerId,
        receiverId: req.user?._id,
        readBy: { $ne: req.user?._id },
      },
      { $addToSet: { readBy: req.user?._id } }
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to mark read' });
  }
};

// Get unread count
export const getUnreadCount = async (req: AuthRequest, res: Response) => {
  try {
    const count = await ChatMessage.countDocuments({
      receiverId: req.user?._id,
      readBy: { $ne: req.user?._id },
    });
    res.json({ success: true, data: { count } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to get unread count' });
  }
};
