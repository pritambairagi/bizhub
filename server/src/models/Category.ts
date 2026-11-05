import mongoose, { Schema, Document } from 'mongoose';
import type { ICategory, CategoryStatus } from '../types/index.js';

export interface CategoryDocument extends Omit<ICategory, '_id'>, Document {}

const categorySchema = new Schema<any>(
  {
    businessId: {
      type: Schema.Types.ObjectId,
      ref: 'Business',
      required: false,
    },
    name: {
      en: { type: String, required: true },
      bn: { type: String },
    },
    slug: {
      type: String,
      lowercase: true,
    },
    parentId: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
    },
    image: {
      type: String,
    },
    icon: {
      type: String,
    },
    order: {
      type: Number,
      default: 0,
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

categorySchema.pre('save', function (this: any, next) {
  if (!this.slug) {
    this.slug = this.name.en
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
  next();
});

categorySchema.index({ businessId: 1, slug: 1 }, { unique: true });
categorySchema.index({ businessId: 1, parentId: 1 });

export const Category = mongoose.model<CategoryDocument>('Category', categorySchema);