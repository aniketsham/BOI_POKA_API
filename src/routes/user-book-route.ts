import { Router } from 'express';
import {
  addBookToUser,
  deleteBookFromSelf,
  fetchBookInSelf,
  updateBookProgress,
  updateBookStatus,
} from '../controller/user-book-controller';
const userBookRouter = Router();

userBookRouter.get('/getAllbooks/:userId', fetchBookInSelf);
userBookRouter.post('/addBook', addBookToUser);
userBookRouter.put('/updateBookProgress/:userId', updateBookProgress);
userBookRouter.put('/updateBookStatus/:userId', updateBookStatus);
userBookRouter.delete('/deleteBook/:userId', deleteBookFromSelf);
export default userBookRouter;
