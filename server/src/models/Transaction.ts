import mongoose, { Schema, Document } from 'mongoose';
import type { ITransaction } from '../types/index.js';

export interface TransactionDocument extends Omit<ITransaction, '_id'>, Document {}

const transactionSchema = new Schema<any>(
  {
    businessId: {
      type: Schema.Types.ObjectId,
      ref: 'Business',
      required: true,
    },
    voucherNumber: {
      type: String,
      required: true,
    },
    date: {
      type: Date,
      default: Date.now,
    },
    type: {
      type: String,
      enum: ['debit', 'credit'],
      required: true,
    },
    accountId: {
      type: Schema.Types.ObjectId,
      ref: 'Account',
      required: true,
    },
    contraAccountId: {
      type: Schema.Types.ObjectId,
      ref: 'Account',
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    description: {
      type: String,
      required: true,
    },
    reference: {
      type: String,
    },
    attachments: [{
      type: String,
    }],
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

transactionSchema.index({ businessId: 1, voucherNumber: 1 }, { unique: true });
transactionSchema.index({ businessId: 1, accountId: 1 });
transactionSchema.index({ businessId: 1, date: -1 });
transactionSchema.index({ businessId: 1, createdBy: 1 });

export const Transaction = mongoose.model<TransactionDocument>('Transaction', transactionSchema);