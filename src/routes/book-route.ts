import { Router } from 'express';
import {
  handleBook,
  fetchBookByGenre,
  fetchBookByAuthor,
  fetchSimilarBooks,
  fetchFilteredBooks,
  fetchBookByISBN,
  fetchSearchResult,
  getBooksAlphabetically,
} from '../controller/book-controller';
import { isAuthenticated } from '../middlewares/auth';

const bookRouter = Router();

bookRouter.post('/handleBook', isAuthenticated, handleBook);
bookRouter.get('/genre/:genre', isAuthenticated, fetchBookByGenre);
bookRouter.get('/author/:author', isAuthenticated, fetchBookByAuthor);
bookRouter.get('/similarBooks/:id', isAuthenticated, fetchSimilarBooks);
bookRouter.get('/filteredBooks', isAuthenticated, fetchFilteredBooks);
bookRouter.get('/ISBN/:isbn', isAuthenticated, fetchBookByISBN);
bookRouter.get('/search/:searchQuery', isAuthenticated, fetchSearchResult);
bookRouter.get('/alphabetical', isAuthenticated, getBooksAlphabetically);
export default bookRouter;
