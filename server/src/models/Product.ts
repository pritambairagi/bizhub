import mongoose, { Schema, Document } from 'mongoose';
import type { IProduct, ProductStatus } from '../types/index.js';

export interface ProductDocument extends Omit<IProduct, '_id'>, Document {}

const productVariantSchema = new Schema({
  name: { type: String, required: true },
  priceOverride: { type: Number },
  stock: { type: Number, default: 0 },
}, { _id: true });

const productSchema = new Schema<any>(
  {
    businessId: {
      type: Schema.Types.ObjectId,
      ref: 'Business',
      required: true,
    },
    name: {
      en: { type: String, required: true },
      bn: { type: String },
    },
    sku: {
      type: String,
      required: true,
    },
    barcode: {
      type: String,
    },
    category: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
    },
    brand: {
      type: String,
    },
    unit: {
      type: String,
      default: 'পিস',
    },
    description: {
      en: { type: String },
      bn: { type: String },
    },
    images: [{
      type: String,
    }],
    pricing: {
      costPrice: { type: Number, default: 0, min: 0 },
      sellingPrice: { type: Number, default: 0, min: 0 },
      mrp: { type: Number, default: 0, min: 0 },
      wholeSalePrice: { type: Number, min: 0 },
    },
    tax: {
      vatRate: { type: Number, default: 0, min: 0, max: 100 },
      taxCategory: { type: String },
    },
    inventory: {
      trackInventory: { type: Boolean, default: true },
      lowStockAlert: { type: Number, default: 10 },
      reorderPoint: { type: Number, default: 20 },
      isSerial: { type: Boolean, default: false },
      isBatch: { type: Boolean, default: false },
    },
    expiry: {
      trackExpiry: { type: Boolean, default: false },
      expiryWarningDays: { type: Number, default: 30 },
    },
    variants: [productVariantSchema],
    status: {
      type: String,
      enum: ['active', 'inactive', 'draft', 'damage', 'out_of_stock'],
      default: 'active',
    },
    vendorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

productSchema.index({ businessId: 1, sku: 1 }, { unique: true });
productSchema.index({ businessId: 1, barcode: 1 });
productSchema.index({ businessId: 1, category: 1 });
productSchema.index({ businessId: 1, status: 1 });
productSchema.index({ 'name.en': 'text', 'name.bn': 'text', sku: 'text' });

export const Product = mongoose.model<ProductDocument>('Product', productSchema);