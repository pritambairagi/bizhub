import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';
import type { IUser, UserRole, UserStatus } from '../types/index.js';

export interface UserDocument extends Omit<IUser, '_id'>, Document {
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const userSchema = new Schema<any>(
  {
    email: {
      type: String,
      unique: true,
      sparse: true,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    role: {
      type: String,
      enum: [
        'super_admin',
        'owner',
        'share_holder',
        'manager',
        'accountant',
        'cashier',
        'delivery',
        'salesman',
        'vendor',
        'customer',
        'custom'
      ],
      default: 'customer',
    },
    businessId: {
      type: Schema.Types.ObjectId,
      ref: 'Business',
    },
    branchId: {
      type: Schema.Types.ObjectId,
      ref: 'Branch',
    },
    customRoleId: {
      type: Schema.Types.ObjectId,
      ref: 'Role',
    },
    permissions: [{
      type: String,
    }],
    profile: {
      firstName: { type: String, default: '' },
      lastName: { type: String, default: '' },
      avatar: { type: String },
      nid: { type: String },
      address: { type: String },
    },
    auth: {
      googleId: { type: String },
      facebookId: { type: String },
      twoFactorEnabled: { type: Boolean, default: false },
      twoFactorSecret: { type: String },
      emailVerified: { type: Boolean, default: false },
      phoneVerified: { type: Boolean, default: false },
    },
    sessions: [{
      device: { type: String },
      ip: { type: String },
      lastActive: { type: Date },
      createdAt: { type: Date, default: Date.now },
    }],
    loginHistory: [{
      ip: { type: String },
      device: { type: String },
      location: { type: String },
      timestamp: { type: Date, default: Date.now },
    }],
    failedLoginAttempts: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['active', 'suspended', 'locked'],
      default: 'active',
    },
  },
  {
    timestamps: true,
  }
);

userSchema.pre('save', async function (this: any, next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

userSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.auth?.twoFactorSecret;
  return obj;
};

userSchema.index({ businessId: 1 });
userSchema.index({ role: 1 });

export const User = mongoose.model<UserDocument>('User', userSchema);