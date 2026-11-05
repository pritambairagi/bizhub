import mongoose, { Schema, Document } from 'mongoose';
import type { IAccount, AccountType, AccountStatus } from '../types/index.js';

export interface AccountDocument extends Omit<IAccount, '_id'>, Document {}

const accountSchema = new Schema<any>(
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
    },
    type: {
      type: String,
      enum: ['asset', 'liability', 'income', 'expense', 'equity'],
      required: true,
    },
    subType: {
      type: String,
    },
    parentId: {
      type: Schema.Types.ObjectId,
      ref: 'Account',
    },
    openingBalance: {
      type: Number,
      default: 0,
    },
    currentBalance: {
      type: Number,
      default: 0,
    },
    isBank: {
      type: Boolean,
      default: false,
    },
    bankDetails: {
      accountName: { type: String },
      accountNumber: { type: String },
      bankName: { type: String },
      branch: { type: String },
      routing: { type: String },
    },
    mobileBanking: {
      provider: { type: String, enum: ['bkash', 'nagad', 'rocket', 'other'] },
      accountNumber: { type: String },
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

accountSchema.index({ businessId: 1, code: 1 }, { unique: true });
accountSchema.index({ businessId: 1, type: 1 });
accountSchema.index({ businessId: 1, parentId: 1 });

export const Account = mongoose.model<AccountDocument>('Account', accountSchema);