import { Router } from 'express';
import {
  deleteAdmin,
  getAdminById,
  getAllAdmins,
  loginSuperAdmin,
  registerSuperAdmin,
  updateAdminById,
} from '../controller/superadmin-controller';
import { isAuthenticated } from '../middlewares/auth';

const superAdminRouter = Router();
superAdminRouter.post('/register', registerSuperAdmin);
superAdminRouter.post('/login', loginSuperAdmin);
superAdminRouter.get('/protected', isAuthenticated, (req, res) => {
  res.status(200).json({
    message:
      'Welcome, Super Admin! You have access to the superprotected route.',
    admin: req.body.role,
  });
});

superAdminRouter.get('/admins', isAuthenticated, getAllAdmins);
superAdminRouter.get('/admin/:adminId', isAuthenticated, getAdminById);
superAdminRouter.put(
  '/admin/update/:adminId',
  isAuthenticated,
  updateAdminById
);
superAdminRouter.delete('/admin/delete/:adminId', isAuthenticated, deleteAdmin);

export default superAdminRouter;
