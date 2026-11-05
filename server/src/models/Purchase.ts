import mongoose, { Schema, Document } from 'mongoose';
import type { IPurchase } from '../types/index.js';

export interface PurchaseDocument extends Omit<IPurchase, '_id'>, Document {}

const purchaseItemSchema = new Schema({
  productId: {
    type: Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  name: { type: String, required: true },
  sku: { type: String, required: true },
  qty: { type: Number, required: true, min: 1 },
  costPrice: { type: Number, required: true, min: 0 },
  total: { type: Number, required: true, min: 0 },
}, { _id: false });

const purchaseSchema = new Schema<any>(
  {
    businessId: {
      type: Schema.Types.ObjectId,
      ref: 'Business',
      required: true,
    },
    supplierId: {
      type: Schema.Types.ObjectId,
      ref: 'Supplier',
    },
    supplierName: {
      type: String,
      required: true,
    },
    purchaseNumber: {
      type: String,
      required: true,
    },
    items: [purchaseItemSchema],
    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },
    tax: {
      type: Number,
      default: 0,
      min: 0,
    },
    total: {
      type: Number,
      required: true,
      min: 0,
    },
    paidAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    dueAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    status: {
      type: String,
      enum: ['pending', 'received', 'partial', 'ordered'],
      default: 'received',
    },
    purchaseDate: {
      type: Date,
      default: Date.now,
    },
    note: {
      type: String,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

purchaseSchema.index({ businessId: 1, purchaseNumber: 1 }, { unique: true });
purchaseSchema.index({ businessId: 1, purchaseDate: -1 });

export const Purchase = mongoose.model<PurchaseDocument>('Purchase', purchaseSchema);
