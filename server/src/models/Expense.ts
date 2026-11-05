import mongoose, { Schema, Document } from 'mongoose';

export interface ExpenseDocument extends Document {
  businessId: mongoose.Types.ObjectId;
  title: string;
  category: 'bill' | 'fee' | 'investment' | 'cost' | 'other';
  amount: number;
  date: Date;
  note?: string;
  createdBy: mongoose.Types.ObjectId;
}

const expenseSchema = new Schema<any>(
  {
    businessId: { type: Schema.Types.ObjectId, ref: 'Business', required: true },
    title: { type: String, required: true },
    category: {
      type: String,
      enum: ['bill', 'fee', 'investment', 'cost', 'other'],
      default: 'cost',
    },
    amount: { type: Number, required: true },
    date: { type: Date, default: Date.now },
    note: { type: String },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

expenseSchema.index({ businessId: 1, date: -1 });

export const Expense = mongoose.model<ExpenseDocument>('Expense', expenseSchema);
