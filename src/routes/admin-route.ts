import { Router } from 'express';
import { getAllUsers, getUserById, loginAdmin, registerAdmin, updateUserById } from '../controller/admin-controller';
import { registerAdminValidator } from '../validations/validation';
import { authenticateAdmins } from '../middlewares/authenticate-admin';

const adminRouter = Router();

adminRouter.post('/register', registerAdminValidator, registerAdmin);
adminRouter.post('/login', loginAdmin);
adminRouter.get('/protected', authenticateAdmins, (req, res) => {
  
  res.status(200).json({
    message: 'Welcome, admin! You have access to the protected route.',
    admin: req.body.role,
  });
});

adminRouter.get('/users', authenticateAdmins, getAllUsers);
adminRouter.get('/user/:userId', authenticateAdmins, getUserById);
adminRouter.put('/user/update/:userId', authenticateAdmins, updateUserById);

export default adminRouter;
