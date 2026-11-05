import mongoose, { Schema, Document } from 'mongoose';

export interface IRole {
  businessId: string;
  name: string;
  description?: string;
  permissions: string[];
  isSystem: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface RoleDocument extends IRole, Document {
  _id: mongoose.Types.ObjectId;
}

const roleSchema = new Schema<any>(
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
    description: {
      type: String,
      trim: true,
    },
    permissions: [{
      type: String,
    }],
    isSystem: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate role names per business
roleSchema.index({ businessId: 1, name: 1 }, { unique: true });

export const Role = mongoose.model<RoleDocument>('Role', roleSchema);
