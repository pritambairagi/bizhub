import mongoose, { Schema, Document } from 'mongoose';
import type { IWarehouse, WarehouseStatus } from '../types/index.js';

export interface WarehouseDocument extends Omit<IWarehouse, '_id'>, Document {}

const warehouseSchema = new Schema<any>(
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
    branchId: {
      type: Schema.Types.ObjectId,
      ref: 'Branch',
      required: true,
    },
    type: {
      type: String,
      enum: ['main', 'sub', 'transit'],
      default: 'main',
    },
    address: {
      street: { type: String },
      district: { type: String },
      thana: { type: String },
      zip: { type: String },
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

warehouseSchema.index({ businessId: 1, code: 1 }, { unique: true });
warehouseSchema.index({ businessId: 1, branchId: 1 });

export const Warehouse = mongoose.model<WarehouseDocument>('Warehouse', warehouseSchema);