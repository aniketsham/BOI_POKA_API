import { Router } from 'express';
import {
  loginUser,
  registerUser,
  updateUser,
} from '../controller/user-controller';
import { registerValidation } from '../validations/validation';
import {
  handleFacebookLogin,
  handleGoogleLogin,
  handleLinkedinLogin,
} from '../controller/auth-controller';

const userRouter = Router();

userRouter.post('/register', registerValidation, registerUser);
userRouter.post('/login', loginUser);
userRouter.post('/google', handleGoogleLogin);
userRouter.post('/linkedin', handleLinkedinLogin);
userRouter.post('/facebook', handleFacebookLogin);
userRouter.put('/update', updateUser);

export default userRouter;
