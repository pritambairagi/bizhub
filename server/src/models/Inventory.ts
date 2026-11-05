import mongoose, { Schema, Document } from 'mongoose';
import type { IInventoryStock } from '../types/index.js';

export interface InventoryStockDocument extends Omit<IInventoryStock, '_id'>, Document {}

const inventoryStockSchema = new Schema<any>(
  {
    businessId: {
      type: Schema.Types.ObjectId,
      ref: 'Business',
      required: true,
    },
    productId: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    warehouseId: {
      type: Schema.Types.ObjectId,
      ref: 'Warehouse',
      required: true,
    },
    batch: {
      type: String,
    },
    expiryDate: {
      type: Date,
    },
    quantity: {
      type: Number,
      default: 0,
      min: 0,
    },
    reservedQty: {
      type: Number,
      default: 0,
      min: 0,
    },
    availableQty: {
      type: Number,
      default: 0,
      min: 0,
    },
    costPrice: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

inventoryStockSchema.index(
  { businessId: 1, productId: 1, warehouseId: 1, batch: 1 },
  { unique: true, partialFilterExpression: { batch: { $exists: true } } }
);
inventoryStockSchema.index({ businessId: 1, productId: 1, warehouseId: 1 });
inventoryStockSchema.index({ warehouseId: 1 });
inventoryStockSchema.index({ expiryDate: 1 }, { partialFilterExpression: { expiryDate: { $exists: true } } });

export const InventoryStock = mongoose.model<InventoryStockDocument>('InventoryStock', inventoryStockSchema);