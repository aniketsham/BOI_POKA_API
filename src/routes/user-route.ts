import { Router } from 'express';
import {
    loginUser,
    registerUser,
//   getAllUsers,
//   getUserById,
//   updateUser,
//   deleteUser,
} from '../controller/user-controller';
import { registerValidation } from '../validations/validation';
import { handleFacebookLogin, handleGoogleLogin, handleLinkedinLogin } from '../controller/auth-controller';
// import { validate } from '../middlewares/validate';

const userRouter = Router();

userRouter.post('/register', registerValidation, registerUser);
userRouter.post('/login', loginUser);
userRouter.post('/google', handleGoogleLogin);
userRouter.post('/linkedin', handleLinkedinLogin);
userRouter.post('/facebook', handleFacebookLogin);
// userRouter.get('/', getAllUsers);
// userRouter.get('/:id', getUserById);
// userRouter.put('/update/:id', updateUser);
// userRouter.delete('/:id', deleteUser);

export default userRouter;
