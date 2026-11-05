import mongoose, { Schema, Document } from 'mongoose';

export interface IBillingRequest {
  businessId: mongoose.Types.ObjectId;
  requestedPlan: string;
  amount: number;
  paymentMethod: string;
  transactionId: string;
  status: 'pending' | 'approved' | 'rejected';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface BillingRequestDocument extends IBillingRequest, Document {}

const billingRequestSchema = new Schema<any>(
  {
    businessId: {
      type: Schema.Types.ObjectId,
      ref: 'Business',
      required: true,
    },
    requestedPlan: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    paymentMethod: {
      type: String,
      required: true,
    },
    transactionId: {
      type: String,
      required: true,
      unique: true,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    notes: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

billingRequestSchema.index({ transactionId: 1 }, { unique: true });
billingRequestSchema.index({ businessId: 1 });

export const BillingRequest = mongoose.model<BillingRequestDocument>('BillingRequest', billingRequestSchema);
