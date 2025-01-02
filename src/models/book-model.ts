import mongoose from 'mongoose';

export interface Book extends mongoose.Document {
  ISBN: string[];
  title: string;
  author: string[]; // added for because book can have multiple authors
  publisher?: string;
  publicationYear: number;
  description: string;
  genre: string[];
  coverImage: string;
  language: string[];
  rating: number;
  addedAt: Date;
  updatedAt: Date;
  isIndian: boolean;
  isDeleted: boolean;
  deletedAt?: Date;
  deletedBy?: string;
}

const bookSchema: mongoose.Schema<Book> = new mongoose.Schema({
  ISBN: [{ type: String, required: true }],
  title: { type: String, required: true },
  author: [{ type: String, required: true }],
  publisher: { type: String },
  publicationYear: { type: Number, required: true },
  genre: [{ type: String, required: true }],
  description: { type: String, required: true },
  coverImage: { type: String },
  language: [{ type: String, required: true }],
  rating: { type: Number, required: true, default: 0.5 },
  addedAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  isIndian: { type: Boolean, default: true },
  isDeleted: { type: Boolean, default: false, select: false },
  deletedAt: { type: Date, select: false },
  deletedBy: { type: String, select: false },
});

const Book = mongoose.model<Book>('Book', bookSchema);

export default Book;
