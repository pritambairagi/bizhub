import mongoose, { Schema, Document } from 'mongoose';
import type { IAttendanceRecord } from '../types/index.js';

export interface AttendanceDocument extends Omit<IAttendanceRecord, '_id'>, Document {}

const attendanceSchema = new Schema<any>(
  {
    businessId: {
      type: Schema.Types.ObjectId,
      ref: 'Business',
      required: true,
    },
    employeeId: {
      type: Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    checkIn: {
      type: Date,
      required: true,
    },
    checkOut: {
      type: Date,
    },
    status: {
      type: String,
      enum: ['present', 'absent', 'late', 'half_day', 'on_leave'],
      default: 'present',
    },
    note: {
      type: String,
    },
    location: {
      lat: { type: Number },
      lng: { type: Number },
      address: { type: String },
    },
  },
  {
    timestamps: true,
  }
);

attendanceSchema.index({ businessId: 1, employeeId: 1, date: 1 }, { unique: true });

export const Attendance = mongoose.model<AttendanceDocument>('Attendance', attendanceSchema);
