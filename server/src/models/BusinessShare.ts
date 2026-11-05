import mongoose, { Schema, Document } from 'mongoose';
import type { IBusinessShare } from '../types/index.js';

export interface BusinessShareDocument extends Omit<IBusinessShare, '_id'>, Document {}

const businessShareSchema = new Schema<any>(
  {
    businessId: {
      type: Schema.Types.ObjectId,
      ref: 'Business',
      required: true,
    },
    partnerName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    sharePercentage: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    investmentAmount: {
      type: Number,
      default: 0,
    },
    role: {
      type: String,
      default: 'partner',
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
    },
    joinedDate: {
      type: Date,
      default: Date.now,
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

businessShareSchema.index({ businessId: 1 });

export const BusinessShare = mongoose.model<BusinessShareDocument>('BusinessShare', businessShareSchema);
