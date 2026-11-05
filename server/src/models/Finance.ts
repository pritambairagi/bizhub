import mongoose, { Schema, Document } from 'mongoose';

// ── EMI Model ──────────────────────────────────────────────────────────────────
const emiPaymentSchema = new Schema({
  date: { type: Date, default: Date.now },
  amount: { type: Number, required: true },
  note: { type: String },
}, { _id: false });

const emiSchema = new Schema({
  businessId: { type: Schema.Types.ObjectId, ref: 'Business', required: true },
  title: { type: String, required: true },
  totalAmount: { type: Number, required: true },
  paidAmount: { type: Number, default: 0 },
  installmentAmount: { type: Number, required: true },
  totalInstallments: { type: Number, required: true },
  paidInstallments: { type: Number, default: 0 },
  frequency: { type: String, enum: ['weekly', 'monthly', 'quarterly'], default: 'monthly' },
  startDate: { type: Date, required: true },
  nextDueDate: { type: Date },
  borrowerName: { type: String, default: '' },
  borrowerPhone: { type: String, default: '' },
  note: { type: String, default: '' },
  status: { type: String, enum: ['active', 'completed', 'overdue'], default: 'active' },
  payments: [emiPaymentSchema],
  createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

emiSchema.pre('save', function (next) {
  if (!this.nextDueDate) {
    this.nextDueDate = new Date(this.startDate);
  }
  // Update status
  if (this.paidAmount >= this.totalAmount) {
    this.status = 'completed';
  } else if (this.nextDueDate && new Date(this.nextDueDate) < new Date()) {
    this.status = 'overdue';
  } else {
    this.status = 'active';
  }
  next();
});

export const EMIRecord = mongoose.model('EMIRecord', emiSchema);

// ── Dues Model ─────────────────────────────────────────────────────────────────
const duePaymentSchema = new Schema({
  date: { type: Date, default: Date.now },
  amount: { type: Number, required: true },
  note: { type: String },
}, { _id: false });

const duesSchema = new Schema({
  businessId: { type: Schema.Types.ObjectId, ref: 'Business', required: true },
  personName: { type: String, required: true },
  personPhone: { type: String, default: '' },
  personType: { type: String, enum: ['customer', 'supplier', 'employee', 'other'], default: 'customer' },
  description: { type: String, default: '' },
  totalAmount: { type: Number, required: true },
  paidAmount: { type: Number, default: 0 },
  dueDate: { type: Date, required: true },
  status: { type: String, enum: ['pending', 'partial', 'paid', 'overdue'], default: 'pending' },
  payments: [duePaymentSchema],
  createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

duesSchema.pre('save', function (next) {
  if (this.paidAmount >= this.totalAmount) {
    this.status = 'paid';
  } else if (this.paidAmount > 0) {
    this.status = 'partial';
  } else if (new Date(this.dueDate) < new Date()) {
    this.status = 'overdue';
  } else {
    this.status = 'pending';
  }
  next();
});

export const DueRecord = mongoose.model('DueRecord', duesSchema);

// ── Association Model ──────────────────────────────────────────────────────────
const assocMemberSchema = new Schema({
  name: { type: String, required: true },
  phone: { type: String, default: '' },
  shareAmount: { type: Number, default: 0 },
  paidAmount: { type: Number, default: 0 },
  joinDate: { type: Date, default: Date.now },
}, { _id: false });

const assocTransactionSchema = new Schema({
  date: { type: Date, default: Date.now },
  type: { type: String, enum: ['credit', 'debit'], required: true },
  amount: { type: Number, required: true },
  description: { type: String, required: true },
  member: { type: String },
}, { _id: false });

const associationSchema = new Schema({
  businessId: { type: Schema.Types.ObjectId, ref: 'Business', required: true },
  name: { type: String, required: true },
  description: { type: String, default: '' },
  monthlyContribution: { type: Number, default: 0 },
  totalFund: { type: Number, default: 0 },
  memberCount: { type: Number, default: 0 },
  members: [assocMemberSchema],
  transactions: [assocTransactionSchema],
  createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

export const Association = mongoose.model('Association', associationSchema);
