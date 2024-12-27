import { Router } from 'express';
import {
  addBookToUser,
  deleteBookFromAllLibrary,
  fetchAllBook,
  fetchBookInShelf,
  updateBookProgress,
  fetchBooksAtLocation,
  fetchBookByLibraryName,
  deleteBookFromLibrary,
  addColorToBook,
  fetchBooksByColor,
  makeBorrowRequest,
  acceptRequest,
  rejectRequest,
  getAllBorrowRequestsByRequester,
  getAllBorrowedBooks,
  getAllLoanedBooks,
  getAllBorrowRequestsByOwner,
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
// userBookRouter.put('/updateBookProgress', isAuthenticated, updateBookProgress);
// userBookRouter.put('/updateBookStatus', isAuthenticated, updateBookStatus);
userBookRouter.put('/update-progress', isAuthenticated, updateBookProgress);
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

userBookRouter.post('/borrow-request', isAuthenticated, makeBorrowRequest);

userBookRouter.post(
  '/borrow-request/:requestId/accept',
  isAuthenticated,
  acceptRequest
);

userBookRouter.post(
  '/borrow-request/:requestId/reject',
  isAuthenticated,
  rejectRequest
);

userBookRouter.get(
  '/borrow-requests/Owner',
  isAuthenticated,
  getAllBorrowRequestsByOwner
);

userBookRouter.get(
  '/borrow-requests/Requester',
  isAuthenticated,
  getAllBorrowRequestsByRequester
);

userBookRouter.get('/borrowed-books', isAuthenticated, getAllBorrowedBooks);

userBookRouter.get('/loaned-books', isAuthenticated, getAllLoanedBooks);

export default userBookRouter;
