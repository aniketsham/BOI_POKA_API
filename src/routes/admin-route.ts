import { Router } from 'express';
import {
  getAllUsers,
  getUserById,
  loginAdmin,
  registerAdmin,
  updateUserById,
  getAllBooks,
  updateUserBookProgress,
  updateUserBookStatus,
  deleteBookFromUserBook,
  deleteUserLibrary,
  deactivateUser,
  activateUser,
} from '../controller/admin-controller';

import {
  fetchBookByAuthor,
  fetchBookByGenre,
  fetchBookByISBN,
} from '../controller/book-controller';
import { fetchAllUserBook } from '../controller/user-book-controller';
import { registerAdminValidator } from '../validations/validation';
import { deleteUser } from '../controller/admin-controller';
import { isAuthenticated } from '../middlewares/auth';
import { accessControl } from '../middlewares/access-control';

const adminRouter = Router();

adminRouter.post('/register', registerAdminValidator, registerAdmin);
adminRouter.post('/login', loginAdmin);
adminRouter.get('/protected', isAuthenticated, (req, res) => {
  res.status(200).json({
    message: 'Welcome, admin! You have access to the protected route.',
    admin: req.body.role,
  });
});

adminRouter.get(
  '/users',
  isAuthenticated,
  accessControl('getUsers'),
  getAllUsers
);
adminRouter.get(
  '/user/:userId',
  isAuthenticated,
  accessControl('getUser'),
  getUserById
);
adminRouter.put(
  '/user/update/:userId',
  isAuthenticated,
  accessControl('updateUser'),
  updateUserById
);
adminRouter.delete(
  '/user/delete/:userId',
  isAuthenticated,
  accessControl('deleteUser'),
  deleteUser
);

adminRouter.get(
  '/getAllBooks',
  isAuthenticated,
  accessControl('getBooks'),
  getAllBooks
);

adminRouter.get(
  '/getBookByISBN/:isbn',
  isAuthenticated,
  accessControl('getBooks'),
  fetchBookByISBN
);

adminRouter.get(
  '/getBookByGenre/:genre',
  isAuthenticated,
  accessControl('getBooks'),
  fetchBookByGenre
);
adminRouter.get(
  '/getBookByAuthor/:author',
  isAuthenticated,
  accessControl('getBooks'),
  fetchBookByAuthor
);

adminRouter.put(
  '/user/deactivate',
  isAuthenticated,
  accessControl('deactivateUser'),
  deactivateUser
);

adminRouter.put(
  '/user/activate',
  isAuthenticated,
  accessControl('activateUser'),
  activateUser
);

adminRouter.put(
  '/updateUserBookProgress/:userId',
  isAuthenticated,
  accessControl('updateUserBooks'),
  updateUserBookProgress
);

adminRouter.put(
  '/updateUserBookStatus/:userId',
  isAuthenticated,
  accessControl('updateUserBooks'),
  updateUserBookStatus
);

adminRouter.delete(
  '/deleteUserBook/:userId',
  isAuthenticated,
  accessControl('deleteUserBooks'),
  deleteBookFromUserBook
);

adminRouter.delete(
  '/deleteLibrary/:userId',
  isAuthenticated,
  accessControl('deleteUserBooks'),
  deleteUserLibrary
);

adminRouter.get(
  '/fetchAllUserBook',
  isAuthenticated,
  accessControl('getUserBooks'),
  fetchAllUserBook
);
export default adminRouter;
