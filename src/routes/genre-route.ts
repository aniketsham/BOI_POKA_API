import { Router } from 'express';
import {
  addGenre,
  moveGenre,
  deleteGenre,
  getAllGenres,
} from '../controller/genre-controller';
import { isAuthenticated } from '../middlewares/auth';
import { accessControl } from '../middlewares/access-control';

const genreRouter = Router();
genreRouter.get(
  '/genres',
  isAuthenticated,
  accessControl('genre'),
  getAllGenres
);
genreRouter.post('/add', isAuthenticated, accessControl('genre'), addGenre);
genreRouter.put(
  '/move/:genreId',
  isAuthenticated,
  accessControl('genre'),
  moveGenre
);
genreRouter.delete(
  '/delete/:genreId',
  isAuthenticated,
  accessControl('genre'),
  deleteGenre
);

export default genreRouter;
