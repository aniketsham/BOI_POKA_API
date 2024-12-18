import mongoose from 'mongoose';

export interface Book extends mongoose.Document {
  ISBN: string[];
  title: string;
  author: string;
  publisher: string;
  publicationYear: number;
  description: string;
  genre: string[];
  coverImage: string;
  language: string[];
  rating: number;
  addedAt: Date;
  updatedAt: Date;

  isDeleted: boolean;
  deletedAt?: Date;
  deletedBy?: string;
}

const bookSchema: mongoose.Schema<Book> = new mongoose.Schema({
  ISBN: [{ type: String, required: true }],
  title: { type: String, required: true },
  author: { type: String, required: true },
  publisher: { type: String, required: true },
  publicationYear: { type: Number, required: true },
  genre: [{ type: String, required: true }],
  description: { type: String, required: true },
  coverImage: { type: String, required: true },
  language: [{ type: String, required: true }],
  rating: { type: Number, required: true },
  addedAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  isDeleted: { type: Boolean, default: false },
  deletedAt: { type: Date },
  deletedBy: { type: String },
});

const Book = mongoose.model<Book>('Book', bookSchema);

export default Book;
