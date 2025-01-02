import { NextFunction, Request, Response } from 'express';
import Book from '../models/book-model';
import axios from 'axios';
import mongoose, { SortOrder } from 'mongoose';
import { getSortOptions } from '../utils/sorting';
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

    const savedBooks = await Promise.all(
      books.map(async (book: any) => {
        const { volumeInfo } = book;

        const isbnArray = volumeInfo.industryIdentifiers.map(
          (identifier: any) => identifier.identifier
        );

        const title = volumeInfo.title;
        const author = volumeInfo.authors || [];
        const publisher = volumeInfo.publisher || '';
        const publicationYear = parseInt(volumeInfo.publishedDate, 10);
        const genre = volumeInfo.categories || [];
        const description = volumeInfo.description || '';
        const coverImage = volumeInfo.imageLinks?.thumbnail;
        const language = volumeInfo.language ? [volumeInfo.language] : [];
        const rating = volumeInfo.averageRating;

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
    const { sortBy, order } = req.query;

    const sortOptions = getSortOptions({
      sortBy: sortBy as 'addedAt' | 'author' | 'genre',
      order: parseInt(order as string, 10) as SortOrder,
    });

    const books = await Book.find({ genre: { $in: genre } }).sort(sortOptions);
    if (books.length === 0) {
      res.status(404).json({ error: 'No books found for the given genre' });
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
    const { sortBy, order } = req.query;

    const sortOptions = getSortOptions({
      sortBy: sortBy as 'addedAt' | 'author' | 'genre',
      order: parseInt(order as string, 10) as SortOrder,
    });

    const books = await Book.find({ author: { $in: author } }).sort(
      sortOptions
    );
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
    const { sortBy, order } = req.query;

    const book = await Book.findById(ParamId);
    if (!book) {
      res.status(404).json({ error: 'Book not found' });
      return;
    }

    const sortOptions = getSortOptions({
      sortBy: sortBy as 'addedAt' | 'author' | 'genre',
      order: parseInt(order as string, 10) as SortOrder,
    });

    const similarBooks = await Book.find({
      genre: { $in: book.genre },
      _id: { $ne: book._id },
    }).sort(sortOptions);

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
    const {
      genre,
      rating,
      author,
      page = 1,
      limit = 10,
      sortBy,
      order,
    } = req.query;

    const filter: any = {};

    if (genre) {
      const genres = Array.isArray(genre) ? genre : [genre];
      filter.genre = {
        $in: genres.map((g) => new RegExp(`\\b${g}\\b`, 'i')),
      };
    }

    if (rating) {
      filter.rating = { $gte: parseFloat(rating as string) };
    }

    if (author) {
      const authors = Array.isArray(author) ? author : [author];
      filter.author = {
        $in: authors.map((a) => new RegExp(`\\b${a}\\b`, 'i')),
      };
    }

    const skip =
      (parseInt(page as string, 10) - 1) * parseInt(limit as string, 10);
    const sortOptions = getSortOptions({
      sortBy: sortBy as 'addedAt' | 'author' | 'genre',
      order: parseInt(order as string, 10) as SortOrder,
    });

    const books = await Book.find(filter)
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit as string, 10));

    if (!books.length) {
      res.status(404).json({ error: 'No books found matching the criteria' });
      return;
    }

    res.status(200).json({ books });
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
    let book = await Book.findOne({
      ISBN: { $in: isbn },
    });

    if (!book) {
      const googleBooksApiUrl = `https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}`;
      const googleBooksResponse = await axios.get(googleBooksApiUrl);

      if (googleBooksResponse.data.totalItems === 0) {
        res.status(404).json({ error: 'Book not found' });
        return;
      }

      const googleBook = googleBooksResponse.data.items[0].volumeInfo;
      const isbnArray = googleBook.industryIdentifiers.map(
        (identifier: any) => identifier.identifier
      );
      const isIndian = isbnArray.some((isbn: string) =>
        isbn.startsWith('97893')
      );

      book = new Book({
        title: googleBook.title,
        author: googleBook.authors,
        ISBN: isbnArray,
        publicationYear: parseInt(googleBook.publishedDate, 10),
        publishedDate: googleBook.publishedDate,
        description: googleBook.description,
        genre: googleBook.categories || [],
        coverImage: googleBook.imageLinks?.thumbnail || '',
        language: googleBook.language ? [googleBook.language] : [],
        rating: googleBook.averageRating,
        isIndian,
      });

      await book.save();
    }

    res.status(200).json(book);
  } catch (error) {
    next(error);
  }
};

export const fetchSearchResult = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const searchQuery = req.params.searchQuery;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const localBooks = await Book.find({
      $or: [
        { title: { $regex: searchQuery, $options: 'i' } },
        { author: { $regex: searchQuery, $options: 'i' } },
        { genre: { $regex: searchQuery, $options: 'i' } },
      ],
    })
      .skip(skip)
      .limit(limit)
      .session(session);

    if (localBooks.length > 0) {
      await session.commitTransaction();
      session.endSession();
      res.status(200).json({ books: localBooks });
      return;
    }
    const googleBooksResponse = await axios.get(
      `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(
        searchQuery
      )}&startIndex=${skip}&maxResults=${limit}&API_KEY=${process.env.GOOGLE_API_KEY}`
    );
    ``;

    const googleBooks = googleBooksResponse.data.items.map((item: any) => {
      const { volumeInfo } = item;
      return {
        industryIdentifiers:
          volumeInfo.industryIdentifiers?.map((id: any) => id.identifier) || [],
        title: volumeInfo.title,
        author: volumeInfo.authors || [],
        publisher: volumeInfo.publisher || '',
        publicationYear: volumeInfo.publishedDate
          ? parseInt(volumeInfo.publishedDate, 10)
          : null,
        genre: volumeInfo.categories || [],
        description: volumeInfo.description || '',
        coverImage: volumeInfo.imageLinks?.thumbnail || '',
        language: volumeInfo.language ? [volumeInfo.language] : [],
        rating: volumeInfo.averageRating,
      };
    });

    const newBooks = googleBooks.map((book: any) => new Book(book));
    const books = await Book.insertMany(newBooks, { session });

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({ books });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    next(error);
  }
};
