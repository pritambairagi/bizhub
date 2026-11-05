import mongoose, { Schema, Document } from 'mongoose';
import type { IBranch, BranchType, BranchStatus } from '../types/index.js';

export interface BranchDocument extends Omit<IBranch, '_id'>, Document {}

const branchSchema = new Schema<any>(
  {
    businessId: {
      type: Schema.Types.ObjectId,
      ref: 'Business',
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    code: {
      type: String,
      required: true,
      uppercase: true,
    },
    type: {
      type: String,
      enum: ['main_branch', 'sub_branch', 'warehouse', 'storehouse', 'shop', 'stowage', 'restaurant', 'store', 'other'],
      default: 'shop',
    },
    address: {
      street: { type: String },
      district: { type: String },
      thana: { type: String },
      zip: { type: String },
    },
    contact: {
      phone: { type: String, required: true },
      email: { type: String },
      manager: { type: Schema.Types.ObjectId, ref: 'User' },
    },
    settings: {
      posEnabled: { type: Boolean, default: true },
      warehouseEnabled: { type: Boolean, default: false },
      defaultWarehouse: { type: Boolean, default: false },
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
    },
  },
  {
    timestamps: true,
  }
);

branchSchema.index({ businessId: 1, code: 1 }, { unique: true });
branchSchema.index({ businessId: 1 });

export const Branch = mongoose.model<BranchDocument>('Branch', branchSchema);