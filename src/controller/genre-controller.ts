import { Request, Response, NextFunction } from 'express';
import Genre from '../models/genre-model';

export const addGenre = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { name, category } = req.body;

    const genre = new Genre({ name, category });
    await genre.save();

    res.status(201).json({ message: 'Genre added successfully', genre });
  } catch (error) {
    next(error);
  }
};

export const moveGenre = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { genreId } = req.params;
    const { category } = req.body;

    const genre = await Genre.findByIdAndUpdate(
      genreId,
      { category },
      { new: true }
    );

    if (!genre) {
      res.status(404).json({ error: 'Genre not found' });
      return;
    }

    res.status(200).json({ message: 'Genre moved successfully', genre });
  } catch (error) {
    next(error);
  }
};

export const deleteGenre = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { genreId } = req.params;

    const genre = await Genre.findByIdAndDelete(genreId);

    if (!genre) {
      res.status(404).json({ error: 'Genre not found' });
      return;
    }

    res.status(200).json({ message: 'Genre deleted successfully' });
  } catch (error) {
    next(error);
  }
};

export const getAllGenres = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const genres = await Genre.find();
    res.status(200).json({ genres });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};
