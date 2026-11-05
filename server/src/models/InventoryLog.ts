import mongoose, { Schema, Document } from 'mongoose';

export interface InventoryLogDocument extends Document {
  businessId: mongoose.Types.ObjectId;
  productId: mongoose.Types.ObjectId;
  warehouseId: mongoose.Types.ObjectId;
  type: 'in' | 'out' | 'adjustment' | 'transfer' | 'return' | 'sale' | 'purchase';
  quantity: number;
  previousQty: number;
  newQty: number;
  referenceId?: mongoose.Types.ObjectId; // Order ID, Transaction ID, etc.
  referenceType?: string;
  note?: string;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
}

const inventoryLogSchema = new Schema<any>(
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
    type: {
      type: String,
      enum: ['in', 'out', 'adjustment', 'transfer', 'return', 'sale', 'purchase'],
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
    },
    previousQty: {
      type: Number,
      required: true,
    },
    newQty: {
      type: Number,
      required: true,
    },
    referenceId: {
      type: Schema.Types.ObjectId,
    },
    referenceType: {
      type: String,
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
    timestamps: { createdAt: true, updatedAt: false },
  }
);

inventoryLogSchema.index({ businessId: 1, productId: 1 });
inventoryLogSchema.index({ businessId: 1, warehouseId: 1 });
inventoryLogSchema.index({ createdAt: -1 });

export const InventoryLog = mongoose.model<InventoryLogDocument>('InventoryLog', inventoryLogSchema);
