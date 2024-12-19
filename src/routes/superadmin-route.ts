import { Router } from 'express';
import { loginSuperAdmin, registerSuperAdmin } from '../controller/superadmin-controller';

const superAdminRouter = Router();
superAdminRouter.post('/register', registerSuperAdmin);
superAdminRouter.post('/login', loginSuperAdmin);

export default superAdminRouter;
