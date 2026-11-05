import mongoose, { Schema, Document } from 'mongoose';
import type { ISupplier } from '../types/index.js';

export interface SupplierDocument extends Omit<ISupplier, '_id'>, Document {}

const supplierSchema = new Schema<any>(
  {
    businessId: {
      type: Schema.Types.ObjectId,
      ref: 'Business',
      required: false,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    companyName: {
      type: String,
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
    address: {
      type: String,
      trim: true,
    },
    brand: {
      type: String,
      trim: true,
    },
    openingBalance: {
      type: Number,
      default: 0,
    },
    balance: {
      type: Number,
      default: 0,
    },
    totalPurchases: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
    },
    note: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

supplierSchema.index({ businessId: 1 });
supplierSchema.index({ businessId: 1, phone: 1 }, { unique: true });

export const Supplier = mongoose.model<SupplierDocument>('Supplier', supplierSchema);
