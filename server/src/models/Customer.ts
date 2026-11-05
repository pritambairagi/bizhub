import mongoose, { Schema, Document } from 'mongoose';
import type { ICustomer, CustomerType, CustomerStatus } from '../types/index.js';

export interface CustomerDocument extends Omit<ICustomer, '_id'>, Document {}

const customerSchema = new Schema<any>(
  {
    businessId: {
      type: Schema.Types.ObjectId,
      ref: 'Business',
      required: true,
    },
    code: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    gender: {
      type: String,
      enum: ['male', 'female', 'other'],
    },
    dateOfBirth: {
      type: Date,
    },
    address: {
      present: { type: String },
      permanent: { type: String },
      district: { type: String },
      thana: { type: String },
    },
    customerType: {
      type: String,
      enum: ['regular', 'vip', 'wholesale'],
      default: 'regular',
    },
    loyalty: {
      points: { type: Number, default: 0, min: 0 },
      tier: { type: String, default: 'bronze' },
      lifetimeValue: { type: Number, default: 0, min: 0 },
    },
    wallet: {
      balance: { type: Number, default: 0, min: 0 },
      transactions: [{
        type: { type: String, enum: ['credit', 'debit'], required: true },
        amount: { type: Number, required: true, min: 0 },
        description: { type: String },
        createdAt: { type: Date, default: Date.now },
      }],
    },
    tags: [{
      type: String,
    }],
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

customerSchema.index({ businessId: 1, code: 1 }, { unique: true });
customerSchema.index({ businessId: 1, phone: 1 });
customerSchema.index({ businessId: 1, email: 1 });
customerSchema.index({ businessId: 1, name: 'text', phone: 'text' });

export const Customer = mongoose.model<CustomerDocument>('Customer', customerSchema);