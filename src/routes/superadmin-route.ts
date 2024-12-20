import { Router } from 'express';
import { getAllAdmins, loginSuperAdmin, registerSuperAdmin } from '../controller/superadmin-controller';
import { authenticateSuperAdmin } from '../middlewares/authenticate-superadmin';
import { getAllUsers } from '../controller/admin-controller';
import { authenticateAdmins } from '../middlewares/authenticate-admin';

const superAdminRouter = Router();
superAdminRouter.post('/register', registerSuperAdmin);
superAdminRouter.post('/login', loginSuperAdmin);
superAdminRouter.get('/protected', authenticateSuperAdmin, (req, res) => {
  res.status(200).json({
    message: 'Welcome, Super Admin! You have access to the superprotected route.',
    admin: req.body.role,
  });
});

superAdminRouter.get('/users', authenticateAdmins, getAllUsers);
superAdminRouter.get('/admins', authenticateSuperAdmin, getAllAdmins);

export default superAdminRouter;
