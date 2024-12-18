import { Router } from 'express';
import { loginAdmin, registerAdmin } from '../controller/admin-controller';

const adminRouter = Router();

adminRouter.post('/register', registerAdmin);
adminRouter.post('/login', loginAdmin);

// userRouter.get('/', getAllUsers);
// userRouter.get('/:id', getUserById);

export default adminRouter;
