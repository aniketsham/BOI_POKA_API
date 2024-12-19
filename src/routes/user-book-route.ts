import { Router } from 'express';
import {
  addBookToUser,
  deleteBookFromSelf,
  fetchBookInSelf,
  updateBookProgress,
  updateBookStatus,
} from '../controller/user-book-controller';
import { isAuthenticated } from '../middlewares/auth';
const userBookRouter = Router();

userBookRouter.get('/getAllbooks/:userId', isAuthenticated, fetchBookInSelf);
userBookRouter.post('/addBook', addBookToUser);
userBookRouter.put(
  '/updateBookProgress/:userId',
  isAuthenticated,
  updateBookProgress
);
userBookRouter.put(
  '/updateBookStatus/:userId',
  isAuthenticated,
  updateBookStatus
);
userBookRouter.delete(
  '/deleteBook/:userId',
  isAuthenticated,
  deleteBookFromSelf
);
export default userBookRouter;
