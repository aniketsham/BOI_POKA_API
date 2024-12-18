import { Router } from 'express';
import {
  addBook,
  fetchBookByGenre,
  fetchBookByAuthor,
  updateBook,
  fetchSimilarBooks,
} from '../controller/book-controller';

const bookRouter = Router();

bookRouter.post('/add', addBook);
bookRouter.get('/genre/:genre', fetchBookByGenre);
bookRouter.get('/author/:author', fetchBookByAuthor);
bookRouter.put('/updateMaster', updateBook);
bookRouter.get('/similarBooks/:id', fetchSimilarBooks);
export default bookRouter;
