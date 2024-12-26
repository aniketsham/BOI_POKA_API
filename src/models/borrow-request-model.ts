import mongoose, { Schema, Document } from 'mongoose';

interface BorrowRequest extends Document {
  bookId: mongoose.Types.ObjectId;
  ownerId: mongoose.Types.ObjectId;
  requesterId: mongoose.Types.ObjectId;
  requestedUntil: Date;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: Date;
  updatedAt: Date;
}

const borrowRequestSchema: Schema<BorrowRequest> = new mongoose.Schema({
  bookId: { type: mongoose.Schema.Types.ObjectId, ref: 'Book', required: true },
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  requesterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  requestedUntil: { type: Date, required: true },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected'],
    default: 'pending',
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const BorrowRequest = mongoose.model<BorrowRequest>(
  'BorrowRequest',
  borrowRequestSchema
);

export default BorrowRequest;
