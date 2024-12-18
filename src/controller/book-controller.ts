import { NextFunction, Request, Response } from 'express';
import Book from '../models/book-model';
export const addBook = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // const {
    //   ISBN,
    //   title,
    //   author,
    //   publisher,
    //   publicationYear,
    //   genre,
    //   description,
    //   coverImage,
    //   language,
    //   rating,
    // } = req.body;

    // if (
    //   !ISBN ||
    //   !title ||
    //   !author ||
    //   !publisher ||
    //   !publicationYear ||
    //   !genre ||
    //   !description ||
    //   !coverImage ||
    //   !language ||
    //   !rating
    // ) {
    //   if (!Array.isArray(ISBN)) {
    //     res.status(400).json({ error: 'ISBN must be an array' });
    //     return;
    //   }

    //   res.status(400).json({ error: 'All fields are required' });
    //   return;
    // }
    /*
    input eg 
    {
      "ISBN": "1234567890",
      "title": "Book Title",
      "author": "Author Name",
      "publisher": "Publisher Name",
      "publicationYear": 2023,
      "genre": ["Genre 1", "Genre 2"],
      "description": "Description",
      "coverImage": "https://example.com/cover.jpg",
      "language": ["English", "French"],
      "rating": 4.5
      
    }
    */

    // const existingBook = await Book.findOne({ ISBN: { $in: ISBN } });
    // if (existingBook) {
    //   res.status(400).json({ error: 'Book already exists' });
    //   return;
    // }
    // const newBook = new Book({
    //   ISBN,
    //   title,
    //   author,
    //   publisher,
    //   publicationYear,
    //   genre,
    //   description,
    //   coverImage,
    //   language,
    //   rating,
    // });
    // await newBook.save();
    // res.status(201).json(newBook);

    const books = req.body.items;

    if (!books || books.length === 0) {
      throw new Error('No books found in the response');
    }

    const savedBooks = await Promise.all(
      books.map(async (book: any) => {
        const { volumeInfo } = book;

        const isbn = volumeInfo.industryIdentifiers.map(
          (identifier: any) => identifier.identifier
        );
        console.log;
        const title = volumeInfo.title;
        const author = volumeInfo.authors || [];
        const publisher = volumeInfo.publisher || '';
        const publicationYear = parseInt(volumeInfo.publishedDate, 10);
        const genre = volumeInfo.categories || [];
        const description = volumeInfo.description || '';
        const coverImage = volumeInfo.imageLinks?.thumbnail || '';
        const language = volumeInfo.language ? [volumeInfo.language] : [];
        const rating = volumeInfo.averageRating || 0;

        // Create a new Book document
        const newBook = new Book({
          ISBN: isbn,
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

        // Save the book to the database
        await newBook.save();
        return newBook;
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

export const updateBook = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    res.status(200).json({ message: 'Book updated successfully' });
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
        { rating: { $gte: book.rating - 1, $lte: book.rating + 1 } },
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
