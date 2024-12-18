import { NextFunction, Request, Response } from 'express';
import Book from '../models/book-model';
export const addBook = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const {
      ISBN,
      title,
      author,
      publisher,
      publicationYear,
      genre,
      description,
      coverImage,
      language,
      rating,
    } = req.body;

    if (
      !ISBN ||
      !title ||
      !author ||
      !publisher ||
      !publicationYear ||
      !genre ||
      !description ||
      !coverImage ||
      !language ||
      !rating
    ) {
      if (!Array.isArray(ISBN)) {
        res.status(400).json({ error: 'ISBN must be an array' });
        return;
      }

      res.status(400).json({ error: 'All fields are required' });
      return;
    }
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

    const existingBook = await Book.findOne({ ISBN: { $in: ISBN } });
    if (existingBook) {
      res.status(400).json({ error: 'Book already exists' });
      return;
    }
    const newBook = new Book({
      ISBN,
      title,
      author,
      publisher,
      publicationYear,
      genre,
      description,
      coverImage,
      language,
      rating,
    });
    await newBook.save();
    res.status(201).json(newBook);
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
