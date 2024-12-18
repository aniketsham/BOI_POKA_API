import { Router } from 'express';
import {
    loginUser,
    registerUser,
    updateUser,
    deleteUser,
//   getAllUsers,
//   getUserById,
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
userRouter.put('/update/:userId', updateUser);
userRouter.delete('/delete/:userId', deleteUser);
// userRouter.get('/', getAllUsers);
// userRouter.get('/:id', getUserById);

export default userRouter;
