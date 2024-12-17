import { Router } from 'express';
import {
    registerUser,
//   getAllUsers,
//   getUserById,
//   updateUser,
//   deleteUser,
} from '../controller/user-controller';
import { registerValidation } from '../validations/validation';
// import { validate } from '../middlewares/validate';

const userRouter = Router();

userRouter.post('/register', registerValidation, registerUser);
// userRouter.get('/', getAllUsers);
// userRouter.get('/:id', getUserById);
// userRouter.put('/update/:id', updateUser);
// userRouter.delete('/:id', deleteUser);

export default userRouter;
