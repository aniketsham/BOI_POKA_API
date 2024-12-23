import { Router } from 'express';
import {
  getAllUsers,
  getUserById,
  loginAdmin,
  registerAdmin,
  updateUserById,
} from '../controller/admin-controller';
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

export default adminRouter;
