import mongoose, { Schema, Document } from 'mongoose';

export interface IChatMessage extends Document {
  businessId: mongoose.Types.ObjectId;
  senderId: mongoose.Types.ObjectId;
  receiverId?: mongoose.Types.ObjectId;
  isGlobal: boolean; // true = notice board broadcast
  message: string;
  type: 'text' | 'notice' | 'system';
  readBy: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const chatMessageSchema = new Schema<IChatMessage>(
  {
    businessId: { type: Schema.Types.ObjectId, ref: 'Business', required: true },
    senderId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    receiverId: { type: Schema.Types.ObjectId, ref: 'User' },
    isGlobal: { type: Boolean, default: false },
    message: { type: String, required: true, trim: true },
    type: { type: String, enum: ['text', 'notice', 'system'], default: 'text' },
    readBy: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true }
);

chatMessageSchema.index({ businessId: 1, createdAt: -1 });
chatMessageSchema.index({ senderId: 1, receiverId: 1 });

export const ChatMessage = mongoose.model<IChatMessage>('ChatMessage', chatMessageSchema);
