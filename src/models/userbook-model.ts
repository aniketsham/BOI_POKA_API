import mongoose, { Schema, Document } from 'mongoose';

export interface UserBook extends Document {
  user: mongoose.Schema.Types.ObjectId;
  books: {
    bookId: mongoose.Schema.Types.ObjectId;
    readProgress: number;
    status: 'reading' | 'completed' | 'paused';
    location: number[][];
    source: string;
  };
  addedAt: Date;

  updatedAt: Date;
  finishedAt?: Date;
}

const userBookSchema: Schema<UserBook> = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  books: [
    {
      bookId: { type: mongoose.Schema.Types.ObjectId, ref: 'Book' },
      readProgress: { type: Number, default: 0 },
      status: {
        type: String,
        enum: ['reading', 'completed', 'paused'],
        default: 'reading',
      },
      location: { type: [[Number]], default: [] },
      source: { type: String, default: '' },
    },
  ],

  addedAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  finishedAt: { type: Date },
});

const UserBook = mongoose.model('UserBook', userBookSchema);