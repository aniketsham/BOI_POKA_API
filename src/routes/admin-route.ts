import { Router } from 'express';
import { registerAdmin } from '../controller/admin-controller';

const adminRouter = Router();

adminRouter.post('/register', registerAdmin);
// adminRouter.post('/login', loginUser);

// userRouter.get('/', getAllUsers);
// userRouter.get('/:id', getUserById);

export default adminRouter;
