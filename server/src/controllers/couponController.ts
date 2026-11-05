import { Request, Response } from 'express';
import { Coupon } from '../models/Coupon.js';
import type { AuthRequest } from '../types/index.js';
import { logger } from '../utils/logger.js';

// ─── Apply/Validate Coupon (POS & Shop) ────────────────────────────────────
export const applyCoupon = async (req: AuthRequest, res: Response) => {
  try {
    const { code, orderTotal } = req.body;
    if (!code) return res.status(400).json({ success: false, message: 'Coupon code required' });

    const coupon = await Coupon.findOne({
      code: code.toUpperCase().trim(),
      isActive: true,
      validFrom: { $lte: new Date() },
      validUntil: { $gte: new Date() },
      $or: [
        { businessId: req.user?.businessId || null },
        { businessId: null },
        { businessId: { $exists: false } },
      ],
    });

    if (!coupon) {
      return res.status(404).json({ success: false, message: 'Invalid or expired coupon code' });
    }

    if (coupon.usedCount >= coupon.usageLimit) {
      return res.status(400).json({ success: false, message: 'Coupon usage limit has been reached' });
    }

    const total = Number(orderTotal) || 0;
    if (coupon.minOrderAmount > 0 && total < coupon.minOrderAmount) {
      return res.status(400).json({
        success: false,
        message: `Minimum order amount of ৳${coupon.minOrderAmount} required to apply this coupon`,
      });
    }

    let discountAmount = coupon.type === 'percentage'
      ? (total * coupon.value) / 100
      : coupon.value;

    if (coupon.maxDiscountAmount && discountAmount > coupon.maxDiscountAmount) {
      discountAmount = coupon.maxDiscountAmount;
    }

    res.json({
      success: true,
      data: {
        couponId: coupon._id,
        code: coupon.code,
        type: coupon.type,
        value: coupon.value,
        discountAmount,
        description: coupon.description,
      },
    });
  } catch (error) {
    logger.error('Apply coupon error:', error);
    res.status(500).json({ success: false, message: 'Failed to apply coupon' });
  }
};

// ─── Admin: Get all coupons ───────────────────────────────────────────────
export const getCoupons = async (req: AuthRequest, res: Response) => {
  try {
    const isSuperAdmin = req.user?.role === 'super_admin';
    const filter: any = {};
    if (!isSuperAdmin) {
      filter.$or = [{ businessId: req.user?.businessId }, { businessId: null }];
    }

    const coupons = await Coupon.find(filter).populate('createdBy', 'email profile').sort({ createdAt: -1 });
    res.json({ success: true, data: coupons });
  } catch (error) {
    logger.error('Get coupons error:', error);
    res.status(500).json({ success: false, message: 'Failed to get coupons' });
  }
};

// ─── Admin: Create coupon ─────────────────────────────────────────────────
export const createCoupon = async (req: AuthRequest, res: Response) => {
  try {
    const isSuperAdmin = req.user?.role === 'super_admin';
    const coupon = await Coupon.create({
      ...req.body,
      code: req.body.code?.toUpperCase().trim(),
      businessId: isSuperAdmin ? (req.body.businessId || null) : req.user?.businessId,
      createdBy: req.user?._id,
    });
    res.status(201).json({ success: true, data: coupon, message: 'Coupon created successfully' });
  } catch (error: any) {
    logger.error('Create coupon error:', error);
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Coupon code already exists' });
    }
    res.status(500).json({ success: false, message: 'Failed to create coupon' });
  }
};

// ─── Admin: Update coupon ─────────────────────────────────────────────────
export const updateCoupon = async (req: AuthRequest, res: Response) => {
  try {
    const coupon = await Coupon.findByIdAndUpdate(req.params['id'] as string, req.body, { new: true });
    if (!coupon) return res.status(404).json({ success: false, message: 'Coupon not found' });
    res.json({ success: true, data: coupon, message: 'Coupon updated' });
  } catch (error) {
    logger.error('Update coupon error:', error);
    res.status(500).json({ success: false, message: 'Failed to update coupon' });
  }
};

// ─── Admin: Delete coupon ─────────────────────────────────────────────────
export const deleteCoupon = async (req: AuthRequest, res: Response) => {
  try {
    const coupon = await Coupon.findByIdAndDelete(req.params['id'] as string);
    if (!coupon) return res.status(404).json({ success: false, message: 'Coupon not found' });
    res.json({ success: true, message: 'Coupon deleted' });
  } catch (error) {
    logger.error('Delete coupon error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete coupon' });
  }
};
