import mongoose, { Schema, Document } from 'mongoose';

// Define interfaces for nested structures
interface Book {
  bookId: mongoose.Types.ObjectId;
  position: number;
  readProgress: number;
  color: string | null;
  status: string;
  source: {
    sourceName: string;
    sourceType: string;
  };
}

interface Shelf {
  shelfId: number;
  books: Book[];
}

interface Library {
  libraryName: string;
  shelves: Shelf[];
}

interface UserBook extends Document {
  user: mongoose.Types.ObjectId;
  libraries: Library[];
  addedAt: Date;
  updatedAt: Date;
  finishedAt: Date;
}

// Define sub-schemas
const bookSchema = new mongoose.Schema({
  bookId: { type: mongoose.Schema.Types.ObjectId, ref: 'Book' },
  position: { type: Number },
  readProgress: { type: Number },
  color: { type: String, default: null },
  status: { type: String },
  source: {
    sourceName: { type: String },
    sourceType: { type: String },
  },
});

const shelfSchema = new mongoose.Schema({
  shelfId: { type: Number },
  books: [bookSchema], // Reference bookSchema
});

const librarySchema = new mongoose.Schema({
  libraryName: { type: String },
  shelves: [shelfSchema], // Reference shelfSchema
});

// Main schema
const userBookSchema: Schema<UserBook> = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  libraries: [librarySchema], // Reference librarySchema
  addedAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  finishedAt: { type: Date },
});

// Add indexes for optimization
userBookSchema.index({ user: 1 });
librarySchema.index({ libraryName: 1 });
shelfSchema.index({ shelfId: 1 });
bookSchema.index({ bookId: 1 });

// Create and export the model
const UserBook = mongoose.model<UserBook>('UserBook', userBookSchema);

export default UserBook;
