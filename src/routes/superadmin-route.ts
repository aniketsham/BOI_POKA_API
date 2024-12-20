import { Router } from 'express';
import { getAdminById, getAllAdmins, loginSuperAdmin, registerSuperAdmin } from '../controller/superadmin-controller';
import { authenticateSuperAdmin } from '../middlewares/authenticate-superadmin';

const superAdminRouter = Router();
superAdminRouter.post('/register', registerSuperAdmin);
superAdminRouter.post('/login', loginSuperAdmin);
superAdminRouter.get('/protected', authenticateSuperAdmin, (req, res) => {
  res.status(200).json({
    message: 'Welcome, Super Admin! You have access to the superprotected route.',
    admin: req.body.role,
  });
});

superAdminRouter.get('/admins', authenticateSuperAdmin, getAllAdmins);
superAdminRouter.get('/admin/:adminId', authenticateSuperAdmin, getAdminById);

export default superAdminRouter;
