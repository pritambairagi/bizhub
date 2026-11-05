import mongoose, { Schema, Document } from 'mongoose';
import type { IOrder, OrderType, OrderStatus } from '../types/index.js';

export interface OrderDocument extends Omit<IOrder, '_id'>, Document {}

const orderSchema = new Schema<any>(
  {
    businessId: {
      type: Schema.Types.ObjectId,
      ref: 'Business',
      required: true,
    },
    branchId: {
      type: Schema.Types.ObjectId,
      ref: 'Branch',
      required: true,
    },
    orderNumber: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ['sale', 'return', 'exchange'],
      default: 'sale',
    },
    customer: {
      id: { type: Schema.Types.ObjectId, ref: 'Customer' },
      name: { type: String, default: 'Walk-in Customer' },
      phone: { type: String, default: '' },
    },
    items: [{
      productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
      name: { type: String, required: true },
      sku: { type: String, required: true },
      qty: { type: Number, required: true, min: 1 },
      unitPrice: { type: Number, required: true, min: 0 },
      discount: { type: Number, default: 0, min: 0 },
      vat: { type: Number, default: 0, min: 0 },
      total: { type: Number, required: true, min: 0 },
      batch: { type: String },
      serial: { type: String },
    }],
    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },
    discount: {
      type: {
        type: String,
        enum: ['fixed', 'percentage'],
        default: 'fixed',
      },
      value: { type: Number, default: 0, min: 0 },
      amount: { type: Number, default: 0, min: 0 },
    },
    vat: {
      type: Number,
      default: 0,
      min: 0,
    },
    total: {
      type: Number,
      required: true,
      min: 0,
    },
    paid: {
      type: Number,
      default: 0,
      min: 0,
    },
    due: {
      type: Number,
      default: 0,
      min: 0,
    },
    payments: [{
      method: {
        type: String,
        enum: ['cash', 'card', 'bkash', 'nagad', 'rocket', 'wallet', 'giftcard'],
        required: true,
      },
      amount: { type: Number, required: true, min: 0 },
      reference: { type: String },
      gateway: { type: String },
    }],
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'processing', 'ready', 'delivered', 'cancelled'],
      default: 'pending',
    },
    note: {
      type: String,
    },
    invoice: {
      number: { type: String },
      url: { type: String },
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

orderSchema.index({ businessId: 1, orderNumber: 1 }, { unique: true });
orderSchema.index({ businessId: 1, branchId: 1 });
orderSchema.index({ businessId: 1, createdAt: -1 });
orderSchema.index({ businessId: 1, status: 1 });
orderSchema.index({ 'customer.phone': 1 });

export const Order = mongoose.model<OrderDocument>('Order', orderSchema);