import { Router } from 'express';
import {
  addBookToUser,
  deleteBookFromAllLibrary,
  fetchAllBook,
  fetchBookInShelf,
  updateBookProgress,
  updateBookStatus,
  fetchBooksAtLocation,
  fetchBookByLibraryName,
  deleteBookFromLibrary,
  addColorToBook,
  fetchBooksByColor,
} from '../controller/user-book-controller';
import { isAuthenticated } from '../middlewares/auth';
const userBookRouter = Router();

userBookRouter.get('/getAllbooks', isAuthenticated, fetchAllBook);
userBookRouter.get('/fetchBookFromShelf', isAuthenticated, fetchBookInShelf);
userBookRouter.get(
  '/fetchBooksAtLocation',
  isAuthenticated,
  fetchBooksAtLocation
);
userBookRouter.get(
  '/fetchByLibraryName/:libraryName',
  isAuthenticated,
  fetchBookByLibraryName
);
userBookRouter.get('/fetchBooksByColor', isAuthenticated, fetchBooksByColor);

userBookRouter.post('/addBook', isAuthenticated, addBookToUser);
userBookRouter.post('/addColorToBook', isAuthenticated, addColorToBook);
userBookRouter.put('/updateBookProgress', isAuthenticated, updateBookProgress);
userBookRouter.put('/updateBookStatus', isAuthenticated, updateBookStatus);
userBookRouter.delete(
  '/deleteBookFromAll',
  isAuthenticated,
  deleteBookFromAllLibrary
);
userBookRouter.delete(
  '/deleteBookFromLibrary',
  isAuthenticated,
  deleteBookFromLibrary
);
export default userBookRouter;
