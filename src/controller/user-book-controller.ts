import { NextFunction, Request, Response } from 'express';
import UserBook from '../models/userbook-model';
import { CustomRequest } from '../types/types';
import { UserModel } from '../models/user-model';
import BorrowRequest from '../models/borrow-request-model';
import mongoose from 'mongoose';
import User from '../models/user-model';
export const addBookToUser = async (
  req: CustomRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { _id: userId } = req.user as UserModel;
    const {
      bookId,
      readProgress = 0,
      status = 'reading',
      libraryName = 'Home',
      location = [],
      source: { sourceName = '', sourceType = '' },
    } = req.body;

    if (!location || location.length !== 2) {
      res.status(400).json({
        message: 'Invalid location format. Expected [shelfIndex, position].',
      });
      return;
    }

    const [shelfIndex, position] = location;

    const userBookRecord = await UserBook.findOne({ user: userId });

    if (!userBookRecord) {
      const newUserBook = new UserBook({
        user: userId,
        libraries: [
          {
            libraryName,
            shelves: [
              {
                shelfId: 1,
                books: [
                  {
                    bookId,
                    readProgress,
                    status,
                    position,
                    color: 'default',
                    source: { sourceName, sourceType },
                  },
                ],
              },
            ],
          },
        ],
        addedAt: new Date(),
        updatedAt: new Date(),
        finishedAt: null,
      });

      await newUserBook.save();
      res.status(201).json({
        message: "Book added to user's list",
        newUserBook,
      });
      return;
    }

    let library = userBookRecord.libraries.find(
      (lib) => lib.libraryName === libraryName
    );

    if (!library) {
      library = {
        libraryName,
        shelves: [
          {
            shelfId: 1,
            books: [
              {
                bookId,
                readProgress,
                status,
                position,
                color: 'default',
                source: { sourceName, sourceType },
              },
            ],
          },
        ],
      };
      userBookRecord.libraries.push(library);
    }

    const existingBook = userBookRecord.libraries
      .flatMap((lib) => lib.shelves)
      .flatMap((shelf) => shelf.books)
      .find((book) => book.bookId.toString() === bookId);

    if (existingBook) {
      const color = existingBook.color || 'default';

      const shelf = library.shelves[shelfIndex];
      if (!shelf) {
        res.status(400).json({ message: 'Shelf not found.' });
        return;
      }

      const isOccupied = shelf.books.some((book) => book.position === position);

      if (isOccupied) {
        shelf.books.forEach((book) => {
          if (book.position >= position) {
            book.position += 1;
          }
        });
      }

      shelf.books.push({
        bookId,
        readProgress,
        status,
        position,
        color: color,
        source: { sourceName, sourceType },
      });

      shelf.books.sort((a, b) => a.position - b.position);

      userBookRecord.updatedAt = new Date();
      await userBookRecord.save();

      res.status(200).json({
        message: "Book updated in user's list",
        userBookRecord,
      });
      return;
    }

    if (shelfIndex < 0 || shelfIndex >= library.shelves.length) {
      res.status(400).json({ message: 'Invalid shelf index.' });
      return;
    }

    const shelf = library.shelves[shelfIndex];

    if (shelf.books.length >= 10) {
      res
        .status(400)
        .json({ message: 'Shelf is full, maximum of 10 books per shelf.' });
      return;
    }

    const isOccupied = shelf.books.some((book) => book.position === position);

    if (isOccupied) {
      shelf.books.forEach((book) => {
        if (book.position >= position) {
          book.position += 1;
        }
      });
    }

    let bookColor = 'default';
    const colorFromOtherLibrary = userBookRecord.libraries
      .flatMap((lib) => lib.shelves)
      .flatMap((shelf) => shelf.books)
      .find((book) => book.bookId.toString() === bookId)?.color;

    if (colorFromOtherLibrary) {
      bookColor = colorFromOtherLibrary;
    }

    shelf.books.push({
      bookId,
      readProgress,
      status,
      position,
      color: bookColor,
      source: { sourceName, sourceType },
    });

    shelf.books.sort((a, b) => a.position - b.position);

    userBookRecord.updatedAt = new Date();
    await userBookRecord.save();

    res.status(200).json({
      message: "Book added to user's list",
      userBookRecord,
    });
    return;
  } catch (error) {
    next(error);
  }
};

export const fetchAllBook = async (
  req: CustomRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { _id: userId } = req.user as UserModel;
    const userLibrary = await UserBook.findOne({ user: userId });

    if (!userLibrary) {
      res.status(404).json({ message: 'No book in library' });
      return;
    }

    userLibrary.libraries.forEach((library) => {
      library.shelves.forEach((shelf) => {
        shelf.books.sort((a, b) => a.position - b.position);
      });
    });

    res.status(200).json(userLibrary);
  } catch (error) {
    next(error);
  }
};

export const updateBookProgress = async (
  req: CustomRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { _id: userId } = req.user as UserModel;
    const { bookId, readProgress } = req.body;

    if (readProgress < 0 || readProgress > 100) {
      res
        .status(400)
        .json({ message: 'Read progress must be between 0 and 100' });
      return;
    }

    const userLibrary = await UserBook.findOne({ user: userId });
    if (!userLibrary) {
      res.status(404).json({ message: 'User library not found' });
      return;
    }

    let bookFound = false;
    userLibrary.libraries.forEach((library) => {
      library.shelves.forEach((shelf) => {
        const book = shelf.books.find(
          (book) => book.bookId.toString() === bookId
        );
        if (book) {
          book.readProgress = readProgress;
          if (readProgress === 100) {
            book.status = 'Completed';
          }
          bookFound = true;
        }
      });
    });

    if (!bookFound) {
      res.status(404).json({ message: 'Book not found in user library' });
      return;
    }

    await userLibrary.save();

    res.status(200).json({ message: 'Book progress updated successfully' });
  } catch (error) {
    next(error);
  }
};

export const deleteBookFromAllLibrary = async (
  req: CustomRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { _id: userId } = req.user as UserModel;
    const { bookId } = req.body;

    const userLibrary = await UserBook.findOne({ user: userId });

    if (!userLibrary) {
      res.status(404).json({ message: 'User Library not found' });
      return;
    }

    let bookFound = false;
    userLibrary.libraries.forEach((library) => {
      library.shelves.forEach((shelf) => {
        const bookIndex = shelf.books.findIndex(
          (b) => b.bookId.toString() === bookId
        );

        if (bookIndex !== -1) {
          shelf.books.splice(bookIndex, 1);
          bookFound = true;
        }
      });
    });

    if (!bookFound) {
      res.status(404).json({ message: 'Book not found in user library' });
      return;
    }

    await userLibrary.save();

    res.status(200).json({ message: 'Book deleted successfully' });
  } catch (error) {
    next(error);
  }
};

export const fetchBookInShelf = async (
  req: CustomRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { _id: userId } = req.user as UserModel;
    const { shelfNumber, libraryName } = req.body;

    const shelfIndex = Number(shelfNumber);
    if (isNaN(shelfIndex) || shelfIndex < 0) {
      res.status(400).json({ message: 'Invalid shelf number.' });
      return;
    }

    const userLibrary = await UserBook.findOne({ user: userId });

    if (!userLibrary) {
      res.status(404).json({ message: 'User Library not found' });
      return;
    }

    const library = userLibrary.libraries.find(
      (lib) => lib.libraryName === libraryName
    );

    if (!library) {
      res.status(404).json({ message: 'Library not found' });
      return;
    }

    if (shelfIndex >= library.shelves.length) {
      res.status(404).json({ message: 'Shelf not found' });
      return;
    }

    const shelf = library.shelves[shelfIndex];

    if (!shelf.books) {
      res
        .status(200)
        .json({ message: 'No books found on this shelf', books: [] });
      return;
    }

    res
      .status(200)
      .json({ message: 'Books retrieved successfully', books: shelf.books });
  } catch (error) {
    next(error);
  }
};

export const fetchBooksAtLocation = async (
  req: CustomRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { _id: userId } = req.user as UserModel;
    const { shelfIndex, position } = req.body;

    const userLibrary = await UserBook.findOne({ user: userId });

    if (!userLibrary) {
      res.status(404).json({ message: 'User Library not found' });
      return;
    }

    const shelf = userLibrary.libraries[0].shelves[Number(shelfIndex)];

    if (!shelf) {
      res.status(404).json({ message: 'Shelf not found' });
      return;
    }

    const bookAtLocation = shelf.books.find(
      (book) => book.position === Number(position)
    );

    if (!bookAtLocation) {
      res
        .status(404)
        .json({ message: 'No book found at the specified location' });
      return;
    }

    res.status(200).json({
      message: 'Book found at the specified location',
      book: bookAtLocation,
    });
  } catch (error) {
    next(error);
  }
};

export const fetchBookByLibraryName = async (
  req: CustomRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { _id: userId } = req.user as UserModel;
    const { libraryName } = req.params;

    const userLibrary = await UserBook.findOne({ user: userId });

    if (!userLibrary) {
      res.status(404).json({ message: 'User Library not found' });
      return;
    }

    const library = userLibrary.libraries.find(
      (lib) => lib.libraryName === libraryName
    );

    if (!library) {
      res.status(404).json({ message: 'Library not found' });
      return;
    }

    const books = library.shelves.flatMap((shelf) => shelf.books);

    if (books.length === 0) {
      res
        .status(200)
        .json({ message: 'No books found in this library', books: [] });
      return;
    }

    res.status(200).json({ message: 'Library retrieved successfully', books });
  } catch (error) {
    next(error);
  }
};

export const deleteBookFromLibrary = async (
  req: CustomRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { _id: userId } = req.user as UserModel;
    const { libraryName, bookId } = req.body;

    const userLibrary = await UserBook.findOne({ user: userId });

    if (!userLibrary) {
      res.status(404).json({ message: 'User Library not found' });
      return;
    }

    const library = userLibrary.libraries.find(
      (lib) => lib.libraryName === libraryName
    );

    if (!library) {
      res.status(404).json({ message: 'Library not found' });
      return;
    }

    let bookFound = false;
    library.shelves.forEach((shelf) => {
      const bookIndex = shelf.books.findIndex(
        (book) => book.bookId.toString() === bookId
      );

      if (bookIndex !== -1) {
        shelf.books.splice(bookIndex, 1);
        bookFound = true;
      }
    });

    if (!bookFound) {
      res
        .status(404)
        .json({ message: 'Book not found in the specified library' });
      return;
    }

    userLibrary.updatedAt = new Date();
    await userLibrary.save();

    res.status(200).json({ message: 'Book deleted from library successfully' });
  } catch (error) {
    next(error);
  }
};

export const addColorToBook = async (
  req: CustomRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { _id: userId } = req.user as UserModel;
    const { bookId, color } = req.body;

    if (!color) {
      res.status(400).json({ message: 'Color is required.' });
      return;
    }

    const userLibrary = await UserBook.findOne({ user: userId });

    if (!userLibrary) {
      res.status(404).json({ message: 'User Library not found' });
      return;
    }

    let bookFound = false;

    userLibrary.libraries.forEach((library) => {
      library.shelves.forEach((shelf) => {
        shelf.books.forEach((book) => {
          if (book.bookId.toString() === bookId.toString()) {
            book.color = color;
            bookFound = true;
          }
        });
      });
    });

    if (!bookFound) {
      res.status(404).json({ message: 'Book not found in user library' });
      return;
    }

    userLibrary.updatedAt = new Date();
    await userLibrary.save();

    res.status(200).json({ message: 'Book color updated successfully' });
  } catch (error) {
    next(error);
  }
};

export const fetchBooksByColor = async (
  req: CustomRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { _id: userId } = req.user as UserModel;
    const { color } = req.query;
    if (!color) {
      res.status(400).json({ message: 'Color is required to filter books.' });
      return;
    }

    const userLibrary = await UserBook.findOne({ user: userId });

    if (!userLibrary) {
      res.status(404).json({ message: 'User library not found.' });
      return;
    }

    const filteredBooks = userLibrary.libraries
      .flatMap((library) => library.shelves)
      .flatMap((shelf) => shelf.books)
      .filter((book) => book.color === color)
      .map((book) => {
        const libraryName = userLibrary.libraries.find((library) =>
          library.shelves.some((shelf) => shelf.books.includes(book))
        )?.libraryName;

        return {
          bookId: book.bookId,
          readProgress: book.readProgress,
          status: book.status,
          position: book.position,
          color: book.color,
          source: book.source,
          libraryName,
        };
      });

    if (filteredBooks.length === 0) {
      res.status(404).json({ message: `No books found with color: ${color}` });
      return;
    }

    res.status(200).json({
      message: 'Books filtered by color retrieved successfully',
      filteredBooks,
    });
  } catch (error) {
    next(error);
  }
};

export const fetchAllUserBook = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userBook = await UserBook.find();

    res.status(200).json({
      message: 'UserBook retrieved successfully',
      userBook,
    });
  } catch (error) {
    next(error);
  }
};

export const makeBorrowRequest = async (
  req: CustomRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { bookId, ownerId, requestedUntil } = req.body;
    const requesterId = req.user?._id as UserModel;

    const newRequest = new BorrowRequest({
      bookId,
      ownerId,
      requesterId,
      requestedUntil,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await newRequest.save();
    res.status(201).json({ message: 'Borrow request created', newRequest });
  } catch (error) {
    next(error);
  }
};

export const acceptRequest = async (
  req: CustomRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { requestId } = req.params;
    const userId = req.user?._id as mongoose.Types.ObjectId;
    const request = await BorrowRequest.findById(requestId).session(session);
    if (!request) {
      res.status(404).json({ message: 'Request not found' });
      await session.abortTransaction();
      session.endSession();
      return;
    }

    if (!request.ownerId.equals(userId)) {
      res
        .status(403)
        .json({ message: 'You are not authorized to accept this request' });
      await session.abortTransaction();
      session.endSession();
      return;
    }

    request.status = 'accepted';
    request.updatedAt = new Date();
    await request.save({ session });

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({ message: 'Request accepted successfully' });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    next(error);
  }
};

export const rejectRequest = async (
  req: CustomRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { requestId } = req.params;
    const userId = req.user?._id as mongoose.Types.ObjectId;

    const request = await BorrowRequest.findById(requestId);
    if (!request) {
      res.status(404).json({ message: 'Request not found' });
      return;
    }

    if (!request.ownerId.equals(userId)) {
      res
        .status(403)
        .json({ message: 'You are not authorized to reject this request' });
      return;
    }

    request.status = 'rejected';
    request.updatedAt = new Date();
    await request.save();

    res.status(200).json({ message: 'Request rejected' });
  } catch (error) {
    next(error);
  }
};

export const getAllBorrowRequestsByRequester = async (
  req: CustomRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { _id: userId } = req.user as UserModel;

    const borrowRequests = await BorrowRequest.find({ requesterId: userId });

    if (borrowRequests.length === 0) {
      res
        .status(404)
        .json({ message: 'No borrow requests found for this user' });
      return;
    }

    res.status(200).json({
      message: 'Requester Borrow requests retrieved successfully',
      borrowRequests,
    });
  } catch (error) {
    next(error);
  }
};

export const getAllBorrowRequestsByOwner = async (
  req: CustomRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { _id: userId } = req.user as UserModel;

    const borrowRequests = await BorrowRequest.find({ ownerId: userId });

    if (borrowRequests.length === 0) {
      res
        .status(404)
        .json({ message: 'No borrow requests found for this user' });
      return;
    }

    res.status(200).json({
      message: 'Owner Borrow requests retrieved successfully',
      borrowRequests,
    });
  } catch (error) {
    next(error);
  }
};

export const getAllBorrowedBooks = async (
  req: CustomRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { _id: userId } = req.user as UserModel;

    const borrowRequests = await BorrowRequest.find({
      requesterId: userId,
      status: 'accepted',
    });

    if (borrowRequests.length === 0) {
      res.status(404).json({ message: 'No borrowed books found' });
      return;
    }

    const borrowedBooks = await Promise.all(
      borrowRequests.map(async (request) => {
        const owner = await User.findById(request.ownerId).select(
          'fullName email'
        );
        return {
          bookId: request.bookId,
          owner: owner
            ? { fullName: owner.fullName, email: owner.email }
            : null,
          requestedUntil: request.requestedUntil,
        };
      })
    );

    res.status(200).json({
      message: 'Borrowed books retrieved successfully',
      borrowedBooks,
    });
  } catch (error) {
    next(error);
  }
};

export const getAllLoanedBooks = async (
  req: CustomRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { _id: userId } = req.user as UserModel;

    const loanedBooks = await BorrowRequest.find({
      ownerId: userId,
      status: 'accepted',
    });

    if (loanedBooks.length === 0) {
      res.status(404).json({ message: 'No loaned books found for this user' });
      return;
    }

    const loanedBookDetails = await Promise.all(
      loanedBooks.map(async (request) => {
        const requester = await User.findById(request.requesterId).select(
          'fullName email'
        );
        return {
          bookId: request.bookId,
          requester: requester
            ? { fullName: requester.fullName, email: requester.email }
            : null,
          requestedUntil: request.requestedUntil,
        };
      })
    );

    res.status(200).json({
      message: 'Loaned books retrieved successfully',
      loanedBooks: loanedBookDetails,
    });
  } catch (error) {
    next(error);
  }
};

export const updateUserLibraryName = async (
  req: CustomRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { currentLibraryName, newLibraryName } = req.body;
    const userId = req.user?._id as mongoose.Types.ObjectId;

    if (!currentLibraryName || !newLibraryName) {
      res.status(400).json({
        error: 'Current library name and new library name are required',
      });
      return;
    }

    const userBook = await UserBook.findOne({ user: userId });
    if (!userBook) {
      res.status(404).json({ error: 'User book record not found' });
      return;
    }

    const library = userBook.libraries.find(
      (lib) => lib.libraryName === currentLibraryName
    );
    if (!library) {
      res.status(404).json({ error: 'Library not found' });
      return;
    }

    library.libraryName = newLibraryName;
    await userBook.save();

    res.status(200).json({
      message: 'Library name updated successfully',
      userBook,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteUserLibraryWithConsent = async (
  req: CustomRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { libraryName, consent } = req.body;
    const userId = req.user?._id as mongoose.Types.ObjectId;

    if (!libraryName || !consent) {
      res
        .status(400)
        .json({ message: 'Library name and consent are required' });
      return;
    }

    const userBook = await UserBook.findOne({ user: userId });
    if (!userBook) {
      res.status(404).json({ message: 'User book record not found' });
      return;
    }

    const library = userBook.libraries.find(
      (lib) => lib.libraryName === libraryName
    );
    if (!library) {
      res.status(404).json({ message: 'Library not found' });
      return;
    }

    if (consent === 'yes') {
      userBook.libraries = userBook.libraries.filter(
        (lib) => lib.libraryName !== libraryName
      );
      await userBook.save();
      res.status(200).json({
        message: 'Library deleted successfully',
        userBook,
      });
      return;
    }

    const booksInLibrary = library.shelves.flatMap((shelf) => shelf.books);
    const booksInOtherLibraries = userBook.libraries
      .filter((lib) => lib.libraryName !== libraryName)
      .flatMap((lib) => lib.shelves)
      .flatMap((shelf) => shelf.books);

    const booksNotInOtherLibraries = booksInLibrary.filter(
      (book) =>
        !booksInOtherLibraries.some(
          (otherBook) => otherBook.bookId.toString() === book.bookId.toString()
        )
    );

    if (consent === 'no' && booksNotInOtherLibraries.length > 0) {
      res.status(400).json({
        message:
          'Please move the books to another library before deleting this library',
        booksNotInOtherLibraries,
      });
      return;
    }

    userBook.libraries = userBook.libraries.filter(
      (lib) => lib.libraryName !== libraryName
    );
    await userBook.save();
    res.status(200).json({
      message: 'Library deleted successfully',
      userBook,
    });
  } catch (error) {
    next(error);
  }
};

export const moveBooksToLibrary = async (
  req: CustomRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { sourceLibraryName, targetLibraryName, bookIds } = req.body;
    const userId = req.user?._id as mongoose.Types.ObjectId;

    if (
      !sourceLibraryName ||
      !targetLibraryName ||
      !Array.isArray(bookIds) ||
      bookIds.length === 0
    ) {
      res.status(400).json({
        message:
          'Source library name, target library name, and book IDs are required',
      });
      return;
    }

    const userBook = await UserBook.findOne({ user: userId });
    if (!userBook) {
      res.status(404).json({ message: 'User book record not found' });
      return;
    }

    const sourceLibrary = userBook.libraries.find(
      (lib) => lib.libraryName === sourceLibraryName
    );
    if (!sourceLibrary) {
      res.status(404).json({ message: 'Source library not found' });
      return;
    }

    const targetLibrary = userBook.libraries.find(
      (lib) => lib.libraryName === targetLibraryName
    );
    if (!targetLibrary) {
      res.status(404).json({ message: 'Target library not found' });
      return;
    }

    const booksToMove = sourceLibrary.shelves.flatMap((shelf) =>
      shelf.books.filter((book) => bookIds.includes(book.bookId.toString()))
    );

    if (booksToMove.length === 0) {
      res.status(400).json({ message: 'No books found to move' });
      return;
    }

    sourceLibrary.shelves.forEach((shelf) => {
      shelf.books = shelf.books.filter(
        (book) => !bookIds.includes(book.bookId.toString())
      );
    });

    targetLibrary.shelves[0].books.push(...booksToMove);

    await userBook.save();

    res.status(200).json({
      message: 'Books moved successfully',
      userBook,
    });
  } catch (error) {
    next(error);
  }
};
