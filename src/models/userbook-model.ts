import mongoose, { Schema, Document } from 'mongoose';

export interface UserBook extends Document {
  user: mongoose.Schema.Types.ObjectId;
  books: {
    bookId: mongoose.Schema.Types.ObjectId;
    readProgress: number;
    status: 'reading' | 'completed' | 'paused';
    location: number[][];
    source: string;
    borrowedBy?: mongoose.Schema.Types.ObjectId;
    borrowedAt?: Date;
    borrowedUntil?: Date;
  }[];

  addedAt: Date;

  updatedAt: Date;
  finishedAt?: Date;
}
//loaned at
//identified doubtful based on image ocr

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
      borrowedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      borrowedAt: { type: Date },
      borrowedUntil: { type: Date },
    },
  ],

  addedAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  finishedAt: { type: Date },
});

const UserBook = mongoose.model('UserBook', userBookSchema);

export default UserBook;
