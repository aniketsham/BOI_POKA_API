import mongoose from 'mongoose';

export interface Book extends mongoose.Document {
  ISBN: string;
  title: string;
  author: string;
  publisher: string;
  publicationYear: number;
  description: string; // Fixed typo here
  genre: string;
  coverImage: string;
  language: string;
  rating: number;
  addedAt: Date;
  updatedAt: Date;
  location: string;
  borrowedBy?: string; // Optional, will be filled when borrowed
  borrowedAt?: Date; // Optional, will be filled when borrowed
  borrowedTill?: Date; // Optional, will be filled when borrowed
  isDeleted: boolean;
  deletedAt?: Date; // Optional, will be filled when deleted
  deletedBy?: string; // Optional, will be filled when deleted
}

const bookSchema: mongoose.Schema<Book> = new mongoose.Schema({
  ISBN: { type: String, required: true },
  title: { type: String, required: true },
  author: { type: String, required: true },
  publisher: { type: String, required: true },
  publicationYear: { type: Number, required: true },
  genre: { type: String, required: true },
  description: { type: String, required: true }, // Fixed typo
  coverImage: { type: String, required: true },
  language: { type: String, required: true },
  rating: { type: Number, required: true },
  addedAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  location: { type: String, required: true },
  borrowedBy: { type: String },
  borrowedAt: { type: Date },
  borrowedTill: { type: Date },
  isDeleted: { type: Boolean, default: false },
  deletedAt: { type: Date },
  deletedBy: { type: String },
});

const Book = mongoose.model<Book>('Book', bookSchema);

export default Book;
