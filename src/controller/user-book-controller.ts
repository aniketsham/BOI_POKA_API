import { NextFunction, Request, Response } from 'express';
import UserBook from '../models/userbook-model';
import { CustomRequest } from '../types/types';
import { UserModel } from '../models/user-model';

// export const addBookToUser = async (
//   req: CustomRequest,
//   res: Response,
//   next: NextFunction
// ): Promise<void> => {
//   try {
//     const { _id: userId } = req.user as UserModel;
//     const {
//       bookId,
//       readProgress = 0,
//       status = 'reading',
//       libraryName = 'My Library',
//       location = [],
//       source: { sourceName = '', sourceType = '' },
//     } = req.body;

//     if (!location || location.length !== 2) {
//       res.status(400).json({
//         message: 'Invalid location format. Expected [shelfIndex, position].',
//       });
//       return;
//     }

//     const [shelfIndex, position] = location;

//     const userBookRecord = await UserBook.findOne({ user: userId });

//     if (!userBookRecord) {
//       const newUserBook = new UserBook({
//         user: userId,
//         libraries: [
//           {
//             libraryName,
//             shelves: [
//               {
//                 shelfId: 1,
//                 books: [
//                   {
//                     bookId,
//                     readProgress,
//                     status,
//                     position,
//                     color: 'default',
//                     source: {
//                       sourceName,
//                       sourceType,
//                     },
//                   },
//                 ],
//               },
//             ],
//           },
//         ],
//         addedAt: new Date(),
//         updatedAt: new Date(),
//         finishedAt: null,
//       });

//       await newUserBook.save();

//       res.status(201).json({
//         message: "Book added to user's list",
//         newUserBook,
//       });
//       return;
//     }

//     let library = userBookRecord.libraries.find(
//       (lib) => lib.libraryName === libraryName
//     );

//     if (!library) {
//       library = {
//         libraryName,
//         shelves: [
//           {
//             shelfId: 1,
//             books: [
//               {
//                 bookId,
//                 readProgress,
//                 status,
//                 position,
//                 color: 'default',
//                 source: {
//                   sourceName,
//                   sourceType,
//                 },
//               },
//             ],
//           },
//         ],
//       };
//       userBookRecord.libraries.push(library);
//     }

//     const existingBook = library.shelves
//       .flatMap((shelf) => shelf.books)
//       .find((book) => book.bookId.toString() === bookId);

//     if (existingBook) {
//       existingBook.readProgress = readProgress;
//       existingBook.status = status;
//       existingBook.position = position;
//       existingBook.color = 'updated';
//       existingBook.source = { sourceName, sourceType };

//       userBookRecord.updatedAt = new Date();
//       await userBookRecord.save();

//       res.status(200).json({
//         message: "Book updated in user's list",
//         userBookRecord,
//       });
//       return;
//     }

//     if (shelfIndex < 0 || shelfIndex >= library.shelves.length) {
//       res.status(400).json({ message: 'Invalid shelf index.' });
//       return;
//     }

//     const shelf = library.shelves[shelfIndex];

//     if (shelf.books.length >= 10) {
//       res
//         .status(400)
//         .json({ message: 'Shelf is full, maximum of 10 books per shelf.' });
//       return;
//     }

//     const isOccupied = shelf.books.some((book) => book.position === position);

//     if (isOccupied) {
//       shelf.books.forEach((book) => {
//         if (book.position >= position) {
//           book.position += 1;
//         }
//       });
//     }

//     shelf.books.push({
//       bookId,
//       readProgress,
//       status,
//       position,
//       color: 'new',
//       source: { sourceName, sourceType },
//     });

//     shelf.books.sort((a, b) => a.position - b.position);

//     userBookRecord.updatedAt = new Date();
//     await userBookRecord.save();

//     res.status(200).json({
//       message: "Book added to user's list",
//       userBookRecord,
//     });
//     return;
//   } catch (error) {
//     next(error);
//   }
// };

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
      libraryName = 'My Library',
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
      // If the user doesn't have any book record, create a new one
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

    // Check if the library exists in the user's record
    let library = userBookRecord.libraries.find(
      (lib) => lib.libraryName === libraryName
    );

    // If library doesn't exist, create a new library
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
                color: 'default', // Default color when the book is first added
                source: { sourceName, sourceType },
              },
            ],
          },
        ],
      };
      userBookRecord.libraries.push(library); // Add the new library to the user record
    }

    // Check if the book already exists in any of the libraries
    const existingBook = userBookRecord.libraries
      .flatMap((lib) => lib.shelves)
      .flatMap((shelf) => shelf.books)
      .find((book) => book.bookId.toString() === bookId);

    if (existingBook) {
      // If book exists, propagate color from the first occurrence
      const color = existingBook.color || 'default';

      // Update the book in the existing library with the new details
      const shelf = library.shelves[shelfIndex];
      if (!shelf) {
        res.status(400).json({ message: 'Shelf not found.' });
        return;
      }

      const isOccupied = shelf.books.some((book) => book.position === position);

      if (isOccupied) {
        // Shift books with positions >= the new position
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
        color: color, // Propagate the existing color
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

    // If the book doesn't exist in the library, we need to add it
    if (shelfIndex < 0 || shelfIndex >= library.shelves.length) {
      res.status(400).json({ message: 'Invalid shelf index.' });
      return;
    }

    const shelf = library.shelves[shelfIndex];

    // Ensure there's room on the shelf (max 10 books per shelf)
    if (shelf.books.length >= 10) {
      res
        .status(400)
        .json({ message: 'Shelf is full, maximum of 10 books per shelf.' });
      return;
    }

    // Check if the position is already occupied
    const isOccupied = shelf.books.some((book) => book.position === position);

    if (isOccupied) {
      // Shift books with positions >= the new position
      shelf.books.forEach((book) => {
        if (book.position >= position) {
          book.position += 1;
        }
      });
    }

    // Get the color of the book from other libraries if it exists
    let bookColor = 'default';
    const colorFromOtherLibrary = userBookRecord.libraries
      .flatMap((lib) => lib.shelves)
      .flatMap((shelf) => shelf.books)
      .find((book) => book.bookId.toString() === bookId)?.color;

    if (colorFromOtherLibrary) {
      bookColor = colorFromOtherLibrary;
    }

    // Add the new book to the shelf
    shelf.books.push({
      bookId,
      readProgress,
      status,
      position,
      color: bookColor, // Apply the correct color
      source: { sourceName, sourceType },
    });

    // Sort the books on the shelf by position
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

    const userLibrary = await UserBook.findOne({ user: userId });

    if (!userLibrary) {
      res.status(404).json({ message: 'User Library not found' });
      return;
    }

    const book = userLibrary.libraries
      .flatMap((library) => library.shelves)
      .flatMap((shelf) => shelf.books)
      .find((b) => b.bookId.toString() === bookId);

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
  req: CustomRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { _id: userId } = req.user as UserModel;
    const { bookId, status } = req.body;

    const userLibrary = await UserBook.findOne({ user: userId });

    if (!userLibrary) {
      res.status(404).json({ message: 'User Library not found' });
      return;
    }

    const book = userLibrary.libraries
      .flatMap((library) => library.shelves)
      .flatMap((shelf) => shelf.books)
      .find((b) => b.bookId.toString() === bookId);

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
    const { _id: userId } = req.user as UserModel; // Get the user's ID from the request
    const { color } = req.query; // The color parameter from the query string

    if (!color) {
      res.status(400).json({ message: 'Color is required to filter books.' });
      return;
    }

    // Find the user's library
    const userLibrary = await UserBook.findOne({ user: userId });

    if (!userLibrary) {
      res.status(404).json({ message: 'User library not found.' });
      return;
    }

    // Filter books by color across all libraries and shelves
    const filteredBooks = userLibrary.libraries
      .flatMap((library) => library.shelves) // Flatten shelves from all libraries
      .flatMap((shelf) => shelf.books) // Flatten books from all shelves
      .filter((book) => book.color === color) // Filter books by the specified color
      .map((book) => {
        // Add the library name to the book information
        const libraryName = userLibrary.libraries.find((library) =>
          library.shelves.some((shelf) => shelf.books.includes(book))
        )?.libraryName;

        // Return a clean book object with necessary information
        return {
          bookId: book.bookId,
          readProgress: book.readProgress,
          status: book.status,
          position: book.position,
          color: book.color,
          source: book.source,
          libraryName, // Adding the library name to each book
        };
      });

    // If no books are found with the specified color
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
