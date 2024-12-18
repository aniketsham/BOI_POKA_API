import { Router } from 'express';
import {
  addBook,
  fetchBookByGenre,
  fetchBookByAuthor,
} from '../controller/book-controller';

const bookRouter = Router();

bookRouter.post('/add', addBook);
bookRouter.get('/genre/:genre', fetchBookByGenre);
bookRouter.get('/author/:author', fetchBookByAuthor);

export default bookRouter;
