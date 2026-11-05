import mongoose, { Schema, Document } from 'mongoose';
import type { IEmployee, EmployeeStatus } from '../types/index.js';

export interface EmployeeDocument extends Omit<IEmployee, '_id'>, Document {}

const employeeSchema = new Schema<any>(
  {
    businessId: {
      type: Schema.Types.ObjectId,
      ref: 'Business',
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    employeeId: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    surname: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    education: {
      type: String,
    },
    photo: {
      type: String,
    },
    department: {
      type: String,
    },
    designation: {
      type: String,
    },
    nid: {
      type: String,
    },
    birthCertificate: {
      type: String,
    },
    roleId: {
      type: Schema.Types.ObjectId,
      ref: 'Role',
    },
    joiningDate: {
      type: Date,
      default: Date.now,
    },
    salary: {
      basic: { type: Number, default: 0, min: 0 },
      houseRent: { type: Number, default: 0, min: 0 },
      medical: { type: Number, default: 0, min: 0 },
      transport: { type: Number, default: 0, min: 0 },
      other: { type: Number, default: 0, min: 0 },
      total: { type: Number, default: 0, min: 0 },
    },
    attendance: {
      deviceId: { type: String },
      faceId: { type: String },
    },
    leaveBalance: {
      casual: { type: Number, default: 12 },
      sick: { type: Number, default: 10 },
      annual: { type: Number, default: 18 },
    },
    status: {
      type: String,
      enum: ['active', 'terminated', 'onleave'],
      default: 'active',
    },
  },
  {
    timestamps: true,
  }
);

employeeSchema.index({ businessId: 1, employeeId: 1 }, { unique: true });
employeeSchema.index({ businessId: 1, userId: 1 });
employeeSchema.index({ businessId: 1, department: 1 });

export const Employee = mongoose.model<EmployeeDocument>('Employee', employeeSchema);