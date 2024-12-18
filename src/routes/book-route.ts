import { Router } from 'express';
import {
  handleBook,
  fetchBookByGenre,
  fetchBookByAuthor,
  fetchSimilarBooks,
  fetchFilteredBooks,
  fetchBookByISBN,
} from '../controller/book-controller';

const bookRouter = Router();

bookRouter.post('/handleBook', handleBook);
bookRouter.get('/genre/:genre', fetchBookByGenre);
bookRouter.get('/author/:author', fetchBookByAuthor);
bookRouter.get('/similarBooks/:id', fetchSimilarBooks);
bookRouter.get('/filteredBooks', fetchFilteredBooks);
bookRouter.get('/ISBN/:isbn', fetchBookByISBN);
export default bookRouter;
