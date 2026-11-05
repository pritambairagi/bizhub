import mongoose, { Schema, Document } from 'mongoose';
import type { IBusiness, BusinessType } from '../types/index.js';

export interface BusinessDocument extends Omit<IBusiness, '_id'>, Document {}

const businessSchema = new Schema<any>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
    },
    type: {
      type: String,
      enum: ['retail', 'wholesale', 'restaurant', 'pharmacy', 'franchise', 'marketplace'],
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'verified', 'suspended', 'rejected'],
      default: 'pending',
    },
    industry: {
      type: String,
    },
    logo: {
      type: String,
    },
    contact: {
      email: { type: String, required: true },
      phone: { type: String, required: true },
      address: { type: String, required: true },
      district: { type: String },
      thana: { type: String },
    },
    registration: {
      bin: { type: String },
      nbr: { type: String },
      tradeLicense: { type: String },
    },
    settings: {
      currency: { type: String, default: 'BDT' },
      timezone: { type: String, default: 'Asia/Dhaka' },
      language: { type: String, default: 'en' },
      dateFormat: { type: String, default: 'DD/MM/YYYY' },
      taxNumber: { type: String },
      invoicePrefix: { type: String, default: 'INV' },
    },
    subscription: {
      plan: { type: String, default: 'free' },
      startDate: { type: Date, default: Date.now },
      endDate: { type: Date },
      features: [{ type: String }],
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

businessSchema.pre('save', function (this: any, next) {
  if (!this.slug) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
  next();
});

businessSchema.index({ owner: 1 });

export const Business = mongoose.model<BusinessDocument>('Business', businessSchema);