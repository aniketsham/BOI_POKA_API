import { Router } from 'express';
import {
  loginUser,
  registerUser,
  updateUser,
  fetchInvites,
  acceptInvitation,
  rejectInvitation,
} from '../controller/user-controller';
import { registerValidation } from '../validations/validation';
import {
  handleFacebookLogin,
  handleGoogleLogin,
  handleLinkedinLogin,
} from '../controller/auth-controller';
import { isAuthenticated } from '../middlewares/auth';

const userRouter = Router();

userRouter.post('/register', registerValidation, registerUser);
userRouter.post('/login', loginUser);
userRouter.post('/google', handleGoogleLogin);
userRouter.post('/linkedin', handleLinkedinLogin);
userRouter.post('/facebook', handleFacebookLogin);
userRouter.put('/update', updateUser);
userRouter.get('/fetchInvites', isAuthenticated, fetchInvites);
userRouter.post('/acceptInvite', isAuthenticated, acceptInvitation);
userRouter.post('/rejectInvite', isAuthenticated, rejectInvitation);
export default userRouter;
