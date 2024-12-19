import { NextFunction, Request, Response } from 'express';
import Book from '../models/book-model';
// export const addBook = async (
//   req: Request,
//   res: Response,
//   next: NextFunction
// ): Promise<void> => {
//   try {
//     const books = req.body.items;

//     if (!books || books.length === 0) {
//       throw new Error('No books found in the response');
//     }

//     const savedBooks = await Promise.all(
//       books.map(async (book: any) => {
//         const { volumeInfo } = book;

//         const isbn = volumeInfo.industryIdentifiers.map(
//           (identifier: any) => identifier.identifier
//         );
//         console.log;
//         const title = volumeInfo.title;
//         const author = volumeInfo.authors || [];
//         const publisher = volumeInfo.publisher || '';
//         const publicationYear = parseInt(volumeInfo.publishedDate, 10);
//         const genre = volumeInfo.categories || [];
//         const description = volumeInfo.description || '';
//         const coverImage = volumeInfo.imageLinks?.thumbnail || '';
//         const language = volumeInfo.language ? [volumeInfo.language] : [];
//         const rating = volumeInfo.averageRating || 0;

//         const newBook = new Book({
//           ISBN: isbn,
//           title,
//           author,
//           publisher,
//           publicationYear,
//           genre,
//           description,
//           coverImage,
//           language,
//           rating,
//           addedAt: new Date(),
//           updatedAt: new Date(),
//           isDeleted: false,
//         });

//         await newBook.save();
//         return newBook;
//       })
//     );

//     res.status(201).json(savedBooks);
//   } catch (error) {
//     next(error);
//   }
// };
export const handleBook = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const books = req.body.items;

    if (!books || books.length === 0) {
      throw new Error('No books found in the response');
    }

    // Process each book and check for existing ISBN
    const savedBooks = await Promise.all(
      books.map(async (book: any) => {
        const { volumeInfo } = book;

        // Extract ISBN array (handling both ISBN-10 and ISBN-13)
        const isbnArray = volumeInfo.industryIdentifiers.map(
          (identifier: any) => identifier.identifier
        );

        const title = volumeInfo.title;
        const author = volumeInfo.authors || [];
        const publisher = volumeInfo.publisher || '';
        const publicationYear = parseInt(volumeInfo.publishedDate, 10);
        const genre = volumeInfo.categories || [];
        const description = volumeInfo.description || '';
        const coverImage = volumeInfo.imageLinks?.thumbnail || '';
        const language = volumeInfo.language ? [volumeInfo.language] : [];
        const rating = volumeInfo.averageRating || 0.5;

        const existingBook = await Book.findOne({
          ISBN: { $in: isbnArray },
        });

        if (existingBook) {
          existingBook.title = title;
          existingBook.author = author;
          existingBook.publisher = publisher;
          existingBook.publicationYear = publicationYear;
          existingBook.genre = genre;
          existingBook.description = description;
          existingBook.coverImage = coverImage;
          existingBook.language = language;
          existingBook.rating = rating;
          existingBook.updatedAt = new Date();

          await existingBook.save();

          return existingBook;
        } else {
          const newBook = new Book({
            ISBN: isbnArray,
            title,
            author,
            publisher,
            publicationYear,
            genre,
            description,
            coverImage,
            language,
            rating,
            addedAt: new Date(),
            updatedAt: new Date(),
            isDeleted: false,
          });

          await newBook.save();
          return newBook;
        }
      })
    );

    res.status(201).json(savedBooks);
  } catch (error) {
    next(error);
  }
};

export const fetchBookByGenre = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const genre = req.params.genre;

    const books = await Book.find({ genre: { $in: genre } });
    if (books.length === 0) {
      res.status(404).json({ error: 'No books found for the given genres' });
      return;
    }

    res.status(200).json(books);
  } catch (error) {
    next(error);
  }
};

export const fetchBookByAuthor = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const author = req.params.author;

    const books = await Book.find({ author: { $in: author } });
    if (books.length === 0) {
      res.status(404).json({ error: 'No books found for the given author' });
      return;
    }

    res.status(200).json(books);
  } catch (error) {
    next(error);
  }
};

export const fetchSimilarBooks = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const ParamId = req.params.id;
    const book = await Book.findById(ParamId);
    if (!book) {
      res.status(404).json({ error: 'Book not found' });
      return;
    }
    const similarBooks = await Book.find({
      $or: [
        { genre: { $in: book.genre } },
        //    { rating: { $gte: book.rating - 1, $lte: book.rating + 1 } },
        { author: { $in: book.author } },
      ],
    });

    if (similarBooks.length === 0) {
      res.status(404).json({ error: 'No similar books found' });
      return;
    }

    res.status(200).json(similarBooks);
  } catch (error) {
    next(error);
  }
};

export const fetchBookById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const ParamId = req.params.id;
    const book = await Book.findById(ParamId);
    if (!book) {
      res.status(404).json({ error: 'Book not found' });
      return;
    }
    res.status(200).json(book);
  } catch (error) {
    next(error);
  }
};

export const fetchFilteredBooks = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { genre, rating, limit } = req.query;

    const filter: any = {};

    if (genre) {
      const genres = Array.isArray(genre) ? genre : [genre];
      filter.genre = {
        $in: genres.map((g) => new RegExp(`^${g}$`, 'i')), // Case-insensitive matching
      };
    }

    if (rating) {
      filter.rating = { $gte: parseFloat(rating as string) };
    }

    const books = await Book.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit ? parseInt(limit as string, 10) : 10); // Default limit to 10 if not provided

    if (!books.length) {
      res.status(404).json({ error: 'No books found matching the criteria' });
      return;
    }

    res.status(200).json(books);
  } catch (error) {
    next(error);
  }
};

export const fetchBookByISBN = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const isbn = req.params.isbn;
    const book = await Book.findOne({
      ISBN: { $in: isbn },
    });
    if (!book) {
      res.status(404).json({ error: 'Book not found' });
      return;
    }
    res.status(200).json(book);
  } catch (error) {
    next(error);
  }
};
