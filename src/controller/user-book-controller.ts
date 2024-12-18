import { NextFunction, Request, Response } from 'express';
import UserBook from '../models/userbook-model';

export const addBookToUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const {
      userId,
      bookId,
      readProgress = 0,
      status = 'reading',
      location = [],
      source = '',
    } = req.body;

    const userBookRecord = await UserBook.findOne({ user: userId });

    if (!userBookRecord) {
      const newUserBook = new UserBook({
        user: userId,
        books: [
          {
            bookId,
            readProgress,
            status,
            location,
            source,
          },
        ],
      });

      await newUserBook.save();
      res
        .status(201)
        .json({ message: "Book added to user's list", newUserBook });
      return;
    }

    // Check if the book is already in the user's list
    const existingBook = userBookRecord.books.find(
      (book) => book.bookId.toString() === bookId
    );

    if (existingBook) {
      // If the book already exists, update its details
      existingBook.readProgress = readProgress;
      existingBook.status = status;
      existingBook.location = location;
      existingBook.source = source;

      // Save the updated userBook record
      userBookRecord.updatedAt = new Date();
      await userBookRecord.save();

      res
        .status(200)
        .json({ message: "Book updated in user's list", userBookRecord });
      return;
    } else {
      const shelfIndex = location[0][0]; // assuming location is a 2D array where the first item is the shelf index
      const position = location[0][1]; // the second item is the position in the shelf

      if (shelfIndex < 0 || shelfIndex >= userBookRecord.books.length) {
        res.status(400).json({ message: 'Invalid shelf index.' });
        return;
      }

      const shelf = userBookRecord.books[shelfIndex];

      if (shelf && shelf.location.length >= 10) {
        res
          .status(400)
          .json({ message: 'Shelf is full, maximum of 10 books per shelf.' });
        return;
      }

      // Check if the position is already occupied on the given shelf
      const isOccupied = shelf.location.some(
        (loc: number[]) => loc[1] === position
      );

      if (isOccupied) {
        res
          .status(400)
          .json({ message: 'Position already occupied on this shelf.' });
        return;
      }

      // If the book doesn't exist, add a new book entry to the user's record
      userBookRecord.books.push({
        bookId,
        readProgress,
        status,
        location,
        source,
      });

      userBookRecord.updatedAt = new Date();
      await userBookRecord.save();

      res
        .status(200)
        .json({ message: "Book added to user's list", userBookRecord });
      return;
    }
  } catch (error) {
    next(error);
  }
};

export const fetchBookInSelf = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { userId } = req.params;

    const userLibrary = await UserBook.findOne({ user: userId });

    if (!userLibrary) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    userLibrary.books.sort((a, b) => {
      const locationA = a.location[0];
      const locationB = b.location[0];

      if (locationA[0] !== locationB[0]) {
        return locationA[0] - locationB[0];
      }

      return locationA[1] - locationB[1];
    });

    res.status(200).json(userLibrary);
  } catch (error) {
    next(error);
  }
};

export const updateBookProgress = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { userId } = req.params;
    const { bookId, readProgress } = req.body;

    const userLibrary = await UserBook.findOne({ user: userId });

    if (!userLibrary) {
      res.status(404).json({ message: 'User Library not found' });
      return;
    }

    const book = userLibrary.books.find((b) => b.bookId.toString() === bookId);

    if (!book) {
      res.status(404).json({ message: 'Book not found in user library' });
      return;
    }

    book.readProgress = readProgress;

    await userLibrary.save();

    res.status(200).json({ message: 'Book progress updated successfully' });
  } catch (error) {
    next(error);
  }
};

export const updateBookStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { userId } = req.params;
    const { bookId, status } = req.body;

    const userLibrary = await UserBook.findOne({ user: userId });

    if (!userLibrary) {
      res.status(404).json({ message: 'User Library not found' });
      return;
    }

    const book = userLibrary.books.find((b) => b.bookId.toString() === bookId);

    if (!book) {
      res.status(404).json({ message: 'Book not found in user library' });
      return;
    }

    book.status = status;

    await userLibrary.save();

    res.status(200).json({ message: 'Book status updated successfully' });
  } catch (error) {
    next(error);
  }
};

export const deleteBookFromSelf = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { userId } = req.params;
    const { bookId } = req.body;

    const userLibrary = await UserBook.findOne({ user: userId });

    if (!userLibrary) {
      res.status(404).json({ message: 'User Library not found' });
      return;
    }

    const bookIndex = userLibrary.books.findIndex(
      (b) => b.bookId.toString() === bookId
    );

    if (bookIndex === -1) {
      res.status(404).json({ message: 'Book not found in user library' });
      return;
    }

    userLibrary.books.splice(bookIndex, 1);

    await userLibrary.save();

    res.status(200).json({ message: 'Book deleted successfully' });
  } catch (error) {
    next(error);
  }
};
