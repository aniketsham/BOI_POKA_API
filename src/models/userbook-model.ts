import mongoose, { Schema, Document } from 'mongoose';

interface UserBook extends Document {
  user: mongoose.Types.ObjectId;

  libraries: [
    {
      libraryName: string;
      shelves: [
        {
          shelfId: number;
          books: [
            {
              bookId: mongoose.Types.ObjectId;
              position: number;
              readProgress: number;
              color: string | null;
              status: string;
              source: {
                sourceName: string;
                sourceType: string;
              };
            },
          ];
        },
      ];
    },
  ];

  addedAt: Date;
  updatedAt: Date;
  finishedAt: Date;
}

const userBookSchema: Schema<UserBook> = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

  libraries: [
    {
      libraryName: { type: String },
      shelves: [
        {
          shelfId: { type: Number },
          books: [
            {
              bookId: { type: mongoose.Schema.Types.ObjectId, ref: 'Book' },
              position: { type: Number },
              readProgress: { type: Number },
              color: { type: String, default: null },
              status: { type: String },
              source: {
                sourceName: { type: String },
                sourceType: { type: String },
              },
            },
          ],
        },
      ],
    },
  ],
  addedAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  finishedAt: { type: Date },
});

const UserBook = mongoose.model('UserBook', userBookSchema);

export default UserBook;
