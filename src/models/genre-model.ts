// filepath: /Users/aniketsharma/Dropbox/Mac/Desktop/BOI_POKA_API/src/models/genre-model.ts
import mongoose, { Document, Schema } from 'mongoose';

export interface GenreModel extends Document {
  name: string;
  category: 'Fiction' | 'Non-Fiction' | 'Academic' | 'Leisure';
}

const GenreSchema: Schema = new Schema(
  {
    name: { type: String, required: true, unique: true },
    category: {
      type: String,
      required: true,
      enum: ['Fiction', 'Non-Fiction', 'Academic', 'Leisure'],
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<GenreModel>('Genre', GenreSchema);
